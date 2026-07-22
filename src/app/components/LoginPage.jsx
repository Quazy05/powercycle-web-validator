'use client';
import { useState } from 'react';
import { Building2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { UNIT_LIST } from '../lib/mockData';

const PLNLogo = ({ size = 64 }) => {
  const customLogoUrl = '/Logo.png';
  if (customLogoUrl) {
    return <img src={customLogoUrl} alt="Logo" style={{ height: size, maxWidth: '100%', objectFit: 'contain' }} />;
  }
  return null;
};

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [determinedRole, setDeterminedRole] = useState('user');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      alert("Masukkan username dan password");
      return;
    }
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const user = data.user;
        const role = user.role.toLowerCase();
        setDeterminedRole(role);
        setShowUnitModal(true);
      } else {
        alert(data.error || 'Username atau password salah');
      }
    } catch (err) {
      console.error('Login connection error:', err);
      alert('Koneksi ke backend gagal. Pastikan database MySQL sudah aktif dan di-import.');
    }
  };

  const handleUnitSelect = (unit) => {
    login(determinedRole, unit, username);
    setShowUnitModal(false);
    
    if (determinedRole === 'admin sis' || determinedRole === 'admin llk') router.push('/admin');
    else if (determinedRole === 'validator') router.push('/validator/scan');
    else if (determinedRole === 'user') router.push('/user');
  };

  return (
    <div style={{
      background: 'var(--ds-bg)',
      minHeight: '100vh',
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
    }}>
      
      <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'rgba(8, 145, 178, 0.07)', filter: 'blur(120px)', top: -200, right: -200, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(8, 145, 178, 0.05)', filter: 'blur(100px)', bottom: -100, left: -100, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 440, padding: '24px 20px', boxSizing: 'border-box' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{ 
              background: 'white', 
              padding: 16, 
              borderRadius: '24px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              boxShadow: '0 12px 40px rgba(8, 145, 178, 0.1)',
              border: '1px solid var(--ds-border)'
            }}>
               <PLNLogo size={90} />
            </div>
          </div>
          <h1 style={{ color: 'var(--ds-text)', fontSize: '2.1rem', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-1.5px' }}>
            Powercycle<span style={{ color: 'var(--ds-accent)' }}>.</span>
          </h1>
          <p style={{ color: 'var(--ds-text-muted)', fontSize: '0.9rem', margin: 0, fontWeight: 500 }}>
            Bank Sampah Digital
          </p>
        </div>

        <div style={{ 
          background: 'white', 
          borderRadius: 'var(--ds-card-radius)', 
          padding: 'var(--login-padding, 40px 36px)', 
          boxShadow: '0 24px 60px -15px rgba(8, 145, 178, 0.08)',
          border: '1px solid rgba(203, 213, 225, 0.7)',
          boxSizing: 'border-box'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', color: 'var(--ds-text)', fontSize: '0.85rem', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Username
              </label>
              <input 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                placeholder="Masukkan username" 
                style={{ 
                  width: '100%', padding: '14px 16px', border: '1.5px solid var(--ds-border)', borderRadius: 12, 
                  fontSize: '0.95rem', outline: 'none', transition: 'all 0.25s', boxSizing: 'border-box',
                  color: 'var(--ds-text)', fontFamily: 'inherit', background: '#FAFBFC'
                }} 
                onFocus={e => { e.target.style.borderColor = 'var(--ds-accent)'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(8, 145, 178, 0.08)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--ds-border)'; e.target.style.background = '#FAFBFC'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', color: 'var(--ds-text)', fontSize: '0.85rem', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  style={{ 
                    width: '100%', padding: '14px 44px 14px 16px', border: '1.5px solid var(--ds-border)', borderRadius: 12, 
                    fontSize: '0.95rem', outline: 'none', transition: 'all 0.25s', boxSizing: 'border-box',
                    color: 'var(--ds-text)', fontFamily: 'inherit', background: '#FAFBFC'
                  }} 
                  onFocus={e => { e.target.style.borderColor = 'var(--ds-accent)'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(8, 145, 178, 0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--ds-border)'; e.target.style.background = '#FAFBFC'; e.target.style.boxShadow = 'none'; }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  style={{ 
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', 
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ds-text-muted)', padding: 4,
                    display: 'flex', alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              style={{ 
                width: '100%', padding: '14px', background: 'var(--ds-text)', color: 'white', 
                border: 'none', borderRadius: '999px', fontSize: '0.95rem', fontWeight: 700, 
                cursor: 'pointer', transition: 'all 0.25s', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8
              }}
              onMouseEnter={e => { e.target.style.background = 'var(--ds-accent)'; e.target.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.target.style.background = 'var(--ds-text)'; e.target.style.transform = 'none'; }}
              onMouseDown={e => e.target.style.transform = 'scale(0.98)'}
              onMouseUp={e => e.target.style.transform = 'none'}
            >
              Masuk <ArrowRight size={16} />
            </button>
          </form>
          
          <p style={{ color: 'var(--ds-text-muted)', fontSize: '0.78rem', margin: '20px 0 0 0', textAlign: 'center', fontWeight: 500 }}>
            Unit Bisnis Pembangkitan Mrica
          </p>

        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <a href="/" style={{ color: 'var(--ds-text-muted)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s', display: 'inline-flex', alignItems: 'center', gap: 6 }}
             onMouseEnter={e => e.target.style.color = 'var(--ds-accent)'}
             onMouseLeave={e => e.target.style.color = 'var(--ds-text-muted)'}
          >
            ← Kembali ke Beranda
          </a>
        </div>
      </div>

      {showUnitModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(12, 26, 46, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, backdropFilter: 'blur(12px)',
          animation: 'fadeIn 0.25s ease'
        }}>
          <div style={{
            background: 'white', borderRadius: 'var(--ds-card-radius)', padding: '40px 36px', width: '100%', maxWidth: 440,
            boxShadow: '0 32px 80px -10px rgba(12, 26, 46, 0.15)', border: '1px solid rgba(203, 213, 225, 0.7)',
            boxSizing: 'border-box',
            animation: 'slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1)'
          }}>
            <h2 style={{ margin: '0 0 8px 0', color: 'var(--ds-text)', fontSize: '1.45rem', fontWeight: 800, textAlign: 'center', letterSpacing: '-0.5px' }}>Pilih Unit Lokasi</h2>
            <p style={{ color: 'var(--ds-text-muted)', fontSize: '0.88rem', textAlign: 'center', marginBottom: 28, marginTop: 0 }}>
              Silakan pilih unit operasional Anda untuk melanjutkan login
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {UNIT_LIST.map(unit => (
                <button
                  key={unit}
                  onClick={() => handleUnitSelect(unit)}
                  style={{
                    padding: '24px 16px', background: 'white', border: '1.5px solid var(--ds-border)',
                    borderRadius: 20, cursor: 'pointer', transition: 'all 0.25s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                    fontFamily: 'inherit', boxSizing: 'border-box'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ds-accent)'; e.currentTarget.style.background = 'rgba(8, 145, 178, 0.03)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--ds-border)'; e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ 
                    width: '100%', 
                    height: 120, 
                    borderRadius: 12, 
                    overflow: 'hidden',
                    marginBottom: 8,
                    background: 'var(--ds-bg-alt)'
                  }}>
                    <img 
                      src={unit === 'Wonogiri' ? '/PLTA Wonogiri.jpeg' : '/PLTA PB. Soedirman.jpeg'} 
                      alt={unit}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--ds-text)', fontSize: '0.95rem', textAlign: 'center' }}>
                    {unit === 'Wonogiri' ? 'PLTA Wonogiri' : (unit === 'Banjarnegara' ? 'PLTA PB.Soedirman' : unit)}
                  </span>
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setShowUnitModal(false)}
              style={{
                width: '100%', padding: '12px', background: 'transparent', color: 'var(--ds-text-muted)',
                border: 'none', marginTop: 24, cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem',
                fontFamily: 'inherit', display: 'block', textAlign: 'center'
              }}
              onMouseEnter={e => e.target.style.color = 'var(--ds-text)'}
              onMouseLeave={e => e.target.style.color = 'var(--ds-text-muted)'}
            >
              Batal Login
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}} />
    </div>
  );
}
