import React from "react";
import { X } from "lucide-react";

export interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc?: string;
  imageAlt?: string;
  imageClassName?: string;
  title: string;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  buttonText?: string;
  onButtonClick?: () => void;
  children?: React.ReactNode;
  hideDefaultButton?: boolean;
}

export const RewardModal: React.FC<RewardModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  imageAlt = "Reward",
  imageClassName = "w-[170px] sm:w-[185px] h-auto object-contain pointer-events-none",
  title,
  subtitle,
  description,
  buttonText,
  onButtonClick,
  children,
  hideDefaultButton = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="relative w-full max-w-[361px] h-[456px] max-h-[92%] aspect-[361/456] flex flex-col items-center justify-center px-5 pt-6 pb-7 drop-shadow-2xl animate-in fade-in zoom-in-95 duration-200"
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
          <X className="w-8 h-8 stroke-[2.8]" />
        </button>

        {/* Top Image / Graphic (if provided) */}
        {imageSrc && (
          <div className="w-full flex justify-center shrink-0 mb-3">
            <img src={imageSrc} alt={imageAlt} className={imageClassName} />
          </div>
        )}

        {/* Custom Body or Standard Text Content */}
        {children ? (
          children
        ) : (
          <div className="w-full flex flex-col items-center text-center px-2 mb-4">
            <h2 className="text-[28px] font-semibold text-[#C70412] tracking-tight mb-2.5 leading-tight">
              {title}
            </h2>

            {subtitle && (
              <div className="text-[16px] font-semibold text-[#1E1E1E] leading-snug mb-2 max-w-[290px]">
                {subtitle}
              </div>
            )}

            {description && (
              <div className="text-[12px] font-normal text-[#4B5563] leading-relaxed max-w-[260px]">
                {description}
              </div>
            )}
          </div>
        )}

        {/* Bottom Action Button */}
        {!hideDefaultButton && buttonText && onButtonClick && (
          <div className="w-full flex justify-center shrink-0">
            <button
              onClick={onButtonClick}
              className="relative w-[215px] sm:w-[225px] h-[44px] flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-95 hover:brightness-105"
              style={{
                backgroundImage: `url('/assets/red-button.png')`,
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
              }}
            >
              <span className="text-white font-extrabold text-[13px] sm:text-[14px] tracking-wider uppercase drop-shadow">
                {buttonText}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
