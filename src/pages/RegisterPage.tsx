import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const SPECIALITIES = ["PPDS", "GP", "DSA", "Other"];

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [practicePlace, setPracticePlace] = useState("");
  const [practiceAddress, setPracticeAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+62");
  const [speciality, setSpeciality] = useState<string>("");
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (
      !fullName.trim() ||
      !practicePlace.trim() ||
      !practiceAddress.trim() ||
      !email.trim()
    ) {
      setErrorMessage("Silakan lengkapi semua data formulir pendaftaran.");
      return;
    }

    if (!speciality) {
      setErrorMessage("Silakan pilih salah satu Speciality.");
      return;
    }

    if (!agreed) {
      setErrorMessage("Anda harus menyetujui Syarat Ketentuan dan Kebijakan Privasi.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert(
        `Pendaftaran Berhasil!\nNama: ${fullName}\nSpeciality: ${speciality}\nEmail: ${email}`,
      );
      navigate("/login");
    }, 600);
  };

  return (
    <div
      className="relative min-h-full w-full flex flex-col justify-between bg-cover bg-top select-none"
      style={{ backgroundImage: `url('/assets/red-and-white-curve-bg.png')` }}
    >
      {/* Top Banner Section with Centered Kalbe Universe Logo */}
      <div className="relative h-[180px] w-full shrink-0 flex items-center justify-center pt-2">
        <div className="w-[175px] sm:w-[190px]">
          <img
            src="/assets/kalbe-universe-logo.png"
            alt="Kalbe Universe - Your Choice, Their Future."
            className="w-full h-auto object-contain pointer-events-none drop-shadow-sm"
          />
        </div>
      </div>

      {/* Sliced White Bottom Sheet Card */}
      <div
        className="relative -mt-5 flex-1 bg-white px-5 sm:px-6 pt-6 pb-8 shadow-[0_-12px_32px_rgba(0,0,0,0.06)] flex flex-col justify-between"
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
            {errorMessage && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {/* Nama lengkap */}
            <div>
              <label className="block text-[14px] text-[#374151] mb-1.5 font-normal">
                Nama lengkap
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
                Tempat praktik
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
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-[14px] text-[#374151] mb-1.5 font-normal">
                Email
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
                Nomor hanphone (Whatsapp)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-[48px] px-3.5 border border-[#D1D5DB] rounded-[8px] text-[14px] text-gray-800 bg-white transition-all focus:border-[#C70412] focus:ring-1 focus:ring-[#C70412]/30 outline-none font-normal"
                required
              />
            </div>

            {/* Speciality */}
            <div className="pt-1">
              <label className="block text-[14px] text-[#374151] mb-2 font-normal">
                Speciality
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
              to="/login"
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
