import { useState, useEffect, useMemo, type FormEvent, type ChangeEvent } from 'react';
import {
  getKalbeRewards,
  createKalbeReward,
  updateKalbeReward,
  deleteKalbeReward,
  getKalbeSymposiums,
  getKalbeBooths,
  isBrandUser,
  type KalbeRewardResponse,
  type KalbeRewardType,
  type KalbeSymposiumResponse,
  type KalbeBoothResponse,
} from './adminApi';
import { useToast } from '../context/ToastContext';

export function RewardsPage() {
  const { showToast } = useToast();
  const isBrand = isBrandUser();

  const [rewards, setRewards] = useState<KalbeRewardResponse[]>([]);
  const [symposiums, setSymposiums] = useState<KalbeSymposiumResponse[]>([]);
  const [booths, setBooths] = useState<KalbeBoothResponse[]>([]);
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
  const [boothId, setBoothId] = useState('');
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

  const fetchBooths = async () => {
    try {
      const res = await getKalbeBooths({ limit: 100 });
      setBooths(res.data || []);
    } catch (err) {
      console.error('Failed to load booths:', err);
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
    fetchBooths();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchRewards();
    }, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, typeFilter, statusFilter]);

  const openCreate = () => {
    if (isBrand) return;
    setEditing(null);
    setName('');
    setRewardType('booth');
    setSymposiumId('');
    setBoothId('');
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
    setBoothId(reward.booth_id || '');
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
          booth_id: rewardType === 'booth' && boothId ? boothId : null,
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
          booth_id: rewardType === 'booth' && boothId ? boothId : null,
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

  const getBoothName = (reward: KalbeRewardResponse) => {
    if (reward.booth?.name) return reward.booth.name;
    if (reward.booth_id) {
      const match = booths.find((b) => b.id === reward.booth_id);
      if (match) return match.name;
      return reward.booth_id;
    }
    return null;
  };

  const stats = useMemo(() => {
    const total = rewards.length;
    const booth = rewards.filter((r) => r.reward_type === 'booth').length;
    const symposium = rewards.filter((r) => r.reward_type === 'symposium').length;
    const totalStock = rewards.reduce((acc, r) => acc + (r.stock || 0), 0);
    return { total, booth, symposium, totalStock };
  }, [rewards]);

  return (
    <div>
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Rewards Merchandise</h1>
          <p className="admin-page-subtitle">
            Kelola inventaris hadiah merchandise untuk booth dan simposium, kuota stok, serta gambar merchandise.
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
              placeholder="Cari nama reward..."
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
              Tambah Reward
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Rewards</span>
            <div className="admin-stat-icon-wrapper admin-stat-icon-primary">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 12 20 22 4 22 4 12" />
                <rect x="2" y="7" width="20" height="5" />
                <line x1="12" y1="22" x2="12" y2="7" />
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
              </svg>
            </div>
          </div>
          <div className="admin-stat-value">{stats.total}</div>
          <div className="admin-stat-sub">Item reward terdaftar</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Booth Rewards</span>
            <div className="admin-stat-icon-wrapper admin-stat-icon-info">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
          </div>
          <div className="admin-stat-value">{stats.booth}</div>
          <div className="admin-stat-sub">Hadiah booth detailing</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Symposium Rewards</span>
            <div className="admin-stat-icon-wrapper admin-stat-icon-warning">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
          </div>
          <div className="admin-stat-value">{stats.symposium}</div>
          <div className="admin-stat-sub">Hadiah post-test simposium</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Stok Tersedia</span>
            <div className="admin-stat-icon-wrapper admin-stat-icon-success">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 12v10" />
              </svg>
            </div>
          </div>
          <div className="admin-stat-value">{stats.totalStock}</div>
          <div className="admin-stat-sub">Unit merchandise aktif</div>
        </div>
      </div>

      {/* Filter Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-secondary)' }}>
            Tipe Reward:
          </span>
          <div className="admin-tabs">
            <button
              type="button"
              className={`admin-tab-btn ${typeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setTypeFilter('all')}
            >
              Semua
            </button>
            <button
              type="button"
              className={`admin-tab-btn ${typeFilter === 'booth' ? 'active' : ''}`}
              onClick={() => setTypeFilter('booth')}
            >
              🎪 Booth
            </button>
            <button
              type="button"
              className={`admin-tab-btn ${typeFilter === 'symposium' ? 'active' : ''}`}
              onClick={() => setTypeFilter('symposium')}
            >
              🎓 Symposium
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
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
                <th style={{ width: 180 }}>Target Terkait</th>
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
                          <span style={{ fontWeight: 600 }}>🎓 Simposium:</span> {getSymposiumName(reward)}
                        </div>
                      ) : reward.reward_type === 'booth' ? (
                        <div style={{ fontSize: 13, color: 'var(--admin-text)' }}>
                          {getBoothName(reward) ? (
                            <>
                              <span style={{ fontWeight: 600, color: 'var(--admin-primary-light)' }}>🎪 Booth:</span>{' '}
                              {getBoothName(reward)}
                            </>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                              Semua Booth (Umum)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>-</span>
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

            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                <div className="admin-field">
                  <label>
                    Nama Reward <span className="required">*</span>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 16 }}>
                  <div className="admin-field">
                    <label>
                      Tipe Reward <span className="required">*</span>
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

                  <div className="admin-field">
                    <label>
                      Stok Kuota <span className="required">*</span>
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
                  <div className="admin-field">
                    <label>
                      Target Simposium <span className="required">*</span>
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
                    <span style={{ color: 'var(--admin-text-muted)', fontSize: 11.5, marginTop: 2 }}>
                      Satu simposium hanya dapat memiliki satu reward merchandise terkait.
                    </span>
                  </div>
                )}

                {rewardType === 'booth' && (
                  <div className="admin-field">
                    <label>
                      Pilih Booth Terkait <span style={{ color: 'var(--admin-text-muted)', fontWeight: 'normal' }}>(Opsional)</span>
                    </label>
                    <select
                      className="admin-select"
                      value={boothId}
                      onChange={(e) => setBoothId(e.target.value)}
                    >
                      <option value="">-- Semua / Umum (Tanpa Spesifik Booth) --</option>
                      {booths.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.is_active ? 'Aktif' : 'Non-Aktif'})
                        </option>
                      ))}
                    </select>
                    <span style={{ color: 'var(--admin-text-muted)', fontSize: 11.5, marginTop: 2 }}>
                      Pilih booth jika reward merchandise ini hanya khusus dibagikan setelah scan booth terkait.
                    </span>
                  </div>
                )}

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
                            backgroundColor: 'var(--admin-danger)',
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
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        transition: 'all var(--admin-transition)',
                        color: 'var(--admin-text-secondary)',
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>
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
