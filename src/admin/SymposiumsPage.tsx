import { useState, useEffect, useMemo, type FormEvent } from 'react';
import {
  getKalbeSymposiums,
  createKalbeSymposium,
  updateKalbeSymposium,
  deleteKalbeSymposium,
  isBrandUser,
  type KalbeSymposiumResponse,
  type KalbeSymposiumRequest,
} from './adminApi';
import { useToast } from '../context/ToastContext';

export function SymposiumsPage() {
  const { showToast } = useToast();
  const isBrand = isBrandUser();

  const [symposiums, setSymposiums] = useState<KalbeSymposiumResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal Create / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<KalbeSymposiumResponse | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startedAt, setStartedAt] = useState('');
  const [endedAt, setEndedAt] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal Delete
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<KalbeSymposiumResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Helper date formatter for datetime-local
  const toLocalInputValue = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '';
      const pad = (n: number) => (n < 10 ? '0' + n : n);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
        d.getHours()
      )}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  const fetchSymposiums = async () => {
    setLoading(true);
    try {
      const res = await getKalbeSymposiums({ limit: 100 });
      if (res.data) {
        setSymposiums(res.data);
      }
    } catch {
      showToast('error', 'Gagal memuat data symposium');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSymposiums();
  }, []);

  // Filtered symposium list
  const filteredSymposiums = useMemo(() => {
    return symposiums.filter((sym) => {
      const matchesSearch =
        sym.title.toLowerCase().includes(search.toLowerCase()) ||
        sym.description.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && sym.is_active) ||
        (statusFilter === 'inactive' && !sym.is_active);
      return matchesSearch && matchesStatus;
    });
  }, [symposiums, search, statusFilter]);

  // Stats Counters
  const totalCount = symposiums.length;
  const activeCount = useMemo(() => symposiums.filter((s) => s.is_active).length, [symposiums]);
  const inactiveCount = totalCount - activeCount;

  // Open Create Modal
  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setDescription('');
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    setStartedAt(toLocalInputValue(now.toISOString()));
    setEndedAt(toLocalInputValue(twoHoursLater.toISOString()));
    setIsActive(true);
    setModalOpen(true);
  };

  // Open Edit Modal
  const openEdit = (sym: KalbeSymposiumResponse) => {
    setEditing(sym);
    setTitle(sym.title);
    setDescription(sym.description);
    setStartedAt(toLocalInputValue(sym.started_at));
    setEndedAt(toLocalInputValue(sym.ended_at));
    setIsActive(sym.is_active);
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('error', 'Judul Simposium wajib diisi');
      return;
    }
    if (!description.trim()) {
      showToast('error', 'Deskripsi Simposium wajib diisi');
      return;
    }
    if (!startedAt || !endedAt) {
      showToast('error', 'Waktu mulai dan selesai wajib ditentukan');
      return;
    }

    const start = new Date(startedAt);
    const end = new Date(endedAt);
    if (end <= start) {
      showToast('error', 'Waktu selesai harus lebih besar daripada waktu mulai');
      return;
    }

    const payload: KalbeSymposiumRequest = {
      title: title.trim(),
      description: description.trim(),
      started_at: start.toISOString(),
      ended_at: end.toISOString(),
      is_active: isActive,
    };

    setSaving(true);
    try {
      if (editing) {
        await updateKalbeSymposium(editing.id, payload);
        showToast('success', 'Simposium berhasil diperbarui');
      } else {
        await createKalbeSymposium(payload);
        showToast('success', 'Simposium baru berhasil dibuat');
      }
      setModalOpen(false);
      fetchSymposiums();
    } catch {
      showToast(
        'error',
        editing ? 'Gagal memperbarui simposium' : 'Gagal membuat simposium'
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete Handlers
  const confirmDelete = (sym: KalbeSymposiumResponse) => {
    setDeleteTarget(sym);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteKalbeSymposium(deleteTarget.id);
      showToast('success', `Simposium "${deleteTarget.title}" berhasil dihapus`);
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      fetchSymposiums();
    } catch {
      showToast('error', 'Gagal menghapus simposium');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Symposiums Management</h1>
          <p className="admin-page-subtitle">
            Kelola agenda simposium ilmiah, topik pembahasan, jadwal pelaksanaan, dan status aktif
          </p>
        </div>

        <div className="admin-page-actions">
          <div className="admin-search-wrapper">
            <svg className="admin-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="admin-search-input"
              placeholder="Cari judul / deskripsi simposium..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className={`admin-btn admin-btn-sm ${statusFilter === 'all' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
              onClick={() => setStatusFilter('all')}
            >
              Semua
            </button>
            <button
              className={`admin-btn admin-btn-sm ${statusFilter === 'active' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
              onClick={() => setStatusFilter('active')}
            >
              Aktif
            </button>
            <button
              className={`admin-btn admin-btn-sm ${statusFilter === 'inactive' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
              onClick={() => setStatusFilter('inactive')}
            >
              Nonaktif
            </button>
          </div>

          {!isBrand && (
            <button className="admin-btn admin-btn-primary" onClick={openCreate}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Tambah Simposium
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Simposium</span>
            <div className="admin-stat-icon-wrapper admin-stat-icon-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
          </div>
          <div className="admin-stat-value">{totalCount}</div>
          <div className="admin-stat-footer">
            <span>📅</span> Total sesi simposium terdaftar
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Simposium Aktif</span>
            <div className="admin-stat-icon-wrapper admin-stat-icon-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          </div>
          <div className="admin-stat-value" style={{ color: 'var(--admin-success)' }}>
            {activeCount}
          </div>
          <div className="admin-stat-footer">
            <span>🟢</span> Simposium yang sedang dibuka/aktif
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Simposium Nonaktif</span>
            <div className="admin-stat-icon-wrapper" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--admin-text-muted)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>
          </div>
          <div className="admin-stat-value" style={{ color: 'var(--admin-text-secondary)' }}>
            {inactiveCount}
          </div>
          <div className="admin-stat-footer">
            <span>⚪</span> Simposium yang diarsipkan/tutup
          </div>
        </div>
      </div>

      {/* Table Data */}
      <div className="admin-table-container">
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div className="admin-spinner-ring" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--admin-text-secondary)', fontSize: 13 }}>Memuat data simposium...</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>No</th>
                <th>Judul Simposium</th>
                <th>Deskripsi</th>
                <th>Waktu Pelaksanaan</th>
                <th>Status</th>
                <th>Dibuat Pada</th>
                {!isBrand && <th style={{ width: 140, textAlign: 'right' }}>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filteredSymposiums.length === 0 ? (
                <tr>
                  <td colSpan={isBrand ? 6 : 7} style={{ textAlign: 'center', padding: 50 }}>
                    <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>📅</div>
                    <div style={{ color: 'var(--admin-text-secondary)', fontSize: 14 }}>
                      Belum ada simposium yang ditemukan
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSymposiums.map((sym, index) => (
                  <tr key={sym.id}>
                    <td style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>{index + 1}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 14 }}>
                        {sym.title}
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          color: 'var(--admin-text-secondary)',
                          fontSize: 12.5,
                          maxWidth: 320,
                          lineHeight: 1.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={sym.description}
                      >
                        {sym.description}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12.5, color: 'var(--admin-text)' }}>
                        📅{' '}
                        {new Date(sym.started_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 2 }}>
                        🕒{' '}
                        {new Date(sym.started_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {new Date(sym.ended_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td>
                      <span className={`admin-badge ${sym.is_active ? 'admin-badge-success' : 'admin-badge-neutral'}`}>
                        {sym.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--admin-text-secondary)' }}>
                      {new Date(sym.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    {!isBrand && (
                      <td>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button
                            className="admin-btn admin-btn-sm admin-btn-secondary"
                            onClick={() => openEdit(sym)}
                            title="Edit Simposium"
                          >
                            Edit
                          </button>
                          <button
                            className="admin-btn admin-btn-sm admin-btn-danger"
                            onClick={() => confirmDelete(sym)}
                            title="Hapus Simposium"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── Modal Create / Edit Symposium ───────────────────────────────── */}
      {modalOpen && (
        <div className="admin-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="admin-modal wide" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {editing ? 'Edit Data Simposium' : 'Tambah Simposium Baru'}
              </h3>
              <button className="admin-modal-close" onClick={() => setModalOpen(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                {/* Title & Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                  <div className="admin-field">
                    <label>
                      Judul Simposium <span className="required">*</span>
                    </label>
                    <input
                      className="admin-input"
                      placeholder="Contoh: Kalbe Scientific Symposium 2026"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="admin-field">
                    <label>Status Simposium</label>
                    <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: 10 }}>
                      <input
                        type="checkbox"
                        id="sym_is_active_checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        style={{ width: 18, height: 18, accentColor: 'var(--admin-primary-light)', cursor: 'pointer' }}
                      />
                      <label htmlFor="sym_is_active_checkbox" style={{ cursor: 'pointer', margin: 0 }}>
                        {isActive ? 'Aktif' : 'Nonaktif'}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="admin-field">
                  <label>
                    Deskripsi Simposium <span className="required">*</span>
                  </label>
                  <textarea
                    className="admin-textarea"
                    rows={4}
                    placeholder="Jelaskan ringkasan agenda simposium, target dokter spesialis, serta topik ilmiah..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                {/* Date & Time Range */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="admin-field">
                    <label>
                      Waktu Mulai <span className="required">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="admin-input"
                      value={startedAt}
                      onChange={(e) => setStartedAt(e.target.value)}
                      required
                    />
                  </div>

                  <div className="admin-field">
                    <label>
                      Waktu Selesai <span className="required">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="admin-input"
                      value={endedAt}
                      onChange={(e) => setEndedAt(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Batal
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : editing ? 'Perbarui Simposium' : 'Simpan Simposium'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal Delete Confirmation ────────────────────────────────────── */}
      {deleteModalOpen && deleteTarget && (
        <div className="admin-modal-overlay" onClick={() => setDeleteModalOpen(false)}>
          <div className="admin-modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-body admin-delete-confirm">
              <div className="admin-delete-icon">⚠️</div>
              <h3 className="admin-delete-title">Hapus Simposium?</h3>
              <p className="admin-delete-message">
                Apakah Anda yakin ingin menghapus data simposium{' '}
                <strong style={{ color: 'var(--admin-text)' }}>"{deleteTarget.title}"</strong>? Data ini akan dihapus
                secara permanen.
              </p>
            </div>
            <div className="admin-modal-footer" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
              >
                Batal
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
