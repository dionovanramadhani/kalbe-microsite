import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export type ToastType = "success" | "error";

export interface ToastProps {
  show: boolean;
  type: ToastType;
  message: string;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  show,
  type,
  message,
  onClose,
  duration = 3500,
}) => {
  const [isExiting, setIsExiting] = React.useState(false);

  const handleClose = React.useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsExiting(false);
      onClose();
    }, 280);
  }, [onClose]);

  useEffect(() => {
    if (show) {
      setIsExiting(false);
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, handleClose]);

  if (!show && !isExiting) return null;

  const isSuccess = type === "success";

  return (
    <div className="fixed top-5 left-0 right-0 z-[999] pointer-events-none flex justify-center px-4">
      <div
        className={`pointer-events-auto w-full max-w-[360px] p-3.5 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.22)] backdrop-blur-md flex items-start gap-3 border transition-all duration-200 ${
          isExiting ? "animate-toast-out" : "animate-toast-in"
        } ${
          isSuccess
            ? "bg-emerald-500/95 text-white border-emerald-400/50 shadow-emerald-950/20"
            : "bg-[#D80015]/95 text-white border-red-400/50 shadow-red-950/25"
        }`}
      >
        <div className="shrink-0 mt-0.5 p-1 rounded-full bg-white/20">
          {isSuccess ? (
            <CheckCircle2 className="w-4 h-4 text-white stroke-[2.5]" />
          ) : (
            <AlertCircle className="w-4 h-4 text-white stroke-[2.5]" />
          )}
        </div>

        <div className="flex-1 text-left min-w-0 pr-1">
          <p className="text-[13px] font-bold leading-tight mb-0.5 text-white tracking-wide">
            {isSuccess ? "Registrasi Berhasil" : "Registrasi Gagal"}
          </p>
          <p className="text-[12px] font-medium leading-snug text-white/95 break-words">
            {message}
          </p>
        </div>

        <button
          onClick={handleClose}
          className="shrink-0 p-1 text-white/70 hover:text-white active:scale-90 transition cursor-pointer -mr-1 -mt-0.5"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
