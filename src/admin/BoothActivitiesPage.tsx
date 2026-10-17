import { useState, useEffect, useMemo, type FormEvent } from 'react';
import {
  getKalbeBooths,
  getKalbeBoothActivities,
  createKalbeBoothActivity,
  updateKalbeBoothActivity,
  deleteKalbeBoothActivity,
  getKalbeBoothPodcasts,
  createKalbeBoothPodcast,
  updateKalbeBoothPodcast,
  deleteKalbeBoothPodcast,
  uploadKalbeMedia,
  isBrandUser,
  type KalbeBoothResponse,
  type KalbeBoothActivityResponse,
  type KalbeBoothActivityRequest,
  type KalbeBoothPodcastResponse,
  type KalbeBoothPodcastRequest,
} from './adminApi';
import { useToast } from '../context/ToastContext';

interface ActivityItemDraft {
  name: string;
  order: number;
  description: string;
  activity_image: string;
  imageFile?: File | null;
  imagePreview?: string;
  speaker: string;
  start_at: string;
  end_at: string;
}

interface PodcastSessionDraft {
  speaker: string;
  start_at: string;
  end_at: string;
}

type ActiveTab = 'activities' | 'podcasts';

export function BoothActivitiesPage() {
  const { showToast } = useToast();
  const isBrand = isBrandUser();

  const [activeTab, setActiveTab] = useState<ActiveTab>('activities');

  // Master Booths for Reference Dropdown
  const [booths, setBooths] = useState<KalbeBoothResponse[]>([]);

  // Activities Data
  const [activities, setActivities] = useState<KalbeBoothActivityResponse[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Podcasts Data
  const [podcasts, setPodcasts] = useState<KalbeBoothPodcastResponse[]>([]);
  const [loadingPodcasts, setLoadingPodcasts] = useState(false);

  // Filters & Search
  const [activitySearch, setActivitySearch] = useState('');
  const [podcastSearch, setPodcastSearch] = useState('');
  const [selectedBoothFilter, setSelectedBoothFilter] = useState('all');

  // Activity Modal State
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<KalbeBoothActivityResponse | null>(null);
  const [activityName, setActivityName] = useState('');
  const [activityRefId, setActivityRefId] = useState('');
  const [activityItems, setActivityItems] = useState<ActivityItemDraft[]>([]);
  const [savingActivity, setSavingActivity] = useState(false);

  // Podcast Modal State
  const [podcastModalOpen, setPodcastModalOpen] = useState(false);
  const [editingPodcast, setEditingPodcast] = useState<KalbeBoothPodcastResponse | null>(null);
  const [podcastName, setPodcastName] = useState('');
  const [podcastTopic, setPodcastTopic] = useState('');
  const [podcastRefId, setPodcastRefId] = useState('');
  const [podcastSessions, setPodcastSessions] = useState<PodcastSessionDraft[]>([]);
  const [savingPodcast, setSavingPodcast] = useState(false);

  // Delete Confirmation State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'activity' | 'podcast'; id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load Booths
  const fetchBooths = async () => {
    try {
      const res = await getKalbeBooths({ limit: 100 });
      if (res.data) {
        setBooths(res.data);
      }
    } catch {
      showToast('error', 'Gagal memuat data master booth');
    }
  };

  // Load Activities
  const fetchActivities = async () => {
    setLoadingActivities(true);
    try {
      const res = await getKalbeBoothActivities({ limit: 100 });
      if (res.data) {
        setActivities(res.data);
      }
    } catch {
      showToast('error', 'Gagal memuat data booth activities');
    } finally {
      setLoadingActivities(false);
    }
  };

  // Load Podcasts
  const fetchPodcasts = async () => {
    setLoadingPodcasts(true);
    try {
      const res = await getKalbeBoothPodcasts({ limit: 100 });
      if (res.data) {
        setPodcasts(res.data);
      }
    } catch {
      showToast('error', 'Gagal memuat data booth podcasts');
    } finally {
      setLoadingPodcasts(false);
    }
  };

  useEffect(() => {
    fetchBooths();
    fetchActivities();
    fetchPodcasts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Booth lookup map for quick name resolution
  const boothMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of booths) {
      map.set(b.id, b.name);
    }
    return map;
  }, [booths]);

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const matchesSearch =
        act.name.toLowerCase().includes(activitySearch.toLowerCase()) ||
        (boothMap.get(act.ref_id) || '').toLowerCase().includes(activitySearch.toLowerCase());
      const matchesBooth = selectedBoothFilter === 'all' || act.ref_id === selectedBoothFilter;
      return matchesSearch && matchesBooth;
    });
  }, [activities, activitySearch, selectedBoothFilter, boothMap]);

  // Filtered Podcasts
  const filteredPodcasts = useMemo(() => {
    return podcasts.filter((pod) => {
      const matchesSearch =
        pod.name.toLowerCase().includes(podcastSearch.toLowerCase()) ||
        (pod.topic || '').toLowerCase().includes(podcastSearch.toLowerCase()) ||
        (boothMap.get(pod.ref_id) || '').toLowerCase().includes(podcastSearch.toLowerCase()) ||
        (pod.sessions || []).some((s) => s.speaker.toLowerCase().includes(podcastSearch.toLowerCase()));
      const matchesBooth = selectedBoothFilter === 'all' || pod.ref_id === selectedBoothFilter;
      return matchesSearch && matchesBooth;
    });
  }, [podcasts, podcastSearch, selectedBoothFilter, boothMap]);

  // Helper to convert ISO string to datetime-local string (YYYY-MM-DDTHH:mm)
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

  // ─── Activity Handlers ──────────────────────────────────────────────────────

  const openCreateActivity = () => {
    setEditingActivity(null);
    setActivityName('');
    setActivityRefId(booths.length > 0 ? booths[0].id : '');
    setActivityItems([
      {
        name: '',
        order: 1,
        description: '',
        activity_image: '',
        imageFile: null,
        imagePreview: '',
        speaker: '',
        start_at: '',
        end_at: '',
      },
    ]);
    setActivityModalOpen(true);
  };

  const openEditActivity = (act: KalbeBoothActivityResponse) => {
    setEditingActivity(act);
    setActivityName(act.name);
    setActivityRefId(act.ref_id);
    setActivityItems(
      act.activity_items && act.activity_items.length > 0
        ? act.activity_items.map((item, idx) => ({
            name: item.name,
            order: item.order || idx + 1,
            description: item.description || '',
            activity_image: item.activity_image || '',
            imageFile: null,
            imagePreview: item.activity_image || '',
            speaker: item.speaker || '',
            start_at: toLocalInputValue(item.start_at || ''),
            end_at: toLocalInputValue(item.end_at || ''),
          }))
        : [
            {
              name: '',
              order: 1,
              description: '',
              activity_image: '',
              imageFile: null,
              imagePreview: '',
              speaker: '',
              start_at: '',
              end_at: '',
            },
          ]
    );
    setActivityModalOpen(true);
  };

  const handleAddActivityItem = () => {
    setActivityItems((prev) => [
      ...prev,
      {
        name: '',
        order: prev.length + 1,
        description: '',
        activity_image: '',
        imageFile: null,
        imagePreview: '',
        speaker: '',
        start_at: '',
        end_at: '',
      },
    ]);
  };

  const handleRemoveActivityItem = (index: number) => {
    setActivityItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      setActivityItems((prev) =>
        prev.map((item, i) =>
          i === index
            ? { ...item, imageFile: file, imagePreview: preview }
            : item
        )
      );
    }
  };

  const handleRemoveItemFile = (index: number) => {
    setActivityItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, imageFile: null, imagePreview: '', activity_image: '' }
          : item
      )
    );
  };

  const handleUpdateActivityItem = (
    index: number,
    field: keyof ActivityItemDraft,
    val: string | number
  ) => {
    setActivityItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    );
  };

  const handleActivitySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!activityName.trim()) {
      showToast('error', 'Nama Activity wajib diisi');
      return;
    }
    if (!activityRefId) {
      showToast('error', 'Pilih Booth terlebih dahulu');
      return;
    }

    setSavingActivity(true);
    try {
      // Upload any new image files first
      const itemsWithUploadedImages = await Promise.all(
        activityItems.map(async (item) => {
          let imageUrl = item.activity_image;
          if (item.imageFile) {
            const uploadRes = await uploadKalbeMedia(item.imageFile);
            if (uploadRes.data?.url) {
              imageUrl = uploadRes.data.url;
            }
          }
          return {
            ...item,
            activity_image: imageUrl,
          };
        })
      );

      const validItems = itemsWithUploadedImages
        .filter((it) => it.name.trim() !== '')
        .map((it, idx) => ({
          name: it.name.trim(),
          order: it.order || idx + 1,
          description: it.description.trim() ? it.description.trim() : null,
          activity_image: it.activity_image && it.activity_image.trim() ? it.activity_image.trim() : null,
          speaker: it.speaker.trim() ? it.speaker.trim() : null,
          start_at: it.start_at ? new Date(it.start_at).toISOString() : null,
          end_at: it.end_at ? new Date(it.end_at).toISOString() : null,
        }));

      const payload: KalbeBoothActivityRequest = {
        name: activityName.trim(),
        ref_id: activityRefId,
        activity_items: validItems,
      };

      if (editingActivity) {
        await updateKalbeBoothActivity(editingActivity.id, payload);
        showToast('success', 'Booth Activity berhasil diperbarui');
      } else {
        await createKalbeBoothActivity(payload);
        showToast('success', 'Booth Activity baru berhasil dibuat');
      }
      setActivityModalOpen(false);
      fetchActivities();
    } catch {
      showToast(
        'error',
        editingActivity ? 'Gagal memperbarui activity' : 'Gagal membuat activity'
      );
    } finally {
      setSavingActivity(false);
    }
  };

  // ─── Podcast Handlers ───────────────────────────────────────────────────────

  const openCreatePodcast = () => {
    setEditingPodcast(null);
    setPodcastName('');
    setPodcastTopic('');
    setPodcastRefId(booths.length > 0 ? booths[0].id : '');
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    setPodcastSessions([
      {
        speaker: '',
        start_at: toLocalInputValue(now.toISOString()),
        end_at: toLocalInputValue(oneHourLater.toISOString()),
      },
    ]);
    setPodcastModalOpen(true);
  };

  const openEditPodcast = (pod: KalbeBoothPodcastResponse) => {
    setEditingPodcast(pod);
    setPodcastName(pod.name);
    setPodcastTopic(pod.topic || '');
    setPodcastRefId(pod.ref_id);
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 3600000);
    setPodcastSessions(
      pod.sessions && pod.sessions.length > 0
        ? pod.sessions.map((sess) => ({
            speaker: sess.speaker,
            start_at: toLocalInputValue(sess.start_at),
            end_at: toLocalInputValue(sess.end_at),
          }))
        : [
            {
              speaker: '',
              start_at: toLocalInputValue(now.toISOString()),
              end_at: toLocalInputValue(oneHourLater.toISOString()),
            },
          ]
    );
    setPodcastModalOpen(true);
  };

  const handleAddPodcastSession = () => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    setPodcastSessions((prev) => [
      ...prev,
      {
        speaker: '',
        start_at: toLocalInputValue(now.toISOString()),
        end_at: toLocalInputValue(oneHourLater.toISOString()),
      },
    ]);
  };

  const handleRemovePodcastSession = (index: number) => {
    setPodcastSessions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePodcastSession = (
    index: number,
    field: keyof PodcastSessionDraft,
    val: string
  ) => {
    setPodcastSessions((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: val } : s))
    );
  };

  const handlePodcastSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!podcastName.trim()) {
      showToast('error', 'Nama Podcast wajib diisi');
      return;
    }
    if (!podcastTopic.trim()) {
      showToast('error', 'Topik Podcast wajib diisi');
      return;
    }
    if (!podcastRefId) {
      showToast('error', 'Pilih Booth terlebih dahulu');
      return;
    }

    const validSessions = podcastSessions
      .filter((s) => s.speaker.trim() !== '' && s.start_at && s.end_at)
      .map((s) => ({
        speaker: s.speaker.trim(),
        start_at: new Date(s.start_at).toISOString(),
        end_at: new Date(s.end_at).toISOString(),
      }));

    const payload: KalbeBoothPodcastRequest = {
      name: podcastName.trim(),
      topic: podcastTopic.trim(),
      ref_id: podcastRefId,
      sessions: validSessions,
    };

    setSavingPodcast(true);
    try {
      if (editingPodcast) {
        await updateKalbeBoothPodcast(editingPodcast.id, payload);
        showToast('success', 'Booth Podcast berhasil diperbarui');
      } else {
        await createKalbeBoothPodcast(payload);
        showToast('success', 'Booth Podcast baru berhasil dibuat');
      }
      setPodcastModalOpen(false);
      fetchPodcasts();
    } catch {
      showToast(
        'error',
        editingPodcast ? 'Gagal memperbarui podcast' : 'Gagal membuat podcast'
      );
    } finally {
      setSavingPodcast(false);
    }
  };

  // ─── Delete Handlers ────────────────────────────────────────────────────────

  const confirmDelete = (type: 'activity' | 'podcast', id: string, name: string) => {
    setDeleteTarget({ type, id, name });
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === 'activity') {
        await deleteKalbeBoothActivity(deleteTarget.id);
        showToast('success', `Activity "${deleteTarget.name}" berhasil dihapus`);
        fetchActivities();
      } else {
        await deleteKalbeBoothPodcast(deleteTarget.id);
        showToast('success', `Podcast "${deleteTarget.name}" berhasil dihapus`);
        fetchPodcasts();
      }
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch {
      showToast('error', `Gagal menghapus ${deleteTarget.type}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-header" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="admin-page-title">Booth Activities & Podcast</h1>
          <p className="admin-page-subtitle">
            Kelola aktivitas interaktif peserta booth serta sesi live podcast dokter di setiap booth
          </p>
        </div>
      </div>

      {/* ─── Top: Full-Width Tabs ────────────────────────────────────────────── */}
      <div style={{ width: '100%', marginBottom: 16 }}>
        <div className="admin-tabs admin-tabs-full">
          <button
            className={`admin-tab-btn ${activeTab === 'activities' ? 'active' : ''}`}
            onClick={() => setActiveTab('activities')}
          >
            🎯 Activities ({activities.length})
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'podcasts' ? 'active' : ''}`}
            onClick={() => setActiveTab('podcasts')}
          >
            🎙️ Podcasts ({podcasts.length})
          </button>
        </div>
      </div>

      {/* ─── Bottom: 25% Dropdown Booth & 25% Button Tambah (Total 50%, Aligned Right) ───── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 16,
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: '0 0 calc(25% - 8px)', minWidth: 200 }}>
          <select
            className="admin-select"
            value={selectedBoothFilter}
            onChange={(e) => setSelectedBoothFilter(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="all">🔍 Filter: Semua Booth</option>
            {booths.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {!isBrand && (
          <div style={{ flex: '0 0 calc(25% - 8px)', minWidth: 200 }}>
            <button
              className="admin-btn admin-btn-primary"
              onClick={activeTab === 'activities' ? openCreateActivity : openCreatePodcast}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {activeTab === 'activities' ? 'Tambah Activity' : 'Tambah Podcast'}
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: BOOTH ACTIVITIES                                                 */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'activities' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                Daftar Booth Activities
                <span className="admin-badge admin-badge-primary" style={{ fontSize: 11 }}>
                  {filteredActivities.length} data
                </span>
              </h2>
              <p style={{ fontSize: 12.5, color: 'var(--admin-text-secondary)', margin: '4px 0 0' }}>
                Daftar misi dan langkah aktivitas interaktif pengunjung pada booth
              </p>
            </div>

            <div className="admin-search-wrapper">
              <svg className="admin-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="admin-search-input"
                placeholder="Cari activity / booth..."
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-table-container">
            {loadingActivities ? (
              <div style={{ padding: 50, textAlign: 'center' }}>
                <div className="admin-spinner-ring" style={{ margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--admin-text-secondary)', fontSize: 13 }}>Memuat booth activities...</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>No</th>
                    <th>Nama Activity</th>
                    <th>Booth Reference</th>
                    <th>Items / Sub-Aktivitas</th>
                    <th>Dibuat Pada</th>
                    {!isBrand && <th style={{ width: 140, textAlign: 'right' }}>Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.length === 0 ? (
                    <tr>
                      <td colSpan={isBrand ? 5 : 6} style={{ textAlign: 'center', padding: 45 }}>
                        <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>🎯</div>
                        <div style={{ color: 'var(--admin-text-secondary)', fontSize: 14 }}>
                          Belum ada aktivitas booth yang ditemukan
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredActivities.map((act, index) => (
                      <tr key={act.id}>
                        <td style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>{index + 1}</td>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{act.name}</span>
                        </td>
                        <td>
                          <span className="admin-badge admin-badge-primary">
                            🏪 {boothMap.get(act.ref_id) || act.booth?.name || 'Booth N/A'}
                          </span>
                        </td>
                        <td>
                          {act.activity_items && act.activity_items.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200, maxWidth: 360 }}>
                              {act.activity_items.map((it, i) => (
                                <div
                                  key={it.id || i}
                                  style={{
                                    fontSize: 12,
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid var(--admin-border)',
                                    padding: '6px 10px',
                                    borderRadius: 6,
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                    <div style={{ fontWeight: 600, color: 'var(--admin-text)' }}>
                                      {it.order ? `${it.order}. ` : ''}{it.name}
                                    </div>
                                    {it.activity_image && (
                                      <a
                                        href={it.activity_image}
                                        target="_blank"
                                        rel="noreferrer"
                                        title="Buka gambar banner"
                                        style={{ display: 'inline-flex' }}
                                      >
                                        <img
                                          src={it.activity_image}
                                          alt={it.name}
                                          style={{
                                            height: 24,
                                            width: 32,
                                            objectFit: 'cover',
                                            borderRadius: 3,
                                            border: '1px solid var(--admin-border)',
                                            flexShrink: 0,
                                          }}
                                        />
                                      </a>
                                    )}
                                  </div>
                                  {it.speaker && (
                                    <div style={{ color: 'var(--admin-primary-light)', fontSize: 11, marginTop: 2 }}>
                                      👨‍⚕️ {it.speaker}
                                    </div>
                                  )}
                                  {(it.start_at || it.end_at) && (
                                    <div style={{ color: 'var(--admin-text-muted)', fontSize: 11, marginTop: 2 }}>
                                      🕒{' '}
                                      {it.start_at
                                        ? new Date(it.start_at).toLocaleTimeString('id-ID', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })
                                        : '-'}{' '}
                                      -{' '}
                                      {it.end_at
                                        ? new Date(it.end_at).toLocaleTimeString('id-ID', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })
                                        : '-'}
                                    </div>
                                  )}
                                  {it.description && (
                                    <div
                                      style={{
                                        color: 'var(--admin-text-secondary)',
                                        fontSize: 11,
                                        marginTop: 2,
                                        lineHeight: 1.3,
                                      }}
                                    >
                                      {it.description}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>- Tidak ada sub-item -</span>
                          )}
                        </td>
                      <td style={{ fontSize: 12.5, color: 'var(--admin-text-secondary)' }}>
                        {new Date(act.created_at).toLocaleDateString('id-ID', {
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
                              onClick={() => openEditActivity(act)}
                              title="Edit Activity"
                            >
                              Edit
                            </button>
                            <button
                              className="admin-btn admin-btn-sm admin-btn-danger"
                              onClick={() => confirmDelete('activity', act.id, act.name)}
                              title="Hapus Activity"
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
      </div>
    )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: BOOTH PODCASTS                                                   */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'podcasts' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                Daftar Booth Podcasts
                <span className="admin-badge admin-badge-primary" style={{ fontSize: 11 }}>
                  {filteredPodcasts.length} data
                </span>
              </h2>
              <p style={{ fontSize: 12.5, color: 'var(--admin-text-secondary)', margin: '4px 0 0' }}>
                Jadwal live talkshow podcast interaktif dokter & praktisi medis
              </p>
            </div>

            <div className="admin-search-wrapper">
              <svg className="admin-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="admin-search-input"
                placeholder="Cari podcast / speaker / booth..."
                value={podcastSearch}
                onChange={(e) => setPodcastSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-table-container">
            {loadingPodcasts ? (
              <div style={{ padding: 50, textAlign: 'center' }}>
                <div className="admin-spinner-ring" style={{ margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--admin-text-secondary)', fontSize: 13 }}>Memuat booth podcasts...</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>No</th>
                    <th>Nama Podcast</th>
                    <th>Topik</th>
                    <th>Booth Reference</th>
                    <th>Sesi & Pembicara</th>
                    <th>Dibuat Pada</th>
                    {!isBrand && <th style={{ width: 140, textAlign: 'right' }}>Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredPodcasts.length === 0 ? (
                    <tr>
                      <td colSpan={isBrand ? 6 : 7} style={{ textAlign: 'center', padding: 45 }}>
                        <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>🎙️</div>
                        <div style={{ color: 'var(--admin-text-secondary)', fontSize: 14 }}>
                          Belum ada podcast booth yang ditemukan
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPodcasts.map((pod, index) => (
                      <tr key={pod.id}>
                        <td style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>{index + 1}</td>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{pod.name}</span>
                        </td>
                        <td>
                          <span style={{ color: 'var(--admin-text-secondary)', fontSize: 13 }}>{pod.topic || '-'}</span>
                        </td>
                        <td>
                          <span className="admin-badge admin-badge-primary">
                            🏪 {boothMap.get(pod.ref_id) || pod.booth?.name || 'Booth N/A'}
                          </span>
                        </td>
                        <td>
                          {pod.sessions && pod.sessions.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {pod.sessions.map((sess, i) => (
                                <div
                                key={sess.id || i}
                                style={{
                                  fontSize: 12,
                                  background: 'rgba(255, 255, 255, 0.04)',
                                  border: '1px solid var(--admin-border)',
                                  padding: '5px 10px',
                                  borderRadius: 4,
                                }}
                              >
                                <div style={{ fontWeight: 600, color: 'var(--admin-text)' }}>
                                  👨‍⚕️ {sess.speaker}
                                </div>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: 11, marginTop: 2 }}>
                                  🕒{' '}
                                  {new Date(sess.start_at).toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}{' '}
                                  -{' '}
                                  {new Date(sess.end_at).toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>- Tidak ada sesi -</span>
                        )}
                      </td>
                      <td style={{ fontSize: 12.5, color: 'var(--admin-text-secondary)' }}>
                        {new Date(pod.created_at).toLocaleDateString('id-ID', {
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
                              onClick={() => openEditPodcast(pod)}
                              title="Edit Podcast"
                            >
                              Edit
                            </button>
                            <button
                              className="admin-btn admin-btn-sm admin-btn-danger"
                              onClick={() => confirmDelete('podcast', pod.id, pod.name)}
                              title="Hapus Podcast"
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
      </div>
    )}

      {/* ─── Modal: Create/Edit Activity ───────────────────────────────────── */}
      {activityModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setActivityModalOpen(false)}>
          <div className="admin-modal wide" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {editingActivity ? 'Edit Booth Activity' : 'Tambah Booth Activity Baru'}
              </h3>
              <button className="admin-modal-close" onClick={() => setActivityModalOpen(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleActivitySubmit}>
              <div className="admin-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="admin-field">
                    <label>
                      Nama Activity <span className="required">*</span>
                    </label>
                    <input
                      className="admin-input"
                      placeholder="Contoh: Interactive Health Games"
                      value={activityName}
                      onChange={(e) => setActivityName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="admin-field">
                    <label>
                      Pilih Booth Terkait <span className="required">*</span>
                    </label>
                    <select
                      className="admin-select"
                      value={activityRefId}
                      onChange={(e) => setActivityRefId(e.target.value)}
                      required
                    >
                      {booths.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sub Activity Items */}
                <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <label style={{ fontWeight: 600, color: 'var(--admin-text)' }}>
                        Items / Langkah Aktivitas
                      </label>
                      <p style={{ fontSize: 12, color: 'var(--admin-text-secondary)', marginTop: 2 }}>
                        Daftar langkah atau misi yang harus dijalani pengunjung pada booth ini
                      </p>
                    </div>
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-secondary"
                      onClick={handleAddActivityItem}
                    >
                      + Tambah Item
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {activityItems.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'var(--admin-surface)',
                          border: '1px solid var(--admin-border)',
                          borderRadius: 'var(--admin-radius)',
                          padding: 12,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-primary-light)' }}>
                            Item #{idx + 1}
                          </span>
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-danger"
                            onClick={() => handleRemoveActivityItem(idx)}
                            disabled={activityItems.length === 1}
                            style={{ padding: '2px 8px' }}
                            title="Hapus baris"
                          >
                            Hapus Item
                          </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12 }}>
                          <div className="admin-field">
                            <label style={{ fontSize: 12 }}>
                              Nama Aktivitas / Misi <span className="required">*</span>
                            </label>
                            <input
                              className="admin-input"
                              style={{ padding: '8px 12px', fontSize: 13 }}
                              placeholder="Contoh: Scan QR & Jawab Pertanyaan"
                              value={item.name}
                              onChange={(e) => handleUpdateActivityItem(idx, 'name', e.target.value)}
                              required
                            />
                          </div>
                          <div className="admin-field">
                            <label style={{ fontSize: 12 }}>Urutan</label>
                            <input
                              type="number"
                              className="admin-input"
                              style={{ padding: '8px 12px', fontSize: 13 }}
                              value={item.order}
                              onChange={(e) =>
                                handleUpdateActivityItem(idx, 'order', parseInt(e.target.value) || idx + 1)
                              }
                            />
                          </div>
                        </div>

                        <div className="admin-field">
                          <label style={{ fontSize: 12 }}>Deskripsi (Opsional)</label>
                          <textarea
                            className="admin-input"
                            rows={2}
                            style={{ padding: '8px 12px', fontSize: 13, resize: 'vertical' }}
                            placeholder="Deskripsi detail kegiatan atau petunjuk untuk peserta"
                            value={item.description}
                            onChange={(e) => handleUpdateActivityItem(idx, 'description', e.target.value)}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div className="admin-field">
                            <label style={{ fontSize: 12 }}>Speaker / Narasumber (Opsional)</label>
                            <input
                              className="admin-input"
                              style={{ padding: '8px 12px', fontSize: 13 }}
                              placeholder="Contoh: dr. Amanda, Sp.GK"
                              value={item.speaker}
                              onChange={(e) => handleUpdateActivityItem(idx, 'speaker', e.target.value)}
                            />
                          </div>

                          <div className="admin-field">
                            <label style={{ fontSize: 12 }}>Banner / Gambar Aktivitas (Opsional)</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <input
                                type="file"
                                accept="image/*"
                                className="admin-input"
                                style={{ padding: '6px 10px', fontSize: 12 }}
                                onChange={(e) => handleItemFileChange(idx, e)}
                              />
                              {item.imagePreview && (
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid var(--admin-border)',
                                    borderRadius: 6,
                                    padding: '6px 10px',
                                  }}
                                >
                                  <img
                                    src={item.imagePreview}
                                    alt="Preview"
                                    style={{
                                      height: 38,
                                      width: 52,
                                      objectFit: 'cover',
                                      borderRadius: 4,
                                      border: '1px solid var(--admin-border)',
                                    }}
                                  />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                      style={{
                                        fontSize: 11.5,
                                        color: 'var(--admin-text)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                      }}
                                    >
                                      {item.imageFile ? item.imageFile.name : 'Gambar saat ini'}
                                    </div>
                                    <div style={{ fontSize: 10.5, color: 'var(--admin-text-muted)' }}>
                                      {item.imageFile
                                        ? `${(item.imageFile.size / 1024).toFixed(1)} KB`
                                        : 'Tersimpan'}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    className="admin-btn admin-btn-sm admin-btn-danger"
                                    style={{ padding: '2px 8px', fontSize: 11 }}
                                    onClick={() => handleRemoveItemFile(idx)}
                                    title="Hapus gambar"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div className="admin-field">
                            <label style={{ fontSize: 12 }}>Waktu Mulai (Opsional)</label>
                            <input
                              type="datetime-local"
                              className="admin-input"
                              style={{ padding: '8px 12px', fontSize: 13 }}
                              value={item.start_at}
                              onChange={(e) => handleUpdateActivityItem(idx, 'start_at', e.target.value)}
                            />
                          </div>

                          <div className="admin-field">
                            <label style={{ fontSize: 12 }}>Waktu Selesai (Opsional)</label>
                            <input
                              type="datetime-local"
                              className="admin-input"
                              style={{ padding: '8px 12px', fontSize: 13 }}
                              value={item.end_at}
                              onChange={(e) => handleUpdateActivityItem(idx, 'end_at', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setActivityModalOpen(false)}
                  disabled={savingActivity}
                >
                  Batal
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={savingActivity}>
                  {savingActivity ? 'Menyimpan...' : editingActivity ? 'Perbarui Activity' : 'Simpan Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal: Create/Edit Podcast ────────────────────────────────────── */}
      {podcastModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setPodcastModalOpen(false)}>
          <div className="admin-modal wide" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {editingPodcast ? 'Edit Booth Podcast' : 'Tambah Booth Podcast Baru'}
              </h3>
              <button className="admin-modal-close" onClick={() => setPodcastModalOpen(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handlePodcastSubmit}>
              <div className="admin-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="admin-field">
                    <label>
                      Nama Podcast <span className="required">*</span>
                    </label>
                    <input
                      className="admin-input"
                      placeholder="Contoh: Moritalks Podcast"
                      value={podcastName}
                      onChange={(e) => setPodcastName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="admin-field">
                    <label>
                      Topik Podcast <span className="required">*</span>
                    </label>
                    <input
                      className="admin-input"
                      placeholder="Contoh: Alergi & Gastro"
                      value={podcastTopic}
                      onChange={(e) => setPodcastTopic(e.target.value)}
                      required
                    />
                  </div>

                  <div className="admin-field" style={{ gridColumn: 'span 2' }}>
                    <label>
                      Pilih Booth Terkait <span className="required">*</span>
                    </label>
                    <select
                      className="admin-select"
                      value={podcastRefId}
                      onChange={(e) => setPodcastRefId(e.target.value)}
                      required
                    >
                      {booths.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Podcast Sessions */}
                <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <label style={{ fontWeight: 600, color: 'var(--admin-text)' }}>
                        Sesi Podcast & Pembicara
                      </label>
                      <p style={{ fontSize: 12, color: 'var(--admin-text-secondary)', marginTop: 2 }}>
                        Atur dokter/ahli pembicara serta rentang jam mulai dan selesai podcast
                      </p>
                    </div>
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-secondary"
                      onClick={handleAddPodcastSession}
                    >
                      + Tambah Sesi
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {podcastSessions.map((sess, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'var(--admin-surface)',
                          border: '1px solid var(--admin-border)',
                          borderRadius: 'var(--admin-radius)',
                          padding: 12,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-primary-light)' }}>
                            Sesi #{idx + 1}
                          </span>
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-danger"
                            onClick={() => handleRemovePodcastSession(idx)}
                            disabled={podcastSessions.length === 1}
                            style={{ padding: '2px 8px' }}
                          >
                            Hapus Sesi
                          </button>
                        </div>

                        <div className="admin-field">
                          <label style={{ fontSize: 12 }}>Nama Pembicara / Dokter</label>
                          <input
                            className="admin-input"
                            style={{ padding: '8px 12px', fontSize: 13 }}
                            placeholder="Contoh: dr. John Doe, Sp.A(K)"
                            value={sess.speaker}
                            onChange={(e) => handleUpdatePodcastSession(idx, 'speaker', e.target.value)}
                            required
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div className="admin-field">
                            <label style={{ fontSize: 12 }}>Waktu Mulai</label>
                            <input
                              type="datetime-local"
                              className="admin-input"
                              style={{ padding: '8px 12px', fontSize: 12 }}
                              value={sess.start_at}
                              onChange={(e) => handleUpdatePodcastSession(idx, 'start_at', e.target.value)}
                              required
                            />
                          </div>
                          <div className="admin-field">
                            <label style={{ fontSize: 12 }}>Waktu Selesai</label>
                            <input
                              type="datetime-local"
                              className="admin-input"
                              style={{ padding: '8px 12px', fontSize: 12 }}
                              value={sess.end_at}
                              onChange={(e) => handleUpdatePodcastSession(idx, 'end_at', e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setPodcastModalOpen(false)}
                  disabled={savingPodcast}
                >
                  Batal
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={savingPodcast}>
                  {savingPodcast ? 'Menyimpan...' : editingPodcast ? 'Perbarui Podcast' : 'Simpan Podcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ────────────────────────────────────── */}
      {deleteModalOpen && deleteTarget && (
        <div className="admin-modal-overlay" onClick={() => setDeleteModalOpen(false)}>
          <div className="admin-modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-body admin-delete-confirm">
              <div className="admin-delete-icon">⚠️</div>
              <h3 className="admin-delete-title">
                Hapus {deleteTarget.type === 'activity' ? 'Activity' : 'Podcast'}?
              </h3>
              <p className="admin-delete-message">
                Apakah Anda yakin ingin menghapus data{' '}
                <strong style={{ color: 'var(--admin-text)' }}>"{deleteTarget.name}"</strong>? Data ini beserta
                sub-item/sesinya akan dihapus secara permanen.
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
