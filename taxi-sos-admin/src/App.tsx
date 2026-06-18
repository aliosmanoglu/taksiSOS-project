import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LogOut, AlertTriangle, Users, Map as MapIcon, Car, Archive as ArchiveIcon } from 'lucide-react';
import Archive from './Archive';

// Custom Map Markers
const createCustomIcon = (color: string, isSOS: boolean = false) => {
  return L.divIcon({
    className: 'custom-icon',
    html: `<div style="
      background-color: ${color};
      width: ${isSOS ? '40px' : '30px'};
      height: ${isSOS ? '40px' : '30px'};
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 ${isSOS ? '20px' : '10px'} ${color};
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
      font-size: ${isSOS ? '18px' : '14px'};
      font-weight: bold;
      animation: ${isSOS ? 'sosFlash 1s infinite' : 'none'};
    ">${isSOS ? 'SOS' : '🚕'}</div>`,
    iconSize: [isSOS ? 40 : 30, isSOS ? 40 : 30],
    iconAnchor: [isSOS ? 20 : 15, isSOS ? 20 : 15],
    popupAnchor: [0, isSOS ? -20 : -15]
  });
};

const taxiIcon = createCustomIcon('#58a6ff');
const sosIcon = createCustomIcon('#f85149', true);

// Constants
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin';

type User = {
  id: string;
  name: string;
  plate: string;
  phone: string;
  lat: number;
  lon: number;
  activeRoom: string | null;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [serverIp, setServerIp] = useState('https://taksisos-project.onrender.com');
  const [activeTab, setActiveTab] = useState<'live' | 'archive'>('live');
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const [users, setUsers] = useState<User[]>([]);
  const [activeSOSCount, setActiveSOSCount] = useState(0);

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert("Hatalı Şifre!");
    }
  };

  // Socket Connection
  useEffect(() => {
    if (!isAuthenticated) return;

    const newSocket = io(serverIp);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('connect_sos', {
        name: 'ADMIN',
        plate: 'ADMIN',
        phone: '00000000000',
        lat: 41.0082,
        lon: 28.9784,
        pushToken: null
      });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('all_users_update', (usersData: User[]) => {
      // Sadece admin olmayan taksicileri göster
      const taxiDrivers = usersData.filter(u => u.phone !== '00000000000');
      setUsers(taxiDrivers);
      
      const sosCount = taxiDrivers.filter(u => u.activeRoom === `sos_room_${u.phone}`).length;
      setActiveSOSCount(sosCount);
      
      if (sosCount > 0) {
        document.body.classList.add('body-sos-active');
      } else {
        document.body.classList.remove('body-sos-active');
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, serverIp]);

  if (!isAuthenticated) {
    return (
      <div className="login-wrapper">
        <div className="glass-panel login-card">
          <div className="login-title">TAKSİ SOS ADMIN</div>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Yetkili girişi gereklidir.</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px', display: 'block' }}>Sunucu Adresi</label>
              <input 
                type="text" 
                className="glass-input" 
                value={serverIp}
                onChange={(e) => setServerIp(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px', display: 'block' }}>Admin Şifresi</label>
              <input 
                type="password" 
                className="glass-input" 
                placeholder="Şifrenizi girin..." 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" className="glass-button primary" style={{ width: '100%', padding: '12px', marginTop: '10px' }}>
              Giriş Yap
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="glass-panel header">
        <div className="header-left">
          <AlertTriangle color="var(--danger-color)" />
          <div className="header-title">Taksi SOS Merkez Kontrol</div>
          <div className={`status-badge ${isConnected ? '' : 'disconnected'}`}>
            <span className="status-indicator"></span>
            {isConnected ? 'Sisteme Bağlı' : 'Bağlantı Koptu'}
          </div>
          <div style={{ marginLeft: '20px', display: 'flex', gap: '10px' }}>
             <button 
                className={`glass-button ${activeTab === 'live' ? 'primary' : ''}`} 
                onClick={() => setActiveTab('live')}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', fontSize: '14px' }}
             >
                <MapIcon size={14} /> Canlı Takip
             </button>
             <button 
                className={`glass-button ${activeTab === 'archive' ? 'primary' : ''}`} 
                onClick={() => setActiveTab('archive')}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', fontSize: '14px' }}
             >
                <ArchiveIcon size={14} /> SOS Arşivi
             </button>
          </div>
        </div>
        <div>
          <button className="glass-button danger" onClick={() => {
            setIsAuthenticated(false);
            if (socket) socket.disconnect();
          }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LogOut size={16} /> Çıkış Yap
          </button>
        </div>
      </header>

      {/* Stats */}
      {activeTab === 'live' && (
      <div className="stats-row">
        <div className="glass-panel stat-card">
          <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Users size={16} /> Aktif Taksiler</div>
          <div className="stat-value">{users.length}</div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><AlertTriangle size={16} /> Aktif SOS Çağrıları</div>
          <div className={`stat-value ${activeSOSCount > 0 ? 'danger' : ''}`}>{activeSOSCount}</div>
        </div>
      </div>
      )}

      {/* Main Panel */}
      <div className="main-content">
        {activeTab === 'archive' ? (
          <Archive serverIp={serverIp} />
        ) : (
          <>
            {/* Map */}
            <div className="glass-panel map-container">
              <MapContainer center={[41.0082, 28.9784]} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                {users.map(user => {
                   const isSOS = user.activeRoom === `sos_room_${user.phone}`;
                   const isHelper = user.activeRoom && user.activeRoom.startsWith('sos_room_') && !isSOS;
                   
                   return (
                    <Marker 
                      key={user.id} 
                      position={[user.lat, user.lon]} 
                      icon={isSOS ? sosIcon : taxiIcon}
                    >
                      <Popup>
                        <div style={{ color: 'var(--bg-color)', fontWeight: 'bold' }}>
                          <div style={{ fontSize: '16px', marginBottom: '4px' }}>{user.name}</div>
                          <div style={{ fontSize: '12px', opacity: 0.8 }}>Plaka: {user.plate}</div>
                          <div style={{ fontSize: '12px', opacity: 0.8 }}>Tel: {user.phone}</div>
                          {isSOS && <div style={{ color: 'red', marginTop: '4px' }}>🚨 AKTİF SOS</div>}
                          {isHelper && <div style={{ color: 'blue', marginTop: '4px' }}>🤝 YARDIMA GİDİYOR</div>}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>

            {/* Sidebar List */}
            <div className="sidebar">
              <div className="glass-panel list-card" style={{ flex: 1 }}>
                <div className="list-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Car size={18} /> Taksi Filosu
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {users.map(user => {
                    const isSOS = user.activeRoom === `sos_room_${user.phone}`;
                    const isHelper = user.activeRoom && user.activeRoom.startsWith('sos_room_') && !isSOS;
                    
                    return (
                      <div key={user.id} className={`list-item ${isSOS ? 'sos-active' : ''}`} style={isHelper ? { borderLeft: '3px solid #58a6ff' } : {}}>
                        <div className="user-info">
                          <span className="user-name">
                            {user.name} 
                            {isSOS && " 🚨"}
                            {isHelper && " 🤝"}
                          </span>
                          <span className="user-details">{user.plate} • {user.phone}</span>
                        </div>
                      </div>
                    );
                  })}
                  {users.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                      Bağlı taksi bulunmuyor.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
