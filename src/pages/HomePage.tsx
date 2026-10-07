import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getCurrentUser, type User } from "../data/dummyUser";
import { RewardModal } from "../components/RewardModal";
import { BoothDrawer } from "../components/BoothDrawer";
import { BoothMenuModal } from "../components/BoothMenuModal";
import {
  getUnclaimedCount,
  claimReward,
  unlockReward,
  isPostTestCompleted,
} from "../data/rewardStore";

interface MissionItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  disabled?: boolean;
  isCompleted?: boolean;
}

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasPostTestSuccess = Boolean(location.state?.showPostTestSuccessModal);

  const [currentUser] = useState<User | null>(() => getCurrentUser());
  const [postTestDone] = useState<boolean>(
    () => isPostTestCompleted() || hasPostTestSuccess,
  );
  const [unclaimedCount, setUnclaimedCount] = useState<number>(() => {
    if (hasPostTestSuccess) {
      unlockReward("morinaga-sympo");
    }
    return getUnclaimedCount();
  });
  const [showPostTestModal, setShowPostTestModal] = useState<boolean>(
    hasPostTestSuccess,
  );
  const [showPinModal, setShowPinModal] = useState(false);
  const [showRewardSuccessModal, setShowRewardSuccessModal] = useState(false);
  const [showBoothMenuModal, setShowBoothMenuModal] = useState(false);
  const [showBoothDrawer, setShowBoothDrawer] = useState(false);
  const [pinDigits, setPinDigits] = useState<[string, string]>(["", ""]);
  const [pinError, setPinError] = useState<string | null>(null);

  // Dummy PIN crew (misal: "88")
  const DUMMY_CREW_PIN = "88";

  const missions: MissionItem[] = [
    {
      id: "morinaga-sympo",
      title: "Morinaga Sympo",
      subtitle: "Ikuti Symposium",
      icon: "/assets/morinaga-sympo-icon.png",
      disabled: postTestDone,
      isCompleted: postTestDone,
    },
    {
      id: "morinaga-booth",
      title: "Morinaga Booth",
      subtitle: "Detailing",
      icon: "/assets/morinaga-booth-icon.png",
      disabled: false,
      isCompleted: false,
    },
    {
      id: "early-life",
      title: "Kalbe Early Life Solutions",
      subtitle: "Detailing",
      icon: "/assets/kalbe-60th-icon.png",
      disabled: true,
      isCompleted: false,
    },
  ];

  useEffect(() => {
    if (location.state?.showPostTestSuccessModal) {
      // Clear history state to avoid modal popping up again on page refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleOpenPinModal = () => {
    setShowPostTestModal(false);
    setPinDigits(["", ""]);
    setPinError(null);
    setShowPinModal(true);
  };

  const handleClaimReward = () => {
    navigate("/claim-reward");
  };

  const handleConfirmPin = () => {
    const fullPin = pinDigits.join("");
    if (fullPin.length < 2) {
      setPinError("Silakan masukkan PIN 2 digit.");
      return;
    }

    if (fullPin !== DUMMY_CREW_PIN) {
      setPinError("PIN yang Anda masukkan salah.");
      return;
    }

    // Success PIN validation -> Mark morinaga-sympo as claimed
    claimReward("morinaga-sympo");
    setUnclaimedCount(getUnclaimedCount());

    setShowPinModal(false);
    setShowRewardSuccessModal(true);
  };

  const handleEnterMission = (mission: MissionItem) => {
    if (mission.disabled) return;
    if (mission.id === "morinaga-sympo") {
      navigate("/symposium");
      return;
    }
    if (mission.id === "morinaga-booth") {
      setShowBoothMenuModal(true);
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
            src={currentUser?.avatar || "/assets/docter-avatar.png"}
            alt={currentUser?.fullName || "Doctor"}
            className="w-[54px] h-[54px] -ml-2.5 shrink-0 object-contain drop-shadow"
          />
          <div className="ml-2 flex flex-col justify-center overflow-hidden">
            <span className="text-[12.5px] font-bold text-[#1E1E1E] leading-tight">
              Hello,
            </span>
            <span className="text-[11.5px]  text-[#444444] truncate leading-tight mt-0.5">
              {currentUser?.fullName || "dr. Ridwan Setiawan"}
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

          {unclaimedCount > 0 && (
            <span className="absolute -top-0.5 right-0.5 w-[19px] h-[19px] bg-[#E50014] text-white text-[10.5px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              {unclaimedCount}
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
            {missions.map((mission) => (
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
                  {mission.isCompleted ? (
                    <div
                      className="inline-flex items-center rounded-full px-3.5 py-1.5 text-[11px] font-medium text-white shadow-sm w-full"
                      style={{ backgroundColor: "#24B500" }}
                    >
                      {mission.subtitle}
                    </div>
                  ) : (
                    <div className="inline-flex items-center border border-[#F87171] rounded-full px-3.5 py-1.5 text-[11px] text-[#444444] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] w-full">
                      {mission.subtitle}
                    </div>
                  )}
                </div>

                {/* Right: Futuristic Button MASUK / SELESAI */}
                {mission.isCompleted ? (
                  <button
                    disabled={true}
                    className="relative w-[76px] h-[28px] shrink-0 flex items-center justify-center cursor-default select-none transition-transform"
                    style={{
                      backgroundImage: `url('/assets/check-in-green.png')`,
                      backgroundSize: "contain",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "center",
                    }}
                  >
                    <span className="text-white font-bold text-[11px] tracking-wider uppercase drop-shadow-sm">
                      SELESAI
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleEnterMission(mission)}
                    disabled={mission.disabled}
                    className={`relative w-[76px] h-[28px] shrink-0 flex items-center justify-center transition-all ${
                      mission.disabled
                        ? "opacity-40 grayscale cursor-not-allowed"
                        : "cursor-pointer active:scale-95 hover:brightness-110"
                    }`}
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
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 1. Post-Test Completion Congratulations Modal */}
      <RewardModal
        isOpen={showPostTestModal}
        onClose={() => setShowPostTestModal(false)}
        imageSrc="/assets/reward-box.png"
        imageAlt="Morinaga Reward Gift"
        imageClassName="w-[185px] sm:w-[200px] h-auto object-contain drop-shadow-md pointer-events-none"
        title="Congratulations!"
        subtitle="Terimakasih telah mengikuti post test Morinaga Symposium."
        description="Anda telah menyelesaikan aktivitas dan mendapatkan reward sebagai bentuk apresiasi atas partisipasi Anda."
        buttonText="AMBIL HADIAH"
        onButtonClick={handleOpenPinModal}
      />

      {/* 2. Enter PIN Modal */}
      <RewardModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        title="MASUKAN PIN"
        buttonText="OKE"
        onButtonClick={handleConfirmPin}
      >
        <div className="w-full flex flex-col items-center text-center px-2 my-auto">
          <h2 className="text-[20px] sm:text-[22px] font-bold text-[#C70412] tracking-wider uppercase mb-7 leading-tight">
            MASUKAN PIN
          </h2>

          {/* 2-Digit Underline Input Fields */}
          <div className="flex items-center justify-center gap-5 sm:gap-6 mb-7">
            {[0, 1].map((index) => (
              <div key={index} className="relative flex flex-col items-center">
                <input
                  id={`pin-input-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={pinDigits[index]}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    const next: [string, string] = [...pinDigits];
                    next[index] = val;
                    setPinDigits(next);
                    if (pinError) setPinError(null);

                    if (val && index === 0) {
                      const nextInput = document.getElementById("pin-input-1");
                      if (nextInput) nextInput.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !pinDigits[index] && index === 1) {
                      const prevInput = document.getElementById("pin-input-0");
                      if (prevInput) prevInput.focus();
                    }
                  }}
                  className="w-[72px] sm:w-[84px] text-center text-[28px] font-extrabold text-[#C70412] bg-transparent outline-none pb-1 cursor-text tracking-widest font-mono"
                />
                <div className="w-[72px] sm:w-[84px] h-[2.5px] bg-[#C70412] rounded-full" />
              </div>
            ))}
          </div>

          {pinError && (
            <p className="text-[11.5px] font-semibold text-red-600 mb-2">{pinError}</p>
          )}

          <p className="text-[12.5px] sm:text-[13px] font-medium text-[#4B5563] leading-snug max-w-[240px] mb-2">
            Masukan PIN dari crew untuk mengambil hadiah
          </p>
        </div>
      </RewardModal>

      {/* 3. Reward Claimed Success Modal (Sport Gym Bag Morinaga) */}
      <RewardModal
        isOpen={showRewardSuccessModal}
        onClose={() => setShowRewardSuccessModal(false)}
        imageSrc="/assets/reward-dummy-symposium.png"
        imageAlt="Sport Gym Bag Morinaga"
        title="Congratulations!"
        subtitle={
          <span>
            Anda mendapatkan <br />
            Sport Gym Bag Morinaga
          </span>
        }
        buttonText="OKE"
        onButtonClick={() => setShowRewardSuccessModal(false)}
      />

      {/* 4. Morinaga Booth Activities Menu Modal */}
      <BoothMenuModal
        isOpen={showBoothMenuModal}
        onClose={() => {
          setShowBoothMenuModal(false);
          setShowBoothDrawer(true);
        }}
      />

      {/* 5. Morinaga Booth Detailing Bottom Drawer */}
      <BoothDrawer
        isOpen={showBoothDrawer}
        onClose={() => setShowBoothDrawer(false)}
        onPodcastScheduleClick={() => {
          alert("Membuka Jadwal Podcast MoriTalks Morinaga");
        }}
        onContinueClick={() => {
          alert("Melanjutkan ke aktivitas Booth Morinaga");
        }}
      />
    </div>
  );
};
