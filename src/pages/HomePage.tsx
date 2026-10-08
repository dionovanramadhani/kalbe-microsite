import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getCurrentUser, type User } from "../data/dummyUser";
import { RewardModal } from "../components/RewardModal";
import { BoothDrawer } from "../components/BoothDrawer";
import { BoothMenuModal } from "../components/BoothMenuModal";
import { PodcastScheduleModal } from "../components/PodcastScheduleModal";
import { EarlyLifeDrawer } from "../components/EarlyLifeDrawer";
import { SymposiumStartedModal } from "../components/SymposiumStartedModal";
import { SymposiumUpcomingModal } from "../components/SymposiumUpcomingModal";
import {
  isSymposiumStartedOrOngoing,
  isSymposiumUpcoming,
  isSymposiumJoined,
} from "../data/symposiumStore";
import {
  getUnclaimedCount,
  claimReward,
  unlockReward,
  isPostTestCompleted,
  isBoothDetailingCompleted,
  isEarlyLifeDetailingCompleted,
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
  const hasBoothSuccess = Boolean(location.state?.showBoothSuccessModal);
  const hasEarlyLifeSuccess = Boolean(location.state?.showEarlyLifeSuccessModal);

  const [currentUser] = useState<User | null>(() => getCurrentUser());
  const [postTestDone] = useState<boolean>(
    () => isPostTestCompleted() || hasPostTestSuccess,
  );
  const [boothDone] = useState<boolean>(
    () => isBoothDetailingCompleted() || hasBoothSuccess,
  );
  const [earlyLifeDone] = useState<boolean>(
    () => isEarlyLifeDetailingCompleted() || hasEarlyLifeSuccess,
  );
  const [unclaimedCount, setUnclaimedCount] = useState<number>(() => {
    if (hasPostTestSuccess) {
      unlockReward("morinaga-sympo");
    }
    if (hasBoothSuccess) {
      unlockReward("morinaga-booth");
    }
    if (hasEarlyLifeSuccess) {
      unlockReward("early-life");
    }
    return getUnclaimedCount();
  });
  const [showPostTestModal, setShowPostTestModal] = useState<boolean>(hasPostTestSuccess);
  const [showBoothCompletionModal, setShowBoothCompletionModal] =
    useState<boolean>(hasBoothSuccess);
  const [showEarlyLifeCompletionModal, setShowEarlyLifeCompletionModal] =
    useState<boolean>(hasEarlyLifeSuccess);
  const [showSymposiumStartedModal, setShowSymposiumStartedModal] = useState<boolean>(
    () => {
      // Selalu muncul ketika sympo sudah mulai (meskipun user berpindah halaman lalu kembali),
      // namun tidak muncul jika user sedang melihat modal sukses lain atau SUDAH join/post-test
      if (hasPostTestSuccess || hasBoothSuccess || hasEarlyLifeSuccess) return false;
      if (postTestDone || isSymposiumJoined()) return false;
      return isSymposiumStartedOrOngoing();
    },
  );
  const [showSymposiumUpcomingModal, setShowSymposiumUpcomingModal] = useState(false);
  const [targetRewardId, setTargetRewardId] = useState<string>(
    hasEarlyLifeSuccess
      ? "early-life"
      : hasBoothSuccess
        ? "morinaga-booth"
        : "morinaga-sympo",
  );
  const [showPinModal, setShowPinModal] = useState(false);
  const [showRewardSuccessModal, setShowRewardSuccessModal] = useState(false);
  const [showBoothMenuModal, setShowBoothMenuModal] = useState(false);
  const [showBoothDrawer, setShowBoothDrawer] = useState(false);
  const [showEarlyLifeDrawer, setShowEarlyLifeDrawer] = useState(false);
  const [showPodcastScheduleModal, setShowPodcastScheduleModal] = useState(false);
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
      disabled: boothDone,
      isCompleted: boothDone,
    },
    {
      id: "early-life",
      title: "Kalbe Early Life Solutions",
      subtitle: "Detailing",
      icon: "/assets/kalbe-60th-icon.png",
      disabled: earlyLifeDone,
      isCompleted: earlyLifeDone,
    },
  ];

  useEffect(() => {
    if (
      location.state?.showPostTestSuccessModal ||
      location.state?.showBoothSuccessModal ||
      location.state?.showEarlyLifeSuccessModal
    ) {
      // Clear history state to avoid modal popping up again on page refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleOpenPinModal = (rewardId: string = "morinaga-sympo") => {
    setTargetRewardId(rewardId);
    setShowPostTestModal(false);
    setShowBoothCompletionModal(false);
    setShowEarlyLifeCompletionModal(false);
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

    // Success PIN validation -> Mark target reward as claimed
    claimReward(targetRewardId);
    setUnclaimedCount(getUnclaimedCount());

    setShowPinModal(false);
    setShowRewardSuccessModal(true);
  };

  const handleEnterMission = (mission: MissionItem) => {
    if (mission.disabled) return;
    if (mission.id === "morinaga-sympo") {
      // Jika simposium belum dimulai, tampilkan modal peringatan waktu mulai
      if (isSymposiumUpcoming()) {
        setShowSymposiumUpcomingModal(true);
        return;
      }
      navigate("/symposium");
      return;
    }
    if (mission.id === "morinaga-booth") {
      setShowBoothMenuModal(true);
      return;
    }
    if (mission.id === "early-life") {
      setShowEarlyLifeDrawer(true);
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
        <div className="relative w-full px-4 pt-5 pb-6 drop-shadow-sm">
          {/* Sliced SVG Futuristic 8-Sided (Octagon) Background with Thicker Accent Corners */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 380 430"
            fill="none"
            preserveAspectRatio="none"
          >
            {/* Background Fill (#FEF9F7) */}
            <polygon
              points="24,2 356,2 378,24 378,406 356,428 24,428 2,406 2,24"
              fill="#FEF9F7"
            />

            {/* Base Red Outline (#F4233E) - Standard 2px */}
            <polygon
              points="24,2 356,2 378,24 378,406 356,428 24,428 2,406 2,24"
              stroke="#F4233E"
              strokeWidth="2"
              strokeLinejoin="miter"
            />

            {/* Top-Left Corner Thick Accent (7.5px) */}
            <polyline
              points="50,2 24,2 2,24 2,50"
              stroke="#F4233E"
              strokeWidth="7.5"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />

            {/* Top-Right Corner Thick Accent (7.5px) */}
            <polyline
              points="330,2 356,2 378,24 378,50"
              stroke="#F4233E"
              strokeWidth="7.5"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />

            {/* Bottom-Right Corner Thick Accent (7.5px) */}
            <polyline
              points="378,380 378,406 356,428 330,428"
              stroke="#F4233E"
              strokeWidth="7.5"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />

            {/* Bottom-Left Corner Thick Accent (7.5px) */}
            <polyline
              points="50,428 24,428 2,406 2,380"
              stroke="#F4233E"
              strokeWidth="7.5"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
          </svg>

          {/* Card Header */}
          <div className="relative z-10 text-center mb-4">
            <h2 className="text-[22px] font-bold text-[#940B0A] tracking-tight leading-tight">
              Misi Utama
            </h2>
            <p className="text-[12px] text-[#5A5A5A] mt-1.5 font-normal">
              Ikuti aktivitas berikut untuk mendapatkan reward.
            </p>
          </div>

          {/* Mission Items List */}
          <div className="relative z-10 space-y-3 flex flex-col gap-3">
            {missions.map((mission) => (
              <div key={mission.id} className="flex items-start gap-2.5 py-0.5">
                {/* Left: Hexagonal Futuristic Icon */}
                <div className="shrink-0 flex items-center justify-center pt-0.5">
                  <img
                    src={mission.icon}
                    alt={mission.title}
                    className="w-[56px] h-[56px] object-contain drop-shadow-sm"
                  />
                </div>

                {/* Right: Title on top, Subtitle Pill & MASUK Button aligned horizontally below */}
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-[#535252] mb-1.5 truncate">
                    {mission.title}
                  </div>

                  {/* Detailing pill aligned side-by-side with MASUK / SELESAI button */}
                  <div className="flex items-center gap-2">
                    {mission.isCompleted ? (
                      <div
                        className="flex-1 min-w-0 flex items-center rounded-full px-3.5 h-[28px] text-[11px] font-medium text-white shadow-sm"
                        style={{ backgroundColor: "#24B500" }}
                      >
                        <span className="truncate">Selesai</span>
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0 flex items-center border border-[#F87171] rounded-full px-3.5 h-[28px] text-[11px] text-[#444444] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                        <span className="truncate">{mission.subtitle}</span>
                      </div>
                    )}

                    {/* Button MASUK / SELESAI sejajar dengan Detailing */}
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
                </div>
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
        onButtonClick={() => handleOpenPinModal("morinaga-sympo")}
      />

      {/* 2. Morinaga Booth Detailing Congratulations Modal */}
      <RewardModal
        isOpen={showBoothCompletionModal}
        onClose={() => setShowBoothCompletionModal(false)}
        imageSrc="/assets/reward-box.png"
        imageAlt="Morinaga Reward Gift"
        imageClassName="w-[185px] sm:w-[200px] h-auto object-contain drop-shadow-md pointer-events-none"
        title="Congratulations!"
        subtitle="Terimakasih telah mengikuti Detailing Morinaga Booth."
        description="Anda telah menyelesaikan aktivitas dan mendapatkan reward sebagai bentuk apresiasi atas partisipasi Anda."
        buttonText="AMBIL HADIAH"
        onButtonClick={() => handleOpenPinModal("morinaga-booth")}
      />

      {/* 2b. Kalbe Early Life Solutions Detailing Congratulations Modal */}
      <RewardModal
        isOpen={showEarlyLifeCompletionModal}
        onClose={() => setShowEarlyLifeCompletionModal(false)}
        imageSrc="/assets/reward-box.png"
        imageAlt="Kalbe Reward Gift"
        imageClassName="w-[185px] sm:w-[200px] h-auto object-contain drop-shadow-md pointer-events-none"
        title="Congratulations!"
        subtitle="Terimakasih telah mengikuti Detailing Kalbe Early Life Solutions."
        description="Anda telah menyelesaikan aktivitas dan mendapatkan reward sebagai bentuk apresiasi atas partisipasi Anda."
        buttonText="AMBIL HADIAH"
        onButtonClick={() => handleOpenPinModal("early-life")}
      />

      {/* 3. Enter PIN Modal */}
      <RewardModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        title="MASUKAN PIN"
        hideDefaultButton={true}
      >
        <div className="w-full flex flex-col items-center text-center px-2 my-auto">
          <h2 className="text-[18px] font-bold text-[#C70412] tracking-wider uppercase mb-7 leading-tight">
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

          <p className="text-[15px] sm:text-[16px] font-medium text-[#555555] leading-snug max-w-[240px] mb-6">
            Masukan PIN dari crew untuk mengambil hadiah
          </p>

          {/* OKE Button grouped in center */}
          <button
            onClick={handleConfirmPin}
            className="relative w-[215px] sm:w-[225px] h-[44px] flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-95 hover:brightness-105"
            style={{
              backgroundImage: `url('/assets/red-button.png')`,
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
            }}
          >
            <span className="text-white font-extrabold text-[13px] sm:text-[14px] tracking-wider uppercase drop-shadow">
              OKE
            </span>
          </button>
        </div>
      </RewardModal>

      {/* 4. Reward Claimed Success Modal */}
      <RewardModal
        isOpen={showRewardSuccessModal}
        onClose={() => setShowRewardSuccessModal(false)}
        imageSrc={
          targetRewardId === "mistery-box"
            ? "/assets/mystery-box-reward.png"
            : targetRewardId === "morinaga-booth" || targetRewardId === "early-life"
              ? "/assets/morinaga-booth-reward.png"
              : "/assets/reward-dummy-symposium.png"
        }
        imageAlt={
          targetRewardId === "mistery-box"
            ? "MYSTERY BOX Morinaga"
            : targetRewardId === "morinaga-booth" || targetRewardId === "early-life"
              ? "DOCTOR’S ACTIVE KIT Morinaga"
              : "Sport Gym Bag Morinaga"
        }
        imageClassName="w-[170px] sm:w-[185px] h-auto object-contain drop-shadow-md pointer-events-none"
        title="Congratulations!"
        subtitle={
          targetRewardId === "mistery-box" ? (
            <span>
              Anda mendapatkan <br />
              <span className="font-bold">MYSTERY BOX Morinaga</span>
            </span>
          ) : targetRewardId === "morinaga-booth" || targetRewardId === "early-life" ? (
            <span>Anda mendapatkan DOCTOR’S ACTIVE KIT Morinaga</span>
          ) : (
            <span>
              Anda mendapatkan <br />
              Sport Gym Bag Morinaga
            </span>
          )
        }
        buttonText="OKE"
        onButtonClick={() => setShowRewardSuccessModal(false)}
      />

      {/* 5. Morinaga Booth Activities Menu Modal */}
      <BoothMenuModal
        isOpen={showBoothMenuModal}
        onClose={() => {
          setShowBoothMenuModal(false);
          setShowBoothDrawer(true);
        }}
      />

      {/* 6. Morinaga Booth Detailing Bottom Drawer */}
      <BoothDrawer
        isOpen={showBoothDrawer}
        onClose={() => setShowBoothDrawer(false)}
        onPodcastScheduleClick={() => {
          setShowPodcastScheduleModal(true);
        }}
        onContinueClick={() => {
          setShowBoothDrawer(false);
          navigate("/booth-scan");
        }}
      />

      {/* 7. Kalbe Early Life Solutions Detailing Bottom Drawer */}
      <EarlyLifeDrawer
        isOpen={showEarlyLifeDrawer}
        onClose={() => setShowEarlyLifeDrawer(false)}
        onContinueClick={() => {
          setShowEarlyLifeDrawer(false);
          navigate("/early-life-scan");
        }}
      />

      {/* 8. MoriTalks Morinaga Podcast Schedule Modal */}
      <PodcastScheduleModal
        isOpen={showPodcastScheduleModal}
        onClose={() => setShowPodcastScheduleModal(false)}
      />

      {/* 9. Morinaga Symposium Started / Ongoing Modal */}
      <SymposiumStartedModal
        isOpen={showSymposiumStartedModal}
        onClose={() => setShowSymposiumStartedModal(false)}
        onTakePostTest={() => {
          setShowSymposiumStartedModal(false);
          navigate("/symposium");
        }}
      />

      {/* 10. Morinaga Symposium Upcoming / Belum Dimulai Modal */}
      <SymposiumUpcomingModal
        isOpen={showSymposiumUpcomingModal}
        onClose={() => setShowSymposiumUpcomingModal(false)}
      />
    </div>
  );
};
