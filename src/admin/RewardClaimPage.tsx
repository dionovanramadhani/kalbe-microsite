import { useState, useEffect, useCallback } from 'react';
import { Search, Copy, Check, Gift, RefreshCw, Download, Sparkles, Key, User, Award } from 'lucide-react';
import {
  getKalbeAdminHistories,
  getKalbeSymposiums,
  getKalbeBooths,
  type KalbeAdminHistoryItem,
  type KalbeSymposiumResponse,
  type KalbeBoothResponse,
} from './adminApi';
import { useToast } from '../context/ToastContext';

export function RewardClaimPage() {
  const { showToast } = useToast();

  const [histories, setHistories] = useState<KalbeAdminHistoryItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // References for filter
  const [symposiums, setSymposiums] = useState<KalbeSymposiumResponse[]>([]);
  const [booths, setBooths] = useState<KalbeBoothResponse[]>([]);

  // Filter States
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'claimed' | 'unclaimed'>('all');
  const [rewardTypeFilter, setRewardTypeFilter] = useState<string>('all');
  const [selectedActivityRef, setSelectedActivityRef] = useState<string>(''); // "" | "symposium:<id>" | "booth:<id>"
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // PIN Modal & Copy States
  const [selectedPinItem, setSelectedPinItem] = useState<KalbeAdminHistoryItem | null>(null);
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null);

  // Load symposiums and booths for the filter dropdown
  useEffect(() => {
    let isMounted = true;
    const loadFilterRefs = async () => {
      try {
        const [sympoRes, boothRes] = await Promise.all([
          getKalbeSymposiums({ limit: 100 }),
          getKalbeBooths({ limit: 100 }),
        ]);
        if (isMounted) {
          setSymposiums(sympoRes.data || []);
          setBooths(boothRes.data || []);
        }
      } catch (err) {
        console.warn('Failed to load filter references:', err);
      }
    };
    loadFilterRefs();
    return () => {
      isMounted = false;
    };
  }, []);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchHistories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Parameters<typeof getKalbeAdminHistories>[0] = {
        page: currentPage,
        limit,
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      if (statusFilter === 'claimed') {
        params.is_claimed = true;
      } else if (statusFilter === 'unclaimed') {
        params.is_claimed = false;
      }

      if (rewardTypeFilter !== 'all') {
        params.reward_type = rewardTypeFilter;
      }

      if (selectedActivityRef) {
        if (selectedActivityRef.startsWith('symposium:')) {
          params.symposium_id = selectedActivityRef.replace('symposium:', '');
        } else if (selectedActivityRef.startsWith('booth:')) {
          params.booth_id = selectedActivityRef.replace('booth:', '');
        }
      }

      const res = await getKalbeAdminHistories(params);
      setHistories(res.data || []);
      setTotal(res.meta?.total ?? res.data?.length ?? 0);
    } catch (err: unknown) {
      console.error('Failed to fetch admin histories:', err);
      const msg = err instanceof Error ? err.message : 'Gagal memuat data riwayat klaim reward.';
      setError(msg);
      showToast('error', msg);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, debouncedSearch, statusFilter, rewardTypeFilter, selectedActivityRef, showToast]);

  useEffect(() => {
    fetchHistories();
  }, [fetchHistories]);

  const handleCopyPin = (id: string, pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPinId(id);
    showToast('success', `PIN ${pin} berhasil disalin!`);
    setTimeout(() => {
      setCopiedPinId((current) => (current === id ? null : current));
    }, 2000);
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const exportToCSV = () => {
    if (histories.length === 0) {
      showToast('error', 'Tidak ada data untuk diekspor.');
      return;
    }

    const headers = [
      'ID',
      'Nama Partisipan',
      'Email',
      'No. Telepon',
      'Aktivitas / Label',
      'Tipe Reward',
      'PIN Klaim',
      'Status Klaim',
      'Tanggal Klaim',
      'Tanggal Perolehan',
    ];

    const rows = histories.map((h) => [
      `"${h.id || ''}"`,
      `"${(h.user?.fullname || '').replace(/"/g, '""')}"`,
      `"${(h.user?.email || '').replace(/"/g, '""')}"`,
      `"${(h.user?.phone_number || '').replace(/"/g, '""')}"`,
      `"${(h.label || h.description || '').replace(/"/g, '""')}"`,
      `"${h.reward_type || ''}"`,
      `"${h.pin || ''}"`,
      `"${h.is_claimed ? 'Sudah Diklaim' : 'Belum Diklaim'}"`,
      `"${h.claimed_at ? formatDate(h.claimed_at) : '-'}"`,
      `"${formatDate(h.created_at)}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `reward_claims_page_${currentPage}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('success', 'File CSV riwayat reward berhasil diunduh!');
  };

  const totalPages = Math.ceil(total / limit) || 1;

  // Aggregate local counts for badge display
  const unclaimedCountOnPage = histories.filter((h) => !h.is_claimed).length;
  const claimedCountOnPage = histories.filter((h) => h.is_claimed).length;

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Gift className="w-6 h-6 text-[#10b981]" />
            Reward Claim
          </h1>
          <p className="admin-page-subtitle">
            Daftar perolehan reward user, status klaim merchandise, dan verifikasi PIN klaim partisipan.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="admin-btn admin-btn-secondary" onClick={fetchHistories} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="admin-btn admin-btn-secondary" onClick={exportToCSV} disabled={histories.length === 0}>
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats-grid" style={{ marginBottom: '20px' }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Riwayat Reward</div>
          <div className="admin-stat-value primary">{total}</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Belum Diklaim (Halaman Ini)</div>
          <div className="admin-stat-value" style={{ color: '#f59e0b' }}>
            {unclaimedCountOnPage}
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Sudah Diklaim (Halaman Ini)</div>
          <div className="admin-stat-value success">{claimedCountOnPage}</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Halaman Berjalan</div>
          <div className="admin-stat-value info">
            {currentPage} / {totalPages}
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="admin-card">
        {/* Controls Bar */}
        <div
          className="admin-controls-bar"
          style={{
            marginBottom: '16px',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Search Box */}
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: 'var(--admin-text-muted)',
              }}
            />
            <input
              type="text"
              className="admin-input"
              style={{ paddingLeft: '36px' }}
              placeholder="Cari nama user, email, no hp, atau PIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', opacity: 0.8 }}>Status:</span>
            <select
              className="admin-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | 'claimed' | 'unclaimed');
                setCurrentPage(1);
              }}
              style={{ width: '140px' }}
            >
              <option value="all">Semua Status</option>
              <option value="unclaimed">Belum Diklaim</option>
              <option value="claimed">Sudah Diklaim</option>
            </select>
          </div>

          {/* Reward Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', opacity: 0.8 }}>Tipe:</span>
            <select
              className="admin-select"
              value={rewardTypeFilter}
              onChange={(e) => {
                const val = e.target.value;
                setRewardTypeFilter(val);
                // Reset specific activity ref if it conflicts with selected reward type
                if (val === 'mystery_box' || (val === 'symposium' && selectedActivityRef.startsWith('booth:')) || (val === 'booth' && selectedActivityRef.startsWith('symposium:'))) {
                  setSelectedActivityRef('');
                }
                setCurrentPage(1);
              }}
              style={{ width: '135px' }}
            >
              <option value="all">Semua Tipe</option>
              <option value="symposium">Symposium</option>
              <option value="booth">Booth</option>
              <option value="mystery_box">Mystery Box</option>
            </select>
          </div>

          {/* Filter Symposium / Booth Terkait */}
          {rewardTypeFilter !== 'mystery_box' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', opacity: 0.8 }}>Aktivitas:</span>
              <select
                className="admin-select"
                value={selectedActivityRef}
                onChange={(e) => {
                  setSelectedActivityRef(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ minWidth: '180px', maxWidth: '240px' }}
              >
                <option value="">Semua Simposium & Booth</option>
                {(rewardTypeFilter === 'all' || rewardTypeFilter === 'symposium') && symposiums.length > 0 && (
                  <optgroup label="🎓 Simposium">
                    {symposiums.map((s) => (
                      <option key={s.id} value={`symposium:${s.id}`}>
                        {s.title}
                      </option>
                    ))}
                  </optgroup>
                )}
                {(rewardTypeFilter === 'all' || rewardTypeFilter === 'booth') && booths.length > 0 && (
                  <optgroup label="🎪 Booth">
                    {booths.map((b) => (
                      <option key={b.id} value={`booth:${b.id}`}>
                        {b.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          )}

          {/* Limit Per Page */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', opacity: 0.8 }}>Tampilkan:</span>
            <select
              className="admin-select"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{ width: '80px' }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="admin-alert admin-alert-danger" style={{ marginBottom: '16px' }}>
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Table Container */}
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '45px' }}>#</th>
                <th>Partisipan (User)</th>
                <th>Aktivitas / Reward</th>
                <th>Tipe</th>
                <th>Sympo/Booth Name</th>
                <th style={{ textAlign: 'center', width: '130px' }}>PIN Klaim</th>
                <th>Status</th>
                <th>Waktu Diperoleh</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div className="admin-spinner" />
                      <span style={{ color: 'var(--admin-text-muted)', fontSize: '13px' }}>
                        Memuat riwayat reward...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : histories.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px 0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <Gift style={{ width: '40px', height: '40px', color: 'var(--admin-text-muted)', opacity: 0.5 }} />
                      <div style={{ fontWeight: 600, color: 'var(--admin-text)' }}>
                        Belum ada riwayat perolehan reward
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'var(--admin-text-muted)' }}>
                        {debouncedSearch
                          ? `Tidak ditemukan hasil pencarian untuk "${debouncedSearch}".`
                          : 'Partisipan yang menyelesaikan booth atau symposium post test akan muncul di sini.'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                histories.map((item, index) => {
                  const rowNumber = (currentPage - 1) * limit + index + 1;

                  return (
                    <tr key={item.id}>
                      <td style={{ color: 'var(--admin-text-muted)', fontSize: '12px' }}>{rowNumber}</td>

                      {/* Partisipan Detail */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: 'var(--admin-text)' }}>
                            {item.user?.fullname || 'User Tanpa Nama'}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                            {item.user?.email || '-'}
                          </span>
                          {item.user?.phone_number && (
                            <span style={{ fontSize: '11px', color: 'var(--admin-text-secondary)', marginTop: '2px' }}>
                              📞 {item.user.phone_number}
                            </span>
                          )}
                          {item.user?.speciality && (
                            <span style={{ fontSize: '10.5px', color: 'var(--admin-text-muted)' }}>
                              Spesialisasi: {item.user.speciality}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Aktivitas / Reward */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 500, color: 'var(--admin-text)' }}>
                            {item.label || item.symposium?.title || item.booth?.name || 'Hadiah Merchandise'}
                          </span>
                          {item.description && (
                            <span
                              style={{
                                fontSize: '12px',
                                color: 'var(--admin-text-muted)',
                                maxWidth: '280px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={item.description}
                            >
                              {item.description}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tipe Reward */}
                      <td>
                        <span
                          className={`admin-badge ${
                            item.reward_type === 'mystery_box'
                              ? 'admin-badge-primary'
                              : item.reward_type === 'symposium'
                                ? 'admin-badge-info'
                                : 'admin-badge-warning'
                          }`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            textTransform: 'capitalize',
                          }}
                        >
                          {item.reward_type === 'mystery_box' && <Sparkles className="w-3 h-3" />}
                          {item.reward_type.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Sympo/Booth Name */}
                      <td>
                        {item.reward_type === 'symposium' ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600, color: 'var(--admin-text)', fontSize: '13px' }}>
                              🎓{' '}
                              {item.symposium?.title ||
                                item.reward?.symposium?.title ||
                                (item.symposium_id && symposiums.find((s) => s.id === item.symposium_id)?.title) ||
                                'Morinaga Sympo'}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>
                              Simposium
                            </span>
                          </div>
                        ) : item.reward_type === 'booth' ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600, color: 'var(--admin-text)', fontSize: '13px' }}>
                              🎪{' '}
                              {item.booth?.name ||
                                item.reward?.booth?.name ||
                                (item.booth_id && booths.find((b) => b.id === item.booth_id)?.name) ||
                                (item.label && !item.label.toLowerCase().includes('kit') && !item.label.toLowerCase().includes('bag')
                                  ? item.label
                                  : 'Morinaga Booth')}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>
                              Booth
                            </span>
                          </div>
                        ) : item.reward_type === 'mystery_box' ? (
                          <span style={{ color: 'var(--admin-text-muted)', fontSize: '12px' }}>
                            Semua Misi (Mystery Box)
                          </span>
                        ) : (
                          <span style={{ color: 'var(--admin-text-muted)', fontSize: '12px' }}>
                            {item.symposium?.title || item.booth?.name || '-'}
                          </span>
                        )}
                      </td>

                      {/* PIN Klaim - Pop-up Trigger Button */}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '5px 12px',
                            fontSize: '12px',
                            borderRadius: '8px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            borderColor: 'rgba(16, 185, 129, 0.35)',
                            color: '#10b981',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                          onClick={() => setSelectedPinItem(item)}
                          title="Klik untuk membuka pop-up kode PIN"
                        >
                          <Key className="w-3.5 h-3.5" />
                          Lihat PIN
                        </button>
                      </td>

                      {/* Status */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span
                            className={`admin-badge ${
                              item.is_claimed ? 'admin-badge-success' : 'admin-badge-warning'
                            }`}
                            style={{ display: 'inline-block', width: 'fit-content' }}
                          >
                            {item.is_claimed ? 'Sudah Diklaim' : 'Belum Diklaim'}
                          </span>
                          {item.is_claimed && item.claimed_at && (
                            <span style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>
                              {formatDate(item.claimed_at)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Waktu Diperoleh */}
                      <td style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                        {formatDate(item.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {total > 0 && (
          <div
            className="admin-pagination"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid var(--admin-border)',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>
              Menampilkan {Math.min((currentPage - 1) * limit + 1, total)} -{' '}
              {Math.min(currentPage * limit, total)} dari total {total} riwayat
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                className="admin-btn admin-btn-secondary"
                disabled={currentPage <= 1 || loading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                ◀ Sebelumnya
              </button>

              <span style={{ fontSize: '13px', padding: '0 8px', color: 'var(--admin-text)' }}>
                Halaman {currentPage} dari {totalPages}
              </span>

              <button
                className="admin-btn admin-btn-secondary"
                disabled={currentPage >= totalPages || loading}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Selanjutnya ▶
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pop-up PIN Klaim Modal */}
      {selectedPinItem && (
        <div className="admin-modal-overlay" onClick={() => setSelectedPinItem(null)}>
          <div
            className="admin-modal"
            style={{ maxWidth: 440, width: '92%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981',
                  }}
                >
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="admin-modal-title" style={{ margin: 0, fontSize: 17 }}>
                    PIN Klaim Hadiah
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--admin-text-muted)' }}>
                    Verifikasi kode penukaran partisipan
                  </p>
                </div>
              </div>
              <button className="admin-modal-close" onClick={() => setSelectedPinItem(null)}>
                ×
              </button>
            </div>

            <div className="admin-modal-body" style={{ padding: '20px 24px' }}>
              {/* Detail Partisipan Card */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--admin-border)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  marginBottom: 18,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
                  <User className="w-3.5 h-3.5" />
                  Partisipan
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--admin-text)' }}>
                  {selectedPinItem.user?.fullname || 'User Tanpa Nama'}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--admin-text-muted)', marginTop: 2 }}>
                  {selectedPinItem.user?.email || '-'} {selectedPinItem.user?.phone_number ? `• 📞 ${selectedPinItem.user.phone_number}` : ''}
                </div>

                <div style={{ borderTop: '1px solid var(--admin-border)', marginTop: 12, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--admin-text-muted)' }}>
                      <Award className="w-3.5 h-3.5" />
                      Aktivitas
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text)' }}>
                      {selectedPinItem.label || selectedPinItem.symposium?.title || selectedPinItem.booth?.name || 'Hadiah Merchandise'}
                    </div>
                  </div>
                  <span
                    className={`admin-badge ${selectedPinItem.is_claimed ? 'admin-badge-success' : 'admin-badge-warning'}`}
                    style={{ fontSize: 11 }}
                  >
                    {selectedPinItem.is_claimed ? 'Sudah Diklaim' : 'Belum Diklaim'}
                  </span>
                </div>
              </div>

              {/* Large Highlighted PIN Display Box */}
              <div
                style={{
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.06) 100%)',
                  border: '1.5px dashed rgba(16, 185, 129, 0.45)',
                  borderRadius: 16,
                  padding: '24px 20px',
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    letterSpacing: 2,
                    color: '#10b981',
                    textTransform: 'uppercase',
                    marginBottom: 10,
                  }}
                >
                  Kode PIN Hadiah
                </div>
                <div
                  style={{
                    fontFamily: 'monospace, Courier, sans-serif',
                    fontSize: 48,
                    fontWeight: 800,
                    letterSpacing: 8,
                    color: '#10b981',
                    lineHeight: 1,
                    marginBottom: 18,
                    textShadow: '0 2px 12px rgba(16, 185, 129, 0.35)',
                  }}
                >
                  {selectedPinItem.pin || '--'}
                </div>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={() => handleCopyPin(selectedPinItem.id, selectedPinItem.pin)}
                  style={{
                    margin: '0 auto',
                    padding: '8px 18px',
                    fontSize: 13,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  }}
                >
                  {copiedPinId === selectedPinItem.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedPinId === selectedPinItem.id ? 'PIN Berhasil Disalin!' : 'Salin PIN'}
                </button>
              </div>

              <p
                style={{
                  fontSize: 12,
                  color: 'var(--admin-text-muted)',
                  textAlign: 'center',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                Berikan kode PIN 2-digit ini kepada user untuk dimasukkan pada modal klaim reward di aplikasi microsite mereka.
              </p>
            </div>

            <div className="admin-modal-footer" style={{ padding: '12px 24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setSelectedPinItem(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
