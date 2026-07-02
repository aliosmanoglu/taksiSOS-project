import React, { useState, useEffect } from 'react';
import { Search, User } from 'lucide-react';
import UserProfileModal from './UserProfileModal';

export default function UsersList({ serverIp, onSelectArchive }: { serverIp: string, onSelectArchive?: (arch: any) => void }) {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUserPhone, setSelectedUserPhone] = useState<string | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const url = serverIp.replace(/\/$/, '') + '/api/admin/users';
            const res = await fetch(url);
            const data = await res.json();
            setUsers(data);
        } catch (e) {
            console.error("Error fetching users", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [serverIp]);

    const filteredUsers = users.filter(u => {
        const query = searchQuery.toLowerCase();
        return (
            (u.name && u.name.toLowerCase().includes(query)) ||
            (u.phone && u.phone.includes(query)) ||
            (u.plate && u.plate.toLowerCase().includes(query))
        );
    });

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input 
                        type="text" 
                        placeholder="İsim, plaka veya telefon ile ara..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ 
                            width: '100%', 
                            padding: '12px 12px 12px 45px', 
                            borderRadius: '8px', 
                            border: '1px solid var(--border-color)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'white',
                            fontSize: '15px'
                        }}
                    />
                </div>
                <button className="glass-button" onClick={fetchUsers} style={{ padding: '12px 20px' }}>Yenile</button>
            </div>

            <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Kullanıcılar yükleniyor...</div>
                ) : filteredUsers.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Kullanıcı bulunamadı.</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                        {filteredUsers.map(u => (
                            <div 
                                key={u.id} 
                                onClick={() => setSelectedUserPhone(u.phone)}
                                style={{
                                    padding: '15px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                            >
                                <div style={{ width: '50px', height: '50px', borderRadius: '25px', backgroundColor: '#333', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                                    {u.imageBase64 ? <img src={u.imageBase64} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <User size={24} color="#666" />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '2px' }}>{u.name}</div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{u.plate} • {u.phone}</div>
                                    <div style={{ marginTop: '5px', fontSize: '12px', fontWeight: 'bold', color: u.status === 'approved' ? 'var(--success-color)' : u.status === 'rejected' ? 'var(--danger-color)' : 'var(--warning-color)' }}>
                                        {u.status === 'approved' ? 'Onaylı' : u.status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedUserPhone && (
                <UserProfileModal 
                    serverIp={serverIp} 
                    phone={selectedUserPhone} 
                    onClose={() => setSelectedUserPhone(null)} 
                    onSelectArchive={onSelectArchive}
                />
            )}
        </div>
    );
}
