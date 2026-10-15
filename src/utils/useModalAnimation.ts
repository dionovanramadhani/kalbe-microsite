import { useState, useEffect, useCallback, useRef } from "react";

export interface UseModalAnimationOptions {
  duration?: number;
}

export function useModalAnimation(
  isOpen: boolean,
  onClose?: () => void,
  options?: UseModalAnimationOptions
) {
  const duration = options?.duration ?? 200;
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isInternalClosing, setIsInternalClosing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Synchronize state during render when isOpen changes to true (Official React pattern)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setIsRendered(true);
      setIsInternalClosing(false);
    }
  }

  // Clear any existing closing timer when opened
  useEffect(() => {
    if (isOpen && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [isOpen]);

  // Handle external closing (parent sets isOpen to false)
  useEffect(() => {
    if (!isOpen && isRendered) {
      const timer = setTimeout(() => {
        setIsRendered(false);
        setIsInternalClosing(false);
        timerRef.current = null;
      }, duration);
      timerRef.current = timer;
      return () => clearTimeout(timer);
    }
  }, [isOpen, isRendered, duration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleClose = useCallback(() => {
    if (isInternalClosing || !isOpen) return;
    setIsInternalClosing(true);
    timerRef.current = setTimeout(() => {
      setIsRendered(false);
      setIsInternalClosing(false);
      timerRef.current = null;
      if (onClose) {
        onClose();
      }
    }, duration);
  }, [isInternalClosing, isOpen, onClose, duration]);

  const isClosing = isInternalClosing || (!isOpen && isRendered);

  return {
    isRendered,
    isClosing,
    handleClose,
  };
}
