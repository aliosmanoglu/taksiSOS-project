import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Play, Pause, FastForward } from 'lucide-react';

// Custom Icons
const victimIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const helperIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface LocationUpdate {
    id: string;
    name: string;
    plate?: string;
    lat: number;
    lon: number;
    timestamp: number;
    isCreator: boolean;
}

const Recenter = ({ lat, lon }: { lat: number, lon: number }) => {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lon], map.getZoom());
    }, [lat, lon, map]);
    return null;
};

export default function LocationSimulation({ history, messages = [], startTime, endTime }: { history: LocationUpdate[], messages?: any[], startTime: number, endTime?: number }) {
    const finalEndTime = endTime || Date.now();
    const duration = finalEndTime - startTime;
    
    const [currentTime, setCurrentTime] = useState(startTime);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speedMultiplier, setSpeedMultiplier] = useState(1);
    const animationRef = useRef<number | null>(null);
    const lastRenderTime = useRef<number>(0);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioPlayerRef.current = new Audio();
        return () => {
            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
                audioPlayerRef.current.src = "";
            }
        };
    }, []);

    const togglePlay = () => {
        if (currentTime >= finalEndTime) {
            setCurrentTime(startTime);
        }
        setIsPlaying(!isPlaying);
    };

    const toggleSpeed = () => {
        setSpeedMultiplier(s => s === 1 ? 2 : s === 2 ? 5 : s === 5 ? 10 : 1);
    };

    useEffect(() => {
        if (!isPlaying) {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            return;
        }

        lastRenderTime.current = Date.now();

        const animate = () => {
            const now = Date.now();
            const delta = now - lastRenderTime.current;
            lastRenderTime.current = now;

            setCurrentTime(prev => {
                const next = prev + (delta * speedMultiplier);
                
                // Audio Synchronization Check
                if (messages && messages.length > 0) {
                    for (const msg of messages) {
                        if (msg.type === 'audio' && msg.timestamp >= prev && msg.timestamp < next) {
                            if (audioPlayerRef.current) {
                                audioPlayerRef.current.src = msg.content;
                                audioPlayerRef.current.playbackRate = speedMultiplier;
                                audioPlayerRef.current.play().catch(e => console.log("Simülasyon ses oynatılamadı", e));
                            }
                        }
                    }
                }

                if (next >= finalEndTime) {
                    setIsPlaying(false);
                    return finalEndTime;
                }
                return next;
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isPlaying, speedMultiplier, finalEndTime]);

    // Calculate current positions
    const currentPositions = new Map<string, LocationUpdate>();
    
    // Sort history by time just in case
    const sortedHistory = [...history].sort((a, b) => a.timestamp - b.timestamp);
    
    for (const update of sortedHistory) {
        if (update.timestamp <= currentTime || currentPositions.size === 0) {
            currentPositions.set(update.id, update);
        }
        if (update.timestamp > currentTime) {
            // Since it's sorted, we can stop early when we pass currentTime
            break;
        }
    }

    const activeUsers = Array.from(currentPositions.values());
    const victim = activeUsers.find(u => u.isCreator);
    const centerLat = victim?.lat || (activeUsers.length > 0 ? activeUsers[0].lat : 41.0082);
    const centerLon = victim?.lon || (activeUsers.length > 0 ? activeUsers[0].lon : 28.9784);

    const progressPercentage = ((currentTime - startTime) / duration) * 100;

    const formatClock = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString('tr-TR');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '350px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <div style={{ flex: 1, position: 'relative' }}>
                <MapContainer center={[centerLat, centerLon]} zoom={15} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />
                    <Recenter lat={centerLat} lon={centerLon} />
                    {activeUsers.map(user => (
                        <Marker 
                            key={user.id} 
                            position={[user.lat, user.lon]} 
                            icon={user.isCreator ? victimIcon : helperIcon}
                            zIndexOffset={user.isCreator ? 1000 : 0}
                        >
                            <Tooltip permanent direction="bottom" offset={[0, 10]} opacity={0.9}>
                                <div style={{ fontWeight: 'bold', fontSize: '11px', whiteSpace: 'nowrap', color: '#000' }}>
                                    {user.plate || 'Bilinmeyen Plaka'}
                                </div>
                            </Tooltip>
                            <Popup>
                                <div style={{ color: '#000', fontWeight: 'bold' }}>
                                    {user.plate || 'Bilinmeyen Plaka'} {user.isCreator ? '(Mağdur)' : '(Yardımcı)'}
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
            
            {/* Timeline Controls */}
            <div style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button 
                    onClick={togglePlay}
                    style={{
                        background: 'var(--accent-color)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', 
                        display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0
                    }}
                >
                    {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" style={{ marginLeft: '3px' }} />}
                </button>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input 
                        type="range" 
                        min={startTime} 
                        max={finalEndTime} 
                        value={currentTime}
                        onChange={(e) => {
                            setCurrentTime(parseFloat(e.target.value));
                            setIsPlaying(false);
                        }}
                        style={{ width: '100%', accentColor: 'var(--accent-color)', cursor: 'pointer' }} 
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <span>{formatClock(startTime)}</span>
                        <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>{formatClock(currentTime)}</span>
                        <span>{formatClock(finalEndTime)}</span>
                    </div>
                </div>

                <button 
                    onClick={toggleSpeed}
                    style={{
                        background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-color)', borderRadius: '8px', 
                        padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#fff',
                        fontSize: '12px', fontWeight: 'bold'
                    }}
                >
                    <FastForward size={14} /> {speedMultiplier}x
                </button>
            </div>
        </div>
    );
}
