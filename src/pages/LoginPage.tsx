import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { setAuthSession } from "../utils/auth";
import { Toast, type ToastType } from "../components/Toast";

export interface MasterDoctorItem {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  clinicLocation?: string | null;
  clinicAddress?: string | null;
  speciality?: string | null;
  micrositeId?: string | null;
}

interface MasterDoctorResponse {
  items: MasterDoctorItem[];
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

// Solid / filled icons matching the design mockup precisely
const UserFilledIcon = () => (
  <svg
    className="w-5 h-5 text-gray-500 shrink-0"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const PhoneFilledIcon = () => (
  <svg
    className="w-5 h-5 text-gray-500 shrink-0"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.44-5.15-3.75-6.59-6.59l1.97-1.57c.28-.27.36-.67.25-1.02A11.36 11.36 0 018.57 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.62c0-.55-.45-1-.99-1z" />
  </svg>
);

const MailFilledIcon = () => (
  <svg
    className="w-5 h-5 text-gray-500 shrink-0"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
  </svg>
);

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const regState = location.state as {
    registrationSuccess?: boolean;
    toastMessage?: string;
  } | null;

  // Keep fields empty as requested
  const [fullName, setFullName] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<MasterDoctorItem | null>(null);
  const [doctorResults, setDoctorResults] = useState<MasterDoctorItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    type: ToastType;
    message: string;
  }>({
    show: Boolean(regState?.registrationSuccess),
    type: "success",
    message:
      regState?.toastMessage ||
      "Akun berhasil dibuat! Silakan masuk dengan email dan nomor telepon Anda.",
  });

  // ── Debounce Master Doctor Search API Call ─────────────────────────────────
  useEffect(() => {
    const query = fullName.trim();

    // If query matches currently selected doctor's fullName, don't trigger re-search
    if (selectedDoctor && selectedDoctor.fullName === query) {
      return;
    }

    if (query.length < 3) {
      setDoctorResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);

    const abortController = new AbortController();

    // Debounce delay 1.5 detik setelah user selesai mengetik baru hit API
    const timer = setTimeout(async () => {
      try {
        const morinagaBaseUrl = (
          import.meta.env.VITE_MORINAGA_API_URL || "https://medical-api.morinaga.id"
        ).replace(/\/$/, "");
        const username = import.meta.env.VITE_MORINAGA_USERNAME || "mWPa9WrCHQ";
        const password = import.meta.env.VITE_MORINAGA_PASSWORD || "r5Zl6pThBb";
        const authHeader = "Basic " + btoa(`${username}:${password}`);
        const endpoint = `/api/external/magenta/get-master-doctor?search=${encodeURIComponent(query)}&page=1&size=10`;
        // Primary URL uses /morinaga-api proxy (handled by Vite in dev and by vercel.json in production) to avoid CORS issues
        const primaryUrl = `/morinaga-api${endpoint}`;
        const directUrl = `${morinagaBaseUrl}${endpoint}`;

        let items: MasterDoctorItem[] = [];
        try {
          const res = await fetch(primaryUrl, {
            headers: {
              Authorization: authHeader,
              Accept: "application/json",
            },
            signal: abortController.signal,
          });
          if (res.ok) {
            const data: MasterDoctorResponse = await res.json();
            items = data.items || [];
          } else {
            console.warn(
              `Primary proxy fetch returned status ${res.status}, trying direct URL`,
            );
            const directRes = await fetch(directUrl, {
              headers: {
                Authorization: authHeader,
                Accept: "application/json",
              },
              signal: abortController.signal,
            });
            if (directRes.ok) {
              const data: MasterDoctorResponse = await directRes.json();
              items = data.items || [];
            }
          }
        } catch (fetchErr: unknown) {
          if (fetchErr instanceof Error && fetchErr.name === "AbortError") return;
          try {
            const directRes = await fetch(directUrl, {
              headers: {
                Authorization: authHeader,
                Accept: "application/json",
              },
              signal: abortController.signal,
            });
            if (directRes.ok) {
              const data: MasterDoctorResponse = await directRes.json();
              items = data.items || [];
            }
          } catch (fallbackErr: unknown) {
            if (fallbackErr instanceof Error && fallbackErr.name === "AbortError") return;
            console.error("Master doctor search fetch error:", fallbackErr);
          }
        }

        setDoctorResults(items);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Failed to search master doctor:", err);
        setDoctorResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 1500);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [fullName, selectedDoctor]);

  // ── Handle outside click to close dropdown ──────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectDoctor = async (doctor: MasterDoctorItem) => {
    setFullName(doctor.fullName);
    setSelectedDoctor(doctor);
    setShowDropdown(false);
    if (errorMessage) setErrorMessage(null);

    // Initial fallback if doctor already has phone/email
    if (doctor.phone || doctor.phoneNumber) {
      const rawPhone = doctor.phone || doctor.phoneNumber || "";
      const cleanDigits = rawPhone.replace(/\D/g, "");
      const normalizedPhone = cleanDigits.startsWith("62")
        ? "0" + cleanDigits.slice(2)
        : cleanDigits.startsWith("0")
          ? cleanDigits
          : "0" + cleanDigits;
      setPhone(normalizedPhone);
    }
    if (doctor.email) {
      setEmail(doctor.email);
    }

    // Call detail endpoint: /api/external/magenta/get-master-doctor/{{doctorId}}/detail
    if (!doctor.id) return;

    try {
      setIsSearching(true);
      const morinagaBaseUrl = (
        import.meta.env.VITE_MORINAGA_API_URL || "https://medical-api.morinaga.id"
      ).replace(/\/$/, "");
      const username = import.meta.env.VITE_MORINAGA_USERNAME || "mWPa9WrCHQ";
      const password = import.meta.env.VITE_MORINAGA_PASSWORD || "r5Zl6pThBb";
      const authHeader = "Basic " + btoa(`${username}:${password}`);
      const endpoint = `/api/external/magenta/get-master-doctor/${encodeURIComponent(doctor.id)}/detail`;
      const primaryUrl = `/morinaga-api${endpoint}`;
      const directUrl = `${morinagaBaseUrl}${endpoint}`;

      let detailData: Record<string, unknown> | null = null;
      try {
        const res = await fetch(primaryUrl, {
          headers: {
            Authorization: authHeader,
            Accept: "application/json",
          },
        });
        if (res.ok) {
          detailData = await res.json();
        } else {
          const directRes = await fetch(directUrl, {
            headers: {
              Authorization: authHeader,
              Accept: "application/json",
            },
          });
          if (directRes.ok) {
            detailData = await directRes.json();
          }
        }
      } catch {
        const directRes = await fetch(directUrl, {
          headers: {
            Authorization: authHeader,
            Accept: "application/json",
          },
        });
        if (directRes.ok) {
          detailData = await directRes.json();
        }
      }

      if (detailData) {
        if (detailData.fullName && typeof detailData.fullName === "string") {
          setFullName(detailData.fullName);
        }
        if (detailData.phone) {
          const rawPhone = String(detailData.phone);
          const cleanDigits = rawPhone.replace(/\D/g, "");
          const normalizedPhone = cleanDigits.startsWith("62")
            ? "0" + cleanDigits.slice(2)
            : cleanDigits.startsWith("0")
              ? cleanDigits
              : "0" + cleanDigits;
          setPhone(normalizedPhone);
        }
        if (detailData.email && typeof detailData.email === "string") {
          setEmail(detailData.email);
        }
        setSelectedDoctor((prev) => ({
          ...(prev || doctor),
          ...(detailData as Partial<MasterDoctorItem>),
        }));
      }
    } catch (err) {
      console.error("Failed to fetch doctor detail:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // const handleQuickFill = () => {
  //   const dummy = DUMMY_USERS[0];
  //   setPhone(dummy.phone);
  //   setEmail(dummy.email);
  //   setErrorMessage(null);
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanFullName = fullName.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanFullName) {
      setErrorMessage("Silakan masukan atau pilih nama lengkap terlebih dahulu.");
      return;
    }

    if (!cleanPhone) {
      setErrorMessage("Nomor telepon wajib diisi.");
      return;
    }

    if (cleanEmail && !cleanEmail.includes("@")) {
      setErrorMessage("Format email tidak valid.");
      return;
    }

    setIsLoading(true);

    try {
      const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
      const primaryUrl = `${apiBaseUrl}/api/kalbe/login`;
      const fallbackUrl = `/api/kalbe/login`;

      const requestBody: {
        fullname: string;
        phone_number: string;
        email?: string;
        master_doctor_id?: string;
        microsite_id?: string;
        source?: string;
      } = {
        fullname: cleanFullName,
        phone_number: cleanPhone,
        source: selectedDoctor ? "dropdown" : "manual",
      };

      if (cleanEmail) {
        requestBody.email = cleanEmail;
      }

      if (selectedDoctor?.id) {
        requestBody.master_doctor_id = selectedDoctor.id;
      }

      if (selectedDoctor?.micrositeId) {
        requestBody.microsite_id = selectedDoctor.micrositeId;
      }

      const requestHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      if (
        apiBaseUrl.includes("ngrok") ||
        (typeof window !== "undefined" && window.location.hostname.includes("ngrok"))
      ) {
        requestHeaders["ngrok-skip-browser-warning"] = "true";
      }

      let res: Response;
      try {
        res = await fetch(primaryUrl, {
          method: "POST",
          headers: requestHeaders,
          body: JSON.stringify(requestBody),
        });
      } catch (primaryErr) {
        if (primaryUrl !== fallbackUrl) {
          console.warn("Primary login URL failed, attempting fallback URL:", primaryErr);
          res = await fetch(fallbackUrl, {
            method: "POST",
            headers: requestHeaders,
            body: JSON.stringify(requestBody),
          });
        } else {
          throw primaryErr;
        }
      }

      const json = await res.json().catch(() => ({}));

      if (!res.ok || json.success === false) {
        const message =
          json?.error?.message ||
          json?.error?.details ||
          json?.message ||
          "Login gagal. Silakan periksa kembali data Anda.";
        throw new Error(typeof message === "string" ? message : "Login gagal.");
      }

      const token = json.data?.access_token || json.access_token || json.token;
      if (!token) {
        throw new Error("Token otentikasi tidak ditemukan dari server.");
      }

      const respData = json.data || {};
      const finalFullName = (
        respData.fullname ||
        cleanFullName ||
        selectedDoctor?.fullName ||
        ""
      ).trim();
      const finalPhone = (respData.phone_number || cleanPhone || "").trim();
      const finalEmail = (respData.email || cleanEmail || "").trim();

      const userData = {
        ...respData,
        id: respData.id,
        fullname: finalFullName,
        fullName: finalFullName,
        nama: finalFullName,
        name: finalFullName,
        email: finalEmail,
        phone_number: finalPhone,
        phoneNumber: finalPhone,
        phone: finalPhone,
        practicePlace: respData.practice_place || selectedDoctor?.clinicLocation || "",
        practiceAddress:
          respData.practice_place_address || selectedDoctor?.clinicAddress || "",
        speciality: respData.speciality || selectedDoctor?.speciality || "",
        master_doctor_id: respData.master_doctor_id || selectedDoctor?.id || "",
        role: respData.role || "user",
        avatar: "/assets/docter-avatar.webp",
        registration_response: respData.registration_response,
      };

      setAuthSession(token, userData, rememberMe);

      sessionStorage.removeItem("kalbe_welcome_shown");
      sessionStorage.setItem("kalbe_welcome_pending", "true");
      sessionStorage.removeItem("kalbe_poster_shown");
      sessionStorage.setItem("kalbe_poster_pending", "true");

      if (redirectUrl && redirectUrl.startsWith("/")) {
        navigate(redirectUrl, { replace: true });
      } else {
        navigate("/home");
      }
    } catch (err: unknown) {
      console.error("Login submission error:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Gagal menghubungi server. Silakan coba beberapa saat lagi.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative h-full w-full flex flex-col justify-between bg-cover bg-top select-none overflow-hidden"
      style={{ backgroundImage: `url('/assets/tower-background.webp')` }}
    >
      {/* Top Floating Toast Notification */}
      <Toast
        show={toast.show}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />

      {/* Top Banner with Morinaga Tower & Kalbe Universe Logo */}
      <div className="relative h-[220px] sm:h-[240px] w-full shrink-0">
        <div className="absolute top-[68px] right-[16px] w-[172px]">
          <img
            src="/assets/kalbe-universe-logo.webp"
            alt="Kalbe Universe - Your Choice, Their Future."
            className="w-full h-auto object-contain pointer-events-none drop-shadow-sm"
          />
        </div>
      </div>

      {/* Sliced White Bottom Sheet Card */}
      <div
        className="relative flex-1 bg-white px-5 pt-6 pb-7 shadow-[0_-12px_32px_rgba(0,0,0,0.06)] flex flex-col justify-between"
        style={{ borderTopLeftRadius: "32px", borderTopRightRadius: "32px" }}
      >
        <div>
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-[26px] font-bold text-[#1E1E1E] leading-tight tracking-normal">
              Welcome
            </h1>
            <p className="text-[14px] text-[#4B5563] mt-0.5">Log in to your account.</p>
          </div>

          {/* Dummy User Hint & Auto-Fill helper */}
          {/* <div className="mb-3.5 p-2.5 rounded-lg bg-red-50/70 border border-red-100 flex items-center justify-between text-[11px] text-gray-600">
            <div>
              <span className="font-semibold text-[#8E000A] block">Akun Dummy Demo:</span>
              <span className="text-gray-500 font-mono">081234567890 / ridwan@kalbe.co.id</span>
            </div>
            <button
              type="button"
              onClick={handleQuickFill}
              className="px-2 py-1 bg-white hover:bg-red-50 text-[#C70412] font-semibold border border-[#C70412]/30 rounded text-[10px] active:scale-95 transition cursor-pointer shrink-0 ml-2"
            >
              Isi Otomatis
            </button>
          </div> */}

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mb-3.5 p-2.5 rounded-lg bg-red-100/90 border border-red-300 text-[12px] text-red-800 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Input 1: Nama Lengkap (Searchable Dropdown) */}
            <div className="relative" ref={dropdownRef}>
              <div className="relative flex items-center h-[48px] px-3.5 border border-[#D1D5DB] rounded-[8px] bg-white transition-all focus-within:border-[#C70412] focus-within:ring-1 focus-within:ring-[#C70412]/30">
                <UserFilledIcon />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setSelectedDoctor(null);
                    setShowDropdown(true);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  onFocus={() => {
                    if (fullName.trim().length > 0) {
                      setShowDropdown(true);
                    }
                  }}
                  placeholder="Masukan nama lengkap"
                  className="w-full pl-3 text-[14px] text-gray-800 placeholder-gray-400 bg-transparent outline-none font-normal"
                  autoComplete="off"
                />
                {isSearching && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-[#C70412] shrink-0 ml-2" />
                )}
              </div>

              {/* Search Dropdown Panel */}
              {showDropdown && fullName.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] bg-white rounded-[10px] border border-gray-200 shadow-xl max-h-[250px] overflow-y-auto z-50 py-1">
                  {isSearching && doctorResults.length === 0 ? (
                    <div className="py-3 px-4 text-center text-[13px] text-gray-500 font-medium">
                      Mencari dokter...
                    </div>
                  ) : doctorResults.length > 0 ? (
                    <>
                      {doctorResults.map((doc, idx) => (
                        <div
                          key={doc.id || idx}
                          onClick={() => handleSelectDoctor(doc)}
                          className="px-4 py-2.5 hover:bg-red-50/60 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 text-left flex flex-col gap-0.5"
                        >
                          <span className="text-[14px] font-semibold text-gray-800 leading-tight">
                            {doc.fullName}
                          </span>
                          {/* {doc.email || doc.phone || doc.phoneNumber ? (
                            <span className="text-[12px] text-gray-500 leading-tight">
                              {[doc.email, doc.phone || doc.phoneNumber]
                                .filter(Boolean)
                                .join(" • ")}
                            </span>
                          ) : null} */}
                        </div>
                      ))}
                      <div className="p-3 text-center border-t border-gray-100 bg-[#FAFAFD] sticky -bottom-1">
                        <button
                          type="button"
                          className="user-dropdown-register-btn"
                          onClick={() =>
                            navigate("/register", {
                              state: { fullName: fullName.trim() },
                            })
                          }
                        >
                          Belum terdaftar? Daftar di sini
                        </button>
                      </div>
                    </>
                  ) : fullName.trim().length >= 3 ? (
                    <div className="py-4 px-4 text-center flex flex-col items-center gap-2">
                      <p className="text-[13px] text-gray-500 font-medium">
                        Dokter tidak ditemukan
                      </p>
                      <button
                        type="button"
                        className="user-dropdown-register-btn"
                        onClick={() =>
                          navigate("/register", { state: { fullName: fullName.trim() } })
                        }
                      >
                        Belum terdaftar? Daftar di sini
                      </button>
                    </div>
                  ) : (
                    <div className="py-3 px-4 text-center text-[13px] text-gray-400 font-normal">
                      Ketik minimal 3 karakter untuk mencari...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input 2: Nomor Telepon */}
            <div className="relative flex items-center h-[48px] px-3.5 border border-[#D1D5DB] rounded-[8px] bg-white transition-all focus-within:border-[#C70412] focus-within:ring-1 focus-within:ring-[#C70412]/30">
              <PhoneFilledIcon />
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={phone}
                onChange={(e) => {
                  const numbersOnly = e.target.value.replace(/\D/g, "");
                  setPhone(numbersOnly);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Masukan nomor telepon"
                className="w-full pl-3 text-[14px] text-gray-800 placeholder-gray-400 bg-transparent outline-none font-normal"
              />
            </div>

            {/* Input 2: Email */}
            <div className="relative flex items-center h-[48px] px-3.5 border border-[#D1D5DB] rounded-[8px] bg-white transition-all focus-within:border-[#C70412] focus-within:ring-1 focus-within:ring-[#C70412]/30">
              <MailFilledIcon />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Masukan email (opsional)"
                className="w-full pl-3 text-[14px] text-gray-800 placeholder-gray-400 bg-transparent outline-none font-normal"
              />
            </div>

            {/* Ingatkan Saya & Lupa Password? */}
            <div className="flex items-center justify-between pt-1 pb-1 text-[13px]">
              <label className="flex items-center gap-2 cursor-pointer select-none text-[#374151]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#D1D5DB] text-[#C70412] accent-[#C70412] focus:ring-[#C70412] cursor-pointer"
                />
                <span>Ingatkan Saya</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-[#C70412] hover:text-[#8E000A] font-semibold transition-colors hidden"
              >
                Lupa Password?
              </Link>
            </div>

            {/* Action Button: MASUK */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                background: "linear-gradient(90deg, #C70412 0%, #8E000A 100%)",
              }}
              className="w-full h-[48px] rounded-[8px] text-white font-bold text-[16px] uppercase tracking-normal cursor-pointer flex items-center justify-center transition-all duration-150 active:scale-[0.99] hover:brightness-105 shadow-md shadow-red-900/20 mt-2.5 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>MEMPROSES...</span>
                </div>
              ) : (
                "MASUK"
              )}
            </button>
          </form>

          {/* Divider: Or */}
          <div className="flex items-center my-5">
            <div className="flex-1 h-px bg-[#E5E7EB]" />
            <span className="px-3.5 text-[12px] text-gray-400 font-normal">Or</span>
            <div className="flex-1 h-px bg-[#E5E7EB]" />
          </div>

          {/* Footer: Belum punya akun? DAFTAR */}
          <div className="text-center text-[15px] sm:text-[16px] text-[#374151] pt-1">
            <span>Belum punya akun? </span>
            <Link
              to="/register"
              className="font-extrabold text-[16px] sm:text-[17px] text-[#E59A00] hover:text-[#C88500] hover:underline transition-all tracking-wide ml-0.5 inline-block"
            >
              DAFTAR
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
