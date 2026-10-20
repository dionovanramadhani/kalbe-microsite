import React from "react";
import { X } from "lucide-react";

import { useModalAnimation } from "../utils/useModalAnimation";

export interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc?: string;
  imageAlt?: string;
  imageClassName?: string;
  imageContainerClassName?: string;
  title: string;
  titleClassName?: string;
  subtitle?: React.ReactNode;
  subtitleClassName?: string;
  description?: React.ReactNode;
  descriptionClassName?: string;
  bodyClassName?: string;
  buttonText?: string;
  onButtonClick?: () => void;
  children?: React.ReactNode;
  hideDefaultButton?: boolean;
  footerContent?: React.ReactNode;
  footerNote?: React.ReactNode;
  cardClassName?: string;
  containerClassName?: string;
}

export const RewardModal: React.FC<RewardModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  imageAlt = "Reward",
  imageClassName = "w-[170px] sm:w-[185px] h-auto object-contain pointer-events-none",
  imageContainerClassName,
  title,
  titleClassName,
  subtitle,
  subtitleClassName,
  description,
  descriptionClassName,
  bodyClassName,
  buttonText,
  onButtonClick,
  children,
  hideDefaultButton = false,
  footerContent,
  footerNote,
  cardClassName,
  containerClassName,
}) => {
  const { isRendered, isClosing, handleClose } = useModalAnimation(isOpen, onClose);

  if (!isRendered) return null;

  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center p-4 ${isClosing ? "pointer-events-none" : ""}`}
    >
      {/* Dark backdrop with blur */}
      <div
        onClick={handleClose}
        className={`absolute inset-0 bg-black/65 backdrop-blur-sm ${
          isClosing ? "animate-backdrop-out" : "animate-backdrop-in"
        }`}
      />

      <div
        className={`relative z-10 w-full drop-shadow-2xl ${
          containerClassName ||
          "max-w-[361px] h-[456px] max-h-[92%] aspect-[361/456] flex flex-col items-center justify-center px-5 pt-6 pb-7"
        } ${isClosing ? "animate-modal-out" : "animate-modal-in"} ${cardClassName || ""}`}
        style={{
          backgroundImage: `url('/assets/modal-background.webp')`,
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Top Close Button (X in Deep Red) */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-8 p-1 rounded-full text-[#D70313] hover:bg-red-50/50 transition-all cursor-pointer active:scale-90"
          title="Tutup Modal"
        >
          <X className="w-8 h-8 stroke-[2.8]" />
        </button>

        {/* Top Image / Graphic (if provided) */}
        {imageSrc && (
          <div
            className={
              imageContainerClassName || "w-full flex justify-center shrink-0 mb-3"
            }
          >
            <img src={imageSrc} alt={imageAlt} className={imageClassName} />
          </div>
        )}

        {/* Custom Body or Standard Text Content */}
        {children ? (
          children
        ) : (
          <div
            className={`w-full flex flex-col items-center text-center px-2 ${bodyClassName || "mb-4"}`}
          >
            <h2
              className={
                titleClassName ||
                "text-[28px] font-semibold text-[#C70412] tracking-tight mb-2.5 leading-tight"
              }
            >
              {title}
            </h2>

            {subtitle && (
              <div
                className={`font-semibold text-[#1E1E1E] leading-snug mb-2 ${
                  subtitleClassName || "text-[16px] max-w-[290px]"
                }`}
              >
                {subtitle}
              </div>
            )}

            {description && (
              <div
                className={
                  descriptionClassName ||
                  "text-[12px] font-normal text-[#4B5563] leading-relaxed max-w-[290px]"
                }
              >
                {description}
              </div>
            )}
          </div>
        )}

        {/* Bottom Action Button or Custom Footer Content */}
        {footerContent ? (
          <div className="w-full flex justify-center shrink-0">{footerContent}</div>
        ) : (
          !hideDefaultButton &&
          buttonText &&
          onButtonClick && (
            <div className="w-full flex flex-col items-center shrink-0">
              <button
                onClick={onButtonClick}
                className="relative w-[215px] sm:w-[225px] h-[44px] flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-95 hover:brightness-105"
                style={{
                  backgroundImage: `url('/assets/red-button.webp')`,
                  backgroundSize: "100% 100%",
                  backgroundRepeat: "no-repeat",
                }}
              >
                <span className="text-white font-extrabold text-[13px] sm:text-[14px] tracking-wider uppercase drop-shadow">
                  {buttonText}
                </span>
              </button>
              {footerNote && (
                <div className="mt-2.5 w-full flex justify-center">{footerNote}</div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
};
