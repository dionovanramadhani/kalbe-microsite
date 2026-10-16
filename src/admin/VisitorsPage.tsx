import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Users,
  Store,
  GraduationCap,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  Phone,
  Mail,
  UserCheck,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import {
  getKalbeParticipants,
  getParticipantCounts,
  getKalbeBooths,
  getKalbeSymposiums,
  type KalbeParticipantItem,
  type ParticipantAggregateResponse,
  type KalbeBoothResponse,
  type KalbeSymposiumResponse,
  type GetParticipantsParams,
} from './adminApi';

export const VisitorsPage: React.FC = () => {
  const { showToast } = useToast();

  // ─── States ───────────────────────────────────────────────────────────────
  const [participants, setParticipants] = useState<KalbeParticipantItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [counts, setCounts] = useState<ParticipantAggregateResponse | null>(null);
  const [countsLoading, setCountsLoading] = useState<boolean>(true);

  // Dropdown list options
  const [booths, setBooths] = useState<KalbeBoothResponse[]>([]);
  const [symposiums, setSymposiums] = useState<KalbeSymposiumResponse[]>([]);

  // Filter States
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'booths' | 'symposiums'>('all');
  const [selectedActivityRef, setSelectedActivityRef] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Detail Modal State
  const [selectedVisitor, setSelectedVisitor] = useState<KalbeParticipantItem | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // ─── Fetch Dropdown Options (Booths & Symposiums) ──────────────────────────
  const fetchDropdownOptions = useCallback(async () => {
    try {
      const [boothsRes, symposRes] = await Promise.allSettled([
        getKalbeBooths({ limit: 100 }),
        getKalbeSymposiums({ limit: 100 }),
      ]);

      if (boothsRes.status === 'fulfilled' && boothsRes.value.data) {
        setBooths(boothsRes.value.data);
      }
      if (symposRes.status === 'fulfilled' && symposRes.value.data) {
        setSymposiums(symposRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load dropdown options:', err);
    }
  }, []);

  useEffect(() => {
    fetchDropdownOptions();
  }, [fetchDropdownOptions]);

  // ─── Fetch Counts ─────────────────────────────────────────────────────────
  const fetchCounts = useCallback(async () => {
    try {
      setCountsLoading(true);
      const res = await getParticipantCounts();
      if (res.data) {
        setCounts(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch participant counts:', err);
    } finally {
      setCountsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // ─── Fetch Participants List ──────────────────────────────────────────────
  const fetchParticipants = useCallback(async () => {
    try {
      setLoading(true);
      const params: GetParticipantsParams = {
        page: currentPage,
        limit,
      };

      if (typeFilter !== 'all') {
        params.type = typeFilter;
      }

      if (selectedActivityRef) {
        if (selectedActivityRef.startsWith('booth:')) {
          params.booth_id = selectedActivityRef.replace('booth:', '');
          params.type = 'booths';
        } else if (selectedActivityRef.startsWith('symposium:')) {
          params.symposium_id = selectedActivityRef.replace('symposium:', '');
          params.type = 'symposiums';
        }
      }

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }

      const res = await getKalbeParticipants(params);
      setParticipants(res.data || []);
      setTotal(res.meta?.total ?? res.data?.length ?? 0);
    } catch (err: unknown) {
      console.error('Failed to fetch participants:', err);
      const msg = err instanceof Error ? err.message : 'Gagal memuat data visitor.';
      showToast('error', msg);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, typeFilter, selectedActivityRef, debouncedSearch, showToast]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
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

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  // Export CSV
  const handleExportCSV = () => {
    if (participants.length === 0) {
      showToast('error', 'Tidak ada data untuk diekspor.');
      return;
    }

    const headers = [
      'No',
      'ID Check-In',
      'Nama Pengunjung',
      'Spesialisasi',
      'Email',
      'No. Telepon',
      'Tipe Kunjungan',
      'Nama Booth / Symposium',
      'Waktu Kunjungan (WIB)',
    ];

    const rows = participants.map((p, idx) => {
      const typeLabel = p.type === 'booths' ? 'Booth' : 'Symposium';
      const locationName = p.type === 'booths' ? p.booth?.name || '-' : p.symposium?.title || '-';
      return [
        (currentPage - 1) * limit + idx + 1,
        p.id,
        `"${(p.user?.fullname || '-').replace(/"/g, '""')}"`,
        `"${(p.user?.speciality || '-').replace(/"/g, '""')}"`,
        `"${(p.user?.email || '-').replace(/"/g, '""')}"`,
        `'${p.user?.phone_number || '-'}`,
        typeLabel,
        `"${locationName.replace(/"/g, '""')}"`,
        formatDate(p.created_at),
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `data_visitor_kalbe_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('success', 'Data visitor berhasil diekspor ke CSV!');
  };

  const handleRefresh = () => {
    fetchCounts();
    fetchDropdownOptions();
    fetchParticipants();
    showToast('info', 'Memperbarui data visitor...');
  };

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setSelectedActivityRef('');
    setCurrentPage(1);
  };

  return (
    <div className="admin-content-container">
      {/* ─── Page Header ──────────────────────────────────────────────────── */}
      <div className="admin-header-row" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users className="w-7 h-7 text-[#E50014]" />
            Data Visitor
          </h1>
          <p className="admin-page-subtitle">
            Rekap data kunjungan peserta dan dokter ke booth dan symposium Kalbe
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleRefresh}
            className="admin-btn admin-btn-secondary"
            title="Refresh Data"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="admin-btn admin-btn-primary"
            title="Ekspor CSV"
            disabled={participants.length === 0}
          >
            <Download className="w-4 h-4" />
            Ekspor CSV
          </button>
        </div>
      </div>

      {/* ─── Aggregate Statistic Cards ────────────────────────────────────── */}
      <div className="admin-stats-grid" style={{ marginBottom: '24px' }}>
        {/* Booth Visitors Card */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}>
            <Store className="w-6 h-6" />
          </div>
          <div className="admin-stat-content">
            <span className="admin-stat-label">Total Kunjungan Booth</span>
            <div className="admin-stat-value">
              {countsLoading ? '...' : counts?.total_booth_visitor ?? 0}
            </div>
          </div>
        </div>

        {/* Symposium Participants Card */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}>
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="admin-stat-content">
            <span className="admin-stat-label">Total Partisipan Symposium</span>
            <div className="admin-stat-value">
              {countsLoading ? '...' : counts?.total_symposium_participant ?? 0}
            </div>
          </div>
        </div>

        {/* Combined Visitors Card */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
            <Users className="w-6 h-6" />
          </div>
          <div className="admin-stat-content">
            <span className="admin-stat-label">Total Semua Kunjungan</span>
            <div className="admin-stat-value">
              {countsLoading
                ? '...'
                : (counts?.total_booth_visitor ?? 0) + (counts?.total_symposium_participant ?? 0)}
            </div>
          </div>
        </div>

        {/* User Login Card */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
            <UserCheck className="w-6 h-6" />
          </div>
          <div className="admin-stat-content">
            <span className="admin-stat-label">Total User Login</span>
            <div className="admin-stat-value">
              {countsLoading ? '...' : counts?.total_user_login ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content Card ────────────────────────────────────────────── */}
      <div className="admin-card">
        {/* Controls Bar: Search & Dropdown Filters */}
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
          <div style={{ flex: '1 1 240px', minWidth: '220px', position: 'relative' }}>
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
              style={{ paddingLeft: '36px', width: '100%' }}
              placeholder="Cari nama pengunjung, email, no handphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter Dropdown 1: Tipe Booth / Symposium */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter className="w-4 h-4 text-[var(--admin-text-muted)]" />
            <span style={{ fontSize: '13px', opacity: 0.85, whiteSpace: 'nowrap' }}>Tipe:</span>
            <select
              className="admin-select"
              value={typeFilter}
              onChange={(e) => {
                const newType = e.target.value as 'all' | 'booths' | 'symposiums';
                setTypeFilter(newType);
                // Reset specific activity dropdown if it conflicts with the new type
                if (
                  (newType === 'booths' && selectedActivityRef.startsWith('symposium:')) ||
                  (newType === 'symposiums' && selectedActivityRef.startsWith('booth:'))
                ) {
                  setSelectedActivityRef('');
                }
                setCurrentPage(1);
              }}
              style={{ minWidth: '135px' }}
            >
              <option value="all">Semua Tipe</option>
              <option value="booths">🎪 Booth</option>
              <option value="symposiums">🎓 Symposium</option>
            </select>
          </div>

          {/* Filter Dropdown 2: Nama Tiap Booth & Symposium */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', opacity: 0.85, whiteSpace: 'nowrap' }}>
              Nama Booth / Symposium:
            </span>
            <select
              className="admin-select"
              value={selectedActivityRef}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedActivityRef(val);
                if (val.startsWith('booth:')) {
                  setTypeFilter('booths');
                } else if (val.startsWith('symposium:')) {
                  setTypeFilter('symposiums');
                }
                setCurrentPage(1);
              }}
              style={{ minWidth: '220px', maxWidth: '300px' }}
            >
              <option value="">Semua Booth & Symposium</option>

              {/* Group Booths */}
              {(typeFilter === 'all' || typeFilter === 'booths') && booths.length > 0 && (
                <optgroup label="🎪 Daftar Booth">
                  {booths.map((b) => (
                    <option key={b.id} value={`booth:${b.id}`}>
                      {b.name}
                    </option>
                  ))}
                </optgroup>
              )}

              {/* Group Symposiums */}
              {(typeFilter === 'all' || typeFilter === 'symposiums') && symposiums.length > 0 && (
                <optgroup label="🎓 Daftar Symposium">
                  {symposiums.map((s) => (
                    <option key={s.id} value={`symposium:${s.id}`}>
                      {s.title}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Reset Filter Button (Shown when filters are active) */}
          {(debouncedSearch || typeFilter !== 'all' || selectedActivityRef) && (
            <button
              onClick={handleResetFilters}
              className="admin-btn admin-btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
              title="Reset semua filter"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* ─── Table ──────────────────────────────────────────────────────── */}
        <div className="admin-table-wrapper" style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '48px', textAlign: 'center' }}>No</th>
                <th>Pengunjung / Dokter</th>
                <th>Kontak</th>
                <th style={{ width: '130px' }}>Tipe Kunjungan</th>
                <th>Nama Booth / Symposium</th>
                <th style={{ width: '170px' }}>Waktu Check-In</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <RefreshCw className="w-8 h-8 text-[var(--admin-primary)] animate-spin" />
                      <span style={{ fontSize: '14px', color: 'var(--admin-text-muted)' }}>
                        Memuat data visitor...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : participants.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '56px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <Users className="w-12 h-12 text-[var(--admin-text-muted)]" style={{ opacity: 0.4 }} />
                      <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--admin-text-secondary)' }}>
                        Tidak Ada Data Visitor
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--admin-text-muted)', margin: 0, maxWidth: '360px' }}>
                        {debouncedSearch || typeFilter !== 'all' || selectedActivityRef
                          ? 'Tidak ada pengunjung yang cocok dengan filter yang dipilih. Coba sesuaikan kata kunci atau filter Anda.'
                          : 'Belum ada data kunjungan peserta yang tercatat di sistem.'}
                      </p>
                      {(debouncedSearch || typeFilter !== 'all' || selectedActivityRef) && (
                        <button
                          onClick={handleResetFilters}
                          className="admin-btn admin-btn-secondary"
                          style={{ marginTop: '8px' }}
                        >
                          Reset Filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                participants.map((p, idx) => {
                  const isBooth = p.type === 'booths';
                  const locationName = isBooth
                    ? p.booth?.name || 'Booth'
                    : p.symposium?.title || 'Symposium';

                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedVisitor(p)}
                      style={{ cursor: 'pointer' }}
                      className="hover:bg-[var(--admin-surface-hover)] transition-colors"
                    >
                      {/* No */}
                      <td style={{ textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '13px' }}>
                        {(currentPage - 1) * limit + idx + 1}
                      </td>

                      {/* Pengunjung */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--admin-text)', fontSize: '14px' }}>
                            {p.user?.fullname || 'Pengunjung Tanpa Nama'}
                          </span>
                          {p.user?.speciality && (
                            <span
                              style={{
                                display: 'inline-block',
                                alignSelf: 'flex-start',
                                padding: '1px 7px',
                                borderRadius: '4px',
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                fontSize: '11px',
                                color: 'var(--admin-text-secondary)',
                              }}
                            >
                              {p.user.speciality}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Kontak */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: 'var(--admin-text-secondary)',
                            }}
                          >
                            <Mail className="w-3.5 h-3.5 text-[var(--admin-text-muted)] shrink-0" />
                            {p.user?.email || '-'}
                          </span>
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: 'var(--admin-text-muted)',
                            }}
                          >
                            <Phone className="w-3.5 h-3.5 text-[var(--admin-text-muted)] shrink-0" />
                            {p.user?.phone_number || '-'}
                          </span>
                        </div>
                      </td>

                      {/* Tipe Kunjungan Badge */}
                      <td>
                        {isBooth ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#F87171',
                              fontSize: '12px',
                              fontWeight: 600,
                            }}
                          >
                            <Store className="w-3.5 h-3.5" />
                            Booth
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              background: 'rgba(59, 130, 246, 0.15)',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              color: '#60A5FA',
                              fontSize: '12px',
                              fontWeight: 600,
                            }}
                          >
                            <GraduationCap className="w-3.5 h-3.5" />
                            Symposium
                          </span>
                        )}
                      </td>

                      {/* Nama Booth / Symposium */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 500, color: 'var(--admin-text)', fontSize: '13px' }}>
                            {locationName}
                          </span>
                        </div>
                      </td>

                      {/* Waktu Check-In */}
                      <td style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar className="w-3.5 h-3.5 text-[var(--admin-text-muted)] shrink-0" />
                          <span>{formatDate(p.created_at)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Pagination Footer ────────────────────────────────────────────── */}
        {!loading && participants.length > 0 && (
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
            {/* Total Indicator & Page Limit */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--admin-text-muted)' }}>
              <span>
                Menampilkan{' '}
                <strong style={{ color: 'var(--admin-text)' }}>
                  {(currentPage - 1) * limit + 1}
                </strong>{' '}
                -{' '}
                <strong style={{ color: 'var(--admin-text)' }}>
                  {Math.min(currentPage * limit, total)}
                </strong>{' '}
                dari <strong style={{ color: 'var(--admin-text)' }}>{total}</strong> data visitor
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Baris per halaman:</span>
                <select
                  className="admin-select"
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{ width: '70px', padding: '3px 8px', height: '30px' }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Page Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="admin-btn admin-btn-secondary"
                style={{ padding: '6px 10px', height: '32px' }}
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>

              <span style={{ fontSize: '13px', padding: '0 8px', color: 'var(--admin-text-secondary)' }}>
                Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="admin-btn admin-btn-secondary"
                style={{ padding: '6px 10px', height: '32px' }}
                title="Halaman Selanjutnya"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Detail Modal (Ketika baris diklik) ────────────────────────────── */}
      {selectedVisitor && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setSelectedVisitor(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div
            className="admin-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '24px',
              background: 'var(--admin-bg-secondary)',
              border: '1px solid var(--admin-border-strong)',
              boxShadow: 'var(--admin-shadow-lg)',
              borderRadius: 'var(--admin-radius-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--admin-text)' }}>
                Detail Kunjungan Visitor
              </h3>
              <button
                onClick={() => setSelectedVisitor(null)}
                className="admin-btn admin-btn-secondary"
                style={{ padding: '4px 8px', height: '30px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
              <div style={{ padding: '12px', background: 'var(--admin-surface)', borderRadius: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)', display: 'block', marginBottom: '4px' }}>
                  Informasi Dokter / Pengunjung
                </span>
                <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--admin-text)' }}>
                  {selectedVisitor.user?.fullname || 'Pengunjung Tanpa Nama'}
                </div>
                {selectedVisitor.user?.speciality && (
                  <div style={{ fontSize: '13px', color: 'var(--admin-primary-light)', marginTop: '2px' }}>
                    Spesialisasi: {selectedVisitor.user.speciality}
                  </div>
                )}
                <div style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', marginTop: '4px' }}>
                  Email: {selectedVisitor.user?.email || '-'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--admin-text-secondary)' }}>
                  No. Telepon: {selectedVisitor.user?.phone_number || '-'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'var(--admin-surface)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)', display: 'block', marginBottom: '4px' }}>
                    Tipe Kunjungan
                  </span>
                  <div style={{ fontWeight: 600, color: selectedVisitor.type === 'booths' ? '#F87171' : '#60A5FA' }}>
                    {selectedVisitor.type === 'booths' ? '🎪 Booth' : '🎓 Symposium'}
                  </div>
                </div>

                <div style={{ padding: '12px', background: 'var(--admin-surface)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)', display: 'block', marginBottom: '4px' }}>
                    Waktu Check-In
                  </span>
                  <div style={{ fontWeight: 500, fontSize: '13px', color: 'var(--admin-text)' }}>
                    {formatDate(selectedVisitor.created_at)}
                  </div>
                </div>
              </div>

              <div style={{ padding: '12px', background: 'var(--admin-surface)', borderRadius: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)', display: 'block', marginBottom: '4px' }}>
                  Lokasi / Aktivitas yang Dikunjungi
                </span>
                <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--admin-text)' }}>
                  {selectedVisitor.type === 'booths'
                    ? selectedVisitor.booth?.name || 'Booth'
                    : selectedVisitor.symposium?.title || 'Symposium'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>
                  ID: {selectedVisitor.booth_id || selectedVisitor.symposium_id || '-'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => setSelectedVisitor(null)}
                className="admin-btn admin-btn-primary"
                style={{ width: '100px' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
