'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera as CameraIcon, RotateCw, Check, X, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CameraProps {
    onCapture: (blob: Blob, location: { lat: number; lng: number } | null) => void;
    label: string;
}

export default function Camera({ onCapture, label }: CameraProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }

            // Get location simultaneously
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => console.warn("Location access denied")
            );
        } catch (err) {
            setError("Camera access denied. Please enable permissions.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const capture = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setCapturedImage(dataUrl);
            stopCamera();
        }
    };

    const confirmCapture = async () => {
        if (!capturedImage) return;
        setLoading(true);
        const response = await fetch(capturedImage);
        const blob = await response.blob();
        onCapture(blob, location);
        setLoading(false);
    };

    const retake = () => {
        setCapturedImage(null);
        startCamera();
    };

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm font-bold text-slate-700 uppercase tracking-widest">{label}</p>

            <div className="relative aspect-video bg-slate-900 rounded-3xl overflow-hidden border-4 border-white shadow-2xl">
                {!capturedImage ? (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover mirror"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-48 h-48 border-2 border-white/30 rounded-full border-dashed animate-pulse" />
                        </div>
                    </>
                ) : (
                    <img src={capturedImage} className="w-full h-full object-cover" alt="Captured" />
                )}

                {location && (
                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 text-[10px] text-white">
                        <MapPin size={10} className="text-emerald-400" />
                        <span>{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
                    </div>
                )}
            </div>

            <div className="flex justify-center gap-4">
                {!capturedImage ? (
                    <button
                        onClick={capture}
                        className="w-20 h-20 rounded-full bg-blue-600 border-8 border-blue-100 flex items-center justify-center shadow-xl active:scale-90 transition-all"
                    >
                        <CameraIcon className="text-white w-8 h-8" />
                    </button>
                ) : (
                    <>
                        <button
                            onClick={retake}
                            className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shadow-lg active:scale-95 transition-all"
                        >
                            <RotateCw size={24} />
                        </button>
                        <button
                            onClick={confirmCapture}
                            disabled={loading}
                            className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 active:scale-95 transition-all"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white rounded-full animate-spin border-t-transparent" /> : <Check size={28} />}
                        </button>
                    </>
                )}
            </div>

            {error && <p className="text-rose-500 text-xs text-center font-bold px-4">{error}</p>}
        </div>
    );
}
