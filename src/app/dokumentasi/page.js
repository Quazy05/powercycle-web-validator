'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Camera, RotateCcw, RotateCw, Check, ArrowLeft, MapPin, RefreshCw, LogOut, CheckCircle, Upload } from 'lucide-react';

const MAX_WIDTH = 1280;

export default function DokumentasiPage() {
  const { unit, username, loading, logout } = useAuth();
  const router = useRouter();

  const [kegiatan, setKegiatan] = useState('');
  const [step, setStep] = useState('select');
  const [capturedImage, setCapturedImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [saving, setSaving] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [useFrontCamera, setUseFrontCamera] = useState(false);
  const [mapTileImg, setMapTileImg] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('loading');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const locationRef = useRef(null);
  const addressRef = useRef(null);
  const mapTileRef = useRef(null);
  const kegiatanRef = useRef('');

  useEffect(() => { locationRef.current = location; }, [location]);
  useEffect(() => { addressRef.current = address; }, [address]);
  useEffect(() => { mapTileRef.current = mapTileImg; }, [mapTileImg]);
  useEffect(() => { kegiatanRef.current = kegiatan; }, [kegiatan]);

  useEffect(() => {
    if (!loading && !username) {
      router.push('/login?returnUrl=/dokumentasi');
    }
  }, [loading, username, router]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('unavailable');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const newLoc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
        setLocation(newLoc);
        setGpsStatus('active');

        try {
          const zoom = 16;
          const n = Math.pow(2, zoom);
          const x = Math.floor((newLoc.lng + 180) / 360 * n);
          const latRad = newLoc.lat * Math.PI / 180;
          const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => setMapTileImg(img);
          img.onerror = () => {};
          img.src = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
        } catch (e) {}

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${newLoc.lat}&lon=${newLoc.lng}&format=json&accept-language=id`,
            { headers: { 'User-Agent': 'Powercycle-Dokumentasi/1.0' } }
          );
          const data = await res.json();
          setAddress({
            display: data.display_name || '',
            village: data.address?.village || data.address?.suburb || '',
            district: data.address?.city_district || data.address?.district || '',
            city: data.address?.city || data.address?.town || '',
            regency: data.address?.county || '',
            state: data.address?.state || '',
            country: data.address?.country || 'Indonesia',
            postcode: data.address?.postcode || ''
          });
        } catch (e) {}
      },
      (err) => {
        setGpsStatus('error');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const startCamera = useCallback(async (front) => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: front ? 'user' : 'environment' },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStep('camera');
    } catch (err) {
      setCameraError('Gagal mengakses kamera. Pastikan izin kamera telah diberikan di browser Anda.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const switchCamera = useCallback(() => {
    const newFront = !useFrontCamera;
    setUseFrontCamera(newFront);
    startCamera(newFront);
  }, [useFrontCamera, startCamera]);

  const drawOverlay = useCallback((ctx, w, h) => {
    const now = new Date();
    const loc = locationRef.current;
    const addr = addressRef.current;
    const tile = mapTileRef.current;
    const keg = kegiatanRef.current;

    const scale = w / 1280;
    const baseFontSize = Math.max(13, Math.round(18 * scale));
    const padding = Math.round(16 * scale);
    const mapSize = Math.round(140 * scale);
    const boxHeight = mapSize + padding * 2;

    const boxY = h - boxHeight;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.fillRect(0, boxY, w, boxHeight);
    ctx.fillStyle = 'rgba(8, 145, 178, 0.9)';
    ctx.fillRect(0, boxY, w, Math.round(3 * scale));

    const mapX = padding;
    const mapY = boxY + padding;

    if (tile) {
      ctx.save();
      ctx.beginPath();
      const r = Math.round(8 * scale);
      ctx.moveTo(mapX + r, mapY);
      ctx.lineTo(mapX + mapSize - r, mapY);
      ctx.quadraticCurveTo(mapX + mapSize, mapY, mapX + mapSize, mapY + r);
      ctx.lineTo(mapX + mapSize, mapY + mapSize - r);
      ctx.quadraticCurveTo(mapX + mapSize, mapY + mapSize, mapX + mapSize - r, mapY + mapSize);
      ctx.lineTo(mapX + r, mapY + mapSize);
      ctx.quadraticCurveTo(mapX, mapY + mapSize, mapX, mapY + mapSize - r);
      ctx.lineTo(mapX, mapY + r);
      ctx.quadraticCurveTo(mapX, mapY, mapX + r, mapY);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(tile, mapX, mapY, mapSize, mapSize);
      ctx.restore();

      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      const pinCX = mapX + mapSize / 2;
      const pinCY = mapY + mapSize / 2;
      const pinR = Math.round(7 * scale);
      ctx.arc(pinCX, pinCY - pinR, pinR, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(pinCX - pinR * 0.7, pinCY - pinR * 0.3);
      ctx.lineTo(pinCX, pinCY + pinR * 1.5);
      ctx.lineTo(pinCX + pinR * 0.7, pinCY - pinR * 0.3);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(pinCX, pinCY - pinR, pinR * 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(20, 70, 55, 0.7)';
      ctx.fillRect(mapX, mapY, mapSize, mapSize);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(mapX, mapY + (mapSize / 5) * i);
        ctx.lineTo(mapX + mapSize, mapY + (mapSize / 5) * i);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(mapX + (mapSize / 5) * i, mapY);
        ctx.lineTo(mapX + (mapSize / 5) * i, mapY + mapSize);
        ctx.stroke();
      }
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(mapX + mapSize / 2, mapY + mapSize / 2, Math.round(8 * scale), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = Math.round(1.5 * scale);
    ctx.strokeRect(mapX, mapY, mapSize, mapSize);

    const textX = mapX + mapSize + padding * 1.2;
    let textY = boxY + padding + baseFontSize * 0.3;
    const lineH = baseFontSize * 1.4;
    const maxTextW = w - textX - padding;

    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    const locationMain = addr
      ? `${addr.district || addr.village}, ${addr.state}`
      : 'Mencari lokasi...';
    ctx.font = `bold ${Math.round(baseFontSize * 1.15)}px Arial, sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(locationMain, textX, textY, maxTextW);
    textY += lineH * 1.05;

    ctx.font = `${baseFontSize}px Arial, sans-serif`;
    ctx.fillStyle = '#E2E8F0';
    ctx.fillText('Indonesia', textX, textY, maxTextW);
    textY += lineH;

    if (addr) {
      const addrParts = [addr.village, addr.district, addr.regency ? 'Kab. ' + addr.regency : '', addr.state, addr.postcode].filter(Boolean);
      const addrLine = addrParts.join(', ');
      ctx.font = `${Math.round(baseFontSize * 0.82)}px Arial, sans-serif`;
      ctx.fillStyle = '#CBD5E1';

      const words = addrLine.split(' ');
      let line = '';
      let lines = 0;
      for (let i = 0; i < words.length && lines < 2; i++) {
        const test = line + words[i] + ' ';
        if (ctx.measureText(test).width > maxTextW && line.length > 0) {
          ctx.fillText(line.trim(), textX, textY);
          textY += lineH * 0.85;
          line = words[i] + ' ';
          lines++;
        } else {
          line = test;
        }
      }
      if (line.trim() && lines < 2) {
        ctx.fillText(line.trim(), textX, textY);
        textY += lineH * 0.95;
      }
    } else {
      textY += lineH;
    }

    if (loc) {
      ctx.font = `${Math.round(baseFontSize * 0.82)}px Arial, sans-serif`;
      ctx.fillStyle = '#94A3B8';
      ctx.fillText(`Lat ${loc.lat.toFixed(6)}\u00B0 Long ${loc.lng.toFixed(6)}\u00B0`, textX, textY);
      textY += lineH;
    }

    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dateStr = `${dayNames[now.getDay()]}, ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;
    ctx.font = `bold ${Math.round(baseFontSize * 0.88)}px Arial, sans-serif`;
    ctx.fillStyle = '#FCD34D';
    ctx.fillText(dateStr, textX, textY);
    textY += lineH;

    ctx.font = `bold ${Math.round(baseFontSize * 0.88)}px Arial, sans-serif`;
    ctx.fillStyle = '#34D399';
    ctx.fillText(`${keg || 'Dokumentasi'}  \u2022  Unit: ${unit || '-'}`, textX, textY);

    ctx.font = `bold ${Math.round(baseFontSize * 0.72)}px Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'right';
    ctx.fillText('Powercycle Dokumentasi', w - padding, boxY - Math.round(8 * scale));
    ctx.textAlign = 'left';
  }, [unit]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let w = video.videoWidth;
    let h = video.videoHeight;
    if (w > MAX_WIDTH) {
      h = Math.floor(h * (MAX_WIDTH / w));
      w = MAX_WIDTH;
    }

    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(video, 0, 0, w, h);
    drawOverlay(ctx, w, h);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    setCapturedImage(dataUrl);
    stopCamera();
    setStep('preview');
  }, [drawOverlay, stopCamera]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        let w = img.width;
        let h = img.height;
        if (w > MAX_WIDTH) {
          h = Math.floor(h * (MAX_WIDTH / w));
          w = MAX_WIDTH;
        }

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        drawOverlay(ctx, w, h);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setCapturedImage(dataUrl);
        setStep('preview');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!capturedImage || !kegiatan) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'dokumentasi_kegiatan'), {
        kegiatan,
        unit: unit || 'Unknown',
        user: username || 'Unknown',
        img_url: capturedImage,
        location: location ? { lat: location.lat, lng: location.lng } : null,
        address: address?.display || null,
        created_at: new Date().toISOString(),
        synced_to_mysql: false
      });
      setStep('success');
    } catch (err) {
      alert('Gagal menyimpan dokumentasi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRotate = useCallback(() => {
    if (!capturedImage || !canvasRef.current) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = img.height;
      canvas.height = img.width;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      drawOverlay(ctx, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      setCapturedImage(dataUrl);
    };
    img.src = capturedImage;
  }, [capturedImage, drawOverlay]);

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(useFrontCamera);
  };

  const handleTakeAnother = () => {
    setCapturedImage(null);
    setKegiatan('');
    setStep('select');
  };

  const handleLogout = async () => {
    stopCamera();
    await logout();
    router.push('/');
  };

  if (loading || !username) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--ds-bg)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '4px solid var(--ds-border)', borderTop: '4px solid var(--ds-accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--ds-text-muted)', fontWeight: 600 }}>Memuat...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const formatTime = (d) => {
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return `${dayNames[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')} WIB`;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0C1A2E', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", display: 'flex', flexDirection: 'column' }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <header style={{ background: 'rgba(12, 26, 46, 0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => { stopCamera(); router.push('/'); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.5px' }}>
              <Camera size={16} style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--ds-accent)' }} />
              Dokumentasi Kegiatan
            </h1>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
              {username} &bull; Unit {unit || '-'}
            </p>
          </div>
        </div>
        <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
          <LogOut size={14} /> Keluar
        </button>
      </header>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: step === 'camera' ? 'flex-start' : 'center', padding: step === 'camera' ? 0 : 20 }}>

        {step === 'select' && (
          <div style={{ width: '100%', maxWidth: 440, padding: '0 20px', boxSizing: 'border-box' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(8, 145, 178, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Camera size={36} color="var(--ds-accent)" />
              </div>
              <h2 style={{ color: '#FFFFFF', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.5px' }}>Ambil Foto Dokumentasi</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', margin: 0 }}>Foto akan otomatis dilengkapi timestamp dan lokasi GPS</p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <MapPin size={14} color={gpsStatus === 'active' ? '#10B981' : '#F59E0B'} />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: gpsStatus === 'active' ? '#10B981' : '#F59E0B' }}>
                  {gpsStatus === 'active' ? 'GPS Aktif' : gpsStatus === 'loading' ? 'Mencari GPS...' : 'GPS Tidak Tersedia'}
                </span>
              </div>
              {location && (
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
                  {address ? `${address.village || address.district}, ${address.regency || address.city}` : `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
                </p>
              )}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Pilih Jenis Kegiatan
              </label>

              <button onClick={() => setKegiatan('Input Sampah')} style={{ width: '100%', padding: '18px 20px', background: kegiatan === 'Input Sampah' ? 'rgba(8, 145, 178, 0.2)' : 'rgba(255,255,255,0.04)', border: kegiatan === 'Input Sampah' ? '2px solid var(--ds-accent)' : '1.5px solid rgba(255,255,255,0.1)', borderRadius: 14, cursor: 'pointer', textAlign: 'left', marginBottom: 10, transition: 'all 0.2s', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 14 }}>
                
                <div>
                  <span style={{ display: 'block', color: '#FFFFFF', fontWeight: 700, fontSize: '0.95rem' }}>Input Sampah</span>
                  <span style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', marginTop: 2 }}>Dokumentasi kegiatan pencatatan sampah</span>
                </div>
              </button>

              <button onClick={() => setKegiatan('Input Pemanfaatan (Program)')} style={{ width: '100%', padding: '18px 20px', background: kegiatan === 'Input Pemanfaatan (Program)' ? 'rgba(8, 145, 178, 0.2)' : 'rgba(255,255,255,0.04)', border: kegiatan === 'Input Pemanfaatan (Program)' ? '2px solid var(--ds-accent)' : '1.5px solid rgba(255,255,255,0.1)', borderRadius: 14, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 14 }}>
                
                <div>
                  <span style={{ display: 'block', color: '#FFFFFF', fontWeight: 700, fontSize: '0.95rem' }}>Input Pemanfaatan (Program)</span>
                  <span style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', marginTop: 2 }}>Dokumentasi kegiatan program pemanfaatan</span>
                </div>
              </button>
            </div>

            {cameraError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <p style={{ color: '#FCA5A5', fontSize: '0.85rem', margin: 0 }}>{cameraError}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
              <button onClick={() => { if (kegiatan) startCamera(useFrontCamera); }} disabled={!kegiatan} style={{ width: '100%', padding: '16px', background: kegiatan ? 'var(--ds-accent)' : 'rgba(255,255,255,0.08)', color: kegiatan ? 'white' : 'rgba(255,255,255,0.3)', border: 'none', borderRadius: 99, fontSize: '1rem', fontWeight: 800, cursor: kegiatan ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.25s' }}>
                <Camera size={20} /> Buka Kamera Langsung
              </button>

              <label style={{ width: '100%', padding: '16px', background: kegiatan ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)', color: kegiatan ? 'white' : 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 99, fontSize: '1rem', fontWeight: 800, cursor: kegiatan ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.25s', boxSizing: 'border-box' }}>
                <Upload size={20} /> Upload / Kamera Bawaan
                <input 
                  type="file" 
                  accept="image/*" 
                  disabled={!kegiatan}
                  onChange={handleFileUpload} 
                  style={{ display: 'none' }} 
                />
              </label>
            </div>
          </div>
        )}

        {step === 'camera' && (
          <div className="cam-container">
            <video ref={videoRef} autoPlay playsInline muted className="cam-video" />

            <div className="cam-info-panel">
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div className="cam-map-thumb">
                  {location ? <MapPin size={20} color="#EF4444" /> : <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>GPS...</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="cam-info-line cam-info-title">
                    {address ? `${address.district || address.village}, ${address.state}` : 'Mencari lokasi...'}
                  </p>
                  <p className="cam-info-line" style={{ color: '#E2E8F0' }}>Indonesia</p>
                  {address && <p className="cam-info-line cam-info-sub">{address.village}, {address.regency}, {address.postcode}</p>}
                  {location && <p className="cam-info-line cam-info-sub" style={{ color: '#94A3B8' }}>Lat {location.lat.toFixed(6)}° Long {location.lng.toFixed(6)}°</p>}
                  <p className="cam-info-line" style={{ fontWeight: 700, color: '#FCD34D' }}>{formatTime(currentTime)}</p>
                  <p className="cam-info-line" style={{ fontWeight: 700, color: '#34D399', marginBottom: 0 }}>{kegiatan} &bull; Unit: {unit || '-'}</p>
                </div>
              </div>
            </div>

            <div className="cam-controls">
              <button onClick={switchCamera} className="cam-btn cam-btn-secondary">
                <RefreshCw size={20} />
              </button>

              <button onClick={capturePhoto} className="cam-btn-capture" onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
                <div className="cam-btn-capture-inner" />
              </button>

              <button onClick={() => { stopCamera(); setStep('select'); }} className="cam-btn cam-btn-close">
                <ArrowLeft size={20} />
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && capturedImage && (
          <div style={{ width: '100%', maxWidth: 600, padding: '0 20px', boxSizing: 'border-box' }}>
            <h2 style={{ color: '#FFFFFF', fontSize: '1.15rem', fontWeight: 800, margin: '0 0 16px', textAlign: 'center' }}>Preview Foto</h2>
            <div style={{ borderRadius: 16, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)', marginBottom: 24 }}>
              <img src={capturedImage} alt="Preview" style={{ width: '100%', display: 'block' }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleRetake} style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.08)', color: 'white', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 99, fontSize: '0.92rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <RotateCcw size={18} /> Ulangi
              </button>
              <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '14px', background: saving ? 'rgba(8,145,178,0.5)' : 'var(--ds-accent)', color: 'white', border: 'none', borderRadius: 99, fontSize: '0.92rem', fontWeight: 700, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {saving ? 'Menyimpan...' : <><Check size={18} /> Simpan</>}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div style={{ width: '100%', maxWidth: 440, padding: '0 20px', boxSizing: 'border-box', textAlign: 'center' }}>
            <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', animation: 'popIn 0.4s ease-out' }}>
              <CheckCircle size={48} color="#10B981" />
            </div>
            <h2 style={{ color: '#FFFFFF', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px' }}>Berhasil Disimpan!</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', margin: '0 0 32px' }}>
              Dokumentasi telah dikirim dan akan otomatis tersinkronisasi ke sistem lokal.
            </p>
            <button onClick={handleTakeAnother} style={{ width: '100%', padding: '16px', background: 'var(--ds-accent)', color: 'white', border: 'none', borderRadius: 99, fontSize: '1rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <Camera size={20} /> Ambil Foto Lagi
            </button>
            <button onClick={() => router.push('/')} style={{ width: '100%', padding: '14px', background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 99, fontSize: '0.92rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 12 }}>
              Kembali ke Beranda
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }

        /* Camera container - fills available space */
        .cam-container {
          width: 100%; height: 100%; position: relative; flex: 1;
          display: flex; flex-direction: column; overflow: hidden;
        }
        .cam-video {
          width: 100%; flex: 1; object-fit: cover; background: #000;
        }

        /* Info panel - bottom in portrait */
        .cam-info-panel {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: rgba(0,0,0,0.72); padding: 10px 14px;
          border-top: 2px solid rgba(8, 145, 178, 0.8);
          z-index: 10;
        }
        .cam-map-thumb {
          width: 56px; height: 56px; border-radius: 8px; overflow: hidden;
          border: 1.5px solid rgba(255,255,255,0.2); background: rgba(20,70,55,0.7);
          flex-shrink: 0; display: flex; align-items: center; justify-content: center;
        }
        .cam-info-line {
          margin: 0 0 1px; font-size: 0.68rem; color: #FFFFFF;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .cam-info-title { font-weight: 700; font-size: 0.78rem; }
        .cam-info-sub { font-size: 0.62rem; color: #CBD5E1; }

        /* Controls - above info panel in portrait */
        .cam-controls {
          position: absolute; left: 0; right: 0;
          display: flex; justify-content: center; align-items: center;
          gap: 20px; padding: 16px; z-index: 10;
          bottom: 130px;
        }
        .cam-btn {
          width: 46px; height: 46px; border-radius: 50%; color: white;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(4px); border: none;
        }
        .cam-btn-secondary {
          background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25) !important;
        }
        .cam-btn-close {
          background: rgba(239,68,68,0.3); border: 1px solid rgba(239,68,68,0.5) !important;
        }
        .cam-btn-capture {
          width: 68px; height: 68px; border-radius: 50%; background: white;
          border: 4px solid var(--ds-accent); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 24px rgba(0,0,0,0.4); transition: transform 0.15s;
        }
        .cam-btn-capture-inner {
          width: 52px; height: 52px; border-radius: 50%;
          border: 3px solid var(--ds-accent);
        }

        /* LANDSCAPE MODE */
        @media (orientation: landscape) and (max-height: 500px) {
          .cam-container { flex-direction: row; }
          .cam-video { width: auto; height: 100%; flex: 1; }

          .cam-info-panel {
            position: absolute; top: 0; bottom: 0; right: 0; left: auto;
            width: 220px; border-top: none; border-left: 2px solid rgba(8, 145, 178, 0.8);
            padding: 10px 12px; overflow-y: auto;
            display: flex; align-items: center;
          }
          .cam-map-thumb { width: 40px; height: 40px; }
          .cam-info-line { font-size: 0.6rem; }
          .cam-info-title { font-size: 0.7rem; }
          .cam-info-sub { font-size: 0.55rem; }

          .cam-controls {
            bottom: auto; right: auto; left: 0; top: 0;
            width: 70px; height: 100%;
            flex-direction: column; justify-content: center;
            padding: 10px; gap: 14px;
          }
          .cam-btn { width: 40px; height: 40px; }
          .cam-btn-capture { width: 56px; height: 56px; }
          .cam-btn-capture-inner { width: 42px; height: 42px; }
        }

        /* Small portrait screens */
        @media (orientation: portrait) and (max-height: 700px) {
          .cam-controls { bottom: 110px; gap: 16px; padding: 10px; }
          .cam-btn-capture { width: 60px; height: 60px; }
          .cam-btn-capture-inner { width: 46px; height: 46px; }
          .cam-info-panel { padding: 8px 12px; }
          .cam-map-thumb { width: 44px; height: 44px; }
        }
      `}</style>
    </div>
  );
}
