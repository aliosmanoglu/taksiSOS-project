import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

type PendingUser = {
  id: string;
  name: string;
  phone: string;
  plate: string;
  idCardUrl: string;
  createdAt: number;
};

export default function Approvals({ serverIp }: { serverIp: string }) {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      const res = await fetch(`${serverIp}/api/admin/pending-users`);
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, [serverIp]);

  const handleApprove = async (phone: string) => {
    if (!window.confirm("Bu sürücüyü onaylamak istediğinize emin misiniz?")) return;
    try {
      await fetch(`${serverIp}/api/admin/approve-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      fetchPending();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (phone: string) => {
    if (!window.confirm("Bu başvuruyu REDDETMEK istediğinize emin misiniz?")) return;
    try {
      await fetch(`${serverIp}/api/admin/reject-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      fetchPending();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div style={{ padding: 20, color: '#fff' }}>Yükleniyor...</div>;
  }

  return (
    <div style={{ padding: 20, width: '100%', overflowY: 'auto' }}>
      <h2 style={{ color: '#fff', marginBottom: 20 }}>Bekleyen Sürücü Başvuruları</h2>
      {users.length === 0 ? (
        <p style={{ color: '#999' }}>Onay bekleyen kayıt bulunmamaktadır.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {users.map(u => (
            <div key={u.id} className="glass-panel" style={{ padding: 15, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontWeight: 'bold', fontSize: 18, color: '#fff' }}>{u.name}</div>
              <div style={{ color: '#ccc' }}>📱 {u.phone}</div>
              <div style={{ color: '#ccc' }}>🚕 {u.plate}</div>
              <div style={{ color: '#999', fontSize: 12 }}>Başvuru: {new Date(u.createdAt).toLocaleString()}</div>
              
              {u.idCardUrl && (
                <div style={{ margin: '10px 0' }}>
                  <a href={u.idCardUrl} target="_blank" rel="noreferrer">
                    <img src={u.idCardUrl} alt="Şoför Kartı" style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 8, border: '1px solid #444' }} />
                  </a>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>Büyütmek için tıklayın</div>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
                <button 
                  onClick={() => handleApprove(u.phone)}
                  style={{ flex: 1, backgroundColor: '#238636', color: '#fff', padding: '10px', borderRadius: 6, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5 }}
                >
                  <CheckCircle size={16} /> Onayla
                </button>
                <button 
                  onClick={() => handleReject(u.phone)}
                  style={{ flex: 1, backgroundColor: '#da3633', color: '#fff', padding: '10px', borderRadius: 6, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5 }}
                >
                  <XCircle size={16} /> Reddet
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
