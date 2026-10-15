import React, { useState, useEffect, useCallback, useRef } from 'react';
import JSZip from 'jszip';
import QRCode from 'qrcode';
import {
  getKalbeSymposiums,
  checkInParticipantSymposium,
  isBrandUser,
  getUsers,
} from './adminApi';
import type {
  KalbeSymposiumResponse,
  UserItemResponse,
} from './adminApi';
import { useToast } from '../context/ToastContext';

interface SymposiumDropdownSearchProps {
  symposiums: KalbeSymposiumResponse[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

const SymposiumDropdownSearch: React.FC<SymposiumDropdownSearchProps> = ({
  symposiums,
  selectedId,
  onSelect,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedSymposium = symposiums.find((s) => s.id === selectedId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSymposiums = symposiums.filter(
    (s) =>
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="admin-dropdown-container" ref={containerRef} style={{ position: 'relative', zIndex: isOpen ? 999 : 1 }}>
      <div
        className={`admin-dropdown-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
          {selectedSymposium ? (
            <span>
              <strong style={{ color: 'var(--admin-text)' }}>{selectedSymposium.title}</strong>
              {selectedSymposium.description && (
                <span style={{ color: 'var(--admin-text-secondary)', marginLeft: '6px', fontSize: '12px' }}>
                  ({selectedSymposium.description.slice(0, 30)}...)
                </span>
              )}
            </span>
          ) : (
            <span style={{ color: 'var(--admin-text-muted)' }}>
              {symposiums.length === 0 ? 'Tidak ada simposium' : 'Pilih Simposium...'}
            </span>
          )}
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {isOpen && !disabled && (
        <div className="admin-dropdown-menu">
          <div className="admin-dropdown-search-box">
            <input
              type="text"
              className="admin-dropdown-search-input"
              placeholder="Cari simposium..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <ul className="admin-dropdown-list">
            {filteredSymposiums.length === 0 ? (
              <li className="admin-dropdown-empty">Simposium tidak ditemukan</li>
            ) : (
              filteredSymposiums.map((s) => (
                <li
                  key={s.id}
                  className={`admin-dropdown-item ${s.id === selectedId ? 'selected' : ''}`}
                  onClick={() => {
                    onSelect(s.id);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  <div className="admin-dropdown-item-title">{s.title}</div>
                  {s.description && <div className="admin-dropdown-item-sub">{s.description}</div>}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

interface UserDropdownSearchProps {
  value: string;
  onChange: (participantId: string) => void;
  disabled?: boolean;
}

const UserDropdownSearch: React.FC<UserDropdownSearchProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserItemResponse[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItemResponse | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value) {
      setSelectedUser(null);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUsers = useCallback(async (query: string) => {
    setLoadingUsers(true);
    try {
      const res = await getUsers({ search: query, page: 1, limit: 10 });
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchUsers(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, isOpen, fetchUsers]);

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    fetchUsers(searchTerm);
  };

  const handleSelect = (user: UserItemResponse) => {
    setSelectedUser(user);
    onChange(user.id);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUser(null);
    onChange('');
    setSearchTerm('');
  };

  const handleUseManualInput = (e: React.MouseEvent) => {
    e.stopPropagation();
    const manualVal = searchTerm.trim();
    if (manualVal) {
      setSelectedUser(null);
      onChange(manualVal);
      setIsOpen(false);
    }
  };

  return (
    <div className="admin-dropdown-container" ref={containerRef} style={{ position: 'relative', zIndex: isOpen ? 999 : 1 }}>
      <div
        className={`admin-dropdown-trigger ${isOpen ? 'open' : ''}`}
        onClick={handleOpen}
        style={{
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px', flex: 1 }}>
          {selectedUser ? (
            <div>
              <span style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{selectedUser.fullname}</span>
              <span style={{ color: 'var(--admin-text-secondary)', marginLeft: '6px', fontSize: '12px' }}>
                ({selectedUser.email || selectedUser.phone_number || selectedUser.id})
              </span>
            </div>
          ) : value ? (
            <div>
              <span style={{ fontWeight: 600, color: 'var(--admin-text)' }}>ID: {value}</span>
              <span style={{ color: 'var(--admin-text-muted)', marginLeft: '6px', fontSize: '11px' }}>(Input manual)</span>
            </div>
          ) : (
            <span style={{ color: 'var(--admin-text-muted)' }}>Cari & pilih Participant / User...</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {(selectedUser || value) && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--admin-text-muted)',
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '14px',
                lineHeight: 1,
              }}
              title="Clear selection"
            >
              ✕
            </button>
          )}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              flexShrink: 0,
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="admin-dropdown-menu">
          <div className="admin-dropdown-search-box">
            <input
              type="text"
              className="admin-dropdown-search-input"
              placeholder="Cari nama, email, atau phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <ul className="admin-dropdown-list">
            {loadingUsers ? (
              <li className="admin-dropdown-empty">
                Mencari user...
              </li>
            ) : users.length === 0 ? (
              <div>
                <li className="admin-dropdown-empty">User tidak ditemukan</li>
                {searchTerm.trim().length > 0 && (
                  <li
                    className="admin-dropdown-item"
                    onClick={handleUseManualInput}
                    style={{ background: 'var(--admin-surface)', borderTop: '1px solid var(--admin-border)' }}
                  >
                    <div className="admin-dropdown-item-title" style={{ color: 'var(--admin-primary-light)' }}>
                      Gunakan ID: &quot;{searchTerm.trim()}&quot;
                    </div>
                    <div className="admin-dropdown-item-sub">Gunakan teks pencarian sebagai User ID manual</div>
                  </li>
                )}
              </div>
            ) : (
              <div>
                {searchTerm.trim().length > 0 && (
                  <li
                    className="admin-dropdown-item"
                    onClick={handleUseManualInput}
                    style={{ background: 'var(--admin-surface)', borderBottom: '1px solid var(--admin-border)' }}
                  >
                    <div className="admin-dropdown-item-title" style={{ color: 'var(--admin-primary-light)' }}>
                      Gunakan ID: &quot;{searchTerm.trim()}&quot;
                    </div>
                    <div className="admin-dropdown-item-sub">Input manual Participant ID</div>
                  </li>
                )}
                {users.map((u) => (
                  <li
                    key={u.id}
                    className={`admin-dropdown-item ${u.id === value ? 'selected' : ''}`}
                    onClick={() => handleSelect(u)}
                  >
                    <div className="admin-dropdown-item-title">{u.fullname}</div>
                    <div className="admin-dropdown-item-sub">
                      {[u.email, u.phone_number].filter(Boolean).join(' • ')}
                    </div>
                    <div className="admin-dropdown-item-meta">ID: {u.id}</div>
                  </li>
                ))}
              </div>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export const SymposiumCheckInPage: React.FC = () => {
  const { showToast } = useToast();
  const isBrand = isBrandUser();

  const [symposiums, setSymposiums] = useState<KalbeSymposiumResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Manual Check-In State
  const [selectedSymposiumId, setSelectedSymposiumId] = useState('');
  const [participantId, setParticipantId] = useState('');
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState(false);
  const [checkInResult, setCheckInResult] = useState<{
    status: 'success' | 'error';
    message: string;
  } | null>(null);

  // QR Modal State
  const [qrModalItem, setQrModalItem] = useState<KalbeSymposiumResponse | null>(null);
  const [qrModalDataUrl, setQrModalDataUrl] = useState<string>('');
  const [downloadingAll, setDownloadingAll] = useState(false);

  const fetchSymposiums = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getKalbeSymposiums();
      const list = res.data || [];
      setSymposiums(list);
      if (list.length > 0 && !selectedSymposiumId) {
        setSelectedSymposiumId(list[0].id);
      }
    } catch (err: unknown) {
      console.error('Failed to fetch symposiums:', err);
      showToast('error', 'Gagal memuat daftar simposium');
    } finally {
      setLoading(false);
    }
  }, [showToast, selectedSymposiumId]);

  useEffect(() => {
    fetchSymposiums();
  }, [fetchSymposiums]);

  // Target URL for post-test redirect
  const getSymposiumPostTestUrl = (symposiumId: string): string => {
    return `${window.location.origin}/post-test?symposium_id=${encodeURIComponent(symposiumId)}`;
  };

  // Generate QR Code image for modal when opened
  useEffect(() => {
    if (qrModalItem) {
      const targetUrl = getSymposiumPostTestUrl(qrModalItem.id);
      QRCode.toDataURL(targetUrl, {
        width: 300,
        margin: 1,
        color: {
          dark: '#940B0A',
          light: '#ffffff',
        },
      })
        .then((url) => setQrModalDataUrl(url))
        .catch((err) => {
          console.error('Failed to generate modal QR:', err);
          setQrModalDataUrl('');
        });
    } else {
      setQrModalDataUrl('');
    }
  }, [qrModalItem]);

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBrand) {
      showToast('error', 'Role Brand hanya memiliki akses read-only');
      return;
    }
    if (!selectedSymposiumId) {
      showToast('error', 'Pilih simposium terlebih dahulu');
      return;
    }
    if (!participantId.trim()) {
      showToast('error', 'Masukkan atau pilih Participant ID / User ID');
      return;
    }

    setIsSubmittingCheckIn(true);
    setCheckInResult(null);

    try {
      await checkInParticipantSymposium({
        symposium_id: selectedSymposiumId.trim(),
        user_id: participantId.trim(),
      });
      showToast('success', `Check-in berhasil untuk Participant: ${participantId}`);
      setCheckInResult({
        status: 'success',
        message: `Berhasil check-in participant (${participantId}) ke simposium!`,
      });
      setParticipantId('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal melakukan check-in simposium';
      showToast('error', msg);
      setCheckInResult({
        status: 'error',
        message: msg,
      });
    } finally {
      setIsSubmittingCheckIn(false);
    }
  };

  // Generate styled downloadable card for QR Code
  const generateSymposiumQRDataUrl = (item: KalbeSymposiumResponse): Promise<string> => {
    return new Promise((resolve, reject) => {
      const postTestUrl = getSymposiumPostTestUrl(item.id);

      QRCode.toDataURL(postTestUrl, {
        width: 320,
        margin: 1,
        color: {
          dark: '#1E1E1E',
          light: '#ffffff',
        },
      })
        .then((qrDataUrl) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Canvas context not available'));
              return;
            }

            const width = 450;
            const height = 580;
            canvas.width = width;
            canvas.height = height;

            // Background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);

            // Header Banner: Kalbe Red gradient
            const grad = ctx.createLinearGradient(0, 0, width, 0);
            grad.addColorStop(0, '#C70412');
            grad.addColorStop(1, '#8E000A');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, 85);

            // Header Title
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Kalbe Universe QR Code', width / 2, 40);

            // Header Subtitle
            ctx.fillStyle = '#fecaca';
            ctx.font = '500 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Symposium Detailing & Post-Test Check-In', width / 2, 65);

            // Draw QR Code
            ctx.drawImage(img, (width - 280) / 2, 110, 280, 280);

            // Symposium Title
            ctx.fillStyle = '#1e1e1e';
            ctx.font = 'bold 15px sans-serif';
            ctx.textAlign = 'center';
            const displayTitle = item.title.length > 55 ? item.title.substring(0, 52) + '...' : item.title;
            ctx.fillText(displayTitle, width / 2, 425);

            // Description
            if (item.description) {
              ctx.fillStyle = '#4b5563';
              ctx.font = '500 13px sans-serif';
              ctx.textAlign = 'center';
              const displayDesc = item.description.length > 50 ? item.description.substring(0, 47) + '...' : item.description;
              ctx.fillText(displayDesc, width / 2, 455);
            }

            // Target URL info
            ctx.fillStyle = '#C70412';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`Target: /post-test?symposium_id=${item.id.slice(0, 8)}...`, width / 2, 490);

            // Instruction Footer
            ctx.fillStyle = '#6b7280';
            ctx.font = '11.5px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Scan QR Code untuk langsung ke halaman Post-Test Simposium', width / 2, 530);

            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = () => reject(new Error('Failed to load QR image'));
          img.src = qrDataUrl;
        })
        .catch(reject);
    });
  };

  const handleDownloadQR = async (item: KalbeSymposiumResponse) => {
    try {
      const dataUrl = await generateSymposiumQRDataUrl(item);
      const link = document.createElement('a');
      link.download = `QR_Symposium_${item.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
      showToast('success', `QR Code "${item.title}" berhasil diunduh!`);
    } catch {
      showToast('error', 'Gagal mengunduh QR Code');
    }
  };

  const filtered = symposiums.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDownloadAllQR = async () => {
    const itemsToDownload = filtered.length > 0 ? filtered : symposiums;
    if (itemsToDownload.length === 0) {
      showToast('error', 'Tidak ada QR Code simposium untuk diunduh');
      return;
    }

    setDownloadingAll(true);
    showToast('info', `Menyiapkan ${itemsToDownload.length} QR Code ke dalam file ZIP...`);

    try {
      const zip = new JSZip();

      for (let i = 0; i < itemsToDownload.length; i++) {
        const item = itemsToDownload[i];
        const dataUrl = await generateSymposiumQRDataUrl(item);
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
        const sanitizedTitle = item.title.replace(/[^a-zA-Z0-9_-]/g, '_');
        const fileName = `QR_Symposium_${sanitizedTitle}_${item.id}.png`;
        zip.file(fileName, base64Data, { base64: true });
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `QR_Symposium_Kalbe_All.zip`;
      link.click();
      URL.revokeObjectURL(link.href);

      showToast('success', `Berhasil mengunduh ZIP berisi ${itemsToDownload.length} QR Code simposium!`);
    } catch {
      showToast('error', 'Terjadi kesalahan saat membuat file ZIP QR Code');
    } finally {
      setDownloadingAll(false);
    }
  };

  const renderDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('id-ID', {
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

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Symposium Check-In</h1>
          <p className="admin-page-subtitle">Daftar simposium dan auto-generate QR Code untuk redirect ke post-test simposium</p>
        </div>
        <div className="admin-page-actions">
          <div className="admin-search-wrapper">
            <svg className="admin-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="admin-search-input"
              placeholder="Cari simposium..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            className="admin-btn admin-btn-primary"
            onClick={handleDownloadAllQR}
            disabled={loading || downloadingAll || symposiums.length === 0}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {downloadingAll ? 'Mengunduh ZIP...' : 'Download Semua QR Code'}
          </button>
        </div>
      </div>

      {isBrand && (
        <div
          style={{
            marginBottom: '20px',
            padding: '14px 18px',
            borderRadius: '10px',
            background: 'var(--admin-warning-subtle)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#fcd34d',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
          }}
        >
          <span>🔒 <strong>Mode Read-Only:</strong> Akun Anda dengan role <strong>Brand</strong> hanya memiliki akses lihat/baca. Fitur check-in manual dinonaktifkan.</span>
        </div>
      )}

      {/* Manual Check-In Card for Admin / Usher */}
      {!isBrand && (
        <div className="admin-table-container" style={{ padding: '24px', marginBottom: '24px', overflow: 'visible', position: 'relative', zIndex: 10 }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--admin-text)' }}>
            Input Manual Check-In Simposium
          </h3>
          <form onSubmit={handleManualCheckIn} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', alignItems: 'end' }}>
            <div className="admin-field">
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-secondary)' }}>Pilih Simposium</label>
              <SymposiumDropdownSearch
                symposiums={symposiums}
                selectedId={selectedSymposiumId}
                onSelect={(id) => setSelectedSymposiumId(id)}
                disabled={loading || isSubmittingCheckIn}
              />
            </div>

            <div className="admin-field">
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-secondary)' }}>
                Participant ID / User ID <span style={{ color: 'var(--admin-danger)' }}>*</span>
              </label>
              <UserDropdownSearch
                value={participantId}
                onChange={(id) => setParticipantId(id)}
                disabled={isSubmittingCheckIn}
              />
            </div>

            <div>
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={isSubmittingCheckIn || !selectedSymposiumId || !participantId.trim()}
                style={{ width: '100%', height: '42px' }}
              >
                {isSubmittingCheckIn ? 'Memproses...' : 'Submit Check-In'}
              </button>
            </div>
          </form>

          {checkInResult && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 16px',
                borderRadius: '8px',
                background: checkInResult.status === 'success' ? 'var(--admin-success-subtle)' : 'var(--admin-danger-subtle)',
                border: `1px solid ${checkInResult.status === 'success' ? 'var(--admin-success)' : 'var(--admin-danger)'}`,
                color: checkInResult.status === 'success' ? 'var(--admin-success)' : 'var(--admin-danger)',
                fontSize: '13px',
              }}
            >
              {checkInResult.message}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="admin-table-container">
        {loading ? (
          <div className="admin-spinner">
            <div className="admin-spinner-ring" />
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Symposium</th>
                <th>Description</th>
                <th>Start</th>
                <th>End</th>
                <th>Icon / Logo</th>
                <th style={{ width: 160, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-table-empty">
                    <div className="admin-table-empty-icon">🎤</div>
                    <div className="admin-table-empty-text">
                      {search ? 'Tidak ada simposium yang cocok' : 'Belum ada data simposium'}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="admin-truncate-md">{idx + 1}</td>
                    <td className="primary">
                      <div className="admin-truncate-md" style={{ fontSize: 14, color: 'var(--admin-text-primary)' }}>{item.title}</div>
                      <div className="admin-truncate-md" style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 2 }}>
                        Target: /post-test?symposium_id={item.id.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="admin-truncate-md">{item.description || '—'}</td>
                    <td className="admin-truncate-md">{renderDateTime(item.started_at)}</td>
                    <td className="admin-truncate-md">{renderDateTime(item.ended_at)}</td>
                    <td>
                      {item.logo || item.icon ? (
                        <img
                          src={item.logo || item.icon || ''}
                          alt={item.title}
                          style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'contain', background: 'var(--admin-surface)' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span style={{ color: 'var(--admin-text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="admin-btn admin-btn-primary sm"
                        onClick={() => setQrModalItem(item)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7" />
                          <rect x="14" y="3" width="7" height="7" />
                          <rect x="14" y="14" width="7" height="7" />
                          <rect x="3" y="14" width="7" height="7" />
                        </svg>
                        Show QR Code
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* QR Code Modal */}
      {qrModalItem && (() => {
        const postTestUrl = getSymposiumPostTestUrl(qrModalItem.id);
        return (
          <div className="admin-modal-overlay" onClick={() => setQrModalItem(null)}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460, textAlign: 'center' }}>
              <div className="admin-modal-header">
                <h3 className="admin-modal-title">QR Code Simposium (Post-Test)</h3>
                <button className="admin-modal-close" onClick={() => setQrModalItem(null)}>
                  ×
                </button>
              </div>
              <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--admin-text)', marginBottom: 4 }}>
                    {qrModalItem.title}
                  </div>
                  {qrModalItem.description && (
                    <div style={{ fontSize: 13, color: 'var(--admin-text-secondary)', marginTop: 2 }}>
                      {qrModalItem.description}
                    </div>
                  )}
                </div>

                {/* QR Code Canvas / Image Display */}
                <div
                  style={{
                    background: '#ffffff',
                    padding: 16,
                    borderRadius: 16,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                    display: 'inline-block',
                  }}
                >
                  {qrModalDataUrl ? (
                    <img
                      src={qrModalDataUrl}
                      alt={`QR Code ${qrModalItem.title}`}
                      style={{ width: 220, height: 220, display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                      Membuat QR Code...
                    </div>
                  )}
                </div>

                {/* Target Link Box with Copy Button */}
                <div style={{ width: '100%', textAlign: 'left' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: 4 }}>
                    Link Redirect Post-Test Simposium:
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      className="admin-input"
                      value={postTestUrl}
                      readOnly
                      style={{ fontSize: 12, background: 'var(--admin-bg)' }}
                    />
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary"
                      onClick={() => {
                        navigator.clipboard.writeText(postTestUrl);
                        showToast('success', 'URL post-test berhasil disalin!');
                      }}
                      style={{ whiteSpace: 'nowrap', fontSize: 12 }}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div style={{ width: '100%', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  <div style={{ fontSize: 11, color: 'var(--admin-text-secondary)', marginBottom: 4 }}>
                    ID Simposium:
                  </div>
                  <code
                    style={{
                      background: 'var(--admin-surface)',
                      border: '1px solid var(--admin-border)',
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      color: 'var(--admin-warning)',
                      wordBreak: 'break-all',
                      display: 'inline-block',
                    }}
                  >
                    {qrModalItem.id}
                  </code>
                </div>
              </div>

              <div className="admin-modal-footer" style={{ justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button className="admin-btn admin-btn-secondary" onClick={() => setQrModalItem(null)}>
                  Tutup
                </button>
                <button
                  className="admin-btn admin-btn-secondary"
                  onClick={() => window.open(postTestUrl, '_blank')}
                >
                  Test Link
                </button>
                <button className="admin-btn admin-btn-primary" onClick={() => handleDownloadQR(qrModalItem)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download QR Code
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
