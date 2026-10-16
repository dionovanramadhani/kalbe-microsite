import { useState, useEffect, useMemo, type FormEvent } from 'react';
import {
  getKalbePostTests,
  createKalbePostTest,
  updateKalbePostTest,
  deleteKalbePostTest,
  getKalbeSymposiums,
  isBrandUser,
  type KalbePostTestResponse,
  type KalbePostTestRequest,
  type KalbePostTestQuestionRequest,
  type KalbePostTestQuestionOptionRequest,
  type KalbeSymposiumResponse,
} from './adminApi';
import { useToast } from '../context/ToastContext';

// ─── Defaults & Helpers ─────────────────────────────────────────────────────

const emptyOption: KalbePostTestQuestionOptionRequest = {
  option_text: '',
  is_correct: false,
  order_number: 1,
};

const emptyQuestion: KalbePostTestQuestionRequest = {
  question_text: '',
  question_type: 'single_choice',
  is_required: true,
  order_number: 1,
  options: [
    { option_text: '', is_correct: true, order_number: 1 },
    { option_text: '', is_correct: false, order_number: 2 },
  ],
};

const emptyForm: KalbePostTestRequest = {
  title: '',
  description: '',
  ref_id: '',
  status: true,
  questions: [{ ...emptyQuestion, options: [{ ...emptyOption, is_correct: true, order_number: 1 }, { ...emptyOption, order_number: 2 }] }],
};

export function PostTestsPage() {
  const { showToast } = useToast();
  const isBrand = isBrandUser();

  const [postTests, setPostTests] = useState<KalbePostTestResponse[]>([]);
  const [symposiums, setSymposiums] = useState<KalbeSymposiumResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSymposiums, setLoadingSymposiums] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal Create / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<KalbePostTestResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<KalbePostTestRequest>({ ...emptyForm });

  // Modal Delete
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<KalbePostTestResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Modal Detail View
  const [detailModal, setDetailModal] = useState<KalbePostTestResponse | null>(null);

  // Map Symposium ID to Name
  const symposiumMap = useMemo(() => {
    const map = new Map<string, KalbeSymposiumResponse>();
    symposiums.forEach((s) => map.set(s.id, s));
    return map;
  }, [symposiums]);

  const fetchPostTests = async () => {
    setLoading(true);
    try {
      const res = await getKalbePostTests({ limit: 100 });
      if (res.data) {
        setPostTests(res.data);
      }
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Gagal memuat data post-test');
    } finally {
      setLoading(false);
    }
  };

  const fetchSymposiums = async () => {
    setLoadingSymposiums(true);
    try {
      const res = await getKalbeSymposiums({ limit: 100 });
      if (res.data) {
        setSymposiums(res.data);
      }
    } catch {
      showToast('error', 'Gagal memuat daftar symposium');
    } finally {
      setLoadingSymposiums(false);
    }
  };

  useEffect(() => {
    fetchPostTests();
    fetchSymposiums();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtered List
  const filteredPostTests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return postTests.filter((item) => {
      const sympTitle = (symposiumMap.get(item.ref_id)?.title || '').toLowerCase();
      const matchesSearch =
        !q ||
        (item.title || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        sympTitle.includes(q);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && item.status) ||
        (statusFilter === 'inactive' && !item.status);
      return matchesSearch && matchesStatus;
    });
  }, [postTests, search, statusFilter, symposiumMap]);

  // Stats Counters
  const totalCount = postTests.length;
  const activeCount = useMemo(() => postTests.filter((p) => p.status).length, [postTests]);
  const inactiveCount = totalCount - activeCount;

  // ─── Modal Openers ─────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: '',
      description: '',
      ref_id: symposiums.length > 0 ? symposiums[0].id : '',
      status: true,
      questions: [
        {
          question_text: '',
          question_type: 'single_choice',
          is_required: true,
          order_number: 1,
          options: [
            { option_text: '', is_correct: true, order_number: 1 },
            { option_text: '', is_correct: false, order_number: 2 },
          ],
        },
      ],
    });
    setModalOpen(true);
  };

  const openEdit = (item: KalbePostTestResponse) => {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description || '',
      ref_id: item.ref_id,
      status: item.status,
      questions: item.questions && item.questions.length > 0
        ? item.questions.map((q, qIdx) => ({
            question_text: q.question_text,
            question_type: (q.question_type as 'single_choice' | 'multiple_choice' | 'text') || 'single_choice',
            is_required: q.is_required,
            order_number: q.order_number || qIdx + 1,
            options: q.options && q.options.length > 0
              ? q.options.map((opt, oIdx) => ({
                  option_text: opt.option_text,
                  is_correct: Boolean(opt.is_correct),
                  order_number: opt.order_number || oIdx + 1,
                }))
              : [{ ...emptyOption, is_correct: true, order_number: 1 }],
          }))
        : [{ ...emptyQuestion }],
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
  };

  const openDelete = (item: KalbePostTestResponse) => {
    setDeleteTarget(item);
    setDeleteModalOpen(true);
  };

  const closeDelete = () => {
    if (deleting) return;
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  // ─── Question & Option Manipulation ────────────────────────────────────────

  const addQuestion = () => {
    setForm((prev) => ({
      ...prev,
      questions: [
        ...(prev.questions || []),
        {
          question_text: '',
          question_type: 'single_choice',
          is_required: true,
          order_number: (prev.questions?.length || 0) + 1,
          options: [
            { option_text: '', is_correct: true, order_number: 1 },
            { option_text: '', is_correct: false, order_number: 2 },
          ],
        },
      ],
    }));
  };

  const removeQuestion = (qIdx: number) => {
    setForm((prev) => {
      const nextQuestions = (prev.questions || []).filter((_, idx) => idx !== qIdx);
      return {
        ...prev,
        questions: nextQuestions.map((q, idx) => ({ ...q, order_number: idx + 1 })),
      };
    });
  };

  const updateQuestion = (qIdx: number, updates: Partial<KalbePostTestQuestionRequest>) => {
    setForm((prev) => {
      const nextQuestions = [...(prev.questions || [])];
      nextQuestions[qIdx] = { ...nextQuestions[qIdx], ...updates };
      return { ...prev, questions: nextQuestions };
    });
  };

  const addOption = (qIdx: number) => {
    setForm((prev) => {
      const nextQuestions = [...(prev.questions || [])];
      const currentOpts = nextQuestions[qIdx].options || [];
      nextQuestions[qIdx] = {
        ...nextQuestions[qIdx],
        options: [
          ...currentOpts,
          {
            option_text: '',
            is_correct: false,
            order_number: currentOpts.length + 1,
          },
        ],
      };
      return { ...prev, questions: nextQuestions };
    });
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    setForm((prev) => {
      const nextQuestions = [...(prev.questions || [])];
      const nextOpts = (nextQuestions[qIdx].options || []).filter((_, idx) => idx !== oIdx);
      nextQuestions[qIdx] = {
        ...nextQuestions[qIdx],
        options: nextOpts.map((opt, idx) => ({ ...opt, order_number: idx + 1 })),
      };
      return { ...prev, questions: nextQuestions };
    });
  };

  const updateOption = (
    qIdx: number,
    oIdx: number,
    updates: Partial<KalbePostTestQuestionOptionRequest>
  ) => {
    setForm((prev) => {
      const nextQuestions = [...(prev.questions || [])];
      const nextOpts = [...(nextQuestions[qIdx].options || [])];
      
      // If single_choice and marking correct, unmark others
      if (nextQuestions[qIdx].question_type === 'single_choice' && updates.is_correct) {
        nextOpts.forEach((opt, idx) => {
          if (idx !== oIdx) opt.is_correct = false;
        });
      }

      nextOpts[oIdx] = { ...nextOpts[oIdx], ...updates };
      nextQuestions[qIdx] = { ...nextQuestions[qIdx], options: nextOpts };
      return { ...prev, questions: nextQuestions };
    });
  };

  // ─── Form Submission ───────────────────────────────────────────────────────

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      showToast('error', 'Judul post-test wajib diisi');
      return;
    }
    if (!form.ref_id) {
      showToast('error', 'Silakan pilih simposium terkait');
      return;
    }
    if (!form.questions || form.questions.length === 0) {
      showToast('error', 'Minimal harus terdapat 1 pertanyaan post-test');
      return;
    }

    // Validation for question text & options
    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      if (!q.question_text.trim()) {
        showToast('error', `Teks pertanyaan #${i + 1} tidak boleh kosong`);
        return;
      }
      if (q.question_type !== 'text') {
        if (!q.options || q.options.length < 2) {
          showToast('error', `Pertanyaan #${i + 1} harus memiliki minimal 2 pilihan jawaban`);
          return;
        }
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].option_text.trim()) {
            showToast('error', `Opsi #${j + 1} pada pertanyaan #${i + 1} tidak boleh kosong`);
            return;
          }
        }
        const hasCorrect = q.options.some((o) => o.is_correct);
        if (!hasCorrect) {
          showToast('error', `Pertanyaan #${i + 1} harus memiliki minimal 1 jawaban benar (Correct)`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const payload: KalbePostTestRequest = {
        title: form.title.trim(),
        description: form.description?.trim() || '',
        ref_id: form.ref_id,
        status: Boolean(form.status),
        questions: form.questions.map((q, qIdx) => ({
          question_text: q.question_text.trim(),
          question_type: q.question_type,
          is_required: Boolean(q.is_required),
          order_number: q.order_number || qIdx + 1,
          options: q.question_type === 'text'
            ? []
            : (q.options || []).map((opt, oIdx) => ({
                option_text: opt.option_text.trim(),
                is_correct: Boolean(opt.is_correct),
                order_number: opt.order_number || oIdx + 1,
              })),
        })),
      };

      if (editing) {
        await updateKalbePostTest(editing.id, payload);
        showToast('success', 'Post-test berhasil diperbarui!');
      } else {
        await createKalbePostTest(payload);
        showToast('success', 'Post-test baru berhasil dibuat!');
      }

      setModalOpen(false);
      fetchPostTests();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Gagal menyimpan post-test');
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete Execution ──────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteKalbePostTest(deleteTarget.id);
      showToast('success', `Post-test "${deleteTarget.title}" berhasil dihapus!`);
      closeDelete();
      fetchPostTests();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Gagal menghapus post-test');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Post-Tests Management</h1>
          <p className="admin-page-subtitle">
            Kelola soal evaluasi post-test simposium, kunci jawaban, dan status keaktifan
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
              placeholder="Cari post-test atau simposium..."
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
              Tambah Post-Test
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Post-Tests</span>
            <div className="admin-stat-icon-wrapper admin-stat-icon-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <polyline points="9 14 11 16 15 12" />
              </svg>
            </div>
          </div>
          <div className="admin-stat-value">{totalCount}</div>
          <div className="admin-stat-footer">
            <span>📝</span> Total evaluasi post-test terdaftar
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Post-Test Aktif</span>
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
            <span>🟢</span> Post-test yang sedang dibuka untuk peserta
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Draft / Non-Aktif</span>
            <div className="admin-stat-icon-wrapper admin-stat-icon-warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          </div>
          <div className="admin-stat-value" style={{ color: 'var(--admin-warning)' }}>
            {inactiveCount}
          </div>
          <div className="admin-stat-footer">
            <span>🟡</span> Post-test dalam status draft / ditutup
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="admin-tabs-bar" style={{ marginBottom: 16 }}>
        <button
          className={`admin-tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          Semua ({totalCount})
        </button>
        <button
          className={`admin-tab-btn ${statusFilter === 'active' ? 'active' : ''}`}
          onClick={() => setStatusFilter('active')}
        >
          Aktif ({activeCount})
        </button>
        <button
          className={`admin-tab-btn ${statusFilter === 'inactive' ? 'active' : ''}`}
          onClick={() => setStatusFilter('inactive')}
        >
          Non-Aktif ({inactiveCount})
        </button>
      </div>

      {/* Table Container */}
      <div className="admin-table-container">
        {loading ? (
          <div className="admin-loading-state">
            <div className="admin-spinner-ring" />
            <span style={{ marginTop: 12, color: 'var(--admin-text-secondary)', fontSize: 13.5 }}>
              Memuat data post-test...
            </span>
          </div>
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 48, textAlign: 'center' }}>No</th>
                  <th>Judul Post-Test</th>
                  <th>Simposium Terkait</th>
                  <th style={{ textAlign: 'center', width: 110 }}>Jumlah Soal</th>
                  <th style={{ textAlign: 'center', width: 100 }}>Status</th>
                  <th style={{ width: 150 }}>Tanggal Dibuat</th>
                  {!isBrand && <th style={{ textAlign: 'right', width: 120 }}>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {filteredPostTests.length === 0 ? (
                  <tr>
                    <td colSpan={isBrand ? 6 : 7} className="admin-table-empty">
                      <div className="admin-table-empty-icon">📝</div>
                      <div className="admin-table-empty-title">
                        {search || statusFilter !== 'all' ? 'Post-Test Tidak Ditemukan' : 'Belum Ada Post-Test'}
                      </div>
                      <div className="admin-table-empty-text">
                        {search || statusFilter !== 'all'
                          ? 'Tidak ada post-test yang cocok dengan filter pencarian.'
                          : 'Mulai buat soal post-test untuk simposium dengan menekan tombol Tambah Post-Test.'}
                      </div>
                      {!isBrand && !search && statusFilter === 'all' && (
                        <button
                          className="admin-btn admin-btn-primary admin-btn-sm"
                          onClick={openCreate}
                          style={{ marginTop: 16 }}
                        >
                          + Tambah Post-Test Sekarang
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredPostTests.map((item, idx) => {
                  const symp = symposiumMap.get(item.ref_id);
                  const qCount = item.questions?.length || 0;

                  return (
                    <tr key={item.id}>
                      <td style={{ textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>
                        {idx + 1}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--admin-text)', marginBottom: 2 }}>
                          {item.title}
                        </div>
                        {item.description && (
                          <div
                            style={{
                              fontSize: 12.5,
                              color: 'var(--admin-text-secondary)',
                              maxWidth: 320,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td>
                        {symp ? (
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--admin-text)' }}>
                              {symp.title}
                            </div>
                            <span
                              style={{
                                display: 'inline-block',
                                fontSize: 11,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: 'rgba(59, 130, 246, 0.1)',
                                color: 'var(--admin-info)',
                                marginTop: 3,
                              }}
                            >
                              Symposium
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                            ID: {item.ref_id.slice(0, 8)}...
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: 12,
                            background: 'var(--admin-surface-hover)',
                            fontSize: 12.5,
                          }}
                        >
                          {qCount} Soal
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className={`admin-badge ${item.status ? 'admin-badge-success' : 'admin-badge-danger'}`}
                        >
                          {item.status ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12.5, color: 'var(--admin-text-secondary)' }}>
                        {new Date(item.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            className="admin-btn admin-btn-ghost admin-btn-icon sm"
                            onClick={() => setDetailModal(item)}
                            title="Lihat Detail Soal"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                          {!isBrand && (
                            <>
                              <button
                                className="admin-btn admin-btn-secondary admin-btn-icon sm"
                                onClick={() => openEdit(item)}
                                title="Edit Post-Test"
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button
                                className="admin-btn admin-btn-danger admin-btn-icon sm"
                                onClick={() => openDelete(item)}
                                title="Hapus Post-Test"
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Modal Create / Edit Post-Test ─────────────────────────────────── */}
      {modalOpen && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 840, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {editing ? 'Edit Post-Test Simposium' : 'Buat Post-Test Simposium Baru'}
              </h2>
              <button className="admin-modal-close-btn" onClick={closeModal} aria-label="Tutup">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
              <div className="admin-modal-body" style={{ overflowY: 'auto', flex: 1, paddingRight: 20 }}>
                {/* General Info Fields */}
                <div className="admin-form-grid" style={{ marginBottom: 20 }}>
                  <div className="admin-field full-width">
                    <label>
                      Judul Post-Test <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="Contoh: Post-Test Simposium Tumbuh Kembang Anak"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="admin-field full-width">
                    <label>Deskripsi Post-Test</label>
                    <textarea
                      className="admin-textarea"
                      placeholder="Uraian singkat mengenai ujian atau post-test ini..."
                      rows={2}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>

                  <div className="admin-field">
                    <label>
                      Simposium Terkait <span className="required">*</span>
                    </label>
                    <select
                      className="admin-select"
                      value={form.ref_id}
                      onChange={(e) => setForm({ ...form, ref_id: e.target.value })}
                      required
                      disabled={loadingSymposiums}
                    >
                      <option value="">{loadingSymposiums ? 'Memuat simposium...' : '-- Pilih Simposium --'}</option>
                      {symposiums.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title} {s.is_active ? '(Aktif)' : '(Non-Aktif)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-field">
                    <label>Status Keaktifan</label>
                    <select
                      className="admin-select"
                      value={form.status ? 'true' : 'false'}
                      onChange={(e) => setForm({ ...form, status: e.target.value === 'true' })}
                    >
                      <option value="true">Aktif (Dapat Dikerjakan)</option>
                      <option value="false">Non-Aktif / Draft</option>
                    </select>
                  </div>
                </div>

                {/* Question Builder Section */}
                <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--admin-text)' }}>
                        Daftar Soal & Kunci Jawaban
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--admin-text-secondary)', marginTop: 2 }}>
                        {(form.questions || []).length} soal terkonfigurasi
                      </div>
                    </div>
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary admin-btn-sm"
                      onClick={addQuestion}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Tambah Soal
                    </button>
                  </div>

                  <div className="admin-survey-builder">
                    {(form.questions || []).map((q, qIdx) => (
                      <div key={qIdx} className="admin-question-card">
                        <div className="admin-question-header">
                          <span className="admin-question-number">Soal #{qIdx + 1}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {(form.questions || []).length > 1 && (
                              <button
                                type="button"
                                className="admin-btn admin-btn-danger admin-btn-icon sm"
                                onClick={() => removeQuestion(qIdx)}
                                title="Hapus Soal"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="admin-question-fields">
                          <div className="admin-field">
                            <label>
                              Pertanyaan <span className="required">*</span>
                            </label>
                            <input
                              type="text"
                              className="admin-input"
                              placeholder="Masukkan teks soal pertanyaan..."
                              value={q.question_text}
                              onChange={(e) => updateQuestion(qIdx, { question_text: e.target.value })}
                              required
                            />
                          </div>

                          <div className="admin-question-row">
                            <div className="admin-field">
                              <label>Tipe Soal</label>
                              <select
                                className="admin-select"
                                value={q.question_type}
                                onChange={(e) =>
                                  updateQuestion(qIdx, {
                                    question_type: e.target.value as 'single_choice' | 'multiple_choice' | 'text',
                                  })
                                }
                              >
                                <option value="single_choice">Single Choice (1 Kunci Jawaban)</option>
                                <option value="multiple_choice">Multiple Choice (Banyak Kunci)</option>
                                <option value="text">Essay / Text Bebas</option>
                              </select>
                            </div>

                            <div className="admin-field" style={{ display: 'flex', alignItems: 'flex-end' }}>
                              <label
                                className="admin-checkbox-field"
                                style={{ height: 42, paddingBottom: 6 }}
                              >
                                <input
                                  type="checkbox"
                                  className="admin-checkbox"
                                  checked={q.is_required}
                                  onChange={(e) => updateQuestion(qIdx, { is_required: e.target.checked })}
                                />
                                <span className="admin-checkbox-label">Wajib Dijawab (Required)</span>
                              </label>
                            </div>
                          </div>

                          {/* Options Builder for Choices */}
                          {q.question_type !== 'text' && (
                            <div className="admin-options-section">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <div className="admin-options-title">
                                  Pilihan Jawaban & Kunci (Tandai Centang Kunci Benar)
                                </div>
                                <button
                                  type="button"
                                  className="admin-btn admin-btn-ghost admin-btn-sm"
                                  onClick={() => addOption(qIdx)}
                                >
                                  + Tambah Opsi
                                </button>
                              </div>

                              {(q.options || []).map((opt, oIdx) => (
                                <div key={oIdx} className="admin-option-row">
                                  <input
                                    type="text"
                                    className="admin-input"
                                    placeholder={`Teks Pilihan ${String.fromCharCode(65 + oIdx)}...`}
                                    value={opt.option_text}
                                    onChange={(e) => updateOption(qIdx, oIdx, { option_text: e.target.value })}
                                    required
                                  />
                                  <label
                                    className="admin-checkbox-field"
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: 6,
                                      background: opt.is_correct ? 'rgba(16, 185, 129, 0.15)' : 'var(--admin-surface-hover)',
                                      border: opt.is_correct ? '1px solid var(--admin-success)' : '1px solid transparent',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      className="admin-checkbox"
                                      checked={Boolean(opt.is_correct)}
                                      onChange={(e) => updateOption(qIdx, oIdx, { is_correct: e.target.checked })}
                                    />
                                    <span
                                      className="admin-checkbox-label"
                                      style={{
                                        color: opt.is_correct ? 'var(--admin-success)' : 'var(--admin-text-secondary)',
                                        fontWeight: opt.is_correct ? 600 : 400,
                                      }}
                                    >
                                      {opt.is_correct ? '✓ Kunci Benar' : 'Salah'}
                                    </span>
                                  </label>

                                  {(q.options || []).length > 2 && (
                                    <button
                                      type="button"
                                      className="admin-btn admin-btn-ghost admin-btn-icon sm"
                                      onClick={() => removeOption(qIdx, oIdx)}
                                      title="Hapus Opsi"
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={closeModal} disabled={saving}>
                  Batal
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Buat Post-Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal Detail / Preview Soal ───────────────────────────────────── */}
      {detailModal && (
        <div className="admin-modal-overlay" onClick={() => setDetailModal(null)}>
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 680, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="admin-modal-header">
              <div>
                <h2 className="admin-modal-title">{detailModal.title}</h2>
                <div style={{ fontSize: 13, color: 'var(--admin-text-secondary)', marginTop: 4 }}>
                  Simposium: {symposiumMap.get(detailModal.ref_id)?.title || detailModal.ref_id}
                </div>
              </div>
              <button className="admin-modal-close-btn" onClick={() => setDetailModal(null)}>
                ×
              </button>
            </div>

            <div className="admin-modal-body" style={{ overflowY: 'auto', flex: 1 }}>
              {detailModal.description && (
                <div style={{ padding: '12px 16px', background: 'var(--admin-surface)', borderRadius: 8, marginBottom: 16, fontSize: 13.5, lineHeight: 1.6 }}>
                  {detailModal.description}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {(!detailModal.questions || detailModal.questions.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: 30, color: 'var(--admin-text-muted)' }}>
                    Tidak ada butir pertanyaan pada post-test ini.
                  </div>
                ) : (
                  detailModal.questions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      style={{
                        padding: 16,
                        borderRadius: 10,
                        background: 'var(--admin-surface)',
                        border: '1px solid var(--admin-border)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <span className="admin-question-number">No. {idx + 1}</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--admin-text)', flex: 1 }}>
                          {q.question_text}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                          {q.question_type}
                        </span>
                      </div>

                      {q.options && q.options.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 12 }}>
                          {q.options.map((opt, oIdx) => (
                            <div
                              key={opt.id || oIdx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                fontSize: 13,
                                color: opt.is_correct ? 'var(--admin-success)' : 'var(--admin-text-secondary)',
                                fontWeight: opt.is_correct ? 600 : 400,
                              }}
                            >
                              <span>{String.fromCharCode(65 + oIdx)}.</span>
                              <span style={{ flex: 1 }}>{opt.option_text}</span>
                              {opt.is_correct && (
                                <span style={{ fontSize: 11, background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: 4 }}>
                                  ✓ Kunci
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setDetailModal(null)}
              >
                Tutup
              </button>
              {!isBrand && (
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={() => {
                    const target = detailModal;
                    setDetailModal(null);
                    openEdit(target);
                  }}
                >
                  Edit Soal Ini
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Delete Confirmation ─────────────────────────────────────── */}
      {deleteModalOpen && deleteTarget && (
        <div className="admin-modal-overlay" onClick={closeDelete}>
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 440 }}
          >
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Konfirmasi Hapus Post-Test</h2>
              <button className="admin-modal-close-btn" onClick={closeDelete} disabled={deleting}>
                ×
              </button>
            </div>

            <div className="admin-modal-body">
              <p style={{ color: 'var(--admin-text-secondary)', lineHeight: 1.6, fontSize: 14 }}>
                Apakah Anda yakin ingin menghapus post-test{' '}
                <strong style={{ color: 'var(--admin-text)' }}>"{deleteTarget.title}"</strong>?
              </p>
              <p style={{ color: 'var(--admin-danger)', fontSize: 12.5, marginTop: 10 }}>
                ⚠️ Seluruh pertanyaan dan opsi jawaban yang terkait dengan post-test ini akan ikut terhapus permanen.
              </p>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={closeDelete}
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
                {deleting ? 'Menghapus...' : 'Ya, Hapus Post-Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
