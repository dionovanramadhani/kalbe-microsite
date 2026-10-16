import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import {
  getKalbeBooths,
  createKalbeBooth,
  updateKalbeBooth,
  deleteKalbeBooth,
  isBrandUser,
  type KalbeBoothResponse,
  type KalbeBoothFormValues,
} from './adminApi';
import { useToast } from '../context/ToastContext';
import { decodeQrFromFile } from '../utils/qrDecoder';

export function BoothsPage() {
  const { showToast } = useToast();
  const isBrand = isBrandUser();

  const [booths, setBooths] = useState<KalbeBoothResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<KalbeBoothResponse | null>(null);
  const [editing, setEditing] = useState<KalbeBoothResponse | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [detailingTitle, setDetailingTitle] = useState('');
  const [detailingDescription, setDetailingDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isRecordHistory, setIsRecordHistory] = useState(true);

  // File uploads & previews
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string>('');

  const [imageTitleFile, setImageTitleFile] = useState<File | null>(null);
  const [imageTitlePreview, setImageTitlePreview] = useState<string>('');

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('');

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [qrCodePreview, setQrCodePreview] = useState<string>('');
  const [qrCodeContent, setQrCodeContent] = useState<string>('');

  const fetchBooths = async () => {
    setLoading(true);
    try {
      const activeParam =
        statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined;
      const res = await getKalbeBooths({
        search: search.trim() || undefined,
        is_active: activeParam,
      });
      setBooths(res.data || []);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal memuat daftar booth');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchBooths();
    }, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const openCreate = () => {
    if (isBrand) return;
    setEditing(null);
    setName('');
    setDetailingTitle('');
    setDetailingDescription('');
    setIsActive(true);
    setIsRecordHistory(true);

    setIconFile(null);
    setIconPreview('');
    setImageTitleFile(null);
    setImageTitlePreview('');
    setBannerFile(null);
    setBannerPreview('');
    setLogoFile(null);
    setLogoPreview('');
    setQrCodeFile(null);
    setQrCodePreview('');
    setQrCodeContent('');

    setModalOpen(true);
  };

  const openEdit = (booth: KalbeBoothResponse) => {
    if (isBrand) return;
    setEditing(booth);
    setName(booth.name);
    setDetailingTitle(booth.detailing_title);
    setDetailingDescription(booth.detailing_description);
    setIsActive(booth.is_active);
    setIsRecordHistory(booth.is_record_history !== false);

    setIconFile(null);
    setIconPreview(booth.icon || '');
    setImageTitleFile(null);
    setImageTitlePreview(booth.image_title || '');
    setBannerFile(null);
    setBannerPreview(booth.detailing_banner || '');
    setLogoFile(null);
    setLogoPreview(booth.logo || '');
    setQrCodeFile(null);
    setQrCodePreview(booth.qr_code || '');
    setQrCodeContent(booth.qr_code_content || '');

    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void,
    setPreview: (url: string) => void
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleQrFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setQrCodeFile(file);
      setQrCodePreview(URL.createObjectURL(file));
      const decoded = await decodeQrFromFile(file);
      if (decoded) {
        setQrCodeContent(decoded);
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isBrand) return;

    if (!name.trim()) {
      showToast('error', 'Nama booth wajib diisi');
      return;
    }
    if (!detailingTitle.trim()) {
      showToast('error', 'Detailing title wajib diisi');
      return;
    }
    if (!detailingDescription.trim()) {
      showToast('error', 'Detailing description wajib diisi');
      return;
    }

    setSaving(true);
    try {
      const payload: KalbeBoothFormValues = {
        name: name.trim(),
        detailing_title: detailingTitle.trim(),
        detailing_description: detailingDescription.trim(),
        is_active: isActive,
        is_record_history: isRecordHistory,
        iconFile,
        imageTitleFile,
        detailingBannerFile: bannerFile,
        logoFile,
        qrCodeFile,
        qr_code_content: qrCodeContent || (editing ? (editing.qr_code_content || undefined) : undefined),
        iconUrl: !iconFile && editing ? (editing.icon || '') : undefined,
        imageTitleUrl: !imageTitleFile && editing ? (editing.image_title || '') : undefined,
        detailingBannerUrl: !bannerFile && editing ? (editing.detailing_banner || '') : undefined,
        logoUrl: !logoFile && editing ? (editing.logo || '') : undefined,
        qrCodeUrl: !qrCodeFile && editing ? (editing.qr_code || '') : undefined,
      };

      if (editing) {
        await updateKalbeBooth(editing.id, payload);
        showToast('success', `Booth "${name}" berhasil diperbarui`);
      } else {
        await createKalbeBooth(payload);
        showToast('success', `Booth "${name}" berhasil ditambahkan`);
      }
      closeModal();
      fetchBooths();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal menyimpan booth');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal || isBrand) return;
    setSaving(true);
    try {
      await deleteKalbeBooth(deleteModal.id);
      showToast('success', `Booth "${deleteModal.name}" berhasil dihapus`);
      setDeleteModal(null);
      fetchBooths();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal menghapus booth');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Booths Management</h1>
          <p className="admin-page-subtitle">Kelola booth interaktif, materi detailing, dan status aktif kegiatan</p>
        </div>
        <div className="admin-page-actions">
          <div className="admin-search-wrapper">
            <svg className="admin-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="admin-search-input"
              placeholder="Cari nama booth / detailing..."
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
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Tambah Booth
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Booths</span>
            <div className="admin-stat-icon-wrapper admin-stat-icon-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
          </div>
          <div className="admin-stat-value">{booths.length}</div>
          <div className="admin-stat-footer">
            <span>🏪</span> Jumlah total booth yang terdaftar
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Booth Aktif</span>
            <div className="admin-stat-icon-wrapper admin-stat-icon-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 14 14" />
              </svg>
            </div>
          </div>
          <div className="admin-stat-value success">{booths.filter((b) => b.is_active).length}</div>
          <div className="admin-stat-footer">
            <span>✓</span> Booth aktif yang wajib dikunjungi peserta
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Booth Nonaktif</span>
            <div className="admin-stat-icon-wrapper admin-stat-icon-info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
          </div>
          <div className="admin-stat-value">{booths.filter((b) => !b.is_active).length}</div>
          <div className="admin-stat-footer">
            <span>⏸️</span> Booth tidak aktif / dalam persiapan
          </div>
        </div>
      </div>

      {/* Booth Table */}
      <div className="admin-table-container">
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
            <span className="admin-spinner-ring" style={{ width: 32, height: 32, borderWidth: 3 }} />
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Media</th>
                <th>Nama Booth</th>
                <th>Detailing Title</th>
                <th>Status</th>
                <th>Record History</th>
                <th>Dibuat Pada</th>
                {!isBrand && <th style={{ width: 120, textAlign: 'center' }}>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {booths.length === 0 ? (
                <tr>
                  <td colSpan={isBrand ? 6 : 7} className="admin-table-empty">
                    <div className="admin-table-empty-icon">🏪</div>
                    <div className="admin-table-empty-text">
                      {search ? 'Tidak ada booth yang cocok dengan pencarian' : 'Belum ada booth yang terdaftar.'}
                    </div>
                  </td>
                </tr>
              ) : (
                booths.map((booth) => (
                  <tr key={booth.id}>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {booth.icon ? (
                          <img
                            src={booth.icon}
                            alt={`${booth.name} Icon`}
                            title="Icon"
                            style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'contain', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--admin-border)' }}
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        ) : null}
                        {booth.logo ? (
                          <img
                            src={booth.logo}
                            alt={`${booth.name} Logo`}
                            title="Logo"
                            style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'contain', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--admin-border)' }}
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        ) : null}
                        {!booth.icon && !booth.logo && (
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--admin-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                            🏪
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="primary">
                      <div style={{ fontWeight: 600 }}>{booth.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>ID: {booth.id.substring(0, 8)}...</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--admin-text)' }}>{booth.detailing_title}</div>
                      <div style={{ fontSize: 12, color: 'var(--admin-text-secondary)', maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {booth.detailing_description}
                      </div>
                    </td>
                    <td>
                      {booth.is_active ? (
                        <span className="admin-badge admin-badge-success">Aktif</span>
                      ) : (
                        <span className="admin-badge admin-badge-neutral">Nonaktif</span>
                      )}
                    </td>
                    <td>
                      {booth.is_record_history !== false ? (
                        <span className="admin-badge admin-badge-success" title="Mencatat history dan reward saat check-in">Ya</span>
                      ) : (
                        <span className="admin-badge admin-badge-neutral" title="Tidak mencatat riwayat perolehan reward">Tidak</span>
                      )}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>
                      {new Date(booth.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    {!isBrand && (
                      <td>
                        <div className="admin-table-actions" style={{ justifyContent: 'center' }}>
                          <button
                            className="admin-btn admin-btn-ghost admin-btn-sm"
                            title="Edit Booth"
                            onClick={() => openEdit(booth)}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            title="Hapus Booth"
                            onClick={() => setDeleteModal(booth)}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
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

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal wide" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">{editing ? 'Edit Data Booth' : 'Tambah Booth Baru'}</h3>
              <button className="admin-modal-close" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                {/* Booth Name, Is Active & Record History */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
                  <div className="admin-field">
                    <label>
                      Nama Booth <span className="required">*</span>
                    </label>
                    <input
                      className="admin-input"
                      placeholder="Contoh: Kalbe Nutritionals Booth"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="admin-field">
                    <label>Status Booth</label>
                    <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: 10 }}>
                      <input
                        type="checkbox"
                        id="is_active_checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        style={{ width: 18, height: 18, accentColor: 'var(--admin-primary-light)', cursor: 'pointer' }}
                      />
                      <label htmlFor="is_active_checkbox" style={{ cursor: 'pointer', margin: 0 }}>
                        {isActive ? 'Aktif' : 'Nonaktif'}
                      </label>
                    </div>
                  </div>

                  <div className="admin-field">
                    <label title="Apakah kunjungan ke booth ini dicatat ke riwayat user untuk klaim reward">Record History</label>
                    <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: 10 }}>
                      <input
                        type="checkbox"
                        id="is_record_history_checkbox"
                        checked={isRecordHistory}
                        onChange={(e) => setIsRecordHistory(e.target.checked)}
                        style={{ width: 18, height: 18, accentColor: 'var(--admin-primary-light)', cursor: 'pointer' }}
                      />
                      <label htmlFor="is_record_history_checkbox" style={{ cursor: 'pointer', margin: 0 }}>
                        {isRecordHistory ? 'Ya' : 'Tidak'}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Detailing Title */}
                <div className="admin-field">
                  <label>
                    Detailing Title <span className="required">*</span>
                  </label>
                  <input
                    className="admin-input"
                    placeholder="Contoh: Product Knowledge & Scientific Overview"
                    value={detailingTitle}
                    onChange={(e) => setDetailingTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Detailing Description */}
                <div className="admin-field">
                  <label>
                    Detailing Description <span className="required">*</span>
                  </label>
                  <textarea
                    className="admin-textarea"
                    rows={4}
                    placeholder="Deskripsi detail seputar booth, aktivitas interaktif, dan informasi medis..."
                    value={detailingDescription}
                    onChange={(e) => setDetailingDescription(e.target.value)}
                    required
                  />
                </div>

                {/* Media Uploads Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, borderTop: '1px solid var(--admin-border)', paddingTop: 16 }}>
                  {/* Icon Image */}
                  <div className="admin-field">
                    <label>Icon Booth (Logo / Icon)</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="admin-input"
                      style={{ padding: 8, fontSize: 12 }}
                      onChange={(e) => handleFileChange(e, setIconFile, setIconPreview)}
                    />
                    {iconPreview && (
                      <div style={{ marginTop: 8, textAlign: 'center' }}>
                        <img
                          src={iconPreview}
                          alt="Icon Preview"
                          style={{ height: 48, borderRadius: 6, objectFit: 'contain', background: 'rgba(255, 255, 255, 0.05)', padding: 4 }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Logo Image */}
                  <div className="admin-field">
                    <label>Logo Booth (Brand Logo)</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="admin-input"
                      style={{ padding: 8, fontSize: 12 }}
                      onChange={(e) => handleFileChange(e, setLogoFile, setLogoPreview)}
                    />
                    {logoPreview && (
                      <div style={{ marginTop: 8, textAlign: 'center' }}>
                        <img
                          src={logoPreview}
                          alt="Logo Preview"
                          style={{ height: 48, borderRadius: 6, objectFit: 'contain', background: 'rgba(255, 255, 255, 0.05)', padding: 4 }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Title Image */}
                  <div className="admin-field">
                    <label>Title Image (Branding Header)</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="admin-input"
                      style={{ padding: 8, fontSize: 12 }}
                      onChange={(e) => handleFileChange(e, setImageTitleFile, setImageTitlePreview)}
                    />
                    {imageTitlePreview && (
                      <div style={{ marginTop: 8, textAlign: 'center' }}>
                        <img
                          src={imageTitlePreview}
                          alt="Title Preview"
                          style={{ height: 48, borderRadius: 6, objectFit: 'contain', background: 'rgba(255, 255, 255, 0.05)', padding: 4 }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Detailing Banner */}
                  <div className="admin-field">
                    <label>Detailing Banner (Header Banner)</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="admin-input"
                      style={{ padding: 8, fontSize: 12 }}
                      onChange={(e) => handleFileChange(e, setBannerFile, setBannerPreview)}
                    />
                    {bannerPreview && (
                      <div style={{ marginTop: 8, textAlign: 'center' }}>
                        <img
                          src={bannerPreview}
                          alt="Banner Preview"
                          style={{ height: 48, borderRadius: 6, objectFit: 'cover', width: '100%' }}
                        />
                      </div>
                    )}
                  </div>

                  {/* QR Code Manual */}
                  <div className="admin-field">
                    <label>QR Code (Upload Gambar Manual)</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="admin-input"
                      style={{ padding: 8, fontSize: 12 }}
                      onChange={handleQrFileChange}
                    />
                    {qrCodePreview && (
                      <div style={{ marginTop: 8, textAlign: 'center' }}>
                        <img
                          src={qrCodePreview}
                          alt="QR Code Preview"
                          style={{ height: 64, borderRadius: 6, objectFit: 'contain', background: 'rgba(255, 255, 255, 0.05)', padding: 4 }}
                        />
                        {qrCodeContent && (
                          <div style={{ marginTop: 6, fontSize: 11, color: '#38bdf8' }}>
                            <span>Isi QR: </span>
                            <code style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>
                              {qrCodeContent}
                            </code>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={closeModal}>
                  Batal
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="admin-spinner-ring" style={{ width: 14, height: 14, borderWidth: 2 }} />
                      Menyimpan...
                    </>
                  ) : editing ? (
                    'Simpan Perubahan'
                  ) : (
                    'Tambah Booth'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="admin-modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="admin-modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-body">
              <div className="admin-delete-confirm">
                <div className="admin-delete-icon">⚠️</div>
                <h3 className="admin-delete-title">Hapus Booth?</h3>
                <p className="admin-delete-message">
                  Apakah Anda yakin ingin menghapus booth <strong>"{deleteModal.name}"</strong>? Data aktivitas terkait juga dapat terpengaruh.
                </p>
              </div>
            </div>
            <div className="admin-modal-footer" style={{ justifyContent: 'center' }}>
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
                className="admin-btn admin-btn-danger"
                onClick={handleDelete}
                disabled={saving}
              >
                {saving ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
