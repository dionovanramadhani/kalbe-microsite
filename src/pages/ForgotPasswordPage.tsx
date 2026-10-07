import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  return (
    <div className="relative min-h-full flex flex-col justify-between bg-white px-6 py-8">
      <div>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Login</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Lupa Password</h1>
        <p className="text-sm text-gray-500 mt-1">Atur ulang password akun Kalbe Universe Anda.</p>
      </div>

      <div className="text-center text-sm text-gray-500 py-12">
        <p>(Form Reset Password akan segera hadir)</p>
      </div>

      <div className="text-center text-sm">
        <Link to="/login" className="text-[#C70412] font-semibold hover:underline">
          Kembali ke halaman Masuk
        </Link>
      </div>
    </div>
  );
};
