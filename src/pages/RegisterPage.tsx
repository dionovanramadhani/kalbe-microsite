import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { saveRegisteredUser, type User } from "../data/dummyUser";
import { setAuthSession } from "../utils/auth";
import { Toast, type ToastType } from "../components/Toast";
import {
  formatPhoneE164,
  registerExternalMorinagaEvent,
  type ExternalMorinagaRegisterPayload,
} from "../utils/kalbeApi";

const SPECIALITIES = ["PPDS", "GP", "DSA", "Other"];

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const regFullName = (location.state as { fullName?: string } | null)?.fullName || "";
  const [fullName, setFullName] = useState(regFullName);
  const [practicePlace, setPracticePlace] = useState("");
  const [practiceAddress, setPracticeAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [speciality, setSpeciality] = useState<string>("");
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Bersihkan penanda registrasi sukses lama agar tidak muncul toaster palsu saat kembali ke login
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("kalbe_just_registered");
      if (location.state?.registrationSuccess) {
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state]);

  // Toast State
  const [toast, setToast] = useState<{
    show: boolean;
    type: ToastType;
    message: string;
  }>({
    show: false,
    type: "error",
    message: "",
  });

  const showToast = (type: ToastType, message: string) => {
    setToast({
      show: true,
      type,
      message,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanDigits = phone.trim().replace(/\D/g, "");

    if (!fullName.trim() || !practicePlace.trim() || !email.trim() || !cleanDigits) {
      showToast("error", "Silakan lengkapi semua data formulir pendaftaran.");
      return;
    }

    if (cleanDigits.length < 8) {
      showToast("error", "Nomor handphone minimal 8 digit setelah +62.");
      return;
    }

    if (!speciality) {
      showToast("error", "Silakan pilih salah satu Speciality.");
      return;
    }

    if (!agreed) {
      showToast("error", "Anda harus menyetujui Syarat Ketentuan dan Kebijakan Privasi.");
      return;
    }

    setIsLoading(true);

    const fullPhoneNumber = `0${cleanDigits}`;
    const e164Phone = formatPhoneE164(cleanDigits);

    try {
      // 1. Panggil API External Morinaga Event Register (Production) terlebih dahulu
      let externalEventResponse: Record<string, unknown> | null = null;
      try {
        const externalPayload: ExternalMorinagaRegisterPayload = {
          micrositeId: "00000000-0000-0000-0000-000000000000",
          partnerId: null,
          fullName: fullName.trim(),
          clinicLocation: practicePlace.trim(),
          clinicAddress: practiceAddress.trim(),
          email: email.trim(),
          phone: e164Phone,
          speciality: speciality,
          acceptTnC: true,
          source: "manual",
          answeredQuestions: [],
        };
        console.log("[1. API External Register PROD] Sending payload:", externalPayload);
        externalEventResponse = await registerExternalMorinagaEvent(externalPayload);
        console.log(
          "[1. API External Register PROD] Received response:",
          externalEventResponse,
        );

        // Jika API external mengembalikan error (misal code 400 atau status gagal), tampilkan pesan error di toaster
        if (externalEventResponse) {
          const code = Number(externalEventResponse.code);
          const hasError =
            code >= 400 ||
            externalEventResponse.success === false ||
            (code !== 200 && code !== 201 && Boolean(externalEventResponse.message));

          if (hasError && externalEventResponse.message) {
            const errorMsg = String(externalEventResponse.message);
            showToast("error", errorMsg);
            setIsLoading(false);
            return;
          }
        }
      } catch (extErr) {
        console.warn("[1. API External Register PROD] Error occurred:", extErr);
      }

      // 2. Setelah itu, baru panggil API registrasi kita (Internal Backend)
      console.log("[2. API Internal Register] Calling /api/kalbe/register...");
      const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
      const reqHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (
        BASE_URL.includes("ngrok") ||
        (typeof window !== "undefined" && window.location.hostname.includes("ngrok"))
      ) {
        reqHeaders["ngrok-skip-browser-warning"] = "true";
      }

      const res = await fetch(`${BASE_URL}/api/kalbe/register`, {
        method: "POST",
        headers: reqHeaders,
        body: JSON.stringify({
          fullname: fullName.trim(),
          practice_place: practicePlace.trim(),
          practice_place_address: practiceAddress.trim(),
          email: email.trim(),
          phone_number: fullPhoneNumber,
          speciality: speciality,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        let errorMsg = "Pendaftaran gagal. Silakan coba lagi.";
        if (json?.error?.details) {
          if (typeof json.error.details === "string") {
            errorMsg = json.error.details;
          } else if (typeof json.error.details === "object") {
            errorMsg = Object.values(json.error.details).join(", ");
          }
        } else if (json?.error?.message) {
          errorMsg = json.error.message;
        } else if (json?.message) {
          errorMsg = json.message;
        }

        if (errorMsg === "email already registered") {
          errorMsg = "Email sudah terdaftar. Silakan gunakan email lain atau masuk.";
        } else if (errorMsg === "phone number already registered") {
          errorMsg =
            "Nomor handphone sudah terdaftar. Silakan gunakan nomor lain atau masuk.";
        }

        showToast("error", errorMsg);
        return;
      }

      const token = json?.data?.access_token;
      const respData = json?.data || {};

      const finalFullName = (respData.fullname || fullName.trim()).trim();
      const finalEmail = (respData.email || email.trim()).trim();
      const finalPhone = (respData.phone_number || fullPhoneNumber).trim();

      const authUserData = {
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
        practicePlace: respData.practice_place || practicePlace.trim(),
        practiceAddress: respData.practice_place_address || practiceAddress.trim(),
        speciality: respData.speciality || speciality,
        master_doctor_id: respData.master_doctor_id || "",
        role: respData.role || "user",
        avatar: "/assets/docter-avatar.webp",
        registration_response: externalEventResponse || respData.registration_response,
      };

      if (token) {
        setAuthSession(token, authUserData, true);
      }

      const userData: User = {
        id: authUserData.id || `user-${Date.now()}`,
        fullName: finalFullName,
        phone: finalPhone,
        email: finalEmail,
        speciality: authUserData.speciality,
        practicePlace: authUserData.practicePlace,
        practiceAddress: authUserData.practiceAddress,
        avatar: "/assets/docter-avatar.webp",
        registration_response: authUserData.registration_response,
      };
      saveRegisteredUser(userData);

      sessionStorage.removeItem("kalbe_welcome_shown");
      sessionStorage.setItem("kalbe_welcome_pending", "true");
      sessionStorage.removeItem("kalbe_poster_shown");
      sessionStorage.setItem("kalbe_poster_pending", "true");
      sessionStorage.setItem("kalbe_from_login", "true");

      if (redirectUrl?.includes("sympo-checkin")) {
        sessionStorage.setItem("kalbe_scanned_from_external_qr", "true");
      }
      sessionStorage.removeItem("kalbe_scanned_from_device");
      sessionStorage.removeItem("kalbe_sympo_scanned");

      // Success Registration Toast
      showToast("success", "Registrasi berhasil! Mengalihkan ke beranda...");

      // Redirect to homepage after brief delay so user sees toast
      setTimeout(() => {
        if (redirectUrl && redirectUrl.startsWith("/")) {
          navigate(redirectUrl, { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }, 1000);
    } catch (err: unknown) {
      sessionStorage.removeItem("kalbe_just_registered");
      console.error("Registration request error:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan koneksi saat mendaftar. Silakan coba lagi.";
      showToast("error", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Test
    <div
      className="relative h-full w-full flex flex-col bg-cover bg-top select-none overflow-y-auto"
      style={{
        backgroundImage: `url('/assets/red-and-white-curve-bg.webp')`,
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* Top Floating Toast Notification */}
      <Toast
        show={toast.show}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />

      {/* Top Banner Section with Centered Kalbe Universe Logo */}
      <div className="relative h-[180px] w-full shrink-0 flex items-center justify-center pt-2">
        <div className="w-[175px] sm:w-[190px]">
          <img
            src="/assets/kalbe-universe-logo.webp"
            alt="Kalbe Universe - Your Choice, Their Future."
            className="w-full h-auto object-contain pointer-events-none drop-shadow-sm"
          />
        </div>
      </div>

      {/* Sliced White Bottom Sheet Card */}
      <div
        className="relative -mt-5 flex-1 min-h-fit bg-white px-5 sm:px-6 pt-6 pb-10 shadow-[0_-12px_32px_rgba(0,0,0,0.06)] flex flex-col justify-between shrink-0"
        style={{ borderTopLeftRadius: "32px", borderTopRightRadius: "32px" }}
      >
        <div>
          {/* Heading */}
          <div className="mb-5">
            <h1 className="text-[26px] font-bold text-[#1E1E1E] leading-tight tracking-normal">
              Buat Akun
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nama lengkap */}
            <div>
              <label className="block text-[14px] text-[#374151] mb-1.5 font-normal">
                Nama lengkap <span className="text-[#C70412]">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-[48px] px-3.5 border border-[#D1D5DB] rounded-[8px] text-[14px] text-gray-800 bg-white transition-all focus:border-[#C70412] focus:ring-1 focus:ring-[#C70412]/30 outline-none font-normal"
                required
              />
            </div>

            {/* Tempat praktik */}
            <div>
              <label className="block text-[14px] text-[#374151] mb-1.5 font-normal">
                Tempat praktik <span className="text-[#C70412]">*</span>
              </label>
              <input
                type="text"
                value={practicePlace}
                onChange={(e) => setPracticePlace(e.target.value)}
                className="w-full h-[48px] px-3.5 border border-[#D1D5DB] rounded-[8px] text-[14px] text-gray-800 bg-white transition-all focus:border-[#C70412] focus:ring-1 focus:ring-[#C70412]/30 outline-none font-normal"
                required
              />
            </div>

            {/* Alamat tempat praktik */}
            <div>
              <label className="block text-[14px] text-[#374151] mb-1.5 font-normal">
                Alamat tempat praktik
              </label>
              <input
                type="text"
                value={practiceAddress}
                onChange={(e) => setPracticeAddress(e.target.value)}
                className="w-full h-[48px] px-3.5 border border-[#D1D5DB] rounded-[8px] text-[14px] text-gray-800 bg-white transition-all focus:border-[#C70412] focus:ring-1 focus:ring-[#C70412]/30 outline-none font-normal"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-[14px] text-[#374151] mb-1.5 font-normal">
                Email <span className="text-[#C70412]">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[48px] px-3.5 border border-[#D1D5DB] rounded-[8px] text-[14px] text-gray-800 bg-white transition-all focus:border-[#C70412] focus:ring-1 focus:ring-[#C70412]/30 outline-none font-normal"
                required
              />
            </div>

            {/* Nomor hanphone (Whatsapp) */}
            <div>
              <label className="block text-[14px] text-[#374151] mb-1.5 font-normal">
                Nomor handphone (Whatsapp) <span className="text-[#C70412]">*</span>
              </label>
              <div className="relative flex items-center h-[48px] border border-[#D1D5DB] rounded-[8px] bg-white transition-all focus-within:border-[#C70412] focus-within:ring-1 focus-within:ring-[#C70412]/30 overflow-hidden px-3.5">
                {/* Immutable Country Code Prefix */}
                <div className="h-full flex items-center justify-center select-none shrink-0 pointer-events-none pr-1">
                  <span className="text-[14px] text-gray-700 tracking-wide">+62</span>
                </div>

                {/* Number Input (User only inputs digits after +62) */}
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => {
                    // Only accept digits, and if user types leading 0 or 62, normalize it
                    let raw = e.target.value.replace(/\D/g, "");
                    if (raw.startsWith("62")) {
                      raw = raw.slice(2);
                    }
                    if (raw.startsWith("0")) {
                      raw = raw.slice(1);
                    }
                    setPhone(raw);
                  }}
                  className="w-full h-full pl-1 pr-1 text-[14px] text-gray-800 bg-transparent outline-none font-normal placeholder:text-gray-400"
                  required
                />
              </div>
            </div>

            {/* Speciality */}
            <div className="pt-1">
              <label className="block text-[14px] text-[#374151] mb-2 font-normal">
                Speciality <span className="text-[#C70412]">*</span>
              </label>
              <div className="space-y-2.5">
                {SPECIALITIES.map((spec) => {
                  const isSelected = speciality === spec;
                  return (
                    <label
                      key={spec}
                      className="flex items-center gap-3 cursor-pointer select-none group"
                      onClick={() => setSpeciality(spec)}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? "border-[#C70412]"
                            : "border-[#D1D5DB] group-hover:border-gray-400"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#C70412]" />
                        )}
                      </div>
                      <span className="text-[14px] text-[#374151] font-normal">
                        {spec}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Agreement Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-[#D1D5DB] text-[#C70412] accent-[#C70412] focus:ring-[#C70412] cursor-pointer shrink-0"
                />
                <span className="text-[12px] text-[#4B5563] leading-relaxed">
                  Dengan mengklik &ldquo;Saya setuju&rdquo; saya menyatakan telah membaca
                  dan menyetujui{" "}
                  <span className="text-[#C70412] font-bold hover:underline cursor-pointer">
                    Syarat Ketentuan
                  </span>{" "}
                  dan{" "}
                  <span className="text-[#C70412] font-bold hover:underline cursor-pointer">
                    Kebijakan Privasi
                  </span>
                </span>
              </label>
            </div>

            {/* Action Button: DAFTAR */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                background: "linear-gradient(90deg, #C70412 0%, #8E000A 100%)",
              }}
              className="w-full h-[48px] rounded-[8px] text-white font-bold text-[16px] uppercase tracking-normal cursor-pointer flex items-center justify-center transition-all duration-150 active:scale-[0.99] hover:brightness-105 shadow-md shadow-red-900/20 disabled:opacity-75 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>MEMPROSES...</span>
                </div>
              ) : (
                "DAFTAR"
              )}
            </button>
          </form>

          {/* Footer: Sudah punya akun? MASUK */}
          <div className="text-center text-[13px] text-[#374151] mt-6">
            <span>Sudah punya akun? </span>
            <Link
              to={
                redirectUrl
                  ? `/login?redirect=${encodeURIComponent(redirectUrl)}`
                  : "/login"
              }
              state={{}}
              className="font-bold text-[#E59A00] hover:text-[#C88500] transition-colors"
            >
              MASUK
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
