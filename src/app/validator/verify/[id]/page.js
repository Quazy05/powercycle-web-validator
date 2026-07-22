'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, ArrowLeft, Package, MapPin, Scale, Calendar, AlertCircle } from 'lucide-react';

export default function ValidatorVerifyPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [validatorName, setValidatorName] = useState('');
  const [editData, setEditData] = useState({ category: '', jenis: '', pengelola: '', weight: '' });
  const [masterJenis, setMasterJenis] = useState([]);
  const [masterPengelola, setMasterPengelola] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/temporary-deposits/${id}`);
        const result = await res.json();

        if (result.success) {
          const docData = result.data;
          setData(docData);
          setEditData({
            category: docData.category,
            jenis: docData.jenis,
            pengelola: docData.pengelola,
            weight: docData.weight
          });

          setMasterJenis([
            { id: 1, kategori: docData.category, nama_jenis: docData.jenis }
          ]);
          setMasterPengelola([
            { id: 1, nama_pengelola: docData.pengelola }
          ]);
        } else {
          setError(result.error || 'Data tidak ditemukan');
        }
      } catch (err) {
        setError('Gagal mengambil data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, router]);

  const handleVerify = async (status, reason = '') => {
    if (!validatorName) {
      alert('Mohon isi Nama Validator terlebih dahulu.');
      return;
    }

    try {
      // 1. Proses update data di Web Publik / Firebase
      const res = await fetch(`/api/temporary-deposits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status, 
          alasan_penolakan: reason, 
          validator_name: validatorName,
          category: editData.category,
          jenis: editData.jenis,
          pengelola: editData.pengelola,
          weight: editData.weight
        })
      });
      const result = await res.json();

      if (result.success) {
        
        // 2. Kirim data secara real-time ke Web Internal jika status Terverifikasi
        if (status === 'Terverifikasi') {
          try {
            await fetch('http://localhost:3000/api/receive-deposit', { // Ganti URL domain internal jika sudah online
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: data.id,
                date: data.date,
                time: data.time,
                user: data.user,
                client: data.client || '-',
                unit: data.unit,
                category: editData.category,
                jenis: editData.jenis,
                pengelola: editData.pengelola,
                weight: editData.weight,
                status: 'Terverifikasi',
                remarks: reason
              })
            });
          } catch (syncErr) {
            console.error('Gagal mengirim webhook ke internal:', syncErr);
          }
        }

        alert(result.message);
        router.push('/validator/scan');
      } else {
        alert('Gagal memvalidasi: ' + result.error);
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan');
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Loading...</div>;

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--ds-bg)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <div style={{ background: 'white', padding: 40, borderRadius: 24, textAlign: 'center', maxWidth: 400, width: '100%' }}>
          <AlertCircle size={48} color="#EF4444" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ margin: '0 0 12px', fontSize: '1.25rem', color: 'var(--ds-text)' }}>Data Tidak Ditemukan</h2>
          <p style={{ margin: '0 0 24px', color: 'var(--ds-text-muted)' }}>{error || 'QR Code tidak valid atau data sudah divalidasi/dihapus.'}</p>
          <button onClick={() => router.push('/validator/scan')} style={{ padding: '12px 24px', background: 'var(--ds-accent)', color: 'white', border: 'none', borderRadius: 99, fontWeight: 700, cursor: 'pointer' }}>Kembali ke Scanner</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ds-bg)', fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: 'border-box' }}>
      <header style={{ background: 'white', padding: '16px 20px', borderBottom: '1px solid var(--ds-border)', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => router.push('/validator/scan')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--ds-text-muted)' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ds-text)', letterSpacing: '-0.5px' }}>Validasi Data Sampah</h2>
      </header>
      
      <main style={{ padding: '20px 16px', maxWidth: 640, margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ background: 'white', borderRadius: 24, padding: '24px 16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid var(--ds-border)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#D97706', padding: '6px 16px', borderRadius: 99, fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
              {data.status}
            </span>
            
            <div style={{ 
              marginTop: 20, 
              background: editData.category === 'Organik' ? '#D1FAE5' : editData.category === 'Anorganik' ? '#E0F2FE' : editData.category === 'Residu' ? '#FEF3C7' : '#F8FAFC',
              borderRadius: '16px', 
              padding: '20px 16px',
              textAlign: 'center',
              border: '1px solid rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8, 
                color: editData.category === 'Organik' ? '#065F46' : editData.category === 'Anorganik' ? '#0369A1' : editData.category === 'Residu' ? '#92400E' : 'var(--ds-text-muted)', 
                fontWeight: 800, 
                fontSize: '0.9rem', 
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: 12
              }}>
                <Scale size={20} />
                TOTAL TIMBULAN
              </div>
              
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', flexWrap: 'wrap' }}>
                <input 
                  type="number" step="0.01" 
                  value={editData.weight} 
                  disabled={true}
                  style={{ 
                    fontSize: '2.5rem', 
                    fontWeight: 900, 
                    color: editData.category === 'Organik' ? '#064E3B' : editData.category === 'Anorganik' ? '#0C4A6E' : editData.category === 'Residu' ? '#78350F' : 'var(--ds-text)', 
                    width: '100%',
                    maxWidth: 180, 
                    textAlign: 'center',
                    background: 'transparent', 
                    border: 'none', 
                    outline: 'none', 
                    padding: '0 4px', 
                    fontFamily: 'inherit', 
                    letterSpacing: '-1px',
                    opacity: 0.8
                  }} 
                />
                <span style={{ 
                  fontSize: '1.2rem', 
                  fontWeight: 800, 
                  color: editData.category === 'Organik' ? '#065F46' : editData.category === 'Anorganik' ? '#0369A1' : editData.category === 'Residu' ? '#92400E' : 'var(--ds-text-muted)', 
                  marginLeft: 4,
                  textTransform: 'uppercase'
                }}>Kg</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28, padding: '0 4px' }}>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ds-text-muted)', fontSize: '0.9rem', fontWeight: 600, flexShrink: 0 }}><Package size={18} /> Kategori</span>
              <select 
                value={editData.category} 
                disabled={true}
                style={{ padding: '8px 12px', border: '1.5px solid var(--ds-border)', borderRadius: 8, fontWeight: 700, outline: 'none', background: '#f3f4f6', color: 'var(--ds-text)', fontFamily: 'inherit', appearance: 'none', maxWidth: '60%', textOverflow: 'ellipsis' }}
              >
                <option value="Organik">Organik</option>
                <option value="Anorganik">Anorganik</option>
                <option value="Residu">Residu</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ds-text-muted)', fontSize: '0.9rem', fontWeight: 600, flexShrink: 0 }}><Package size={18} /> Jenis Sampah</span>
              <select 
                value={editData.jenis} 
                disabled={true}
                style={{ padding: '8px 12px', border: '1.5px solid var(--ds-border)', borderRadius: 8, fontWeight: 700, outline: 'none', background: '#f3f4f6', color: 'var(--ds-text)', fontFamily: 'inherit', cursor: 'default', appearance: 'none', maxWidth: '65%', textOverflow: 'ellipsis' }}
              >
                {masterJenis.map(j => (
                  <option key={j.id} value={j.nama_jenis}>{j.nama_jenis}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ds-text-muted)', fontSize: '0.9rem', fontWeight: 600, flexShrink: 0 }}><MapPin size={18} /> Pengelola</span>
              <select 
                value={editData.pengelola} 
                disabled={true}
                style={{ padding: '8px 12px', border: '1.5px solid var(--ds-border)', borderRadius: 8, fontWeight: 700, outline: 'none', background: '#f3f4f6', color: 'var(--ds-text)', fontFamily: 'inherit', cursor: 'default', appearance: 'none', maxWidth: '65%', textOverflow: 'ellipsis' }}
              >
                {masterPengelola.map(p => (
                  <option key={p.id} value={p.nama_pengelola}>{p.nama_pengelola}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ds-text-muted)', fontSize: '0.9rem', fontWeight: 600, flexShrink: 0 }}><Calendar size={18} /> Tanggal Input</span>
              <span style={{ fontWeight: 800, color: 'var(--ds-text)', fontSize: '0.9rem', textAlign: 'right' }}>{data.date} {data.time}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingBottom: 4 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ds-text-muted)', fontSize: '0.9rem', fontWeight: 600, flexShrink: 0 }}>ID Data</span>
              <span style={{ fontWeight: 800, color: 'var(--ds-text-muted)', fontSize: '0.8rem', textAlign: 'right', wordBreak: 'break-all' }}>{data.id}</span>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', fontWeight: 700, color: 'var(--ds-text)' }}>Nama Validator (Wajib Diisi)</label>
            <input 
              type="text" 
              value={validatorName} 
              onChange={e => setValidatorName(e.target.value)} 
              placeholder="Masukkan nama Anda..." 
              style={{ width: '100%', padding: '12px 16px', border: '1.5px solid var(--ds-border)', borderRadius: 12, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, flexDirection: 'row' }}>
            <button onClick={() => setShowRejectModal(true)} style={{ flex: 1, padding: '14px 10px', background: '#FEF2F2', color: '#DC2626', border: '2px solid #FECACA', borderRadius: 16, fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
              <XCircle size={18} /> Tolak Data
            </button>
            <button onClick={() => { if(window.confirm('Yakin data sudah sesuai?')) handleVerify('Terverifikasi') }} style={{ flex: 1, padding: '14px 10px', background: '#10B981', color: 'white', border: 'none', borderRadius: 16, fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)' }}>
              <CheckCircle size={18} /> Data Sesuai
            </button>
          </div>
        </div>
      </main>

      {showRejectModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(12, 26, 46, 0.6)', backdropFilter: 'blur(4px)', padding: 16 }}>
          <div style={{ background: 'white', width: '100%', maxWidth: 400, borderRadius: 24, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', boxSizing: 'border-box' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '1.2rem', fontWeight: 800, color: 'var(--ds-text)' }}>Alasan Penolakan</h3>
            <p style={{ margin: '0 0 16px', color: 'var(--ds-text-muted)', fontSize: '0.88rem' }}>Berikan alasan mengapa data ini ditolak agar User dapat memperbaikinya.</p>
            <textarea 
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Contoh: Berat aktual hanya 10 Kg, jenis salah..."
              style={{ width: '100%', padding: 14, border: '1.5px solid var(--ds-border)', borderRadius: 16, minHeight: 110, fontSize: '0.9rem', outline: 'none', resize: 'none', marginBottom: 20, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowRejectModal(false)} style={{ flex: 1, padding: '12px', background: 'white', color: 'var(--ds-text)', border: '1.5px solid var(--ds-border)', borderRadius: 99, fontWeight: 700, cursor: 'pointer' }}>Batal</button>
              <button onClick={() => { if(!rejectReason) return alert('Alasan harus diisi'); handleVerify('Ditolak', rejectReason); }} style={{ flex: 1, padding: '12px', background: '#EF4444', color: 'white', border: 'none', borderRadius: 99, fontWeight: 700, cursor: 'pointer' }}>Kirim Penolakan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}