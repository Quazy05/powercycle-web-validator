const fs = require('fs');
let c = fs.readFileSync('src/app/dokumentasi/page.js', 'utf8');

c = c.replace("CheckCircle } from 'lucide-react'", "CheckCircle, Upload } from 'lucide-react'");

const handleFileUpload = `const handleFileUpload = (e) => {
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

  const handleSave = async () => {`;

c = c.replace('const handleSave = async () => {', handleFileUpload);

const newButtons = `<div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
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
            </div>`;

c = c.replace(/<button onClick=\{\(\) => \{ if \(kegiatan\) startCamera\(useFrontCamera\); \}\}.*?<\/button>/s, newButtons);

fs.writeFileSync('src/app/dokumentasi/page.js', c);
console.log('Patched');
