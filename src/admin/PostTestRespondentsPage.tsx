import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  Download,
  Calendar,
  Phone,
  Mail,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  GraduationCap,
  FileText,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import {
  getKalbePostTestRespondents,
  getKalbeSymposiums,
  type KalbePostTestRespondentGroup,
  type KalbePostTestRespondentItem,
  type KalbePostTestRespondentsMeta,
  type KalbeSymposiumResponse,
} from './adminApi';

// Helper accessors for data safety
const getPostTestTitle = (g: KalbePostTestRespondentGroup) => {
  const rec = g as unknown as Record<string, unknown>;
  return (
    g.nama_post_test ||
    (typeof rec.post_test_name === 'string' ? rec.post_test_name : '') ||
    (typeof rec.title === 'string' ? rec.title : '') ||
    'Post-Test Tanpa Judul'
  );
};

const getSymposiumName = (g: KalbePostTestRespondentGroup) => {
  const rec = g as unknown as Record<string, unknown>;
  return (
    g.nama_symposium ||
    (typeof rec.symposium_name === 'string' ? rec.symposium_name : '') ||
    '-'
  );
};

const getEventDate = (g: KalbePostTestRespondentGroup) => {
  const rec = g as unknown as Record<string, unknown>;
  return (
    g.tanggal_event ||
    (typeof rec.symposium_date === 'string' ? rec.symposium_date : '') ||
    (typeof rec.started_at === 'string' ? rec.started_at : '') ||
    '-'
  );
};

const getRespName = (r: KalbePostTestRespondentItem) => {
  const rec = r as unknown as Record<string, unknown>;
  return (
    r.nama ||
    (typeof rec.fullname === 'string' ? rec.fullname : '') ||
    (typeof rec.name === 'string' ? rec.name : '') ||
    (typeof rec.respondent_name === 'string' ? rec.respondent_name : '') ||
    'Tanpa Nama'
  );
};

const getRespPhone = (r: KalbePostTestRespondentItem) => {
  const rec = r as unknown as Record<string, unknown>;
  return (
    r.handphone ||
    (typeof rec.phone_number === 'string' ? rec.phone_number : '') ||
    (typeof rec.respondent_phone_number === 'string' ? rec.respondent_phone_number : '') ||
    '-'
  );
};

const getRespEmail = (r: KalbePostTestRespondentItem) => {
  const rec = r as unknown as Record<string, unknown>;
  return (
    r.email ||
    (typeof rec.respondent_email === 'string' ? rec.respondent_email : '') ||
    '-'
  );
};

const getRespSubmitDate = (r: KalbePostTestRespondentItem) => {
  const rec = r as unknown as Record<string, unknown>;
  return (
    r.tanggal_submit ||
    (typeof rec.submitted_at === 'string' ? rec.submitted_at : '') ||
    (typeof rec.created_at === 'string' ? rec.created_at : '') ||
    '-'
  );
};

export const PostTestRespondentsPage: React.FC = () => {
  const { showToast } = useToast();

  // ─── Data States ────────────────────────────────────────────────────────────
  const [groups, setGroups] = useState<KalbePostTestRespondentGroup[]>([]);
  const [meta, setMeta] = useState<KalbePostTestRespondentsMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [symposiums, setSymposiums] = useState<KalbeSymposiumResponse[]>([]);

  // ─── Filter States ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [selectedSymposiumId, setSelectedSymposiumId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // ─── Modals State ───────────────────────────────────────────────────────────
  const [selectedGroup, setSelectedGroup] = useState<KalbePostTestRespondentGroup | null>(null);
  const [groupRespSearch, setGroupRespSearch] = useState<string>('');
  const [selectedRespondent, setSelectedRespondent] = useState<{
    group: KalbePostTestRespondentGroup;
    respondent: KalbePostTestRespondentItem;
  } | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // ─── Fetch Symposiums for Dropdown Filter ────────────────────────────────────
  useEffect(() => {
    const fetchSympos = async () => {
      try {
        const res = await getKalbeSymposiums({ limit: 100 });
        if (res.data) {
          setSymposiums(res.data);
        }
      } catch (err) {
        console.error('Failed to load symposiums for filter:', err);
      }
    };
    fetchSympos();
  }, []);

  // ─── Fetch Respondents Data ─────────────────────────────────────────────────
  const fetchRespondents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getKalbePostTestRespondents({
        page: currentPage,
        limit,
        symposium_id: selectedSymposiumId || undefined,
        search: debouncedSearch.trim() || undefined,
      });

      const mappedGroups = (res.data || []).map((g) => ({
        ...g,
        respondents: [...(g.respondents || [])].sort((a, b) => {
          const timeA = new Date(getRespSubmitDate(a)).getTime() || 0;
          const timeB = new Date(getRespSubmitDate(b)).getTime() || 0;
          return timeB - timeA;
        }),
      }));

      setGroups(mappedGroups);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err: unknown) {
      console.error('Failed to fetch post test respondents:', err);
      const msg = err instanceof Error ? err.message : 'Gagal memuat data responden post-test.';
      showToast('error', msg);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, selectedSymposiumId, debouncedSearch, showToast]);

  useEffect(() => {
    fetchRespondents();
  }, [fetchRespondents]);

  // ─── Computed Stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let totalResp = 0;
    let totalQuestions = 0;
    let totalCorrect = 0;
    let scoreSum = 0;
    let scoredRespCount = 0;

    groups.forEach((g) => {
      if (g.respondents && g.respondents.length > 0) {
        totalResp += g.respondents.length;
        g.respondents.forEach((r) => {
          totalQuestions += r.total_questions || 0;
          totalCorrect += r.total_correct || 0;
          scoreSum += r.score || 0;
          scoredRespCount++;
        });
      }
    });

    const avgScore = scoredRespCount > 0 ? (scoreSum / scoredRespCount).toFixed(1) : '0';
    return {
      totalPostTests: meta?.total ?? groups.length,
      totalRespondents: totalResp,
      avgScore,
      totalCorrect,
      totalQuestions,
    };
  }, [groups, meta]);

  const totalPages = useMemo(() => {
    if (!meta) return 1;
    return Math.max(1, meta.total_pages || Math.ceil(meta.total / limit));
  }, [meta, limit]);

  // ─── Formatters ─────────────────────────────────────────────────────────────
  const formatDate = (dateStr?: string) => {
    if (!dateStr || dateStr === '-') return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const formatScoreBadge = (score: number) => {
    const formatted = score % 1 === 0 ? score.toFixed(0) : score.toFixed(1);
    if (score >= 75) {
      return <span className="admin-badge admin-badge-success">{formatted} / 100</span>;
    }
    if (score >= 50) {
      return <span className="admin-badge admin-badge-warning">{formatted} / 100</span>;
    }
    return <span className="admin-badge admin-badge-danger">{formatted} / 100</span>;
  };


  // ─── Export CSV Functions ───────────────────────────────────────────────────
  const handleExportCSV = (targetGroup?: KalbePostTestRespondentGroup) => {
    const listToExport = targetGroup ? [targetGroup] : groups;
    if (listToExport.length === 0) {
      showToast('error', 'Tidak ada data untuk diekspor.');
      return;
    }

    const headers = [
      'No',
      'Judul Post-Test',
      'Nama Symposium',
      'Tanggal Event',
      'Nama User',
      'Email',
      'Phone Number',
      'Waktu Submit',
      'Skor (0-100)',
      'Total Soal',
      'Jawaban Benar',
      'Jawaban Salah',
    ];

    const rows: string[][] = [];
    let counter = 1;

    listToExport.forEach((group) => {
      (group.respondents || []).forEach((resp) => {
        rows.push([
          String(counter++),
          `"${getPostTestTitle(group).replace(/"/g, '""')}"`,
          `"${getSymposiumName(group).replace(/"/g, '""')}"`,
          `"${getEventDate(group)}"`,
          `"${getRespName(resp).replace(/"/g, '""')}"`,
          `"${getRespEmail(resp).replace(/"/g, '""')}"`,
          `'${getRespPhone(resp)}`,
          formatDate(getRespSubmitDate(resp)),
          String(resp.score ?? 0),
          String(resp.total_questions || 0),
          String(resp.total_correct || 0),
          String(resp.total_incorrect || 0),
        ]);
      });
    });

    if (rows.length === 0) {
      showToast('error', 'Belum ada data responden pada post-test ini.');
      return;
    }

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const titleSlug = getPostTestTitle(targetGroup || groups[0])
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');

    const filename = targetGroup
      ? `responden_post_test_${titleSlug}_${new Date().toISOString().split('T')[0]}.csv`
      : `responden_post_test_kalbe_all_${new Date().toISOString().split('T')[0]}.csv`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('success', 'Data responden post-test berhasil diekspor ke CSV!');
  };

  // Filtered respondents inside detail modal (sorted newest first)
  const modalRespondents = useMemo(() => {
    if (!selectedGroup) return [];
    const list = [...(selectedGroup.respondents || [])].sort((a, b) => {
      const timeA = new Date(getRespSubmitDate(a)).getTime() || 0;
      const timeB = new Date(getRespSubmitDate(b)).getTime() || 0;
      return timeB - timeA;
    });

    if (!groupRespSearch.trim()) return list;
    const q = groupRespSearch.toLowerCase();
    return list.filter((r) => {
      const name = getRespName(r).toLowerCase();
      const email = getRespEmail(r).toLowerCase();
      const phone = getRespPhone(r).toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [selectedGroup, groupRespSearch]);

  return (
    <div>
      {/* ─── Page Header ──────────────────────────────────────────────────────── */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Responden Post-Test</h1>
          <p className="admin-page-subtitle">
            Laporan data responden pengerjaan post-test symposium, perolehan skor, dan evaluasi jawaban peserta.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={fetchRespondents}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Muat Ulang
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={() => handleExportCSV()}
            disabled={loading || groups.length === 0}
          >
            <Download size={16} />
            Ekspor Semua CSV
          </button>
        </div>
      </div>

      {/* ─── Metric Cards ─────────────────────────────────────────────────────── */}
      <div className="admin-stats-grid" style={{ marginBottom: 24 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Post-Tests</span>
            <div className="admin-stat-icon-wrapper admin-stat-icon-primary">
              <FileText size={20} />
            </div>
          </div>
          <div className="admin-stat-value">{stats.totalPostTests}</div>
          <div className="admin-stat-footer">Post-test simposium terdaftar</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Responden</span>
            <div className="admin-stat-icon-wrapper admin-stat-icon-info">
              <GraduationCap size={20} />
            </div>
          </div>
          <div className="admin-stat-value">{stats.totalRespondents}</div>
          <div className="admin-stat-footer">Peserta telah submit post-test</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Rata-rata Skor</span>
            <div className="admin-stat-icon-wrapper admin-stat-icon-warning">
              <Award size={20} />
            </div>
          </div>
          <div className="admin-stat-value">{stats.avgScore} <span style={{ fontSize: 14, color: 'var(--admin-text-secondary)' }}>/ 100</span></div>
          <div className="admin-stat-footer">Nilai rata-rata seluruh responden</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Jawaban Benar</span>
            <div className="admin-stat-icon-wrapper admin-stat-icon-success">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="admin-stat-value">
            {stats.totalCorrect}
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--admin-text-secondary)', marginLeft: 6 }}>
              / {stats.totalQuestions} soal
            </span>
          </div>
          <div className="admin-stat-footer">Total soal terjawab dengan benar</div>
        </div>
      </div>

      {/* ─── Filter Bar ───────────────────────────────────────────────────────── */}
      <div
        className="admin-table-container"
        style={{
          padding: 16,
          marginBottom: 20,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: 1, minWidth: 280 }}>
          {/* Search Box */}
          <div className="admin-search-wrapper" style={{ flex: 1, minWidth: 220, maxWidth: 380 }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Cari judul post-test atau simposium..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-input"
            />
          </div>

          {/* Symposium Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 220 }}>
            <Filter size={16} style={{ color: 'var(--admin-text-secondary)' }} />
            <select
              className="admin-select"
              value={selectedSymposiumId}
              onChange={(e) => {
                setSelectedSymposiumId(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: '100%' }}
            >
              <option value="">Semua Symposium</option>
              {symposiums.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Limit Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>Tampilkan:</span>
          <select
            className="admin-select"
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{ width: 85 }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* ─── Post-Test List Table ─────────────────────────────────────────────── */}
      <div className="admin-table-container">
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div className="spin" style={{ display: 'inline-block', marginBottom: 12 }}>
              <RefreshCw size={28} />
            </div>
            <p style={{ color: 'var(--admin-text-secondary)', fontSize: 14 }}>
              Memuat data responden post-test...
            </p>
          </div>
        ) : groups.length === 0 ? (
          <div className="admin-table-empty" style={{ padding: 60, textAlign: 'center' }}>
            <div className="admin-table-empty-icon" style={{ fontSize: 40, marginBottom: 12 }}>
              📋
            </div>
            <h3 className="admin-table-empty-title" style={{ fontSize: 18, marginBottom: 6 }}>
              Tidak Ada Data Post-Test
            </h3>
            <p className="admin-table-empty-text" style={{ color: 'var(--admin-text-secondary)', fontSize: 14 }}>
              {debouncedSearch || selectedSymposiumId
                ? 'Tidak ditemukan post-test yang cocok dengan kriteria pencarian.'
                : 'Belum ada data post-test yang tersedia.'}
            </p>
          </div>
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>No</th>
                  <th>Judul Post-Test</th>
                  <th>Simposium Terkait</th>
                  <th style={{ textAlign: 'center', width: 150 }}>Jumlah Responden</th>
                  <th style={{ textAlign: 'center', width: 160 }}>Rata-rata Skor</th>
                  <th style={{ textAlign: 'right', width: 220 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group, index) => {
                  const respCount = group.respondents ? group.respondents.length : (group.total_respondents || 0);
                  const avgGroupScore =
                    respCount > 0 && group.respondents && group.respondents.length > 0
                      ? group.respondents.reduce((acc, r) => acc + (r.score || 0), 0) / group.respondents.length
                      : 0;

                  return (
                    <tr key={group.post_test_id || index}>
                      <td>{(currentPage - 1) * limit + index + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--admin-text)' }}>
                          {getPostTestTitle(group)}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--admin-text)' }}>
                          {getSymposiumName(group) !== '-' ? (
                            getSymposiumName(group)
                          ) : (
                            <span style={{ color: 'var(--admin-text-secondary)' }}>-</span>
                          )}
                        </div>
                        {getEventDate(group) !== '-' && (
                          <div
                            style={{
                              fontSize: 12,
                              color: 'var(--admin-text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              marginTop: 2,
                            }}
                          >
                            <Calendar size={12} />
                            {getEventDate(group)}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className={`admin-badge ${respCount > 0 ? 'admin-badge-info' : ''}`}
                          style={{ fontWeight: 600 }}
                        >
                          {respCount} Peserta
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {respCount > 0 ? (
                          formatScoreBadge(avgGroupScore)
                        ) : (
                          <span style={{ color: 'var(--admin-text-secondary)', fontSize: 13 }}>-</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary"
                            style={{ padding: '6px 12px', fontSize: 12.5 }}
                            onClick={() => {
                              setSelectedGroup(group);
                              setGroupRespSearch('');
                            }}
                          >
                            <Eye size={14} />
                            Lihat Responden ({respCount})
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn-outline"
                            style={{ padding: '6px 10px', fontSize: 12.5 }}
                            onClick={() => handleExportCSV(group)}
                            title="Ekspor CSV Post-Test ini"
                            disabled={respCount === 0}
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── Pagination ─────────────────────────────────────────────────────── */}
        {!loading && groups.length > 0 && (
          <div
            style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--admin-border)',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>
              Menampilkan data <strong>{(currentPage - 1) * limit + 1}</strong> -{' '}
              <strong>{Math.min(currentPage * limit, meta?.total ?? groups.length)}</strong> dari{' '}
              <strong>{meta?.total ?? groups.length}</strong> post-test
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                style={{ padding: '6px 12px' }}
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
                Prev
              </button>
              <span style={{ fontSize: 13, margin: '0 8px', fontWeight: 600 }}>
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                style={{ padding: '6px 12px' }}
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Modal 1: Detail Responden Post-Test (Clean & Focused) ─────────────── */}
      {selectedGroup && (
        <div
          className="admin-modal-overlay"
          onClick={() => setSelectedGroup(null)}
        >
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 960,
              maxHeight: '90vh',
              background: 'var(--admin-bg-secondary)',
            }}
          >
            {/* Modal Header */}
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title" style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                  Responden: {getPostTestTitle(selectedGroup)}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--admin-text-secondary)', marginTop: 4 }}>
                  Simposium: <strong>{getSymposiumName(selectedGroup)}</strong>
                  {getEventDate(selectedGroup) !== '-' && (
                    <> • Tanggal: <strong>{getEventDate(selectedGroup)}</strong></>
                  )}
                </p>
              </div>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setSelectedGroup(null)}
                aria-label="Tutup"
              >
                &times;
              </button>
            </div>

            {/* Modal Sub-Header (Stats & Search) */}
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid var(--admin-border)',
                background: 'rgba(255, 255, 255, 0.02)',
                display: 'flex',
                gap: 16,
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div className="admin-search-wrapper" style={{ flex: 1, maxWidth: 360 }}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Cari nama, email, atau phone number..."
                  value={groupRespSearch}
                  onChange={(e) => setGroupRespSearch(e.target.value)}
                  className="admin-input"
                />
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>
                  Total: <strong>{modalRespondents.length}</strong> responden
                </span>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  style={{ padding: '6px 12px', fontSize: 12.5 }}
                  onClick={() => handleExportCSV(selectedGroup)}
                  disabled={!selectedGroup.respondents || selectedGroup.respondents.length === 0}
                >
                  <Download size={14} />
                  Ekspor CSV Post-Test Ini
                </button>
              </div>
            </div>

            {/* Modal Table Content (Cukup Nama, Email, Phone, Waktu Submit, Skor & Detail Jawaban) */}
            <div
              className="admin-modal-body"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0 24px 20px 24px',
                background: 'transparent',
              }}
            >
              {modalRespondents.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-secondary)' }}>
                  {groupRespSearch
                    ? 'Tidak ditemukan responden yang cocok dengan kata kunci pencarian.'
                    : 'Belum ada data responden untuk post-test ini.'}
                </div>
              ) : (
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <table
                    className="admin-table"
                    style={{
                      marginTop: 16,
                      width: '100%',
                      minWidth: '640px',
                    }}
                  >
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>No</th>
                        <th>Nama User</th>
                        <th>Email</th>
                        <th>Phone Number</th>
                        <th style={{ width: 160 }}>Waktu Submit</th>
                        <th style={{ textAlign: 'center', width: 140 }}>Skor (0-100)</th>
                        <th style={{ textAlign: 'center', width: 130 }}>Detail Jawaban</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalRespondents.map((resp, idx) => (
                        <tr key={resp.response_id || idx}>
                          <td>{idx + 1}</td>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--admin-text)' }}>
                              {getRespName(resp)}
                            </div>
                          </td>
                          <td>
                            <div
                              style={{
                                fontSize: 13,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                color: 'var(--admin-text)',
                              }}
                            >
                              <Mail size={13} style={{ color: 'var(--admin-text-secondary)' }} />
                              {getRespEmail(resp)}
                            </div>
                          </td>
                          <td>
                            <div
                              style={{
                                fontSize: 13,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                color: 'var(--admin-text)',
                              }}
                            >
                              <Phone size={13} style={{ color: 'var(--admin-text-secondary)' }} />
                              {getRespPhone(resp)}
                            </div>
                          </td>
                          <td style={{ fontSize: 12.5, color: 'var(--admin-text-secondary)' }}>
                            {formatDate(getRespSubmitDate(resp))}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div>{formatScoreBadge(resp.score || 0)}</div>
                            <div style={{ fontSize: 11, color: 'var(--admin-text-secondary)', marginTop: 4 }}>
                              {resp.total_correct}/{resp.total_questions} Benar
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="admin-btn admin-btn-secondary"
                              style={{ padding: '6px 12px', fontSize: 12 }}
                              onClick={() =>
                                setSelectedRespondent({
                                  group: selectedGroup,
                                  respondent: resp,
                                })
                              }
                            >
                              <HelpCircle size={14} />
                              Lihat Jawaban
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              className="admin-modal-footer"
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--admin-border)',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setSelectedGroup(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 2: Detail Jawaban Per Responden ─────────────────────────────── */}
      {selectedRespondent && (
        <div
          className="admin-modal-overlay"
          onClick={() => setSelectedRespondent(null)}
          style={{ zIndex: 1100 }}
        >
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 780,
              maxHeight: '85vh',
              background: 'var(--admin-bg-secondary)',
            }}
          >
            {/* Header */}
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title" style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                  Rincian Jawaban: {getRespName(selectedRespondent.respondent)}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--admin-text-secondary)', marginTop: 4 }}>
                  Post-Test: <strong>{getPostTestTitle(selectedRespondent.group)}</strong> • Skor:{' '}
                  <strong>{selectedRespondent.respondent.score} / 100</strong> (
                  {selectedRespondent.respondent.total_correct}/
                  {selectedRespondent.respondent.total_questions} Benar)
                </p>
              </div>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setSelectedRespondent(null)}
                aria-label="Tutup"
              >
                &times;
              </button>
            </div>

            {/* Questions List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {(!selectedRespondent.respondent.answers ||
                selectedRespondent.respondent.answers.length === 0) ? (
                <div style={{ padding: 30, textAlign: 'center', color: 'var(--admin-text-secondary)' }}>
                  Tidak ada data jawaban yang tersimpan untuk responden ini.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {selectedRespondent.respondent.answers.map((ans, qIdx) => (
                    <div
                      key={ans.question_id || qIdx}
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        background: ans.is_correct
                          ? 'rgba(16, 185, 129, 0.05)'
                          : 'rgba(239, 68, 68, 0.05)',
                        border: `1px solid ${
                          ans.is_correct ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                        }`,
                      }}
                    >
                      {(() => {
                        const ansRec = ans as unknown as Record<string, unknown>;
                        const qText =
                          ans.pertanyaan ||
                          (typeof ansRec.question_text === 'string' ? ansRec.question_text : '') ||
                          'Pertanyaan';
                        const uAns =
                          ans.answer && ans.answer !== '-'
                            ? ans.answer
                            : Array.isArray(ansRec.user_selected_options)
                              ? ansRec.user_selected_options.join(', ')
                              : '(Tidak menjawab)';
                        const cAns =
                          ans.correct_answer && ans.correct_answer !== '-'
                            ? ans.correct_answer
                            : Array.isArray(ansRec.correct_options)
                              ? ansRec.correct_options.join(', ')
                              : '-';

                        return (
                          <>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                gap: 12,
                                marginBottom: 10,
                              }}
                            >
                              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--admin-text)', flex: 1 }}>
                                <span style={{ color: 'var(--admin-primary)', marginRight: 6 }}>
                                  #{qIdx + 1}.
                                </span>
                                {qText}
                              </div>
                              <div>
                                {ans.is_correct ? (
                                  <span
                                    className="admin-badge admin-badge-success"
                                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                                  >
                                    <CheckCircle2 size={13} />
                                    Benar
                                  </span>
                                ) : (
                                  <span
                                    className="admin-badge admin-badge-danger"
                                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                                  >
                                    <XCircle size={13} />
                                    Salah
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* User's Selected Answer */}
                            <div style={{ marginTop: 8, fontSize: 13 }}>
                              <span style={{ color: 'var(--admin-text-secondary)', fontWeight: 500 }}>
                                Jawaban Peserta:{' '}
                              </span>
                              <span
                                style={{
                                  fontWeight: 600,
                                  color: ans.is_correct ? '#10b981' : '#ef4444',
                                  marginLeft: 4,
                                }}
                              >
                                {uAns}
                              </span>
                            </div>

                            {/* Correct Key Answer (Shown if user was incorrect or as reference) */}
                            {!ans.is_correct && (
                              <div
                                style={{
                                  marginTop: 8,
                                  fontSize: 13,
                                  padding: '8px 12px',
                                  borderRadius: 6,
                                  background: 'rgba(59, 130, 246, 0.08)',
                                  border: '1px dashed rgba(59, 130, 246, 0.3)',
                                }}
                              >
                                <span style={{ color: '#3b82f6', fontWeight: 600 }}>
                                  Kunci Jawaban Benar:{' '}
                                </span>
                                <span style={{ fontWeight: 600, color: 'var(--admin-text)', marginLeft: 4 }}>
                                  {cAns}
                                </span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="admin-modal-footer"
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--admin-border)',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setSelectedRespondent(null)}
              >
                Kembali ke Daftar Responden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PostTestRespondentsPage;
