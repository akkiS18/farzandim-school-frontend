import { useEffect, useRef } from "react";

interface UseSwipeMobileMenuProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  edgeThreshold?: number; // Maximum X distance from left screen edge to trigger opening swipe (default 80px)
  minSwipeDistance?: number; // Minimum horizontal drag distance to register a swipe (default 40px)
}

/**
 * Custom hook to enable touch swipe gestures for opening/closing mobile sidebar drawer.
 * - Swiping right from the left edge opens the menu.
 * - Swiping left anywhere closes an open menu.
 */
export function useSwipeMobileMenu({
  isOpen,
  onOpen,
  onClose,
  edgeThreshold = 80,
  minSwipeDistance = 40,
}: UseSwipeMobileMenuProps) {
  const isOpenRef = useRef(isOpen);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);

  // Keep refs up to date to avoid stale closures in event listeners
  useEffect(() => {
    isOpenRef.current = isOpen;
    onOpenRef.current = onOpen;
    onCloseRef.current = onClose;
  }, [isOpen, onOpen, onClose]);

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let isTracking = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;

      const currentlyOpen = isOpenRef.current;

      // Track swipe if menu is open (swipe left to close) or touch starts near left edge (swipe right to open)
      if (!currentlyOpen && startX <= edgeThreshold) {
        isTracking = true;
      } else if (currentlyOpen) {
        isTracking = true;
      } else {
        isTracking = false;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isTracking || e.changedTouches.length !== 1) return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      const currentlyOpen = isOpenRef.current;

      // Ensure primary gesture direction is horizontal (not vertical scrolling)
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (!currentlyOpen && deltaX >= minSwipeDistance) {
          onOpenRef.current();
        } else if (currentlyOpen && deltaX <= -minSwipeDistance) {
          onCloseRef.current();
        }
      }
      isTracking = false;
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [edgeThreshold, minSwipeDistance]);
}

export default useSwipeMobileMenu;
