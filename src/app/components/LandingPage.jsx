'use client';
import './LandingPage.css';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Recycle, Leaf, Factory, TrendingUp, ArrowRight, BarChart3,
  Users, Scale, ChevronDown, Menu, X, MapPin, Phone, Mail, ArrowUp, Navigation
} from 'lucide-react';
import {
  BarChart, Bar, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  UNIT_LIST, formatWeight, formatWeightTon
} from '../lib/mockData';

function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.round(start * 10) / 10);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

const PLNLogo = ({ size = 64, unit = '' }) => {
  let customLogoUrl = '/Logo.png';
  if (unit === 'Wonogiri') customLogoUrl = '/Logo PLTA WONOGIRI.png';
  else if (unit === 'Banjarnegara') customLogoUrl = '/Logo PLTA PB. Soedirman.png';
  
  if (customLogoUrl) {
    return <img src={customLogoUrl} alt="Logo" style={{ height: size, maxWidth: '100%', objectFit: 'contain' }} />;
  }
  return null;
};

// Data lokasi untuk Map (Google Maps Embed - titik lokasi PLTA)
const MAP_LOCATIONS = [
  { id: 'Wonogiri', name: 'PLTA Wonogiri', embedUrl: 'https://maps.google.com/maps?q=PLTA+Wonogiri&z=15&output=embed' },
  { id: 'Banjarnegara', name: 'PLTA PB.Soedirman', embedUrl: 'https://maps.google.com/maps?q=PLTA+Mrica+Banjarnegara&z=15&output=embed' }
];

export default function LandingPage({ initialDeposits = [], mockUsers = [], pemanfaatanData = [] }) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeUnit, setActiveUnit] = useState('all');
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [activeMapLoc, setActiveMapLoc] = useState(MAP_LOCATIONS[0]);

  // Firebase data state
  const [firebaseDeposits, setFirebaseDeposits] = useState(initialDeposits);
  const [firebaseStats, setFirebaseStats] = useState(null);
  const [firebaseMonthlyData, setFirebaseMonthlyData] = useState(null);
  const [firebaseUnitStats, setFirebaseUnitStats] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Fetch data from Firebase via API
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        if (data.success) {
          setFirebaseDeposits(data.deposits || []);
          setFirebaseStats(data.stats || null);
          setFirebaseMonthlyData(data.monthlyData || null);
          setFirebaseUnitStats(data.unitStats || null);
        }
      } catch (error) {
        console.error('Failed to fetch stats from Firebase:', error);
      } finally {
        setDataLoading(false);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
      setShowTopBtn(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter data transaksi berdasarkan Unit yang aktif
  const currentFilteredDeposits = useMemo(() => {
    return activeUnit === 'all'
      ? firebaseDeposits
      : firebaseDeposits.filter(d => d.unit === activeUnit);
  }, [activeUnit, firebaseDeposits]);

  const monthlyChartData = useMemo(() => {
    // If we have Firebase monthly data, use it (for 'all' filter)
    if (firebaseMonthlyData && activeUnit === 'all') {
      return firebaseMonthlyData;
    }
    // Otherwise calculate from filtered deposits
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map(m => ({ bulan: m, berat: 0 }));

    currentFilteredDeposits.forEach(d => {
      const date = new Date(d.date);
      if (date.getFullYear() === new Date().getFullYear()) {
        const monthIndex = date.getMonth();
        if (data[monthIndex]) {
          data[monthIndex].berat += Number(d.weight) || 0;
        }
      }
    });
    return data;
  }, [currentFilteredDeposits, firebaseMonthlyData, activeUnit]);

  const stats = useMemo(() => {
    if (firebaseStats && activeUnit === 'all') {
      return firebaseStats;
    }
    // Calculate from filtered deposits for specific unit
    const totalWeight = currentFilteredDeposits.reduce((s, d) => s + (Number(d.weight) || 0), 0);
    const organikWeight = currentFilteredDeposits.filter(d => d.category === 'Organik').reduce((s, d) => s + (Number(d.weight) || 0), 0);
    const anorganikWeight = currentFilteredDeposits.filter(d => d.category === 'Anorganik').reduce((s, d) => s + (Number(d.weight) || 0), 0);
    const residuWeight = currentFilteredDeposits.filter(d => d.category === 'Residu').reduce((s, d) => s + (Number(d.weight) || 0), 0);
    const totalTransactions = currentFilteredDeposits.length;
    const uniqueUsers = new Set(currentFilteredDeposits.map(d => d.user).filter(Boolean));

    return { totalWeight, organikWeight, anorganikWeight, residuWeight, totalTransactions, totalUsers: uniqueUsers.size };
  }, [activeUnit, currentFilteredDeposits, firebaseStats]);

  const unitStats = useMemo(() => {
    if (firebaseUnitStats) {
      return firebaseUnitStats;
    }
    return UNIT_LIST.map(unit => {
      const unitDeposits = firebaseDeposits.filter(d => d.unit === unit);
      const totalWeight = unitDeposits.reduce((s, d) => s + (Number(d.weight) || 0), 0);
      const totalTransactions = unitDeposits.length;
      const uniqueUsers = new Set(unitDeposits.map(d => d.user).filter(Boolean));
      return { unit, totalWeight, totalTransactions, nasabah: uniqueUsers.size };
    });
  }, [firebaseDeposits, firebaseUnitStats]);

  const pemanfaatanStats = useMemo(() => {
    return {
      totalInput: pemanfaatanData.length,
      totalPrograms: new Set(pemanfaatanData.map(d => d.program_name)).size,
      totalUnits: new Set(pemanfaatanData.map(d => d.unit)).size
    };
  }, [pemanfaatanData]);

  const pieData = [
    { name: 'Organik', value: +Number(stats.organikWeight).toFixed(1), color: '#10B981' },
    { name: 'Anorganik', value: +Number(stats.anorganikWeight).toFixed(1), color: '#0891B2' },
    { name: 'Residu', value: +Number(stats.residuWeight).toFixed(1), color: '#F59E0B' },
  ];

  const animatedTotal = useCountUp(stats.totalWeight, 1500);
  const animatedTransactions = useCountUp(stats.totalTransactions, 1200);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="landing-root">
      <header className={`landing-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-inner">
          <a href="#hero" className="header-brand">
            <span className="header-logo-wrap">
              <PLNLogo size={42} unit={activeUnit} />
            </span>
            <span className="header-brand-text">
              <span className="brand-name">Powercycle</span>
              <span className="brand-tagline">Bank Sampah Digital</span>
            </span>
          </a>

          <nav className="header-nav-desktop">
            <a href="#hero" className="nav-link active">Beranda</a>
            <a href="#tentang" className="nav-link">Tentang</a>
            <a href="#statistik" className="nav-link">Statistik</a>
            <a href="#unit" className="nav-link">Unit</a>
            <a href="#kontak" className="nav-link">Kontak</a>
          </nav>

          <div className="header-actions">
            <a href="/login" className="btn-login">
              Masuk <ArrowRight size={16} />
            </a>
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="mobile-menu">
          <a href="#hero" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Beranda</a>
          <a href="#tentang" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Tentang</a>
          <a href="#statistik" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Statistik</a>
          <a href="#unit" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Unit</a>
          <a href="#kontak" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Kontak</a>
          <a href="/login" className="btn-login mobile">
            Masuk <ArrowRight size={16} />
          </a>
        </div>
      )}

      <section id="hero" className="hero-section">
        <div className="hero-bg-effects" aria-hidden="true">
          <div className="hero-glow hero-glow-1" />
          <div className="hero-glow hero-glow-2" />
          <div className="hero-glow hero-glow-3" />
        </div>

        <div className="hero-content">
          <div className="hero-left">
            <div className="hero-badge animate-fade-up">
              <Recycle size={14} />
              <span>Bank Sampah Digital PLTA</span>
            </div>

            <h1 className="hero-title animate-fade-up delay-1">
              Pilah Sampah, Selamatkan Bumi{' '}
              <span className="hero-title-accent">Kurangi, Gunakan Lagi, Daur Ulang.</span>
            </h1>

            <p className="hero-description animate-fade-up delay-2">
              PT PLN Indonesia Power UBP Mrica berupaya melakukan pengelolaan sampah yang
              berkelanjutan, terukur dan terintegrasi untuk mendukung peningkatan target
              pengelolaan sampah yang optimal.
            </p>

            <div className="hero-cta animate-fade-up delay-3">
              <a href="#tentang" className="btn-secondary-hero">
                Tentang Kami
              </a>
              <a href="#statistik" className="btn-primary-hero">
                Lihat Statistik <ArrowRight size={16} />
              </a>
            </div>
          </div>

          <div className="hero-right animate-fade-up delay-3">
            <div className="hero-stats-card featured">
              <div className="hero-card-tag">
                <BarChart3 size={14} />
                Ringkasan Data
              </div>
              <h3 className="hero-card-title">Total Pengelolaan Sampah</h3>
              <div className="hero-stats-grid">
                <div className="hero-stat-item">
                  <span className="hero-stat-value">{formatWeightTon(animatedTotal).split(' ')[0]}</span>
                  <span className="hero-stat-label">Ton Terkelola</span>
                </div>
                <div className="hero-stat-item">
                  <span className="hero-stat-value">{Math.round(animatedTransactions)}</span>
                  <span className="hero-stat-label">Transaksi</span>
                </div>
                <div className="hero-stat-item">
                  <span className="hero-stat-value">{UNIT_LIST.length}</span>
                  <span className="hero-stat-label">Unit Aktif</span>
                </div>
              </div>
            </div>

            <div className="hero-stats-card">
              <div className="hero-card-tag">
                <Recycle size={14} />
                Komposisi
              </div>
              <div className="hero-stats-grid">
                <div className="hero-stat-item">
                  <span className="hero-stat-value" style={{ color: '#10B981' }}>{Number(stats.organikWeight).toFixed(1)}</span>
                  <span className="hero-stat-label">Kg Organik</span>
                </div>
                <div className="hero-stat-item">
                  <span className="hero-stat-value" style={{ color: '#0891B2' }}>{Number(stats.anorganikWeight).toFixed(1)}</span>
                  <span className="hero-stat-label">Kg Anorganik</span>
                </div>
                <div className="hero-stat-item">
                  <span className="hero-stat-value" style={{ color: '#F59E0B' }}>{Number(stats.residuWeight).toFixed(1)}</span>
                  <span className="hero-stat-label">Kg Residu</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <a href="#tentang" className="scroll-indicator" aria-label="Scroll down">
          <ChevronDown size={20} />
        </a>
      </section>

      <section id="tentang" className="section-tentang">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">
              <span className="badge-line" />Tentang Kami
            </span>
            <h2 className="section-title">
              Apa itu <span className="text-accent">Powercycle?</span>
            </h2>
            <p className="section-subtitle">
              Powercycle adalah sistem bank sampah digital yang dikembangkan untuk mendukung
              pengelolaan sampah di wilayah PLN Indonesia Power UBP Mrica. Platform ini memudahkan pencatatan,
              monitoring, dan pelaporan data sampah dari berbagai unit secara real-time.
            </p>
          </div>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                <Leaf size={28} />
              </div>
              <h3 className="feature-title">Ramah Lingkungan</h3>
              <p className="feature-desc">Mendukung pengelolaan sampah yang berkelanjutan dan terukur untuk mengurangi dampak lingkungan secara signifikan.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon" style={{ background: 'rgba(8,145,178,0.1)', color: '#0891B2' }}>
                <BarChart3 size={28} />
              </div>
              <h3 className="feature-title">Real-time Monitoring</h3>
              <p className="feature-desc">Pantau data sampah secara real-time dengan visualisasi grafik yang informatif dan mudah dipahami oleh semua pihak.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
                <Factory size={28} />
              </div>
              <h3 className="feature-title">Multi Unit</h3>
              <p className="feature-desc">Mendukung pencatatan dari berbagai unit operasional dengan data yang terpisah namun terintegrasi dalam satu platform.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="statistik" className="section-statistik">
        <div className="section-container">
          <div className="section-header center">
            <span className="section-badge light">
              <span className="badge-line light" />Statistik
            </span>
            <h2 className="section-title light">
              Data Pengelolaan <span className="text-accent">Sampah</span>
            </h2>
            <p className="section-subtitle light">
              Statistik pengumpulan dan pengelolaan sampah dari seluruh unit operasional Bank Sampah Powercycle.
            </p>
          </div>

          <div className="unit-filter">
            <button
              className={`filter-btn ${activeUnit === 'all' ? 'active' : ''}`}
              onClick={() => setActiveUnit('all')}
            >
              Semua Unit
            </button>
            {UNIT_LIST.map(unit => (
              <button
                key={unit}
                className={`filter-btn ${activeUnit === unit ? 'active' : ''}`}
                onClick={() => setActiveUnit(unit)}
              >
                {unit === 'Wonogiri' ? 'PLTA Wonogiri' : (unit === 'Banjarnegara' ? 'PLTA PB.Soedirman' : unit)}
              </button>
            ))}
          </div>

          <div className="stats-grid">
            <div className="stat-card glass">
              <div className="stat-icon-wrap green">
                <Scale size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{formatWeightTon(stats.totalWeight)}</span>
                <span className="stat-label">Total Berat Sampah</span>
              </div>
            </div>
            <div className="stat-card glass">
              <div className="stat-icon-wrap blue">
                <TrendingUp size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.totalTransactions}</span>
                <span className="stat-label">Total Transaksi</span>
              </div>
            </div>
            <div className="stat-card glass">
              <div className="stat-icon-wrap amber">
                <Users size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.totalUsers}</span>
                <span className="stat-label">Nasabah Aktif</span>
              </div>
            </div>
            <div className="stat-card glass">
              <div className="stat-icon-wrap purple">
                <Recycle size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{UNIT_LIST.length}</span>
                <span className="stat-label">Unit Operasional</span>
              </div>
            </div>
          </div>

          <div className="charts-row">
            <div className="chart-card glass">
              <h3 className="chart-title">Tren Bulanan (Kg)</h3>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="bulan" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.5)' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.5)' }} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      contentStyle={{ background: '#1A2940', border: 'none', borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', color: '#fff' }}
                      labelStyle={{ color: '#94A3B8' }}
                      formatter={(value) => [`${value} Kg`, 'Berat']}
                    />
                    <Bar dataKey="berat" fill="url(#barGradientDS)" radius={[8, 8, 0, 0]} barSize={36} />
                    <defs>
                      <linearGradient id="barGradientDS" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0891B2" />
                        <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card glass">
              <h3 className="chart-title">Komposisi Sampah</h3>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={3} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#1A2940', border: 'none', borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', color: '#fff' }}
                      formatter={(value) => `${value} Kg`}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: 13 }}
                      formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.6)' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE GOOGLE MAPS SECTION */}
      <section id="peta" style={{ padding: '120px 24px', background: 'var(--ds-bg)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <span className="glass-badge" style={{ display: 'inline-block', padding: '8px 20px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 700, marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1.5 }}>Sebaran Lokasi</span>
            <h2 style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--ds-text)', marginBottom: 24, letterSpacing: '-1px' }}>Peta <span style={{ color: 'var(--ds-accent)' }}>Unit PLN</span></h2>
          </div>

          <div className="map-section-layout">
            {/* LEFT: Unit Selection Panel */}
            <div className="map-sidebar">
              <div className="glass-panel" style={{ borderRadius: '1.5rem', padding: '28px', height: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--ds-text)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Navigation size={22} color="var(--ds-accent)" /> Unit Operasional
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--ds-text-muted)', margin: 0, lineHeight: 1.6 }}>Pilih unit di bawah ini untuk mengarahkan peta ke lokasi tersebut.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  {MAP_LOCATIONS.map((loc) => {
                    const statsForLoc = unitStats.find(u => u.unit === loc.id);
                    const isActive = activeMapLoc.id === loc.id;
                    return (
                      <div
                        key={loc.id}
                        className="map-loc-card"
                        onClick={() => setActiveMapLoc(loc)}
                        style={{
                          background: isActive ? 'var(--ds-accent)' : 'rgba(255,255,255,0.6)',
                          color: isActive ? 'white' : 'var(--ds-text)',
                          border: isActive ? '1px solid var(--ds-accent)' : '1px solid rgba(255,255,255,0.9)',
                          boxShadow: isActive ? '0 8px 24px rgba(8,145,178,0.4)' : '0 4px 12px rgba(0,0,0,0.05)',
                          transform: isActive ? 'scale(1.02)' : 'scale(1)'
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8, marginBottom: '10px' }}>
                          <MapPin size={18} color={isActive ? 'white' : 'var(--ds-accent)'} /> {loc.name}
                        </div>

                        {statsForLoc && (
                          <div style={{ display: 'flex', gap: '20px', borderTop: isActive ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.08)', paddingTop: '10px' }}>
                            <div>
                              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, opacity: isActive ? 0.8 : 0.6 }}>Terkelola</div>
                              <div style={{ fontSize: '1rem', fontWeight: 800 }}>{formatWeightTon(statsForLoc.totalWeight)}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, opacity: isActive ? 0.8 : 0.6 }}>Nasabah</div>
                              <div style={{ fontSize: '1rem', fontWeight: 800 }}>{statsForLoc.nasabah}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT: Google Map (larger) */}
            <div className="map-iframe-wrapper clay-card">
              <iframe
                src={activeMapLoc.embedUrl}
                width="100%"
                height="100%"
                style={{ border: 0, borderRadius: '1.5rem' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Peta Lokasi ${activeMapLoc.name}`}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section-cta">
        <div className="section-container">
          <div className="cta-card">
            <div className="cta-bg-effects" aria-hidden="true">
              <div className="cta-glow cta-glow-1" />
              <div className="cta-glow cta-glow-2" />
            </div>
            <div className="cta-content">
              <h2 className="cta-title">Mulai kelola data sampah Anda</h2>
              <p className="cta-desc">
                Masuk ke dashboard untuk mencatat, memantau, dan mengelola data sampah dari unit Anda secara real-time.
              </p>
              <div className="cta-buttons">
                <a href="/login" className="btn-cta-primary">
                  Login Sekarang <ArrowRight size={18} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer id="kontak" className="landing-footer">
        <div className="footer-gradient-line" aria-hidden="true" />
        <div className="section-container">
          <div className="footer-grid">
            <div className="footer-brand-col">
              <a href="#hero" className="footer-brand">
                <PLNLogo size={42} unit={activeUnit} />
                <span className="footer-brand-text">
                  <span className="brand-name">Powercycle</span>
                  <span className="brand-tagline">Bank Sampah Digital</span>
                </span>
              </a>
              <p className="footer-desc">
                Platform digital untuk pencatatan, monitoring, dan pelaporan pengelolaan
                sampah yang terintegrasi di wilayah PLN Indonesia Power UBP Mrica.
              </p>
            </div>

            <div className="footer-nav-col">
              <h4 className="footer-col-title">Navigasi</h4>
              <ul className="footer-links">
                <li><a href="#hero">Beranda</a></li>
                <li><a href="#tentang">Tentang</a></li>
                <li><a href="#statistik">Statistik</a></li>
                <li><a href="#unit">Unit</a></li>
              </ul>
            </div>

            <div className="footer-contact-col">
              <h4 className="footer-col-title">Kontak</h4>
              <ul className="footer-contact-list">
                <li>
                  <MapPin size={16} className="footer-contact-icon" />
                  <span>PLTA Mrica, Jawa Tengah</span>
                </li>
                <li>
                  <Phone size={16} className="footer-contact-icon" />
                  <span>(0286) 123456</span>
                </li>
                <li>
                  <Mail size={16} className="footer-contact-icon" />
                  <span>banksampah@pltamrica.co.id</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© 2026 Powercycle — PLTA Mrica. Semua hak dilindungi.</p>
            <a href="#hero" className="back-to-top">
              Kembali ke atas
              <span className="back-to-top-icon">↑</span>
            </a>
          </div>
        </div>
      </footer>

      <button
        className={`floating-top-btn ${showTopBtn ? 'visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Kembali ke atas"
      >
        <ArrowUp size={20} />
      </button>
    </div>
  );
}
