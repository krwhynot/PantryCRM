'use client';

import { useRef, useEffect, useCallback, useState } from 'react';

interface DragDropConfig {
  onDragStart?: (item: any, event: DragEvent) => void;
  onDragEnd?: (item: any, event: DragEvent) => void;
  onDrop?: (droppedItem: any, targetItem?: any, dropPosition?: 'before' | 'after' | 'inside') => void;
  onDragOver?: (event: DragEvent) => void;
  canDrag?: (item: any) => boolean;
  canDrop?: (droppedItem: any, targetItem?: any) => boolean;
  dragPreview?: (item: any) => HTMLElement;
  dropTypes?: string[];
  dragType?: string;
}

interface DragState {
  isDragging: boolean;
  draggedItem: any;
  draggedOver: boolean;
  dropPosition: 'before' | 'after' | 'inside' | null;
}

export function useDragAndDrop(item: any, config: DragDropConfig = {}) {
  const elementRef = useRef<HTMLElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItem: null,
    draggedOver: false,
    dropPosition: null
  });

  const {
    onDragStart,
    onDragEnd,
    onDrop,
    onDragOver,
    canDrag = () => true,
    canDrop = () => true,
    dragPreview,
    dropTypes = ['text/plain'],
    dragType = 'text/plain'
  } = config;

  // Make element draggable
  const makeDraggable = useCallback(() => {
    const element = elementRef.current;
    if (!element || !canDrag(item)) return;

    element.draggable = true;
    element.style.cursor = 'grab';

    // Add touch support for mobile
    element.style.touchAction = 'none';
  }, [item, canDrag]);

  // Handle drag start
  const handleDragStart = useCallback((event: DragEvent) => {
    const element = elementRef.current;
    if (!element || !canDrag(item)) {
      event.preventDefault();
      return;
    }

    setDragState(prev => ({ ...prev, isDragging: true, draggedItem: item }));
    element.style.cursor = 'grabbing';
    element.style.opacity = '0.5';

    // Set drag data
    event.dataTransfer!.setData(dragType, JSON.stringify(item));
    event.dataTransfer!.effectAllowed = 'move';

    // Create custom drag preview if provided
    if (dragPreview) {
      const preview = dragPreview(item);
      document.body.appendChild(preview);
      event.dataTransfer!.setDragImage(preview, 0, 0);
      
      // Remove preview after drag starts
      setTimeout(() => {
        if (document.body.contains(preview)) {
          document.body.removeChild(preview);
        }
      }, 0);
    }

    onDragStart?.(item, event);
  }, [item, canDrag, dragType, dragPreview, onDragStart]);

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEvent) => {
    const element = elementRef.current;
    if (element) {
      element.style.cursor = canDrag(item) ? 'grab' : 'default';
      element.style.opacity = '1';
    }

    setDragState(prev => ({ 
      ...prev, 
      isDragging: false, 
      draggedItem: null,
      draggedOver: false,
      dropPosition: null 
    }));

    onDragEnd?.(item, event);
  }, [item, canDrag, onDragEnd]);

  // Handle drag over
  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    
    const rect = elementRef.current?.getBoundingClientRect();
    if (!rect) return;

    const y = event.clientY - rect.top;
    const height = rect.height;
    
    let dropPosition: 'before' | 'after' | 'inside';
    
    if (y < height * 0.25) {
      dropPosition = 'before';
    } else if (y > height * 0.75) {
      dropPosition = 'after';
    } else {
      dropPosition = 'inside';
    }

    setDragState(prev => ({ ...prev, draggedOver: true, dropPosition }));
    
    onDragOver?.(event);
  }, [onDragOver]);

  // Handle drag enter
  const handleDragEnter = useCallback((event: DragEvent) => {
    event.preventDefault();
    setDragState(prev => ({ ...prev, draggedOver: true }));
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback((event: DragEvent) => {
    const element = elementRef.current;
    if (!element) return;

    // Only hide drop indicator if we're actually leaving the element
    const rect = element.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragState(prev => ({ ...prev, draggedOver: false, dropPosition: null }));
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((event: DragEvent) => {
    event.preventDefault();
    
    const draggedData = event.dataTransfer!.getData(dragType);
    if (!draggedData) return;

    try {
      const droppedItem = JSON.parse(draggedData);
      
      if (canDrop(droppedItem, item)) {
        onDrop?.(droppedItem, item, dragState.dropPosition || 'inside');
      }
    } catch (error) {
      console.error('Failed to parse dropped data:', error);
    }

    setDragState(prev => ({ 
      ...prev, 
      draggedOver: false, 
      dropPosition: null 
    }));
  }, [dragType, canDrop, item, onDrop, dragState.dropPosition]);

  // Touch handling for mobile drag and drop
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const touchElement = useRef<HTMLElement | null>(null);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (!canDrag(item)) return;
    
    const touch = event.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    touchElement.current = elementRef.current;
  }, [item, canDrag]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!touchStartPos.current || !touchElement.current) return;
    
    const touch = event.touches[0];
    const deltaX = touch.clientX - touchStartPos.current.x;
    const deltaY = touch.clientY - touchStartPos.current.y;
    
    // Check if it's a significant drag movement
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      event.preventDefault();
      
      // Provide visual feedback for touch drag
      touchElement.current.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      touchElement.current.style.opacity = '0.7';
      touchElement.current.style.zIndex = '1000';
    }
  }, []);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!touchStartPos.current || !touchElement.current) return;
    
    // Reset visual state
    touchElement.current.style.transform = '';
    touchElement.current.style.opacity = '';
    touchElement.current.style.zIndex = '';
    
    // Find drop target
    const touch = event.changedTouches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (elementBelow && elementBelow !== touchElement.current) {
      // Trigger drop simulation
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: new DataTransfer()
      });
      
      dropEvent.dataTransfer!.setData(dragType, JSON.stringify(item));
      elementBelow.dispatchEvent(dropEvent);
    }
    
    touchStartPos.current = null;
    touchElement.current = null;
  }, [dragType, item]);

  // Set up event listeners
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    makeDraggable();

    // Drag events
    element.addEventListener('dragstart', handleDragStart);
    element.addEventListener('dragend', handleDragEnd);
    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('dragenter', handleDragEnter);
    element.addEventListener('dragleave', handleDragLeave);
    element.addEventListener('drop', handleDrop);

    // Touch events for mobile
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('dragstart', handleDragStart);
      element.removeEventListener('dragend', handleDragEnd);
      element.removeEventListener('dragover', handleDragOver);
      element.removeEventListener('dragenter', handleDragEnter);
      element.removeEventListener('dragleave', handleDragLeave);
      element.removeEventListener('drop', handleDrop);
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [
    makeDraggable,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  ]);

  return {
    elementRef,
    dragState,
    isDragging: dragState.isDragging,
    isDraggedOver: dragState.draggedOver,
    dropPosition: dragState.dropPosition
  };
}

// Hook for sortable lists
export function useSortableList<T>(
  items: T[],
  onReorder: (newItems: T[]) => void,
  getId: (item: T) => string
) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const createDragDropHandlers = (item: T, index: number) => {
    return useDragAndDrop(item, {
      canDrag: () => true,
      canDrop: (droppedItem: T, targetItem?: T) => {
        return droppedItem !== targetItem;
      },
      onDragStart: () => {
        setDraggedIndex(index);
      },
      onDragEnd: () => {
        setDraggedIndex(null);
      },
      onDrop: (droppedItem: T, targetItem?: T, dropPosition = 'inside') => {
        const draggedItemIndex = items.findIndex(i => getId(i) === getId(droppedItem));
        const targetIndex = targetItem ? items.findIndex(i => getId(i) === getId(targetItem)) : items.length - 1;
        
        if (draggedItemIndex === -1 || targetIndex === -1) return;
        
        const newItems = [...items];
        const [removed] = newItems.splice(draggedItemIndex, 1);
        
        let insertIndex = targetIndex;
        if (dropPosition === 'after') {
          insertIndex = targetIndex + 1;
        } else if (dropPosition === 'before') {
          insertIndex = targetIndex;
        }
        
        // Adjust for items that were moved from before the target
        if (draggedItemIndex < targetIndex) {
          insertIndex -= 1;
        }
        
        newItems.splice(insertIndex, 0, removed);
        onReorder(newItems);
      },
      dragType: 'application/x-sortable-item'
    });
  };

  return {
    createDragDropHandlers,
    draggedIndex
  };
}