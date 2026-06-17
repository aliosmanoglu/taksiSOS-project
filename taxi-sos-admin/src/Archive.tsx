import React, { useState, useEffect } from 'react';
import { Archive as ArchiveIcon, Clock, User, Phone, Play, FileText, AlertCircle, Calendar } from 'lucide-react';

export default function Archive({ serverIp }: { serverIp: string }) {
    const [archives, setArchives] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedArchive, setSelectedArchive] = useState<any>(null);

    const fetchArchives = async () => {
        setLoading(true);
        try {
            // Remove trailing slash if exists and append /api/sos-archives
            const url = serverIp.replace(/\/$/, '') + '/api/sos-archives';
            const res = await fetch(url);
            const data = await res.json();
            setArchives(data);
        } catch (e) {
            console.error("Error fetching archives", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArchives();
    }, [serverIp]);

    const playAudio = (base64Audio: string) => {
        try {
            const snd = new Audio("data:audio/m4a;base64," + base64Audio);
            snd.play();
        } catch(e) {
            console.error("Ses oynatılamadı", e);
            alert("Ses dosyası desteklenmiyor veya bozuk.");
        }
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const formatDuration = (start: number, end?: number) => {
        if (!end) return "Devam Ediyor";
        const diffInSeconds = Math.floor((end - start) / 1000);
        const mins = Math.floor(diffInSeconds / 60);
        const secs = diffInSeconds % 60;
        return `${mins} dk ${secs} sn`;
    };

    return (
        <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>
            {/* Archive List Sidebar */}
            <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ArchiveIcon size={18} /> Geçmiş Çağrılar
                    </div>
                    <button className="glass-button" onClick={fetchArchives} style={{ padding: '5px 10px', fontSize: '12px' }}>Yenile</button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                    {loading && <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Yükleniyor...</div>}
                    {!loading && archives.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Kayıtlı çağrı bulunamadı.</div>
                    )}
                    {archives.map(arch => (
                        <div 
                            key={arch.id} 
                            onClick={() => setSelectedArchive(arch)}
                            style={{ 
                                padding: '15px', 
                                margin: '5px 0', 
                                background: selectedArchive?.id === arch.id ? 'rgba(88, 166, 255, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                border: selectedArchive?.id === arch.id ? '1px solid var(--accent-color)' : '1px solid transparent',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <AlertCircle size={14} color="var(--danger-color)" />
                                {arch.creator?.name || 'Bilinmeyen Taksi'}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                                <span><Calendar size={10} style={{marginRight: '3px'}}/>{formatDate(arch.startTime)}</span>
                                <span>{arch.messages?.length || 0} Mesaj</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Archive Detail View */}
            <div className="glass-panel" style={{ flex: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {!selectedArchive ? (
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
                        <div style={{ textAlign: 'center' }}>
                            <ArchiveIcon size={48} style={{ opacity: 0.5, marginBottom: '10px' }} />
                            <p>Detayları görmek için soldan bir çağrı seçin</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', background: 'rgba(248, 81, 73, 0.1)' }}>
                            <h2 style={{ fontSize: '20px', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertCircle color="var(--danger-color)" /> 
                                {selectedArchive.creator?.name} - Olay Detayı
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                                <div><strong>Plaka:</strong> {selectedArchive.creator?.plate}</div>
                                <div><strong>Telefon:</strong> {selectedArchive.creator?.phone}</div>
                                <div><strong>Başlangıç:</strong> {formatDate(selectedArchive.startTime)}</div>
                                <div><strong>Süre:</strong> {formatDuration(selectedArchive.startTime, selectedArchive.endTime)}</div>
                            </div>
                            
                            <div style={{ marginTop: '15px' }}>
                                <strong style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Users size={14} /> Yardıma Giden Taksiler ({selectedArchive.helpers?.length || 0}):
                                </strong>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                                    {selectedArchive.helpers?.map((h: any, i: number) => (
                                        <span key={i} style={{ padding: '4px 8px', background: 'rgba(88, 166, 255, 0.2)', borderRadius: '12px', fontSize: '11px', border: '1px solid rgba(88, 166, 255, 0.4)' }}>
                                            {h.name} ({h.plate})
                                        </span>
                                    ))}
                                    {(!selectedArchive.helpers || selectedArchive.helpers.length === 0) && (
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Kimse katılmadı.</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <h3 style={{ fontSize: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '5px', color: 'var(--text-secondary)' }}>Zaman Çizelgesi (Mesajlar)</h3>
                            
                            {(!selectedArchive.messages || selectedArchive.messages.length === 0) && (
                                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Kayıtlı telsiz mesajı bulunmuyor.</div>
                            )}

                            {selectedArchive.messages?.map((msg: any) => {
                                const isCreator = msg.senderId === selectedArchive.creator?.id || msg.senderName === selectedArchive.creator?.name;
                                return (
                                    <div key={msg.id} style={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignSelf: isCreator ? 'flex-end' : 'flex-start',
                                        maxWidth: '70%',
                                        background: isCreator ? 'rgba(248, 81, 73, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                        border: isCreator ? '1px solid rgba(248, 81, 73, 0.3)' : '1px solid var(--border-color)',
                                        borderRadius: '12px',
                                        padding: '12px',
                                        position: 'relative'
                                    }}>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '5px', display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
                                            <span style={{ fontWeight: 'bold', color: isCreator ? 'var(--danger-color)' : 'var(--accent-color)' }}>
                                                {msg.senderName} {isCreator && "(Mağdur)"}
                                            </span>
                                            <span>{new Date(msg.timestamp).toLocaleTimeString('tr-TR')}</span>
                                        </div>
                                        
                                        {msg.type === 'audio' ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <button onClick={() => playAudio(msg.content)} className="glass-button primary" style={{ padding: '8px', borderRadius: '50%', width: '35px', height: '35px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                    <Play size={14} fill="currentColor" />
                                                </button>
                                                <div style={{ fontSize: '13px' }}>Sesli Mesaj • {Math.round(msg.duration || 0)}sn</div>
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                                                {msg.content}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
