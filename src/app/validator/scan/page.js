'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, Upload } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';

export default function ValidatorScanPage() {
  const router = useRouter();
  const [scannedId, setScannedId] = useState('');

  const handleDecodedText = (decodedText) => {
    try {
      const url = new URL(decodedText);
      router.push(url.pathname);
    } catch (e) {
      if (decodedText.includes('/validator/verify/')) {
        router.push(decodedText);
      } else {
        router.push(`/validator/verify/${decodedText}`);
      }
    }
  };

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", { 
      qrbox: { width: 250, height: 250 }, 
      fps: 5,
      // Menonaktifkan tombol bawaan "Scan an Image File" dari library
      showFileButton: false 
    });

    scanner.render(
      (decodedText) => {
        scanner.clear();
        handleDecodedText(decodedText);
      },
      (err) => {
        // ignore errors
      }
    );

    return () => {
      scanner.clear().catch(e => console.error(e));
    };
  }, [router]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const html5QrCode = new Html5Qrcode("reader");
    html5QrCode.scanFile(file, true)
      .then((decodedText) => {
        html5QrCode.clear();
        handleDecodedText(decodedText);
      })
      .catch((err) => {
        alert('Gagal mendeteksi QR Code dari gambar. Pastikan gambar jelas.');
      });
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (scannedId) {
      router.push(`/validator/verify/${scannedId}`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ds-bg)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <header style={{ background: 'white', padding: '16px 28px', borderBottom: '1px solid var(--ds-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-text)', letterSpacing: '-0.5px' }}>Validator Portal</h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--ds-text-muted)' }}>Scan QR Code atau unggah gambar untuk verifikasi data sampah</p>
        </div>
      </header>
      
      <main style={{ padding: 40, maxWidth: 600, margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: 24, padding: 32, boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid var(--ds-border)', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: 'rgba(8, 145, 178, 0.1)', color: 'var(--ds-accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <QrCode size={32} />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-text)' }}>Scan QR Code / Unggah Gambar</h3>
          <p style={{ margin: '0 0 24px', color: 'var(--ds-text-muted)', fontSize: '0.9rem' }}>Arahkan kamera ke QR Code atau pilih file gambar QR Code dari perangkat Anda.</p>
          
          <div id="reader" style={{ width: '100%', borderRadius: 16, overflow: 'hidden', border: '2px dashed var(--ds-border)' }}></div>

          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--ds-border)' }}>
            <p style={{ margin: '0 0 12px', color: 'var(--ds-text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Atau masukkan ID secara manual:</p>
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: 8 }}>
              <input type="text" value={scannedId} onChange={e => setScannedId(e.target.value)} placeholder="Contoh: TD172050..." style={{ flex: 1, padding: '12px 16px', border: '1.5px solid var(--ds-border)', borderRadius: 12, fontSize: '0.9rem', outline: 'none' }} />
              <button type="submit" style={{ padding: '12px 20px', background: 'var(--ds-text)', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Cari</button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}