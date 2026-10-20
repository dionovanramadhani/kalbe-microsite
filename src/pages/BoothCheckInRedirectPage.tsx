import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getToken } from "../utils/auth";
import {
  insertKalbeBoothParticipant,
  getKalbeBoothsList,
} from "../utils/kalbeApi";
import {
  setBoothDetailingCompleted,
  setEarlyLifeDetailingCompleted,
  unlockReward,
} from "../data/rewardStore";

export const BoothCheckInRedirectPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const boothId = searchParams.get("booth_id");

    if (!boothId) {
      setErrorMessage("QR Code tidak memuat booth_id yang valid.");
      setTimeout(() => navigate("/home"), 2000);
      return;
    }

    const token = getToken();
    if (!token) {
      // User belum login -> simpan redirect url
      const currentUrl = `/booth-checkin?booth_id=${encodeURIComponent(boothId)}`;
      navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`, { replace: true });
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        // Panggil endpoint insert booth participant
        await insertKalbeBoothParticipant(boothId).catch((err: unknown) => {
          // Jika error 409 (sudah pernah check in), biarkan lanjut tanpa block user
          const msg = err instanceof Error ? err.message : "";
          if (!msg.toLowerCase().includes("already")) {
            console.warn("Insert booth participant warning:", err);
          }
        });

        // Cari tahu apakah booth ini Morinaga Booth atau Kalbe Early Life Solutions
        const booths = await getKalbeBoothsList().catch(() => []);
        const matchedBooth = booths.find((b) => b.id === boothId);
        const typeParam = (searchParams.get("type") || "").toLowerCase();
        const nameParam = (searchParams.get("name") || "").toLowerCase();
        const nameLower = (matchedBooth?.name || nameParam).toLowerCase();
        const isEarly =
          typeParam.includes("early") ||
          typeParam.includes("life") ||
          nameLower.includes("early") ||
          nameLower.includes("life");

        if (isEarly) {
          setEarlyLifeDetailingCompleted(true);
          if (isMounted) {
            navigate("/home", { replace: true, state: { showEarlyLifeSuccessModal: true } });
          }
        } else {
          setBoothDetailingCompleted(true);
          unlockReward("morinaga-booth");
          if (isMounted) {
            navigate("/home", { replace: true, state: { showBoothSuccessModal: true } });
          }
        }
      } catch (err: unknown) {
        console.error("Failed to process booth check-in:", err);
        if (isMounted) {
          setErrorMessage("Gagal memproses check-in booth. Mengalihkan ke Beranda...");
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
            <h2 className="text-[16px] font-bold text-[#C70412] mb-1">Check-In Booth</h2>
            <p className="text-[12px] text-gray-500 leading-relaxed">
              Sedang memproses kunjungan booth Anda...
            </p>
          </>
        )}
      </div>
    </div>
  );
};
