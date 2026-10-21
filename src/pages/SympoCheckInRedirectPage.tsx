import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getToken } from "../utils/auth";
import { getKalbeSymposiumToday } from "../utils/kalbeApi";

export const SympoCheckInRedirectPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const symposiumId = searchParams.get("symposium_id");

    const token = getToken();
    if (!token) {
      sessionStorage.setItem("kalbe_scanned_from_external_qr", "true");
      if (symposiumId) {
        sessionStorage.setItem("kalbe_external_sympo_id", symposiumId);
      }
      const currentUrl = `/sympo-checkin${window.location.search}`;
      navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`, { replace: true });
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        let targetSympoId = symposiumId;
        if (!targetSympoId) {
          const today = await getKalbeSymposiumToday().catch(() => null);
          if (today?.id) {
            targetSympoId = today.id;
          }
        }

        // Tandai bahwa user sudah scan QR symposium dari luar microsite (external QR scan)
        sessionStorage.setItem("kalbe_scanned_from_external_qr", "true");
        if (targetSympoId) {
          sessionStorage.setItem("kalbe_external_sympo_id", targetSympoId);
        }

        if (isMounted) {
          navigate("/home", { replace: true, state: { fromSympoScan: true } });
        }
      } catch (err: unknown) {
        console.error("Failed to process symposium access:", err);
        if (isMounted) {
          setErrorMessage("Gagal memproses akses simposium. Mengalihkan ke Beranda...");
          setTimeout(() => navigate("/home", { replace: true }), 2500);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [searchParams, navigate]);

  return (
    <div
      className="font-kalbe relative h-full w-full flex flex-col justify-center items-center bg-cover bg-top select-none px-6 py-8"
      style={{
        backgroundImage: `url('/assets/red-and-white-curve-bg.webp')`,
        fontFamily: "KalbeGeometric, Arial, sans-serif",
      }}
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-red-100 max-w-[320px] w-full flex flex-col items-center text-center">
        {errorMessage ? (
          <>
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
              <span className="text-xl font-bold">!</span>
            </div>
            <h2 className="text-[16px] font-bold text-gray-800 mb-1">Gagal</h2>
            <p className="text-[12px] text-gray-500 leading-relaxed mb-2">{errorMessage}</p>
          </>
        ) : (
          <>
            <div className="w-10 h-10 border-3 border-[#C70412] border-t-transparent rounded-full animate-spin mb-4" />
            <h2 className="text-[16px] font-bold text-[#C70412] mb-1">Akses Simposium</h2>
            <p className="text-[12px] text-gray-500 leading-relaxed">
              Menyiapkan akses simposium dan mengalihkan ke Beranda...
            </p>
          </>
        )}
      </div>
    </div>
  );
};
