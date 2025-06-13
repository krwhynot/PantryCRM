'use client';

import { useRef, useEffect, useCallback } from 'react';

interface SwipeCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeStart?: (event: TouchEvent | MouseEvent) => void;
  onSwipeEnd?: (event: TouchEvent | MouseEvent) => void;
}

interface SwipeConfig {
  threshold?: number; // Minimum distance for a swipe (default: 50)
  velocity?: number;  // Minimum velocity for a swipe (default: 0.3)
  trackMouse?: boolean; // Also track mouse events (default: false)
  preventDefaultOnSwipe?: boolean; // Prevent default on swipe (default: true)
}

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

export function useSwipeable(
  callbacks: SwipeCallbacks,
  config: SwipeConfig = {}
) {
  const {
    threshold = 50,
    velocity = 0.3,
    trackMouse = false,
    preventDefaultOnSwipe = true
  } = config;

  const elementRef = useRef<HTMLElement>(null);
  const startPoint = useRef<TouchPoint | null>(null);
  const isTracking = useRef(false);

  const getEventPoint = (event: TouchEvent | MouseEvent): TouchPoint => {
    const touch = 'touches' in event ? event.touches[0] : event;
    return {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  };

  const handleStart = useCallback((event: TouchEvent | MouseEvent) => {
    startPoint.current = getEventPoint(event);
    isTracking.current = true;
    callbacks.onSwipeStart?.(event);
  }, [callbacks]);

  const handleMove = useCallback((event: TouchEvent | MouseEvent) => {
    if (!isTracking.current || !startPoint.current) return;

    // Prevent scrolling while swiping if configured
    if (preventDefaultOnSwipe && 'touches' in event) {
      const currentPoint = getEventPoint(event);
      const deltaX = Math.abs(currentPoint.x - startPoint.current.x);
      const deltaY = Math.abs(currentPoint.y - startPoint.current.y);
      
      // If horizontal swipe is more prominent, prevent vertical scroll
      if (deltaX > deltaY && deltaX > 10) {
        event.preventDefault();
      }
    }
  }, [preventDefaultOnSwipe]);

  const handleEnd = useCallback((event: TouchEvent | MouseEvent) => {
    if (!isTracking.current || !startPoint.current) return;

    const endPoint = getEventPoint(event);
    const deltaX = endPoint.x - startPoint.current.x;
    const deltaY = endPoint.y - startPoint.current.y;
    const deltaTime = endPoint.time - startPoint.current.time;

    // Calculate distance and velocity
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const calculatedVelocity = distance / deltaTime;

    // Check if swipe meets threshold requirements
    if (distance >= threshold && calculatedVelocity >= velocity) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Determine swipe direction
      if (absX > absY) {
        // Horizontal swipe
        if (deltaX > 0) {
          callbacks.onSwipeRight?.();
        } else {
          callbacks.onSwipeLeft?.();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          callbacks.onSwipeDown?.();
        } else {
          callbacks.onSwipeUp?.();
        }
      }

      if (preventDefaultOnSwipe) {
        event.preventDefault();
      }
    }

    // Reset tracking
    startPoint.current = null;
    isTracking.current = false;
    callbacks.onSwipeEnd?.(event);
  }, [callbacks, threshold, velocity, preventDefaultOnSwipe]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Touch events
    element.addEventListener('touchstart', handleStart, { passive: false });
    element.addEventListener('touchmove', handleMove, { passive: false });
    element.addEventListener('touchend', handleEnd, { passive: false });

    // Mouse events (if enabled)
    if (trackMouse) {
      element.addEventListener('mousedown', handleStart);
      element.addEventListener('mousemove', handleMove);
      element.addEventListener('mouseup', handleEnd);
    }

    return () => {
      element.removeEventListener('touchstart', handleStart);
      element.removeEventListener('touchmove', handleMove);
      element.removeEventListener('touchend', handleEnd);

      if (trackMouse) {
        element.removeEventListener('mousedown', handleStart);
        element.removeEventListener('mousemove', handleMove);
        element.removeEventListener('mouseup', handleEnd);
      }
    };
  }, [handleStart, handleMove, handleEnd, trackMouse]);

  return elementRef;
}

// Hook for pull-to-refresh functionality
export function usePullToRefresh(
  onRefresh: () => Promise<void> | void,
  config: {
    threshold?: number;
    resistance?: number;
    refreshingText?: string;
    pullText?: string;
    releaseText?: string;
  } = {}
) {
  const {
    threshold = 80,
    resistance = 3,
    refreshingText = 'Refreshing...',
    pullText = 'Pull to refresh',
    releaseText = 'Release to refresh'
  } = config;

  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isRefreshing = useRef<boolean>(false);
  const pullDistance = useRef<number>(0);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (isRefreshing.current) return;
    
    const touch = event.touches[0];
    startY.current = touch.clientY;
    currentY.current = touch.clientY;
  }, []);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (isRefreshing.current) return;

    const touch = event.touches[0];
    currentY.current = touch.clientY;
    const deltaY = currentY.current - startY.current;

    // Only pull down when at top of page
    if (window.scrollY === 0 && deltaY > 0) {
      pullDistance.current = deltaY / resistance;
      
      // Update visual indicator
      const container = containerRef.current;
      if (container) {
        container.style.transform = `translateY(${pullDistance.current}px)`;
        
        // Update text based on pull distance
        const indicator = container.querySelector('.pull-indicator');
        if (indicator) {
          if (pullDistance.current > threshold) {
            indicator.textContent = releaseText;
            indicator.classList.add('ready-to-refresh');
          } else {
            indicator.textContent = pullText;
            indicator.classList.remove('ready-to-refresh');
          }
        }
      }

      // Prevent scrolling when pulling
      if (pullDistance.current > 10) {
        event.preventDefault();
      }
    }
  }, [threshold, resistance, pullText, releaseText]);

  const handleTouchEnd = useCallback(async () => {
    if (isRefreshing.current) return;

    const container = containerRef.current;
    
    if (pullDistance.current > threshold) {
      isRefreshing.current = true;
      
      // Show refreshing state
      if (container) {
        const indicator = container.querySelector('.pull-indicator');
        if (indicator) {
          indicator.textContent = refreshingText;
          indicator.classList.add('refreshing');
        }
      }

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        isRefreshing.current = false;
        
        // Reset visual state
        if (container) {
          container.style.transform = 'translateY(0)';
          const indicator = container.querySelector('.pull-indicator');
          if (indicator) {
            indicator.textContent = pullText;
            indicator.classList.remove('ready-to-refresh', 'refreshing');
          }
        }
      }
    } else {
      // Reset without refreshing
      if (container) {
        container.style.transform = 'translateY(0)';
        const indicator = container.querySelector('.pull-indicator');
        if (indicator) {
          indicator.textContent = pullText;
          indicator.classList.remove('ready-to-refresh');
        }
      }
    }

    pullDistance.current = 0;
  }, [threshold, onRefresh, refreshingText, pullText]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return containerRef;
}