import { useState, useEffect, useCallback, useRef, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import {
  getUsers,
  loginKalbeUser,
  registerKalbeUser,
  type UserItemResponse,
  type UsersResponse,
  type RegisterKalbeUserPayload,
} from './adminApi';
import { useToast } from '../context/ToastContext';
import { setAuthSession } from '../utils/auth';

interface SearchUserItem {
  id?: string;
  fullname?: string;
  email?: string;
  phone_number?: string;
}

const SPECIALITIES = ['PPDS', 'GP', 'DSA', 'Other'];

export function UsersListPage({ initialOpenRegister = false }: { initialOpenRegister?: boolean }) {
  const { showToast } = useToast();
  const loginDropdownRef = useRef<HTMLDivElement>(null);

  const [users, setUsers] = useState<UserItemResponse[]>([]);
  const [meta, setMeta] = useState<UsersResponse['meta'] | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Login modal state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginName, setLoginName] = useState<string>('');
  const [loginPhone, setLoginPhone] = useState<string>('');
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [selectedLoginUser, setSelectedLoginUser] = useState<SearchUserItem | null>(null);
  const [searchResults, setSearchResults] = useState<SearchUserItem[]>([]);
  const [isSearchingUser, setIsSearchingUser] = useState<boolean>(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState<boolean>(false);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Registration modal state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(initialOpenRegister);
  const [registerLoading, setRegisterLoading] = useState<boolean>(false);
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});

  const initialRegisterState: RegisterKalbeUserPayload = {
    fullname: '',
    email: '',
    phone_number: '',
    speciality: 'PPDS',
    practice_place: '',
    practice_place_address: '',
  };

  const [registerForm, setRegisterForm] = useState<RegisterKalbeUserPayload>(initialRegisterState);

  // Debounce search query input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Debounce user search call for Login
  useEffect(() => {
    const trimmed = loginName.trim();

    if (selectedLoginUser && selectedLoginUser.fullname === trimmed) {
      return;
    }

    if (trimmed.length < 2) {
      setSearchResults([]);
      setIsSearchingUser(false);
      return;
    }

    setIsSearchingUser(true);
    setShowLoginDropdown(true);

    const timer = setTimeout(async () => {
      try {
        const res = await getUsers({ search: trimmed, page: 1, limit: 10 });
        if (res.success && res.data) {
          setSearchResults(res.data);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error('Failed to search users for login:', err);
        setSearchResults([]);
      } finally {
        setIsSearchingUser(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [loginName, selectedLoginUser]);

  // Handle outside click to close login dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (loginDropdownRef.current && !loginDropdownRef.current.contains(e.target as Node)) {
        setShowLoginDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUsers({
        search: debouncedSearch || undefined,
        page: currentPage,
        limit: limit,
      });

      if (res.success) {
        setUsers(res.data || []);
        setMeta(
          res.meta || {
            total: res.data?.length || 0,
            currentPage: currentPage,
            lastPage: 1,
            nextPage: null,
          }
        );
      } else {
        const msg = (res.error as any)?.message || 'Gagal memuat daftar user';
        setError(msg);
        showToast('error', msg);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data';
      setError(msg);
      showToast('error', msg);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, currentPage, limit, showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const copyToClipboard = (text?: string, label?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast('info', `${label || 'Teks'} berhasil disalin!`);
  };

  const handleRegisterChange = useCallback((field: keyof RegisterKalbeUserPayload, value: string) => {
    setRegisterForm((prev) => ({ ...prev, [field]: value }));

    setRegisterErrors((prev) => {
      if (!prev[field]) return prev;
      const nextErr = { ...prev };
      delete nextErr[field];
      return nextErr;
    });
  }, []);

  const validateRegisterForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!registerForm.fullname.trim()) {
      errors.fullname = 'Nama lengkap wajib diisi';
    }
    if (!registerForm.email.trim()) {
      errors.email = 'Email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email.trim())) {
      errors.email = 'Format email tidak valid';
    }
    if (!registerForm.phone_number.trim()) {
      errors.phone_number = 'Nomor telepon wajib diisi';
    } else if (registerForm.phone_number.trim().length < 8) {
      errors.phone_number = 'Nomor telepon minimal 8 digit';
    }
    if (!registerForm.practice_place.trim()) {
      errors.practice_place = 'Tempat praktik/RS wajib diisi';
    }
    if (!registerForm.practice_place_address.trim()) {
      errors.practice_place_address = 'Alamat tempat praktik wajib diisi';
    }
    if (!registerForm.speciality.trim()) {
      errors.speciality = 'Spesialisasi wajib diisi';
    }

    setRegisterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateRegisterForm()) return;

    setRegisterLoading(true);
    try {
      const res = await registerKalbeUser({
        ...registerForm,
        fullname: registerForm.fullname.trim(),
        email: registerForm.email.trim(),
        phone_number: registerForm.phone_number.trim(),
        practice_place: registerForm.practice_place.trim(),
        practice_place_address: registerForm.practice_place_address.trim(),
        speciality: registerForm.speciality.trim(),
      });

      if (!res.success) {
        const msg = (res.error as any)?.message || 'Gagal mendaftarkan user';
        throw new Error(msg);
      }

      showToast('success', 'User berhasil didaftarkan!');
      setIsRegisterModalOpen(false);
      setRegisterForm(initialRegisterState);
      fetchUsers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat pendaftaran';
      setRegisterErrors((prev) => ({ ...prev, submit: msg }));
      showToast('error', msg);
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleOpenLoginModal = (user?: UserItemResponse) => {
    setLoginError(null);
    setShowLoginDropdown(false);

    if (user) {
      const uName = user.fullname || '';
      const uPhone = user.phone_number || '';
      let uEmail = (user.email || '').trim();
      if (!uEmail && uName) {
        const cleanName = uName.toLowerCase().trim().replace(/\s+/g, '_');
        uEmail = `${cleanName}@default.com`;
      }
      setLoginName(uName);
      setLoginPhone(uPhone);
      setLoginEmail(uEmail);
      setSelectedLoginUser({
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        phone_number: user.phone_number,
      });
    } else {
      setLoginName('');
      setLoginPhone('');
      setLoginEmail('');
      setSelectedLoginUser(null);
    }

    setIsLoginModalOpen(true);
  };

  const handleSelectLoginUser = (user: SearchUserItem) => {
    const userName = user.fullname || '';
    const userPhone = user.phone_number || '';

    let userEmail = (user.email || '').trim();
    if (!userEmail && userName) {
      const cleanName = userName.toLowerCase().trim().replace(/\s+/g, '_');
      userEmail = `${cleanName}@default.com`;
    }

    setLoginName(userName);
    setLoginPhone(userPhone);
    setLoginEmail(userEmail);
    setSelectedLoginUser(user);
    setShowLoginDropdown(false);
    setLoginError(null);
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const trimmedName = loginName.trim();
    if (!trimmedName) {
      setLoginError('Silakan cari dan pilih nama user terlebih dahulu');
      return;
    }

    let finalEmail = loginEmail.trim();
    if (!finalEmail && trimmedName) {
      const cleanName = trimmedName.toLowerCase().trim().replace(/\s+/g, '_');
      finalEmail = `${cleanName}@default.com`;
      setLoginEmail(finalEmail);
    }

    const trimmedPhone = loginPhone.trim();
    if (!trimmedPhone || !finalEmail) {
      setLoginError('Email dan nomor telepon wajib terisi. Silakan pilih user dari daftar.');
      return;
    }

    setLoginLoading(true);

    try {
      const json = await loginKalbeUser({
        fullname: trimmedName,
        email: finalEmail,
        phone_number: trimmedPhone,
      });

      if (!json || json.success === false) {
        const message =
          (json?.error as any)?.message ||
          (json?.error as any)?.details ||
          'Login gagal. Silakan periksa kembali data Anda.';
        throw new Error(typeof message === 'string' ? message : 'Login gagal.');
      }

      // Store auth response token & user
      const token = json.data?.access_token || (json as any).access_token || (json as any).token;
      const respData = json.data || {};
      const userData = {
        ...respData,
        id: respData.id,
        fullname: respData.fullname || trimmedName,
        fullName: respData.fullname || trimmedName,
        email: respData.email || finalEmail,
        phone_number: respData.phone_number || trimmedPhone,
        phoneNumber: respData.phone_number || trimmedPhone,
        phone: respData.phone_number || trimmedPhone,
        role: respData.role || 'user',
      };

      if (token) {
        setAuthSession(token, userData, false);
      }

      showToast('success', `Berhasil login sebagai ${userData.fullname}!`);
      setIsLoginModalOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login gagal. Silakan coba lagi.';
      console.error('Admin Login submit error:', err);
      setLoginError(msg);
      showToast('error', msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (meta && (newPage < 1 || newPage > meta.lastPage)) return;
    setCurrentPage(newPage);
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
    if (users.length === 0) {
      showToast('error', 'Tidak ada data untuk diexport');
      return;
    }

    const headers = ['ID', 'Full Name', 'Email', 'Phone Number', 'Created At'];
    const rows = users.map((u) => [
      `"${u.id || ''}"`,
      `"${(u.fullname || '').replace(/"/g, '""')}"`,
      `"${(u.email || '').replace(/"/g, '""')}"`,
      `"${(u.phone_number || '').replace(/"/g, '""')}"`,
      `"${u.created_at || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `kalbe_users_page_${currentPage}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('success', 'File CSV berhasil diunduh!');
  };

  const renderRegisterFieldError = (field: string) => {
    if (!registerErrors[field]) return null;
    return (
      <div
        style={{
          color: 'var(--admin-danger, #ef4444)',
          fontSize: '12px',
          fontWeight: 500,
          marginTop: '4px',
          display: 'flex',
          justifyContent: 'flex-end',
          textAlign: 'right',
          width: '100%',
        }}
      >
        {registerErrors[field]}
      </div>
    );
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Daftar All Users</h1>
          <p className="admin-page-subtitle">Menampilkan seluruh data pengguna/partisipan terdaftar dalam sistem.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => handleOpenLoginModal()}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderColor: 'rgba(16, 185, 129, 0.4)',
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.25)',
            }}
          >
            🔑 Login User
          </button>
          <button className="admin-btn admin-btn-primary" onClick={() => setIsRegisterModalOpen(true)}>
            ➕ Registrasi User
          </button>
          <button className="admin-btn admin-btn-secondary" onClick={fetchUsers} disabled={loading}>
            🔄 Refresh
          </button>
          <button className="admin-btn admin-btn-secondary" onClick={exportToCSV} disabled={users.length === 0}>
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats-grid" style={{ marginBottom: '20px' }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Users (API Total)</div>
          <div className="admin-stat-value primary">
            {meta?.total ?? users.length}
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">User Halaman Ini</div>
          <div className="admin-stat-value info">{users.length}</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Halaman Berjalan</div>
          <div className="admin-stat-value success">
            {meta ? `${meta.currentPage} / ${meta.lastPage || 1}` : '1 / 1'}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="admin-card">
        {/* Filter Bar */}
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
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <input
              type="text"
              className="admin-input"
              placeholder="Cari berdasarkan Nama, Email, atau No. Telepon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

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
                <th style={{ width: '50px' }}>#</th>
                <th>Nama Lengkap</th>
                <th>Email</th>
                <th>No. Telepon</th>
                <th>Tanggal Terdaftar</th>
                <th>User ID</th>
                <th style={{ width: '90px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>
                    <div
                      style={{
                        display: 'inline-block',
                        width: '24px',
                        height: '24px',
                        border: '3px solid rgba(0,0,0,0.1)',
                        borderTopColor: '#3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                      }}
                    />
                    <p style={{ margin: '8px 0 0 0', opacity: 0.7, fontSize: '13px' }}>Memuat data user...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', opacity: 0.7 }}>
                    Tidak ada data user yang ditemukan.
                  </td>
                </tr>
              ) : (
                users.map((user, idx) => {
                  const rowNum = (currentPage - 1) * limit + idx + 1;
                  return (
                    <tr key={user.id || idx}>
                      <td style={{ fontWeight: 600, opacity: 0.7 }}>{rowNum}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--admin-text-main)' }}>
                          {user.fullname || '-'}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{ cursor: 'pointer', color: '#3b82f6' }}
                          title="Klik untuk menyalin Email"
                          onClick={() => copyToClipboard(user.email, 'Email')}
                        >
                          {user.email || '-'}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{ cursor: 'pointer' }}
                          title="Klik untuk menyalin No. Telepon"
                          onClick={() => copyToClipboard(user.phone_number, 'No. Telepon')}
                        >
                          {user.phone_number || '-'}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px', opacity: 0.85 }}>
                        {formatDate(user.created_at)}
                      </td>
                      <td>
                        <code
                          style={{
                            fontSize: '11px',
                            background: 'rgba(0,0,0,0.05)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                          title="Klik untuk menyalin User ID"
                          onClick={() => copyToClipboard(user.id, 'User ID')}
                        >
                          {user.id ? `${user.id.substring(0, 8)}...` : '-'}
                        </code>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: 'var(--admin-text, #f0f0f5)',
                            borderColor: 'rgba(255, 255, 255, 0.15)',
                          }}
                          onClick={() => handleOpenLoginModal(user)}
                          title={`Login sebagai ${user.fullname || 'user'}`}
                        >
                          🔑 Login
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {meta && meta.lastPage > 1 && (
          <div
            className="admin-pagination"
            style={{
              marginTop: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '13px', opacity: 0.8 }}>
              Menampilkan {Math.min((currentPage - 1) * limit + 1, meta.total)} -{' '}
              {Math.min(currentPage * limit, meta.total)} dari total {meta.total} data
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                className="admin-btn admin-btn-secondary"
                disabled={currentPage <= 1 || loading}
                onClick={() => handlePageChange(currentPage - 1)}
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                &laquo; Prev
              </button>

              <span style={{ fontSize: '13px', padding: '0 8px', fontWeight: 600 }}>
                Halaman {currentPage} dari {meta.lastPage}
              </span>

              <button
                className="admin-btn admin-btn-secondary"
                disabled={currentPage >= meta.lastPage || loading}
                onClick={() => handlePageChange(currentPage + 1)}
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                Next &raquo;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {isRegisterModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsRegisterModalOpen(false)}>
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px', width: '90%' }}
          >
            <div
              className="admin-modal-header"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: '1px solid var(--admin-border)',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--admin-text-main)' }}>
                ➕ Registrasi User Manual
              </h3>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: 'var(--admin-text-muted)',
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} noValidate>
              <div
                className="admin-modal-body"
                style={{ padding: '20px', maxHeight: 'calc(80vh - 120px)', overflowY: 'auto' }}
              >
                <div className="admin-form-grid">
                  {/* Field 1: Nama Lengkap */}
                  <div className="admin-field full-width">
                    <label>
                      Nama Lengkap <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="Contoh: dr. Budi Santoso, Sp.A"
                      value={registerForm.fullname}
                      onChange={(e) => handleRegisterChange('fullname', e.target.value)}
                      required
                    />
                    {renderRegisterFieldError('fullname')}
                  </div>

                  {/* Field 2: Email */}
                  <div className="admin-field">
                    <label>
                      Email <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      className="admin-input"
                      placeholder="nama@email.com"
                      value={registerForm.email}
                      onChange={(e) => handleRegisterChange('email', e.target.value)}
                      required
                    />
                    {renderRegisterFieldError('email')}
                  </div>

                  {/* Field 3: No. Telepon */}
                  <div className="admin-field">
                    <label>
                      No. Telepon <span className="required">*</span>
                    </label>
                    <input
                      type="tel"
                      className="admin-input"
                      placeholder="08xxxxxxxxxx"
                      value={registerForm.phone_number}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        handleRegisterChange('phone_number', val);
                      }}
                      required
                    />
                    {renderRegisterFieldError('phone_number')}
                  </div>

                  {/* Field 4: Spesialisasi */}
                  <div className="admin-field">
                    <label>
                      Spesialisasi <span className="required">*</span>
                    </label>
                    <select
                      className="admin-select"
                      value={registerForm.speciality}
                      onChange={(e) => handleRegisterChange('speciality', e.target.value)}
                      required
                    >
                      <option value="" disabled hidden>
                        Pilih Spesialisasi
                      </option>
                      {SPECIALITIES.map((spec) => (
                        <option key={spec} value={spec}>
                          {spec}
                        </option>
                      ))}
                    </select>
                    {renderRegisterFieldError('speciality')}
                  </div>

                  {/* Field 5: Tempat Praktik / RS */}
                  <div className="admin-field">
                    <label>
                      Tempat Praktik / RS <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="RS Siloam / Klinik / Puskesmas"
                      value={registerForm.practice_place}
                      onChange={(e) => handleRegisterChange('practice_place', e.target.value)}
                      required
                    />
                    {renderRegisterFieldError('practice_place')}
                  </div>

                  {/* Field 6: Alamat Tempat Praktik */}
                  <div className="admin-field full-width">
                    <label>
                      Alamat Tempat Praktik <span className="required">*</span>
                    </label>
                    <textarea
                      className="admin-input"
                      rows={2}
                      placeholder="Jl. Sudirman No. 123, Jakarta"
                      value={registerForm.practice_place_address}
                      onChange={(e) => handleRegisterChange('practice_place_address', e.target.value)}
                      required
                    />
                    {renderRegisterFieldError('practice_place_address')}
                  </div>
                </div>

                {renderRegisterFieldError('submit')}
              </div>

              <div
                className="admin-modal-footer"
                style={{
                  padding: '16px 20px',
                  borderTop: '1px solid var(--admin-border)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                }}
              >
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setIsRegisterModalOpen(false)}
                  disabled={registerLoading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={registerLoading}
                >
                  {registerLoading ? 'Mendaftarkan...' : 'Daftarkan User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Login Modal (Admin UI) */}
      {isLoginModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsLoginModalOpen(false)}>
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px', width: '90%' }}
          >
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                  }}
                >
                  🔑
                </div>
                <div>
                  <h3 className="admin-modal-title" style={{ margin: 0 }}>
                    Login Sebagai User
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                    Masuk ke sesi partisipan dan lanjutkan ke User Journey (/home)
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setIsLoginModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} noValidate>
              <div
                className="admin-modal-body"
                style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}
              >
                {/* Error Alert */}
                {loginError && (
                  <div
                    className="admin-alert admin-alert-danger"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      margin: 0,
                    }}
                  >
                    <span>⚠️</span>
                    <span style={{ fontSize: '13px' }}>{loginError}</span>
                  </div>
                )}

                {/* Field 1: Nama (Searchable with Autocomplete Dropdown) */}
                <div
                  className="admin-field"
                  style={{ position: 'relative' }}
                  ref={loginDropdownRef}
                >
                  <label>
                    Nama Lengkap <span className="required">*</span>
                  </label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="Cari atau ketik nama user..."
                      value={loginName}
                      onChange={(e) => {
                        setLoginName(e.target.value);
                        setSelectedLoginUser(null);
                        setShowLoginDropdown(true);
                        setLoginError(null);
                      }}
                      onFocus={() => {
                        if (loginName.trim().length >= 2 || searchResults.length > 0) {
                          setShowLoginDropdown(true);
                        }
                      }}
                      autoComplete="off"
                      style={{ paddingRight: '36px' }}
                      required
                    />
                    <div
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        color: 'var(--admin-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {isSearchingUser ? (
                        <div
                          style={{
                            width: '14px',
                            height: '14px',
                            border: '2px solid rgba(255,255,255,0.2)',
                            borderTopColor: 'var(--admin-primary)',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                          }}
                        />
                      ) : (
                        <Search size={16} />
                      )}
                    </div>
                  </div>

                  {/* Dropdown Hasil Pencarian */}
                  {showLoginDropdown && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '6px',
                        background: 'var(--admin-bg-secondary, #12121a)',
                        border: '1px solid var(--admin-glass-border, rgba(255, 255, 255, 0.12))',
                        borderRadius: 'var(--admin-radius, 8px)',
                        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
                        zIndex: 1050,
                        maxHeight: '220px',
                        overflowY: 'auto',
                      }}
                    >
                      {isSearchingUser ? (
                        <div
                          style={{
                            padding: '12px 16px',
                            fontSize: '13px',
                            color: 'var(--admin-text-muted)',
                            textAlign: 'center',
                          }}
                        >
                          Mencari user...
                        </div>
                      ) : searchResults.length > 0 ? (
                        <>
                          {searchResults.map((user, idx) => {
                            const uName = user.fullname || 'Tanpa Nama';
                            const uPhone = user.phone_number || '-';
                            const rawEmail = (user.email || '').trim();
                            const defaultEmail =
                              uName !== 'Tanpa Nama'
                                ? `${uName.toLowerCase().trim().replace(/\s+/g, '_')}@default.com`
                                : '-';
                            const uEmail = rawEmail || defaultEmail;

                            return (
                              <div
                                key={user.id || idx}
                                onClick={() => handleSelectLoginUser(user)}
                                style={{
                                  padding: '10px 14px',
                                  cursor: 'pointer',
                                  borderBottom:
                                    '1px solid var(--admin-border, rgba(255, 255, 255, 0.05))',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '2px',
                                  transition: 'background 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background =
                                    'var(--admin-surface-hover, rgba(255, 255, 255, 0.08))';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'transparent';
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: 600,
                                    fontSize: '13px',
                                    color: 'var(--admin-text, #f0f0f5)',
                                  }}
                                >
                                  {uName}
                                </div>
                                <div
                                  style={{
                                    fontSize: '11px',
                                    color: 'var(--admin-text-muted, #8b8b9e)',
                                  }}
                                >
                                  {uEmail} &bull; {uPhone}
                                </div>
                              </div>
                            );
                          })}
                          <div
                            style={{
                              padding: '10px 14px',
                              textAlign: 'center',
                              borderTop:
                                '1px solid var(--admin-border, rgba(255, 255, 255, 0.08))',
                              background: 'var(--admin-surface, #181824)',
                            }}
                          >
                            <button
                              type="button"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--admin-primary-light, #ff2d55)',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                              onClick={() => {
                                setShowLoginDropdown(false);
                                setIsLoginModalOpen(false);
                                setIsRegisterModalOpen(true);
                              }}
                            >
                              Belum terdaftar? Registrasi User di sini
                            </button>
                          </div>
                        </>
                      ) : loginName.trim().length >= 2 ? (
                        <div style={{ padding: '14px', textAlign: 'center' }}>
                          <div
                            style={{
                              fontSize: '12px',
                              color: 'var(--admin-text-muted)',
                              marginBottom: '8px',
                            }}
                          >
                            User "{loginName.trim()}" tidak ditemukan dalam daftar pencarian.
                          </div>
                          <button
                            type="button"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--admin-primary-light, #ff2d55)',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                            onClick={() => {
                              setShowLoginDropdown(false);
                              setIsLoginModalOpen(false);
                              setIsRegisterModalOpen(true);
                            }}
                          >
                            Daftarkan user baru sekarang
                          </button>
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: '12px 16px',
                            fontSize: '13px',
                            color: 'var(--admin-text-muted)',
                            textAlign: 'center',
                          }}
                        >
                          Ketik minimal 2 karakter untuk mencari...
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Field 2: No. Telepon */}
                <div className="admin-field">
                  <label>
                    No. Telepon <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    className="admin-input"
                    placeholder="087xxxxxxxxxx"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    autoComplete="tel"
                    required
                  />
                </div>

                {/* Field 3: Email */}
                <div className="admin-field">
                  <label>
                    Email <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    className="admin-input"
                    placeholder="nama@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                  <span style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>
                    Otomatis terisi jika memilih user di atas.
                  </span>
                </div>
              </div>

              <div
                className="admin-modal-footer"
                style={{
                  padding: '16px 20px',
                  borderTop: '1px solid var(--admin-border)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                }}
              >
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setIsLoginModalOpen(false)}
                  disabled={loginLoading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={loginLoading}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    minWidth: '130px',
                  }}
                >
                  {loginLoading ? 'Memproses...' : '🔑 Login Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
