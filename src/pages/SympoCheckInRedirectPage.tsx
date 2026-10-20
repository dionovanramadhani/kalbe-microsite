import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getToken } from "../utils/auth";
import {
  insertKalbeSymposiumParticipant,
  getKalbeSymposiumToday,
} from "../utils/kalbeApi";
import { setSymposiumJoined } from "../data/symposiumStore";

export const SympoCheckInRedirectPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const symposiumId = searchParams.get("symposium_id");

    const token = getToken();
    if (!token) {
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

        if (targetSympoId) {
          await insertKalbeSymposiumParticipant(targetSympoId).catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : "";
            if (!msg.toLowerCase().includes("already")) {
              console.warn("Insert symposium participant warning:", err);
            }
          });
        }

        setSymposiumJoined(true);

        if (isMounted) {
          navigate(
            `/post-test${targetSympoId ? `?symposium_id=${encodeURIComponent(targetSympoId)}` : ""}`,
            { replace: true }
          );
        }
      } catch (err: unknown) {
        console.error("Failed to process symposium check-in:", err);
        if (isMounted) {
          setErrorMessage("Gagal memproses check-in simposium. Mengalihkan ke Beranda...");
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
            <h2 className="text-[16px] font-bold text-gray-800 mb-1">Check-In Gagal</h2>
            <p className="text-[12px] text-gray-500 leading-relaxed mb-2">{errorMessage}</p>
          </>
        ) : (
          <>
            <div className="w-10 h-10 border-3 border-[#C70412] border-t-transparent rounded-full animate-spin mb-4" />
            <h2 className="text-[16px] font-bold text-[#C70412] mb-1">Check-In Simposium</h2>
            <p className="text-[12px] text-gray-500 leading-relaxed">
              Sedang memproses partisipasi simposium dan menyiapkan post-test...
            </p>
          </>
        )}
      </div>
    </div>
  );
};
