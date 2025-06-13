'use client';

import { useSwipeable } from '../../hooks/useSwipeable';
import { ReactNode, useState } from 'react';
import { Card } from './card';

interface SwipeAction {
  icon: ReactNode;
  label: string;
  action: () => void;
  color: 'red' | 'blue' | 'green' | 'yellow';
}

interface SwipeableCardProps {
  children: ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
}

export default function SwipeableCard({
  children,
  leftActions = [],
  rightActions = [],
  onSwipeLeft,
  onSwipeRight,
  className = ''
}: SwipeableCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [revealDirection, setRevealDirection] = useState<'left' | 'right' | null>(null);

  const handleSwipeLeft = () => {
    if (rightActions.length > 0) {
      setRevealDirection('right');
      setIsRevealed(true);
    } else {
      onSwipeLeft?.();
    }
  };

  const handleSwipeRight = () => {
    if (leftActions.length > 0) {
      setRevealDirection('left');
      setIsRevealed(true);
    } else {
      onSwipeRight?.();
    }
  };

  const handleActionClick = (action: SwipeAction) => {
    action.action();
    setIsRevealed(false);
    setRevealDirection(null);
  };

  const swipeRef = useSwipeable({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    onSwipeEnd: () => {
      // Auto-hide actions after 3 seconds if no interaction
      if (isRevealed) {
        setTimeout(() => {
          setIsRevealed(false);
          setRevealDirection(null);
        }, 3000);
      }
    }
  }, {
    threshold: 50,
    velocity: 0.3,
    trackMouse: true
  });

  const getColorClasses = (color: SwipeAction['color']) => {
    switch (color) {
      case 'red':
        return 'bg-red-500 hover:bg-red-600 text-white';
      case 'blue':
        return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'green':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'yellow':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Left actions */}
      {leftActions.length > 0 && (
        <div className={`absolute left-0 top-0 h-full flex items-center transition-transform duration-200 ${
          isRevealed && revealDirection === 'left' ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {leftActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              className={`h-full px-4 flex flex-col items-center justify-center min-w-16 touch-target ${getColorClasses(action.color)}`}
              aria-label={action.label}
            >
              <div className="text-lg mb-1">{action.icon}</div>
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Right actions */}
      {rightActions.length > 0 && (
        <div className={`absolute right-0 top-0 h-full flex items-center transition-transform duration-200 ${
          isRevealed && revealDirection === 'right' ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {rightActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              className={`h-full px-4 flex flex-col items-center justify-center min-w-16 touch-target ${getColorClasses(action.color)}`}
              aria-label={action.label}
            >
              <div className="text-lg mb-1">{action.icon}</div>
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main card content */}
      <div
        ref={swipeRef}
        className={`relative transition-transform duration-200 ${
          isRevealed && revealDirection === 'left' 
            ? `translate-x-${leftActions.length * 16}` 
            : isRevealed && revealDirection === 'right'
            ? `-translate-x-${rightActions.length * 16}`
            : 'translate-x-0'
        }`}
      >
        <Card 
          className={`touch-friendly ${className}`}
          onClick={() => {
            if (isRevealed) {
              setIsRevealed(false);
              setRevealDirection(null);
            }
          }}
        >
          {children}
        </Card>
      </div>

      {/* Swipe indicators */}
      {(leftActions.length > 0 || rightActions.length > 0) && (
        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
          <span className="inline-block w-4 h-1 bg-gray-300 rounded mx-0.5"></span>
          <span className="inline-block w-4 h-1 bg-gray-300 rounded mx-0.5"></span>
          <span className="inline-block w-4 h-1 bg-gray-300 rounded mx-0.5"></span>
        </div>
      )}
    </div>
  );
}