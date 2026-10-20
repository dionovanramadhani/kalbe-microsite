import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import { RewardModal } from "../components/RewardModal";
import { claimReward as claimRewardInStore } from "../data/rewardStore";
import {
  getKalbeUserHistory,
  claimKalbeHistoryReward,
  type KalbeHistoryItemResponse,
} from "../utils/kalbeApi";

export interface HistoryRewardItem {
  id: string;
  historyId?: string;
  title: string;
  subtitle: string;
  date: string;
  claimed: boolean;
  isClaimable: boolean;
  pin?: string;
  icon: string;
  rewardImage: string;
  rewardName: string;
  rewardType?: string;
  booth?: { name?: string; icon?: string | null };
  symposium?: { title?: string; icon?: string | null };
}

const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return "26 Okt 2026";
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = d.getDate();
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "Mei",
        "Jun",
        "Jul",
        "Agt",
        "Sep",
        "Okt",
        "Nov",
        "Des",
      ];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, "0");
      const mins = String(d.getMinutes()).padStart(2, "0");
      return `${day} ${month} ${year}, ${hours}.${mins} WIB`;
    }
  } catch {
    // ignore
  }
  return "26 Okt 2026";
};

const mapHistoryToRewardItem = (item: KalbeHistoryItemResponse): HistoryRewardItem => {
  let title: string;
  let subtitle: string;
  let icon = "/assets/morinaga-sympo-icon.webp";
  let rewardImage = "/assets/reward-box.webp";
  let rewardName = "Special Reward";

  const type = (item.reward_type || "").toLowerCase();

  if (type === "symposium") {
    const sympoName = item.symposium?.title || "Morinaga Symposium";
    title = sympoName;
    subtitle = `Mengikuti ${sympoName}`;
    icon =
      item.symposium?.icon || item.symposium?.logo || "/assets/morinaga-sympo-icon.webp";
    rewardImage = "/assets/reward-box.webp";
    rewardName = "Paket Spesial Morinaga";
  } else if (type === "booth") {
    const boothName = item.booth?.name || item.booth?.detailing_title || "Morinaga Booth";
    title = boothName;
    subtitle = `Mengikuti ${boothName}`;
    icon = item.booth?.icon || item.booth?.logo || "/assets/morinaga-booth-icon.webp";
    rewardImage = "/assets/morinaga-booth-reward.webp";
    rewardName = "Hadiah Booth Morinaga";
  } else if (type.includes("early") || type.includes("life")) {
    const earlyLifeName =
      item.booth?.name || item.booth?.detailing_title || "Kalbe Early Life Solutions";
    title = earlyLifeName;
    subtitle = `Mengikuti ${earlyLifeName}`;
    icon = item.booth?.icon || item.booth?.logo || "/assets/kalbe-60th-icon.webp";
    rewardImage = "/assets/spin-wheel-reward.webp";
    rewardName = "Kesempatan Spin Wheel";
  } else if (type.includes("mystery")) {
    title = "Mystery Box";
    subtitle = "Mengikuti semua booth dan symposium";
    icon = "/assets/mistery-box.webp";
    rewardImage = "/assets/mystery-box-reward.webp";
    rewardName = "Hadiah Eksklusif Mystery Box";
  } else {
    const defaultName =
      item.symposium?.title || item.booth?.name || item.booth?.detailing_title || "Acara";
    title = defaultName;
    subtitle = `Mengikuti ${defaultName}`;
  }

  // Override with actual reward configuration if available from backend
  if (item.reward?.name) {
    rewardName = item.reward.name;
  }
  if (item.reward?.picture) {
    rewardImage = item.reward.picture;
  }

  return {
    id: item.id,
    historyId: item.id,
    title,
    subtitle,
    date: formatDate(item.claimed_at || item.created_at),
    claimed: item.is_claimed,
    isClaimable: item.is_claimable !== false,
    pin: item.pin,
    icon,
    rewardImage,
    rewardName,
    rewardType: item.reward_type,
    booth: item.booth ? { name: item.booth.name, icon: item.booth.icon } : undefined,
    symposium: item.symposium ? { title: item.symposium.title } : undefined,
  };
};

export const ClaimRewardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [rewards, setRewards] = useState<HistoryRewardItem[]>([]);
  const [selectedReward, setSelectedReward] = useState<HistoryRewardItem | null>(null);
  const [claimedRewardInfo, setClaimedRewardInfo] = useState<{
    name: string;
    image: string;
  } | null>(null);

  // Modal States
  const [showPinModal, setShowPinModal] = useState(false);
  const [showRewardSuccessModal, setShowRewardSuccessModal] = useState(false);
  const [pinDigits, setPinDigits] = useState<[string, string]>(["", ""]);
  const [pinError, setPinError] = useState<string | null>(null);
  const [submittingPin, setSubmittingPin] = useState(false);

  const fetchHistoryList = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all history records (both claimed and unclaimed) from API
      const historyList = await getKalbeUserHistory();
      if (historyList) {
        // Exclude mystery box from regular reward claim list (as it has its own page)
        const nonMystery = historyList.filter(
          (h) => h.reward_type !== "mystery_box" && !h.reward_type?.includes("mystery"),
        );
        setRewards(nonMystery.map(mapHistoryToRewardItem));
        setLoading(false);
        return;
      }
    } catch (e) {
      console.warn("Failed to fetch user history from API:", e);
    }

    setRewards([]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHistoryList();
  }, [fetchHistoryList]);

  const handleOpenClaim = (reward: HistoryRewardItem) => {
    if (reward.claimed || !reward.isClaimable) return;
    setSelectedReward(reward);
    setPinDigits(["", ""]);
    setPinError(null);
    setShowPinModal(true);
  };

  const handleConfirmPin = async () => {
    const fullPin = pinDigits.join("");
    if (fullPin.length < 2) {
      setPinError("Silakan masukkan PIN 2 digit.");
      return;
    }

    if (!selectedReward) return;

    setSubmittingPin(true);
    setPinError(null);

    try {
      let claimedName = selectedReward.rewardName;
      let claimedImg = selectedReward.rewardImage;

      // If history item came from backend API, submit claim to backend API
      if (selectedReward.historyId) {
        const claimRes = await claimKalbeHistoryReward(selectedReward.historyId, fullPin);
        if (claimRes?.reward) {
          if (claimRes.reward.name) {
            claimedName = claimRes.reward.name;
          }
          if (claimRes.reward.picture) {
            claimedImg = claimRes.reward.picture;
          }
        }
      } else {
        // Fallback local store check
        if (fullPin !== selectedReward.pin) {
          setPinError("PIN yang Anda masukkan salah.");
          setSubmittingPin(false);
          return;
        }
      }

      setClaimedRewardInfo({
        name: claimedName,
        image: claimedImg,
      });

      // Mark reward as claimed in store and in state
      claimRewardInStore(selectedReward.id);
      setRewards((prev) =>
        prev.map((item) =>
          item.id === selectedReward.id
            ? { ...item, claimed: true, rewardName: claimedName, rewardImage: claimedImg }
            : item,
        ),
      );

      // Also update selectedReward
      setSelectedReward((prev) =>
        prev
          ? {
              ...prev,
              claimed: true,
              rewardName: claimedName,
              rewardImage: claimedImg,
            }
          : null,
      );

      setShowPinModal(false);
      setShowRewardSuccessModal(true);
    } catch (err: unknown) {
      console.warn("Claim reward failed:", err);
      const errMsg = err instanceof Error ? err.message : "";
      if (
        errMsg.toLowerCase().includes("pin") ||
        errMsg.toLowerCase().includes("invalid")
      ) {
        setPinError("PIN yang Anda masukkan salah.");
      } else {
        setPinError(errMsg || "Gagal mengklaim reward. Silakan coba lagi.");
      }
    } finally {
      setSubmittingPin(false);
    }
  };

  return (
    <div
      className="font-kalbe relative h-full w-full flex flex-col justify-between items-center bg-cover bg-top select-none px-4 pt-4 pb-5 overflow-hidden"
      style={{
        backgroundImage: `url('/assets/red-and-white-curve-bg.webp')`,
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
            src="/assets/post-test-arrow.webp"
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
            {loading ? (
              <div className="w-full flex-1 flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-8 h-8 border-3 border-[#C70412] border-t-transparent rounded-full animate-spin" />
                <span className="text-[12px] text-gray-500 font-medium">
                  Memuat riwayat hadiah...
                </span>
              </div>
            ) : (
              <div className="w-full flex-1 overflow-y-auto pr-0.5 space-y-3 pt-1 pb-2 scrollbar-none flex flex-col">
                {rewards.length === 0 ? (
                  <div className="my-auto flex flex-col items-center justify-center text-center px-4 py-8">
                    <img
                      src="/assets/reward-box.webp"
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
                          onError={(e) => {
                            e.currentTarget.src =
                              item.rewardType === "booth"
                                ? "/assets/morinaga-booth-icon.webp"
                                : "/assets/morinaga-sympo-icon.webp";
                          }}
                        />
                      </div>

                      {/* Center: Info text */}
                      <div className="flex-1 min-w-0 pr-1 flex flex-col gap-0.5">
                        <h3 className="text-[12px] font-semibold text-[#5A5A5A] leading-tight truncate">
                          {item.rewardType === "booth"
                            ? item.booth?.name || item.title
                            : item.rewardType === "symposium"
                              ? item.symposium?.title || item.title
                              : item.title}
                        </h3>
                        <p className="text-[10px] text-[#5A5A5A] leading-tight mt-0.5 line-clamp-2">
                          {item.subtitle}
                        </p>
                        <div className="flex items-center gap-1 text-[8px] text-[#83939A] mt-1">
                          <Calendar className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                          <span className="truncate">{item.date}</span>
                        </div>
                      </div>

                      {/* Right: Pill Claim Button */}
                      <button
                        onClick={() => handleOpenClaim(item)}
                        disabled={item.claimed || !item.isClaimable}
                        className={`h-[28px] px-3.5 rounded-full font-bold text-[11px] tracking-wide flex items-center justify-center shrink-0 transition-all ${
                          item.claimed
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : !item.isClaimable
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300"
                              : "bg-[#E50014] text-white hover:bg-[#C70412] active:scale-95 cursor-pointer shadow-sm shadow-red-500/20"
                        }`}
                        title={
                          item.claimed
                            ? "Hadiah sudah diklaim"
                            : !item.isClaimable
                              ? "Reward belum tersedia dari admin"
                              : "Klaim reward hadiah ini"
                        }
                      >
                        {item.claimed
                          ? "Claimed"
                          : !item.isClaimable
                            ? "Belum Tersedia"
                            : "Claim"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Futuristic Red Camera Overlay Frame */}
          <div
            className="absolute inset-0 pointer-events-none z-20"
            style={{
              backgroundImage: `url('/assets/red-and-white-curve-bg-long.webp')`,
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
        hideDefaultButton={true}
      >
        <div className="w-full flex flex-col items-center text-center px-2 my-auto">
          <h2 className="text-[18px] sm:text-[19px] font-bold text-[#C70412] tracking-wider uppercase mb-7 leading-tight">
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
            <p className="text-[11.5px] font-semibold text-red-600 mb-2">{pinError}</p>
          )}

          <p className="text-[15px] sm:text-[16px] font-medium text-[#555555] leading-snug max-w-[240px] mb-6">
            Masukan PIN dari crew untuk mengambil hadiah
          </p>

          {/* OKE Button grouped in center */}
          <button
            onClick={handleConfirmPin}
            disabled={submittingPin}
            className={`relative w-[215px] sm:w-[225px] h-[44px] flex items-center justify-center transition-transform duration-150 active:scale-95 hover:brightness-105 ${
              submittingPin ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
            }`}
            style={{
              backgroundImage: `url('/assets/red-button.webp')`,
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
            }}
          >
            <span className="text-white font-extrabold text-[13px] sm:text-[14px] tracking-wider uppercase drop-shadow">
              {submittingPin ? "MEMPROSES..." : "OKE"}
            </span>
          </button>
        </div>
      </RewardModal>

      {/* 2. Reward Claimed Success Modal */}
      {selectedReward && (
        <RewardModal
          isOpen={showRewardSuccessModal}
          onClose={() => {
            setShowRewardSuccessModal(false);
            setClaimedRewardInfo(null);
          }}
          imageSrc={claimedRewardInfo?.image || selectedReward.rewardImage}
          imageAlt={claimedRewardInfo?.name || selectedReward.rewardName}
          imageClassName="max-w-[170px] max-h-[145px] w-auto h-auto object-contain pointer-events-none drop-shadow-md"
          title="Congratulations!"
          subtitle={
            <span>
              Anda mendapatkan <br />
              {claimedRewardInfo?.name || selectedReward.rewardName}
            </span>
          }
          buttonText="OKE"
          onButtonClick={() => {
            setShowRewardSuccessModal(false);
            setClaimedRewardInfo(null);
          }}
        />
      )}
    </div>
  );
};
