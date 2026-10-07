import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

interface MissionItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
}

const MISSIONS: MissionItem[] = [
  {
    id: "morinaga-sympo",
    title: "Morinaga Sympo",
    subtitle: "Ikuti Symposium",
    icon: "/assets/morinaga-sympo-icon.png",
  },
  {
    id: "morinaga-booth",
    title: "Morinaga Booth",
    subtitle: "Detailing",
    icon: "/assets/morinaga-booth-icon.png",
  },
  {
    id: "kalbe-60th",
    title: "Kalbe 60th Booth",
    subtitle: "Detailing",
    icon: "/assets/kalbe-60th-icon.png",
  },
  {
    id: "early-life",
    title: "Early Life Solutions",
    subtitle: "Detailing",
    icon: "/assets/kalbe-60th-icon.png",
  },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [hasReward, setHasReward] = useState(true);

  const handleClaimReward = () => {
    alert("Selamat! Anda telah mengklaim reward Kalbe Universe.");
    setHasReward(false);
  };

  const handleEnterMission = (mission: MissionItem) => {
    if (mission.id === "morinaga-sympo") {
      navigate("/symposium");
      return;
    }
    alert(`Membuka aktivitas: ${mission.title} (${mission.subtitle})`);
  };

  return (
    <div
      className="font-kalbe relative min-h-full w-full flex flex-col bg-cover bg-top select-none pb-10"
      style={{
        backgroundImage: `url('/assets/tower-background.png')`,
        fontFamily: "KalbeGeometric, Arial, sans-serif",
      }}
    >
      {/* Top Section with Morinaga Tower & Kalbe Universe Logo (Shifted higher up) */}
      <div className="relative h-[200px] w-full shrink-0">
        <div className="absolute top-[42px] right-[16px] w-[172px]">
          <img
            src="/assets/kalbe-universe-logo.png"
            alt="Kalbe Universe - Your Choice, Their Future."
            className="w-full h-auto object-contain pointer-events-none drop-shadow-sm"
          />
        </div>
      </div>

      {/* Floating Badges Row: Doctor Info & Claim Reward (Enlarged & spaced) */}
      <div className="relative px-3 flex items-center justify-between gap-2.5 mb-3.5 z-10">
        {/* Doctor Info Badge (Enlarged for better spacing) */}
        <div
          className="relative flex items-center h-[52px] pr-4 pl-1 shrink-0"
          style={{
            backgroundImage: `url('/assets/docter-bg.png')`,
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
            width: "202px",
          }}
        >
          <img
            src="/assets/docter-avatar.png"
            alt="dr. Ridwan Setiawan"
            className="w-[54px] h-[54px] -ml-2.5 shrink-0 object-contain drop-shadow"
          />
          <div className="ml-2 flex flex-col justify-center overflow-hidden">
            <span className="text-[12.5px] font-bold text-[#1E1E1E] leading-tight">
              Hello,
            </span>
            <span className="text-[11.5px] font-semibold text-[#444444] truncate leading-tight mt-0.5">
              dr. Ridwan Setiawan
            </span>
          </div>
        </div>

        {/* Claim Reward Badge (Enlarged) */}
        <button
          onClick={handleClaimReward}
          className="relative flex items-center justify-center gap-2 h-[48px] px-3.5 shrink-0 cursor-pointer transition-transform active:scale-95 hover:brightness-105"
          style={{
            backgroundImage: `url('/assets/reward-claim-bg.png')`,
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
            width: "152px",
          }}
        >
          <img
            src="/assets/reward-icon-red.png"
            alt="Reward Gift"
            className="w-[23px] h-[23px] object-contain shrink-0"
          />
          <span className="text-[12.5px] font-bold text-[#C70412] tracking-tight">
            Klaim Hadiah
          </span>

          {hasReward && (
            <span className="absolute -top-1.5 -right-0.5 w-[19px] h-[19px] bg-[#E50014] text-white text-[10.5px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              1
            </span>
          )}
        </button>
      </div>

      {/* Main Mission Card ("Misi Utama") */}
      <div className="relative px-3 flex-1 flex flex-col z-10">
        <div
          className="relative w-full px-3.5 pt-4 pb-5"
          style={{
            backgroundImage: `url('/assets/mission-bg.png')`,
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Card Header */}
          <div className="text-center mb-3.5">
            <h2 className="text-[22px] font-bold text-[#800000] tracking-tight leading-tight">
              Misi Utama
            </h2>
            <p className="text-[12px] text-[#555555] mt-0.5 font-normal">
              Ikuti aktivitas berikut untuk mendapatkan reward.
            </p>
          </div>

          {/* Mission Items List */}
          <div className="space-y-3">
            {MISSIONS.map((mission) => (
              <div
                key={mission.id}
                className="flex items-center justify-between gap-2 py-0.5"
              >
                {/* Left: Hexagonal Futuristic Icon */}
                <div className="shrink-0 flex items-center justify-center">
                  <img
                    src={mission.icon}
                    alt={mission.title}
                    className="w-[56px] h-[56px] object-contain drop-shadow-sm"
                  />
                </div>

                {/* Middle: Title & Subtitle Pill */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="text-[13px] font-bold text-[#222222] mb-1 truncate">
                    {mission.title}
                  </div>
                  <div className="inline-flex items-center border border-[#F87171] rounded-full px-3.5 py-0.5 text-[11px] text-[#444444] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                    {mission.subtitle}
                  </div>
                </div>

                {/* Right: Futuristic Button MASUK */}
                <button
                  onClick={() => handleEnterMission(mission)}
                  className="relative w-[76px] h-[28px] shrink-0 flex items-center justify-center cursor-pointer transition-transform active:scale-95 hover:brightness-110"
                  style={{
                    backgroundImage: `url('/assets/check-in-red.png')`,
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                  }}
                >
                  <span className="text-white font-bold text-[11px] tracking-wider uppercase drop-shadow-sm">
                    MASUK
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
