import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authenticateUser, DUMMY_USERS } from '../data/dummyUser';

// Solid / filled icons matching the design mockup precisely
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
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleQuickFill = () => {
    const dummy = DUMMY_USERS[0];
    setPhone(dummy.phone);
    setEmail(dummy.email);
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const result = authenticateUser(phone, email);
    if (!result.success) {
      setErrorMessage(result.error || 'Nomor telepon atau email salah.');
      return;
    }

    navigate('/home');
  };

  return (
    <div
      className="relative min-h-full w-full flex flex-col justify-between bg-cover bg-top select-none"
      style={{ backgroundImage: `url('/assets/tower-background.png')` }}
    >
      {/* Top Banner with Morinaga Tower & Kalbe Universe Logo */}
      <div className="relative h-[280px] w-full shrink-0">
        <div className="absolute top-[68px] right-[16px] w-[172px]">
          <img
            src="/assets/kalbe-universe-logo.png"
            alt="Kalbe Universe - Your Choice, Their Future."
            className="w-full h-auto object-contain pointer-events-none drop-shadow-sm"
          />
        </div>
      </div>

      {/* Sliced White Bottom Sheet Card */}
      <div
        className="relative flex-1 bg-white px-5 pt-6 pb-7 shadow-[0_-12px_32px_rgba(0,0,0,0.06)] flex flex-col justify-between"
        style={{ borderTopLeftRadius: '32px', borderTopRightRadius: '32px' }}
      >
        <div>
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-[26px] font-bold text-[#1E1E1E] leading-tight tracking-normal">
              Welcome
            </h1>
            <p className="text-[14px] text-[#4B5563] mt-0.5">
              Log in to your account.
            </p>
          </div>

          {/* Dummy User Hint & Auto-Fill helper */}
          <div className="mb-3.5 p-2.5 rounded-lg bg-red-50/70 border border-red-100 flex items-center justify-between text-[11px] text-gray-600">
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
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mb-3.5 p-2.5 rounded-lg bg-red-100/90 border border-red-300 text-[12px] text-red-800 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Input 1: Nomor Telepon */}
            <div className="relative flex items-center h-[48px] px-3.5 border border-[#D1D5DB] rounded-[8px] bg-white transition-all focus-within:border-[#C70412] focus-within:ring-1 focus-within:ring-[#C70412]/30">
              <PhoneFilledIcon />
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
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
                placeholder="Masukan email"
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
                className="text-[#C70412] hover:text-[#8E000A] font-semibold transition-colors"
              >
                Lupa Password?
              </Link>
            </div>

            {/* Action Button: MASUK */}
            <button
              type="submit"
              style={{
                background: 'linear-gradient(90deg, #C70412 0%, #8E000A 100%)',
              }}
              className="w-full h-[48px] rounded-[8px] text-white font-bold text-[16px] uppercase tracking-normal cursor-pointer flex items-center justify-center transition-all duration-150 active:scale-[0.99] hover:brightness-105 shadow-md shadow-red-900/20 mt-2.5"
            >
              MASUK
            </button>
          </form>

          {/* Divider: Or */}
          <div className="flex items-center my-5">
            <div className="flex-1 h-px bg-[#E5E7EB]" />
            <span className="px-3.5 text-[12px] text-gray-400 font-normal">Or</span>
            <div className="flex-1 h-px bg-[#E5E7EB]" />
          </div>

          {/* Footer: Belum punya akun? DAFTAR */}
          <div className="text-center text-[13px] text-[#374151]">
            <span>Belum punya akun? </span>
            <Link
              to="/register"
              className="font-bold text-[#E59A00] hover:text-[#C88500] transition-colors"
            >
              DAFTAR
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};


