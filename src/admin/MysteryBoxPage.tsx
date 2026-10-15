import { useState, useEffect, useMemo, type FormEvent, type ChangeEvent } from 'react';
import {
  getKalbeRewards,
  createKalbeMysteryBoxReward,
  updateKalbeReward,
  deleteKalbeReward,
  isBrandUser,
  type KalbeRewardResponse,
} from './adminApi';
import { useToast } from '../context/ToastContext';

export function MysteryBoxPage() {
  const { showToast } = useToast();
  const isBrand = isBrandUser();

  const [rewards, setRewards] = useState<KalbeRewardResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deleted'>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<KalbeRewardResponse | null>(null);
  const [editing, setEditing] = useState<KalbeRewardResponse | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [stock, setStock] = useState<number>(0);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState<string>('');

  const fetchMysteryBoxRewards = async () => {
    setLoading(true);
    try {
      const isDeletedParam =
        statusFilter === 'active' ? false : statusFilter === 'deleted' ? true : undefined;

      const res = await getKalbeRewards({
        search: search.trim() || undefined,
        reward_type: 'mystery_box',
        is_deleted: isDeletedParam,
      });

      setRewards(res.data || []);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal memuat reward Mystery Box');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchMysteryBoxRewards();
    }, 250);
    return () => clearTimeout(timeout);
  }, [search, statusFilter]);

  const openCreate = () => {
    if (isBrand) return;
    setEditing(null);
    setName('');
    setStock(0);
    setPictureFile(null);
    setPicturePreview('');
    setModalOpen(true);
  };

  const openEdit = (reward: KalbeRewardResponse) => {
    if (isBrand) return;
    setEditing(reward);
    setName(reward.name);
    setStock(reward.stock || 0);
    setPictureFile(null);
    setPicturePreview(reward.picture || '');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPictureFile(file);
      setPicturePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isBrand) return;

    if (!name.trim()) {
      showToast('error', 'Nama reward wajib diisi');
      return;
    }

    if (stock < 0) {
      showToast('error', 'Stok tidak boleh bernilai negatif');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateKalbeReward(editing.id, {
          name: name.trim(),
          reward_type: 'mystery_box',
          stock,
          pictureFile,
          pictureUrl: !pictureFile && picturePreview ? picturePreview : undefined,
        });
        showToast('success', 'Reward Mystery Box berhasil diperbarui');
      } else {
        await createKalbeMysteryBoxReward({
          name: name.trim(),
          stock,
          pictureFile,
        });
        showToast('success', 'Reward Mystery Box baru berhasil ditambahkan');
      }
      closeModal();
      fetchMysteryBoxRewards();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal menyimpan reward Mystery Box');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal || isBrand) return;
    setSaving(true);
    try {
      await deleteKalbeReward(deleteModal.id);
      showToast('success', 'Status reward Mystery Box berhasil diubah');
      setDeleteModal(null);
      fetchMysteryBoxRewards();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal menghapus reward Mystery Box');
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    const total = rewards.length;
    const active = rewards.filter((r) => !r.is_deleted).length;
    const totalStock = rewards.reduce((acc, r) => acc + (r.stock || 0), 0);
    return { total, active, totalStock };
  }, [rewards]);

  return (
    <div>
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Mystery Box Management</h1>
          <p className="admin-page-subtitle">
            Kelola inventaris hadiah eksklusif Mystery Box untuk pengunjung yang menyelesaikan seluruh booth & simposium aktif.
          </p>
        </div>
        <div className="admin-page-actions">
          <div className="admin-search-wrapper">
            <svg
              className="admin-search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="admin-search-input"
              placeholder="Cari reward mystery box..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {!isBrand && (
            <button className="admin-btn admin-btn-primary" onClick={openCreate}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Tambah Mystery Box
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Mystery Box</span>
            <div className="admin-stat-icon-wrapper admin-stat-icon-primary">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 12v10" />
              </svg>
            </div>
          </div>
          <div className="admin-stat-value">{stats.total}</div>
          <div className="admin-stat-sub">Item reward terdaftar</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Stok Tersedia</span>
            <div className="admin-stat-icon-wrapper admin-stat-icon-success">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 12 20 22 4 22 4 12" />
                <rect x="2" y="7" width="20" height="5" />
                <line x1="12" y1="22" x2="12" y2="7" />
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
              </svg>
            </div>
          </div>
          <div className="admin-stat-value">{stats.totalStock}</div>
          <div className="admin-stat-sub">Unit kuota mystery box</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Status Aktif</span>
            <div className="admin-stat-icon-wrapper admin-stat-icon-info">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          </div>
          <div className="admin-stat-value">{stats.active}</div>
          <div className="admin-stat-sub">Reward dapat diklaim user</div>
        </div>
      </div>

      {/* Filter Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 12,
          marginBottom: 18,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-secondary)' }}>
          Status:
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className={`admin-btn admin-btn-sm ${statusFilter === 'all' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            onClick={() => setStatusFilter('all')}
          >
            Semua
          </button>
          <button
            type="button"
            className={`admin-btn admin-btn-sm ${statusFilter === 'active' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            onClick={() => setStatusFilter('active')}
          >
            Aktif
          </button>
          <button
            type="button"
            className={`admin-btn admin-btn-sm ${statusFilter === 'deleted' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            onClick={() => setStatusFilter('deleted')}
          >
            Dihapus
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="admin-table-container">
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 64 }}>Gambar</th>
                <th>Nama Mystery Box</th>
                <th style={{ width: 160 }}>Tipe Reward</th>
                <th style={{ width: 120, textAlign: 'center' }}>Stok Kuota</th>
                <th style={{ width: 120, textAlign: 'center' }}>Status</th>
                {!isBrand && <th style={{ width: 120, textAlign: 'center' }}>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isBrand ? 5 : 6} style={{ textAlign: 'center', padding: 48 }}>
                    <div className="admin-loading-spinner" />
                    <p style={{ marginTop: 12, color: 'var(--admin-text-secondary)', fontSize: 13 }}>
                      Memuat data Mystery Box...
                    </p>
                  </td>
                </tr>
              ) : rewards.length === 0 ? (
                <tr>
                  <td colSpan={isBrand ? 5 : 6} className="admin-table-empty">
                    <div className="admin-table-empty-icon">🎁</div>
                    <div className="admin-table-empty-title">
                      {search || statusFilter !== 'all'
                        ? 'Reward Tidak Ditemukan'
                        : 'Belum Ada Mystery Box'}
                    </div>
                    <div className="admin-table-empty-text">
                      {search || statusFilter !== 'all'
                        ? 'Tidak ada reward yang sesuai dengan filter atau kata kunci pencarian Anda.'
                        : 'Mulai buat reward eksklusif Mystery Box untuk pengunjung yang menyelesaikan semua kegiatan.'}
                    </div>
                    {!isBrand && !search && (
                      <button
                        className="admin-btn admin-btn-primary"
                        style={{ marginTop: 16 }}
                        onClick={openCreate}
                      >
                        + Tambah Mystery Box Sekarang
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                rewards.map((reward) => (
                  <tr key={reward.id}>
                    <td>
                      {reward.picture ? (
                        <img
                          src={reward.picture}
                          alt={reward.name}
                          style={{
                            width: 44,
                            height: 44,
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid var(--admin-border)',
                            background: 'rgba(255, 255, 255, 0.05)',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 18,
                            color: 'var(--admin-text-muted)',
                            border: '1px solid var(--admin-border)',
                          }}
                        >
                          🎁
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--admin-text)', fontSize: 13.5 }}>
                        {reward.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 2 }}>
                        ID: {reward.id}
                      </div>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-warning">
                        ✨ Mystery Box
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: 12,
                          fontWeight: 700,
                          backgroundColor:
                            reward.stock <= 5
                              ? 'var(--admin-danger-subtle)'
                              : 'var(--admin-primary-subtle)',
                          color:
                            reward.stock <= 5
                              ? 'var(--admin-danger)'
                              : 'var(--admin-primary-light)',
                        }}
                      >
                        {reward.stock} pcs
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {reward.is_deleted ? (
                        <span className="admin-badge admin-badge-danger">Dihapus</span>
                      ) : (
                        <span className="admin-badge admin-badge-success">Aktif</span>
                      )}
                    </td>
                    {!isBrand && (
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button
                            className="admin-btn-action admin-btn-action-edit"
                            onClick={() => openEdit(reward)}
                            title="Edit Mystery Box"
                          >
                            ✏️
                          </button>
                          <button
                            className="admin-btn-action admin-btn-action-delete"
                            onClick={() => setDeleteModal(reward)}
                            title={reward.is_deleted ? 'Pulihkan Mystery Box' : 'Hapus Mystery Box'}
                          >
                            {reward.is_deleted ? '🔄' : '🗑️'}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {editing ? 'Edit Mystery Box Reward' : 'Tambah Mystery Box Reward'}
              </h2>
              <button className="admin-modal-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                <div className="admin-field">
                  <label>
                    Nama Mystery Box <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Contoh: Paket Spesial Mystery Box Morinaga"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="admin-field">
                  <label>
                    Stok Kuota <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="admin-input"
                    placeholder="0"
                    value={stock}
                    onChange={(e) => setStock(parseInt(e.target.value, 10) || 0)}
                    required
                  />
                </div>

                <div className="admin-field">
                  <label>Foto / Gambar Merchandise</label>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    {picturePreview ? (
                      <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
                        <img
                          src={picturePreview}
                          alt="Preview"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '10px',
                            border: '1px solid var(--admin-border)',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPictureFile(null);
                            setPicturePreview('');
                          }}
                          style={{
                            position: 'absolute',
                            top: -6,
                            right: -6,
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: 'var(--admin-danger)',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 13,
                            fontWeight: 'bold',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                          }}
                          title="Hapus gambar"
                        >
                          ×
                        </button>
                      </div>
                    ) : null}

                    <label
                      style={{
                        flex: 1,
                        cursor: 'pointer',
                        padding: '12px 16px',
                        background: 'var(--admin-surface)',
                        border: '1px dashed var(--admin-border)',
                        borderRadius: 'var(--admin-radius)',
                        color: 'var(--admin-text-secondary)',
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        transition: 'all var(--admin-transition)',
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span style={{ fontWeight: 500 }}>
                        {picturePreview ? 'Ganti Foto / Gambar' : 'Pilih Foto / Gambar Merchandise'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                  <span style={{ color: 'var(--admin-text-muted)', fontSize: 11.5, marginTop: 2 }}>
                    Format file: JPG, PNG, atau WEBP. Maksimal 5MB.
                  </span>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={closeModal} disabled={saving}>
                  Batal
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <div className="admin-loading-spinner" style={{ width: 14, height: 14 }} />
                      Menyimpan...
                    </>
                  ) : editing ? (
                    'Simpan Perubahan'
                  ) : (
                    'Tambah Reward'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Restore Modal */}
      {deleteModal && (
        <div className="admin-modal-overlay" onClick={() => !saving && setDeleteModal(null)}>
          <div className="admin-modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {deleteModal.is_deleted ? 'Pulihkan Reward Mystery Box' : 'Hapus Reward Mystery Box'}
              </h2>
              <button className="admin-modal-close" onClick={() => !saving && setDeleteModal(null)}>
                ×
              </button>
            </div>

            <div style={{ padding: '16px 0' }}>
              <p style={{ color: 'var(--admin-text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
                {deleteModal.is_deleted
                  ? `Apakah Anda yakin ingin memulihkan reward Mystery Box "${deleteModal.name}"? Reward akan kembali aktif dan dapat diklaim user.`
                  : `Apakah Anda yakin ingin menonaktifkan/menghapus reward Mystery Box "${deleteModal.name}"? Reward tidak akan dapat diklaim selama berstatus dihapus.`}
              </p>
            </div>

            <div className="admin-modal-footer" style={{ padding: '16px 0 0' }}>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setDeleteModal(null)}
                disabled={saving}
              >
                Batal
              </button>
              <button
                type="button"
                className={`admin-btn ${deleteModal.is_deleted ? 'admin-btn-primary' : 'admin-btn-danger'}`}
                onClick={handleDelete}
                disabled={saving}
              >
                {saving
                  ? 'Memproses...'
                  : deleteModal.is_deleted
                  ? 'Ya, Pulihkan'
                  : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
