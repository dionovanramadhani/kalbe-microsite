import React from "react";

export interface PostTestScoreModalProps {
  isOpen: boolean;
  score?: number;
  onConfirm: () => void;
}

export const PostTestScoreModal: React.FC<PostTestScoreModalProps> = ({
  isOpen,
  score = 80,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 overflow-hidden select-none">
      {/* Dark Backdrop */}
      <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] animate-backdrop-in" />

      {/* Red Sunburst Radial Light Burst Background - Diperbesar Melewati Batas Viewport (Static) */}
      <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center overflow-hidden z-0">
        <img
          src="/assets/score-red-circle-background.webp"
          alt="Score Background Rays"
          className="w-full h-full object-cover scale-[2.2] origin-center"
        />
      </div>

      {/* Floating Center Wrapper */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* White Card Container with Chamfered Red Corner Border - Scale up from small to big */}
        <div
          className="relative z-10 w-[290px] h-[340px] flex flex-col items-center justify-between pt-6 pb-6 px-4 shadow-2xl animate-popup-scale-up"
          style={{
            backgroundImage: `url('/assets/skor-bg-white.webp')`,
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
            fontFamily: "KalbeGeometric, Arial, sans-serif",
          }}
        >
          {/* Top Logo: Kalbe Universe */}
          <div className="w-full flex justify-center pt-1">
            <img
              src="/assets/kalbe-universe-logo.webp"
              alt="Kalbe Universe"
              className="w-[140px] h-auto object-contain pointer-events-none"
            />
          </div>

          {/* Middle Score Display */}
          <div className="flex flex-col items-center justify-center my-auto">
            {/* Total Skor: semibold 17.5px #222222 */}
            <span
              style={{
                fontSize: "17.5px",
                fontWeight: 600,
                color: "#222222",
              }}
              className="tracking-wider uppercase"
            >
              TOTAL SKOR
            </span>

            {/* Skor: semibold 50.5px #FB0000 */}
            <span
              style={{
                fontSize: "50.5px",
                fontWeight: 600,
                color: "#FB0000",
                lineHeight: "1.15",
              }}
              className="mt-1 font-semibold"
            >
              {score}
            </span>
          </div>

          {/* Bottom Action Button: OK (bold 22px #FFFFFF) */}
          <div className="w-full flex justify-center pb-1">
            <button
              onClick={onConfirm}
              className="relative w-[195px] h-[48px] flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-95 hover:brightness-105"
              style={{
                backgroundImage: `url('/assets/red-button.webp')`,
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
              }}
            >
              <span
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#FFFFFF",
                }}
                className="uppercase tracking-wider font-bold drop-shadow-sm"
              >
                OK
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
