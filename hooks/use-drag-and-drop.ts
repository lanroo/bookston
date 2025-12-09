
import { useCallback, useRef, useState } from 'react';

export interface UseDragAndDropOptions {
  itemHeight?: number;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  debounceMs?: number;
}

export interface UseDragAndDropReturn<T> {
  draggedIndex: number | null;
  hoverIndex: number | null;
  dragY: number;
  handleDragStart: (index: number, startY: number) => void;
  handleDragMove: (currentY: number, startIndex: number) => void;
  handleDragEnd: () => void;
  calculateTargetIndex: (currentY: number, startIndex: number) => number;
}

export function useDragAndDrop<T>(
  items: T[],
  options: UseDragAndDropOptions = {}
): UseDragAndDropReturn<T> {
  const { itemHeight = 112, onReorder, debounceMs = 300 } = options;

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [dragY, setDragY] = useState(0);

  const dragStartY = useRef(0);
  const dragStartIndex = useRef(0);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const calculateTargetIndex = useCallback(
    (currentY: number, startIndex: number): number => {
      const offset = currentY - dragStartY.current;
      const indexOffset = Math.round(offset / itemHeight);
      const targetIndex = startIndex + indexOffset;
      return Math.max(0, Math.min(items.length - 1, targetIndex));
    },
    [items.length, itemHeight]
  );

  const handleDragStart = useCallback(
    (index: number, startY: number) => {
      setDraggedIndex(index);
      dragStartIndex.current = index;
      dragStartY.current = startY;
      setHoverIndex(null);
      setDragY(0);
    },
    []
  );

  const handleDragMove = useCallback(
    (currentY: number, startIndex: number) => {
      if (draggedIndex === null) return;

      const targetIndex = calculateTargetIndex(currentY, startIndex);
      const offset = currentY - dragStartY.current;
      setDragY(offset);

      if (targetIndex !== dragStartIndex.current && targetIndex !== hoverIndex) {
        setHoverIndex(targetIndex);

        dragStartIndex.current = targetIndex;

        if (onReorder) {
          if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
          }
          debounceTimeoutRef.current = setTimeout(() => {
            onReorder(dragStartIndex.current, targetIndex);
          }, debounceMs);
        }
      }
    },
    [draggedIndex, hoverIndex, calculateTargetIndex, onReorder, debounceMs]
  );

  const handleDragEnd = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    if (onReorder && draggedIndex !== null && hoverIndex !== null) {
      onReorder(draggedIndex, hoverIndex);
    }
    
    setDraggedIndex(null);
    setDragY(0);
    setHoverIndex(null);
    dragStartY.current = 0;
    dragStartIndex.current = 0;
  }, [draggedIndex, hoverIndex, onReorder]);

  return {
    draggedIndex,
    hoverIndex,
    dragY,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    calculateTargetIndex,
  };
}

