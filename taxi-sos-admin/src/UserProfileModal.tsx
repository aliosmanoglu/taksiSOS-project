import React, { useState, useEffect } from 'react';
import { User, Phone, X, ShieldAlert, Calendar } from 'lucide-react';

export default function UserProfileModal({ serverIp, phone, onClose, onSelectArchive }: any) {
    const [userData, setUserData] = useState<any>(null);
    const [sosHistory, setSosHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const url = serverIp.replace(/\/$/, '') + `/api/admin/user/${phone}`;
                const res = await fetch(url);
                const data = await res.json();
                if(data.user) {
                    setUserData(data.user);
                    setSosHistory(data.sosHistory || []);
                }
            } catch (e) {
                console.error("Error fetching user", e);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [serverIp, phone]);

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
                        <User /> Kullanıcı Profili
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
                </div>
                
                <div style={{ overflowY: 'auto', padding: '20px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center' }}>Yükleniyor...</div>
                    ) : userData ? (
                        <>
                            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                                {userData.imageBase64 ? (
                                    <img src={userData.imageBase64} alt="ID" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '10px' }} />
                                ) : (
                                    <div style={{ width: '120px', height: '120px', backgroundColor: '#333', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <User size={48} color="#666" />
                                    </div>
                                )}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <h2 style={{ margin: 0, fontSize: '24px' }}>{userData.name}</h2>
                                    <div style={{ color: 'var(--text-secondary)' }}><strong>Telefon:</strong> {userData.phone}</div>
                                    <div style={{ color: 'var(--text-secondary)' }}><strong>Plaka:</strong> {userData.plate}</div>
                                    <div style={{ color: 'var(--text-secondary)' }}>
                                        <strong>Durum: </strong> 
                                        <span style={{ 
                                            color: userData.status === 'approved' ? 'var(--success-color)' : 
                                                   (userData.status === 'rejected' || userData.status === 'banned') ? 'var(--danger-color)' : 'var(--warning-color)' 
                                        }}>
                                            {userData.status === 'approved' ? 'Onaylı' : userData.status === 'rejected' ? 'Reddedildi' : userData.status === 'banned' ? 'Engellendi' : 'Bekliyor'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ShieldAlert size={18} /> Geçmiş SOS Çağrıları ({sosHistory.length})
                            </h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                                {sosHistory.length === 0 ? (
                                    <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Bu kullanıcının geçmiş SOS çağrısı bulunmuyor.</div>
                                ) : (
                                    sosHistory.map(arch => (
                                        <div key={arch.id} 
                                            onClick={() => {
                                                if(onSelectArchive) {
                                                    onSelectArchive(arch);
                                                    onClose();
                                                }
                                            }}
                                            style={{ 
                                            padding: '12px', 
                                            background: 'rgba(255,255,255,0.05)', 
                                            borderRadius: '8px',
                                            cursor: onSelectArchive ? 'pointer' : 'default',
                                            border: '1px solid var(--border-color)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Calendar size={14} /> {formatDate(arch.startTime)}
                                            </div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                                                {arch.messages?.length || 0} Mesaj
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', color: 'var(--danger-color)' }}>Kullanıcı bulunamadı.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
