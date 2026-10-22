import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getToken } from "../utils/auth";
import { getKalbeBoothsList } from "../utils/kalbeApi";

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

    const typeParam = (searchParams.get("type") || "").toLowerCase();
    const nameParam = (searchParams.get("name") || "").toLowerCase();
    const isEarlyParam =
      typeParam.includes("early") ||
      typeParam.includes("life") ||
      nameParam.includes("early") ||
      nameParam.includes("life");

    const defaultBoothType = isEarlyParam ? "early-life" : "morinaga-booth";

    const token = getToken();
    if (!token) {
      // Simpan flag external scan di sessionStorage
      sessionStorage.setItem("kalbe_external_scan_booth_id", boothId);
      sessionStorage.setItem("kalbe_external_scan_booth_type", defaultBoothType);

      // User belum login -> simpan redirect url lengkap
      const currentUrl = `/booth-checkin${window.location.search}`;
      navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`, { replace: true });
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        let isEarly = isEarlyParam;

        // Jika param type & name tidak ada, verifikasi dari API daftar booth
        if (!typeParam && !nameParam) {
          const booths = await getKalbeBoothsList().catch(() => []);
          const matchedBooth = booths.find((b) => b.id === boothId);
          const nameLower = (matchedBooth?.name || "").toLowerCase();
          isEarly = nameLower.includes("early") || nameLower.includes("life");
        }

        const boothType = isEarly ? "early-life" : "morinaga-booth";

        // Simpan flag external scan di sessionStorage
        sessionStorage.setItem("kalbe_external_scan_booth_id", boothId);
        sessionStorage.setItem("kalbe_external_scan_booth_type", boothType);

        if (isMounted) {
          navigate("/home", {
            replace: true,
            state: {
              openBoothFromExternalScan: boothType,
              externalBoothId: boothId,
            },
          });
        }
      } catch (err: unknown) {
        console.error("Failed to process booth check-in redirect:", err);
        if (isMounted) {
          navigate("/home", { replace: true });
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
            <p className="text-[14px] text-gray-700">{errorMessage}</p>
          </>
        ) : (
          <>
            <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[15px] font-semibold text-gray-800">
              Membuka Booth...
            </p>
          </>
        )}
      </div>
    </div>
  );
};
