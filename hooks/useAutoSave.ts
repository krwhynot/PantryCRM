'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import { offlineStorage } from '@/src/lib/offline-storage';

export interface AutoSaveOptions {
  delay?: number; // Debounce delay in milliseconds
  key: string; // Unique key for the draft
  enabled?: boolean; // Whether auto-save is enabled
  onSaveSuccess?: () => void; // Callback when save succeeds
  onSaveError?: (error: Error) => void; // Callback when save fails
}

export function useAutoSave<T>(
  data: T,
  options: AutoSaveOptions
) {
  const {
    delay = 3000,
    key,
    enabled = true,
    onSaveSuccess,
    onSaveError
  } = options;

  const [debouncedData] = useDebounce(data, delay);
  const previousDataRef = useRef<T>();
  const isInitialRender = useRef(true);

  const saveDraft = useCallback(async (dataToSave: T) => {
    if (!enabled) return;

    try {
      await offlineStorage.saveDraft('form', key, {
        data: dataToSave,
        timestamp: Date.now(),
        version: '1.0'
      });
      onSaveSuccess?.();
    } catch (error) {
      console.error('Auto-save failed:', error);
      onSaveError?.(error as Error);
    }
  }, [key, enabled, onSaveSuccess, onSaveError]);

  const loadDraft = useCallback(async (): Promise<T | null> => {
    if (!enabled) return null;

    try {
      const draft = await offlineStorage.getDraft('form', key);
      return draft?.data || null;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }, [key, enabled]);

  const clearDraft = useCallback(async () => {
    if (!enabled) return;

    try {
      await offlineStorage.removeDraft('form', key);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [key, enabled]);

  const isDraftAvailable = useCallback(async (): Promise<boolean> => {
    if (!enabled) return false;

    try {
      const draft = await offlineStorage.getDraft('form', key);
      return draft !== null;
    } catch (error) {
      console.error('Failed to check draft availability:', error);
      return false;
    }
  }, [key, enabled]);

  // Auto-save when debounced data changes
  useEffect(() => {
    // Skip initial render and only save if data actually changed
    if (isInitialRender.current) {
      isInitialRender.current = false;
      previousDataRef.current = debouncedData;
      return;
    }

    // Only save if data has meaningfully changed
    const hasChanged = JSON.stringify(previousDataRef.current) !== JSON.stringify(debouncedData);
    
    if (hasChanged && enabled) {
      saveDraft(debouncedData);
      previousDataRef.current = debouncedData;
    }
  }, [debouncedData, saveDraft, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Optional: Clear draft on unmount if desired
      // clearDraft();
    };
  }, []);

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    isDraftAvailable
  };
}

export default useAutoSave;