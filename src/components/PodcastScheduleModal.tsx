import React from "react";
import { X } from "lucide-react";

export interface PodcastScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PodcastSession {
  speaker: string;
  time: string;
}

const PODCAST_SESSIONS: PodcastSession[] = [
  {
    speaker: "Sesi 1 - Prof Budi",
    time: "10.00 - 10.10 WIB",
  },
  {
    speaker: "Sesi 2 - Dr. Ariani",
    time: "14.00 - 14.10 WIB",
  },
];

export const PodcastScheduleModal: React.FC<PodcastScheduleModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center p-4">
      {/* Dark backdrop with blur confined to mobile viewport */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200"
      />

      {/* Modal Card with futuristic frame */}
      <div
        className="relative z-10 w-full max-w-[361px] h-[456px] max-h-[92%] aspect-[361/456] flex flex-col items-center justify-center px-5 pt-6 pb-7 drop-shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        style={{
          backgroundImage: `url('/assets/modal-background.png')`,
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Top Close Button (X in Deep Red) */}
        <button
          onClick={onClose}
          className="absolute top-5 right-8 p-1 rounded-full text-[#D70313] hover:bg-red-50/50 transition-all cursor-pointer active:scale-90"
          title="Tutup Modal"
        >
          <X className="w-8 h-8 stroke-[3]" />
        </button>

        {/* Centered Content Block */}
        <div className="w-full flex flex-col items-center text-center my-auto px-2">
          {/* 3D Red Clock Graphic */}
          <div className="w-full flex justify-center shrink-0 mb-2.5">
            <img
              src="/assets/clock-red.png"
              alt="Jadwal Podcast"
              className="w-[145px] sm:w-[155px] h-auto object-contain drop-shadow-md pointer-events-none select-none"
            />
          </div>

          {/* Title */}
          <h2 className="text-[24px] font-bold text-[#D41025] tracking-tight mb-3 leading-tight">
            MoriTalks Morinaga
          </h2>

          {/* Session List */}
          <div className="w-full flex flex-col items-center space-y-3">
            {PODCAST_SESSIONS.map((session, index) => (
              <div key={index} className="w-full flex flex-col items-center">
                <span className="text-[16px] font-bold text-[#222222] mb-1.5 leading-tight">
                  {session.speaker}
                </span>
                <div className="w-full max-w-[225px] sm:max-w-[235px] h-[42px] sm:h-[44px] rounded-2xl border-[1.5px] border-[#D41025] bg-white flex items-center justify-center shadow-xs">
                  <span className="text-[#D41025] font-bold text-[20px] tracking-wide leading-none">
                    {session.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
