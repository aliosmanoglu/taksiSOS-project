const { fork } = require('child_process');
const { io } = require('socket.io-client');

describe('PTT Mutex Logic', () => {
  let serverProcess;
  let clientA, clientB;
  const PORT = 5001;
  const ROOM = 'test_sos_room';

  beforeAll((done) => {
    serverProcess = fork('app.js', [], {
      env: { ...process.env, PORT: PORT }
    });
    setTimeout(() => done(), 2000);
  });

  afterAll((done) => {
    serverProcess.kill();
    done();
  });

  beforeEach((done) => {
    clientA = io(`http://localhost:${PORT}`);
    clientB = io(`http://localhost:${PORT}`);
    let connected = 0;
    const onConnect = () => {
      connected++;
      if (connected === 2) {
        // Join rooms
        clientA.emit('join_sos_room', ROOM);
        clientB.emit('join_sos_room', ROOM);
        setTimeout(() => done(), 500); // wait for joins
      }
    };
    clientA.on('connect', onConnect);
    clientB.on('connect', onConnect);
  });

  afterEach(() => {
    if (clientA.connected) clientA.disconnect();
    if (clientB.connected) clientB.disconnect();
  });

  test('should grant talk to Client A and lock channel for Client B', (done) => {
    let aGranted = false;
    let bLocked = false;

    clientA.emit('request_talk', { room: ROOM });

    clientA.on('talk_granted', () => {
      aGranted = true;
      clientB.emit('request_talk', { room: ROOM });
    });

    clientB.on('channel_locked', (data) => {
      bLocked = true;
    });

    clientB.on('talk_rejected', (data) => {
      expect(aGranted).toBe(true);
      expect(bLocked).toBe(true);
      expect(data.reason).toContain('Channel is currently locked');
      
      clientA.emit('stop_talk', { room: ROOM });
    });

    clientB.on('channel_released', () => {
      done();
    });
  }, 10000);

  test('channel should be free after Client A stops talking', (done) => {
    clientA.emit('request_talk', { room: ROOM });

    clientA.on('talk_granted', () => {
      clientA.emit('stop_talk', { room: ROOM });
    });

    clientB.on('channel_released', () => {
      clientB.emit('request_talk', { room: ROOM });
    });

    clientB.on('talk_granted', () => {
      expect(true).toBe(true);
      clientB.emit('stop_talk', { room: ROOM });
      done();
    });
  }, 10000);
});
