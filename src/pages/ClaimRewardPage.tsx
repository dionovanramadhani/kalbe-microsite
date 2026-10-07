import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import { RewardModal } from "../components/RewardModal";
import {
  getObtainedRewards,
  claimReward as claimRewardInStore,
  type RewardItem,
} from "../data/rewardStore";

const DUMMY_CREW_PIN = "88";

export const ClaimRewardPage: React.FC = () => {
  const navigate = useNavigate();
  const [rewards, setRewards] = useState<RewardItem[]>(() =>
    getObtainedRewards(),
  );
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);

  // Modal States
  const [showPinModal, setShowPinModal] = useState(false);
  const [showRewardSuccessModal, setShowRewardSuccessModal] = useState(false);
  const [pinDigits, setPinDigits] = useState<[string, string]>(["", ""]);
  const [pinError, setPinError] = useState<string | null>(null);

  const handleOpenClaim = (reward: RewardItem) => {
    setSelectedReward(reward);
    setPinDigits(["", ""]);
    setPinError(null);
    setShowPinModal(true);
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

    // Mark reward as claimed in store and in state
    if (selectedReward) {
      claimRewardInStore(selectedReward.id);
      setRewards((prev) =>
        prev.map((item) =>
          item.id === selectedReward.id ? { ...item, claimed: true } : item,
        ),
      );
    }

    setShowPinModal(false);
    setShowRewardSuccessModal(true);
  };

  return (
    <div
      className="font-kalbe relative h-full w-full flex flex-col justify-between items-center bg-cover bg-top select-none px-4 pt-4 pb-5 overflow-hidden"
      style={{
        backgroundImage: `url('/assets/red-and-white-curve-bg.png')`,
        fontFamily: "KalbeGeometric, Arial, sans-serif",
      }}
    >
      {/* Top Header Bar */}
      <div className="relative w-full flex items-center justify-center pt-1 pb-2 shrink-0">
        {/* Back Button */}
        <button
          onClick={() => navigate("/home")}
          className="absolute left-0 cursor-pointer active:scale-95 transition-transform"
          title="Kembali ke Homepage"
        >
          <img
            src="/assets/post-test-arrow.png"
            alt="Back"
            className="w-8 h-8 object-contain drop-shadow-sm"
          />
        </button>

        {/* Page Title */}
        <h1 className="text-[20px] font-bold text-[#C70412] tracking-wide">
          Klaim Hadiah
        </h1>
      </div>

      {/* Main Futuristic Card Sheet with Camera Frame asset */}
      <div className="relative w-full flex-1 flex flex-col items-center justify-center my-1 min-h-0">
        <div className="relative w-full max-w-[365px] h-full max-h-[580px] flex flex-col items-center justify-center shrink-0">
          {/* Card Inner White Container clipped with chamfer */}
          <div
            className="relative w-full h-full bg-white flex flex-col pt-5 pb-4 px-4 overflow-hidden shadow-sm"
            style={{
              clipPath:
                "polygon(22px 0%, calc(100% - 22px) 0%, 100% 22px, 100% calc(100% - 22px), calc(100% - 22px) 100%, 22px 100%, 0% calc(100% - 22px), 0% 22px)",
            }}
          >
            {/* Rewards List Container */}
            <div className="w-full flex-1 overflow-y-auto pr-0.5 space-y-3 pt-1 pb-2 scrollbar-none flex flex-col">
              {rewards.length === 0 ? (
                <div className="my-auto flex flex-col items-center justify-center text-center px-4 py-8">
                  <img
                    src="/assets/reward-box.png"
                    alt="Belum Ada Hadiah"
                    className="w-[100px] h-auto object-contain mb-3 opacity-60 grayscale"
                  />
                  <h3 className="text-[14px] font-bold text-[#4B5563] mb-1">
                    Belum Ada Hadiah
                  </h3>
                  <p className="text-[11.5px] text-gray-400 max-w-[220px] leading-relaxed">
                    Selesaikan misi dan post test untuk mendapatkan reward Anda!
                  </p>
                </div>
              ) : (
                rewards.map((item) => (
                  <div
                    key={item.id}
                    className="w-full bg-white rounded-[14px] border border-gray-200/90 p-3 flex items-center justify-between gap-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-red-200 transition-colors"
                  >
                    {/* Left: Futuristic Hex Icon Container */}
                    <div className="w-[46px] h-[46px] shrink-0 flex items-center justify-center">
                      <img
                        src={item.icon}
                        alt={item.title}
                        className="w-full h-full object-contain drop-shadow-sm"
                      />
                    </div>

                    {/* Center: Info text */}
                    <div className="flex-1 min-w-0 pr-1">
                      <h3 className="text-[13px] font-bold text-[#1E1E1E] leading-tight truncate">
                        {item.title}
                      </h3>
                      <p className="text-[11.5px] font-medium text-[#4B5563] leading-tight truncate mt-0.5">
                        {item.subtitle}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>{item.date}</span>
                      </div>
                    </div>

                    {/* Right: Pill Claim Button */}
                    <button
                      onClick={() => handleOpenClaim(item)}
                      disabled={item.claimed}
                      className={`h-[28px] px-4 rounded-full text-white font-bold text-[11.5px] tracking-wide flex items-center justify-center shrink-0 transition-all ${
                        item.claimed
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-[#E50014] hover:bg-[#C70412] active:scale-95 cursor-pointer shadow-sm shadow-red-500/20"
                      }`}
                    >
                      {item.claimed ? "Claimed" : "Claim"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Futuristic Red Camera Overlay Frame */}
          <div
            className="absolute inset-0 pointer-events-none z-20"
            style={{
              backgroundImage: `url('/assets/scanner-frame-camera.png')`,
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
            }}
          />
        </div>
      </div>

      {/* 1. Enter PIN Modal */}
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

          {/* 2-Digit Underline Input Fields (Unmasked) */}
          <div className="flex items-center justify-center gap-5 sm:gap-6 mb-7">
            {[0, 1].map((index) => (
              <div key={index} className="relative flex flex-col items-center">
                <input
                  id={`reward-pin-input-${index}`}
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

                    // Auto-advance to next input if filled
                    if (val && index === 0) {
                      const nextInput = document.getElementById("reward-pin-input-1");
                      if (nextInput) nextInput.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    // Backspace jumps to previous input if empty
                    if (e.key === "Backspace" && !pinDigits[index] && index === 1) {
                      const prevInput = document.getElementById("reward-pin-input-0");
                      if (prevInput) prevInput.focus();
                    }
                  }}
                  className="w-[72px] sm:w-[84px] text-center text-[28px] font-extrabold text-[#C70412] bg-transparent outline-none pb-1 cursor-text tracking-widest font-mono"
                />
                {/* Red Underline matching design mockup */}
                <div className="w-[72px] sm:w-[84px] h-[2.5px] bg-[#C70412] rounded-full" />
              </div>
            ))}
          </div>

          {pinError && (
            <p className="text-[11.5px] font-semibold text-red-600 mb-2">
              {pinError}
            </p>
          )}

          <p className="text-[12.5px] sm:text-[13px] font-medium text-[#4B5563] leading-snug max-w-[240px] mb-2">
            Masukan PIN dari crew untuk mengambil hadiah
          </p>
        </div>
      </RewardModal>

      {/* 2. Reward Claimed Success Modal */}
      {selectedReward && (
        <RewardModal
          isOpen={showRewardSuccessModal}
          onClose={() => setShowRewardSuccessModal(false)}
          imageSrc={selectedReward.rewardImage}
          imageAlt={selectedReward.rewardName}
          title="Congratulations!"
          subtitle={
            <span>
              Anda mendapatkan <br />
              {selectedReward.rewardName}
            </span>
          }
          buttonText="OKE"
          onButtonClick={() => setShowRewardSuccessModal(false)}
        />
      )}
    </div>
  );
};
