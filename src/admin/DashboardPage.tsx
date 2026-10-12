import { useState, useEffect, useCallback } from 'react';
import { getParticipantCounts, type ParticipantAggregateResponse } from './adminApi';

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconStore() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconPresentation() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

export function DashboardPage() {
  const [stats, setStats] = useState<ParticipantAggregateResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getParticipantCounts();
      if (res.success && res.data) {
        setStats(res.data);
      } else {
        setError('Gagal memuat data statistik.');
      }
      setLastRefreshed(new Date());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat menghubungkan ke server.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">Welcome to Kalbe Universe Admin Panel & Participant Overview</p>
        </div>
        <div className="admin-page-actions">
          <button
            className="admin-btn admin-btn-secondary"
            onClick={fetchStats}
            disabled={loading}
          >
            <IconRefresh />
            <span>{loading ? 'Memuat...' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div
          className="admin-alert admin-alert-danger"
          style={{
            marginBottom: 24,
            padding: '16px 20px',
            borderRadius: 'var(--admin-radius)',
            background: 'var(--admin-danger-subtle)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>⚠️ {error}</span>
          <button
            className="admin-btn admin-btn-sm admin-btn-danger"
            onClick={fetchStats}
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Stats Cards Grid (Identik dengan Nestle Dashboard) */}
      <div className="admin-stats-grid">
        {/* Card 1: Total User Login */}
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total User Login</span>
            <div className="admin-stat-icon-wrapper admin-stat-icon-primary">
              <IconUsers />
            </div>
          </div>
          <div className="admin-stat-value">
            {loading && !stats ? '...' : (stats?.total_user_login ?? 0).toLocaleString()}
          </div>
          <div className="admin-stat-footer">
            <span>👤</span> Total akun pengguna terdaftar / login
          </div>
        </div>

        {/* Card 2: Total Booth Visitor */}
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Booth Visitor</span>
            <div className="admin-stat-icon-wrapper admin-stat-icon-success">
              <IconStore />
            </div>
          </div>
          <div className="admin-stat-value">
            {loading && !stats ? '...' : (stats?.total_booth_visitor ?? 0).toLocaleString()}
          </div>
          <div className="admin-stat-footer">
            <span>🏪</span> Total kunjungan peserta ke booth
          </div>
        </div>

        {/* Card 3: Total Symposium Participant */}
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Symposium Participant</span>
            <div className="admin-stat-icon-wrapper admin-stat-icon-info">
              <IconPresentation />
            </div>
          </div>
          <div className="admin-stat-value">
            {loading && !stats ? '...' : (stats?.total_symposium_participant ?? 0).toLocaleString()}
          </div>
          <div className="admin-stat-footer">
            <span>🎤</span> Total partisipan pada sesi simposium
          </div>
        </div>
      </div>

      {/* Main Welcome Card */}
      <div className="admin-table-container" style={{ padding: 44, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.9 }}>🚀</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: 'var(--admin-text)' }}>
          Welcome to Kalbe Admin Panel
        </h2>
        <p style={{ color: 'var(--admin-text-secondary)', fontSize: 14, maxWidth: 520, margin: '0 auto', lineHeight: 1.65 }}>
          Gunakan menu navigasi sidebar untuk mengelola Users, Scanner Booth & Symposium, Rewards, serta memantau partisipan secara real-time.
        </p>
        {lastRefreshed && (
          <div style={{ marginTop: 22, fontSize: 12, color: 'var(--admin-text-muted)' }}>
            Terakhir diperbarui: {lastRefreshed.toLocaleTimeString('id-ID')}
          </div>
        )}
      </div>
    </div>
  );
}
