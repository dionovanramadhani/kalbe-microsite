import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import {
  getKalbeRewards,
  createKalbeReward,
  updateKalbeReward,
  deleteKalbeReward,
  getKalbeSymposiums,
  isBrandUser,
  type KalbeRewardResponse,
  type KalbeRewardType,
  type KalbeSymposiumResponse,
} from './adminApi';
import { useToast } from '../context/ToastContext';

export function RewardsPage() {
  const { showToast } = useToast();
  const isBrand = isBrandUser();

  const [rewards, setRewards] = useState<KalbeRewardResponse[]>([]);
  const [symposiums, setSymposiums] = useState<KalbeSymposiumResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'booth' | 'symposium'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deleted'>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<KalbeRewardResponse | null>(null);
  const [editing, setEditing] = useState<KalbeRewardResponse | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [rewardType, setRewardType] = useState<KalbeRewardType>('booth');
  const [symposiumId, setSymposiumId] = useState('');
  const [stock, setStock] = useState<number>(0);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState<string>('');

  const fetchSymposiums = async () => {
    try {
      const res = await getKalbeSymposiums({ limit: 100 });
      setSymposiums(res.data || []);
    } catch (err) {
      console.error('Failed to load symposiums:', err);
    }
  };

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const isDeletedParam =
        statusFilter === 'active' ? false : statusFilter === 'deleted' ? true : undefined;
      const typeParam = typeFilter === 'all' ? undefined : typeFilter;

      const res = await getKalbeRewards({
        search: search.trim() || undefined,
        reward_type: typeParam,
        is_deleted: isDeletedParam,
      });

      // Filter out mystery_box from this menu since it has its own dedicated menu
      const filtered = (res.data || []).filter((r) => r.reward_type !== 'mystery_box');
      setRewards(filtered);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal memuat daftar reward merchandise');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSymposiums();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchRewards();
    }, 250);
    return () => clearTimeout(timeout);
  }, [search, typeFilter, statusFilter]);

  const openCreate = () => {
    if (isBrand) return;
    setEditing(null);
    setName('');
    setRewardType('booth');
    setSymposiumId('');
    setStock(0);
    setPictureFile(null);
    setPicturePreview('');
    setModalOpen(true);
  };

  const openEdit = (reward: KalbeRewardResponse) => {
    if (isBrand) return;
    setEditing(reward);
    setName(reward.name);
    setRewardType((reward.reward_type as KalbeRewardType) || 'booth');
    setSymposiumId(reward.symposium_id || '');
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
      showToast('error', 'Stok tidak boleh negatif');
      return;
    }

    if (rewardType === 'symposium' && !symposiumId) {
      showToast('error', 'Pilih simposium untuk reward bertipe symposium');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateKalbeReward(editing.id, {
          name: name.trim(),
          reward_type: rewardType,
          symposium_id: rewardType === 'symposium' ? symposiumId : null,
          stock,
          pictureFile,
          pictureUrl: !pictureFile && picturePreview ? picturePreview : undefined,
        });
        showToast('success', 'Reward merchandise berhasil diperbarui');
      } else {
        await createKalbeReward({
          name: name.trim(),
          reward_type: rewardType,
          symposium_id: rewardType === 'symposium' ? symposiumId : null,
          stock,
          pictureFile,
        });
        showToast('success', 'Reward merchandise berhasil ditambahkan');
      }
      closeModal();
      fetchRewards();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal menyimpan reward');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal || isBrand) return;
    setSaving(true);
    try {
      await deleteKalbeReward(deleteModal.id);
      showToast('success', 'Status reward berhasil diubah (soft delete/restore)');
      setDeleteModal(null);
      fetchRewards();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal menghapus reward');
    } finally {
      setSaving(false);
    }
  };

  const getSymposiumName = (reward: KalbeRewardResponse) => {
    if (reward.symposium?.title) return reward.symposium.title;
    if (reward.symposium_id) {
      const match = symposiums.find((s) => s.id === reward.symposium_id);
      if (match) return match.title;
    }
    return '-';
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Rewards Merchandise</h1>
          <p className="admin-page-subtitle">
            Kelola inventaris hadiah merchandise untuk booth dan simposium, kuota stok, serta gambar merchandise.
          </p>
        </div>
        {!isBrand && (
          <button className="admin-btn admin-btn-primary" onClick={openCreate}>
            <span style={{ fontSize: 16 }}>+</span> Tambah Reward
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="admin-filter-bar">
        <div className="admin-search-wrap">
          <span className="admin-search-icon">🔍</span>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Cari berdasarkan nama reward..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="admin-search-clear" onClick={() => setSearch('')}>
              ×
            </button>
          )}
        </div>

        <div className="admin-filter-tabs">
          <span style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginRight: 4 }}>Tipe:</span>
          <button
            className={`admin-filter-tab ${typeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTypeFilter('all')}
          >
            Semua
          </button>
          <button
            className={`admin-filter-tab ${typeFilter === 'booth' ? 'active' : ''}`}
            onClick={() => setTypeFilter('booth')}
          >
            Booth
          </button>
          <button
            className={`admin-filter-tab ${typeFilter === 'symposium' ? 'active' : ''}`}
            onClick={() => setTypeFilter('symposium')}
          >
            Symposium
          </button>
        </div>

        <div className="admin-filter-tabs">
          <span style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginRight: 4 }}>Status:</span>
          <button
            className={`admin-filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            Semua
          </button>
          <button
            className={`admin-filter-tab ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            Aktif
          </button>
          <button
            className={`admin-filter-tab ${statusFilter === 'deleted' ? 'active' : ''}`}
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
                <th>Nama Reward</th>
                <th style={{ width: 140 }}>Tipe Reward</th>
                <th>Target / Simposium</th>
                <th style={{ width: 100, textAlign: 'center' }}>Stok</th>
                <th style={{ width: 110, textAlign: 'center' }}>Status</th>
                {!isBrand && <th style={{ width: 120, textAlign: 'center' }}>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isBrand ? 6 : 7} style={{ textAlign: 'center', padding: 48 }}>
                    <div className="admin-loading-spinner" />
                    <p style={{ marginTop: 12, color: 'var(--admin-text-secondary)', fontSize: 13 }}>
                      Memuat data reward...
                    </p>
                  </td>
                </tr>
              ) : rewards.length === 0 ? (
                <tr>
                  <td colSpan={isBrand ? 6 : 7} className="admin-table-empty">
                    <div className="admin-table-empty-icon">🎁</div>
                    <div className="admin-table-empty-title">
                      {search || typeFilter !== 'all' || statusFilter !== 'all'
                        ? 'Reward Tidak Ditemukan'
                        : 'Belum Ada Reward Merchandise'}
                    </div>
                    <div className="admin-table-empty-text">
                      {search || typeFilter !== 'all' || statusFilter !== 'all'
                        ? 'Tidak ada reward yang sesuai dengan filter atau kata kunci pencarian Anda.'
                        : 'Mulai buat reward merchandise baru untuk dialokasikan ke booth atau simposium.'}
                    </div>
                    {!isBrand && !search && typeFilter === 'all' && (
                      <button
                        className="admin-btn admin-btn-primary"
                        style={{ marginTop: 16 }}
                        onClick={openCreate}
                      >
                        + Tambah Reward Sekarang
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
                      {reward.reward_type === 'booth' ? (
                        <span className="admin-badge admin-badge-info">🎪 Booth</span>
                      ) : reward.reward_type === 'symposium' ? (
                        <span className="admin-badge admin-badge-warning">🎓 Symposium</span>
                      ) : (
                        <span className="admin-badge admin-badge-neutral">{reward.reward_type}</span>
                      )}
                    </td>
                    <td>
                      {reward.reward_type === 'symposium' ? (
                        <div style={{ fontSize: 13, color: 'var(--admin-text)' }}>
                          {getSymposiumName(reward)}
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                          Koleksi Pengunjung Booth
                        </span>
                      )}
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
                            title="Edit Reward"
                          >
                            ✏️
                          </button>
                          <button
                            className="admin-btn-action admin-btn-action-delete"
                            onClick={() => setDeleteModal(reward)}
                            title={reward.is_deleted ? 'Pulihkan Reward' : 'Hapus Reward'}
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
          <div className="admin-modal" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {editing ? 'Edit Reward Merchandise' : 'Tambah Reward Merchandise'}
              </h2>
              <button className="admin-modal-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="admin-form">
              <div className="admin-form-group">
                <label className="admin-label">
                  Nama Reward <span style={{ color: 'var(--admin-danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="Contoh: Tumbler Exclusive Kalbe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group" style={{ flex: 1 }}>
                  <label className="admin-label">
                    Tipe Reward <span style={{ color: 'var(--admin-danger)' }}>*</span>
                  </label>
                  <select
                    className="admin-select"
                    value={rewardType}
                    onChange={(e) => setRewardType(e.target.value as KalbeRewardType)}
                  >
                    <option value="booth">🎪 Booth Merchandise</option>
                    <option value="symposium">🎓 Symposium Merchandise</option>
                  </select>
                </div>

                <div className="admin-form-group" style={{ width: 140 }}>
                  <label className="admin-label">
                    Stok Kuota <span style={{ color: 'var(--admin-danger)' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="admin-input"
                    value={stock}
                    onChange={(e) => setStock(parseInt(e.target.value, 10) || 0)}
                    required
                  />
                </div>
              </div>

              {rewardType === 'symposium' && (
                <div className="admin-form-group">
                  <label className="admin-label">
                    Target Simposium <span style={{ color: 'var(--admin-danger)' }}>*</span>
                  </label>
                  <select
                    className="admin-select"
                    value={symposiumId}
                    onChange={(e) => setSymposiumId(e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Simposium --</option>
                    {symposiums.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({s.is_active ? 'Aktif' : 'Non-Aktif'})
                      </option>
                    ))}
                  </select>
                  <small style={{ color: 'var(--admin-text-muted)', fontSize: 11.5, marginTop: 4, display: 'block' }}>
                    Satu simposium hanya dapat memiliki satu reward merchandise terkait.
                  </small>
                </div>
              )}

              <div className="admin-form-group">
                <label className="admin-label">Foto / Gambar Merchandise</label>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  {picturePreview ? (
                    <div style={{ position: 'relative' }}>
                      <img
                        src={picturePreview}
                        alt="Preview"
                        style={{
                          width: 64,
                          height: 64,
                          objectFit: 'cover',
                          borderRadius: '8px',
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
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          backgroundColor: 'var(--admin-danger)',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : null}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="admin-file-input"
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah Reward'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Restore Confirmation Modal */}
      {deleteModal && (
        <div className="admin-modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="admin-modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {deleteModal.is_deleted ? 'Pulihkan Reward' : 'Hapus Reward'}
              </h2>
              <button className="admin-modal-close" onClick={() => setDeleteModal(null)}>
                ×
              </button>
            </div>
            <div style={{ padding: '16px 20px', color: 'var(--admin-text-secondary)', fontSize: 14 }}>
              {deleteModal.is_deleted ? (
                <p>
                  Apakah Anda yakin ingin memulihkan reward <strong>{deleteModal.name}</strong>?
                </p>
              ) : (
                <p>
                  Apakah Anda yakin ingin menghapus reward <strong>{deleteModal.name}</strong>? Tindakan
                  ini akan menonaktifkan reward dari sistem penukaran peserta.
                </p>
              )}
            </div>
            <div className="admin-modal-footer">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => setDeleteModal(null)}
                disabled={saving}
              >
                Batal
              </button>
              <button
                className={`admin-btn ${deleteModal.is_deleted ? 'admin-btn-primary' : 'admin-btn-danger'}`}
                onClick={handleDelete}
                disabled={saving}
              >
                {saving ? 'Memproses...' : deleteModal.is_deleted ? 'Ya, Pulihkan' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
