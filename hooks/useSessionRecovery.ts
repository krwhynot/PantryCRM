'use client';

import { useState, useEffect, useCallback } from 'react';
import { offlineStorage } from '@/src/lib/offline-storage';

export interface SessionRecoveryOptions {
  maxAge?: number; // Maximum age of draft in milliseconds (default: 1 hour)
  autoRestore?: boolean; // Whether to automatically restore without asking
}

export interface DraftData {
  data: any;
  timestamp: number;
  version: string;
  formId: string;
}

export function useSessionRecovery(
  formType: string,
  formId: string,
  options: SessionRecoveryOptions = {}
) {
  const {
    maxAge = 60 * 60 * 1000, // 1 hour default
    autoRestore = false
  } = options;

  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [draftData, setDraftData] = useState<DraftData | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const isRecentDraft = useCallback((timestamp: number): boolean => {
    return Date.now() - timestamp < maxAge;
  }, [maxAge]);

  const checkForDraft = useCallback(async () => {
    try {
      const draft = await offlineStorage.getDraft(formType, formId);
      
      if (draft && isRecentDraft(draft.timestamp)) {
        const draftInfo: DraftData = {
          data: draft.data,
          timestamp: draft.timestamp,
          version: draft.version || '1.0',
          formId
        };
        
        setDraftData(draftInfo);
        
        if (autoRestore) {
          return draftInfo;
        } else {
          setShowRestoreDialog(true);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error checking for draft:', error);
      return null;
    }
  }, [formType, formId, isRecentDraft, autoRestore]);

  const restoreFromDraft = useCallback(async (): Promise<any | null> => {
    if (!draftData) return null;

    setIsRestoring(true);
    try {
      setShowRestoreDialog(false);
      return draftData.data;
    } catch (error) {
      console.error('Error restoring from draft:', error);
      return null;
    } finally {
      setIsRestoring(false);
    }
  }, [draftData]);

  const discardDraft = useCallback(async () => {
    try {
      await offlineStorage.removeDraft(formType, formId);
      setDraftData(null);
      setShowRestoreDialog(false);
    } catch (error) {
      console.error('Error discarding draft:', error);
    }
  }, [formType, formId]);

  const saveDraft = useCallback(async (data: any) => {
    try {
      await offlineStorage.saveDraft(formType, formId, {
        data,
        timestamp: Date.now(),
        version: '1.0'
      });
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }, [formType, formId]);

  const formatDraftAge = useCallback((timestamp: number): string => {
    const ageMs = Date.now() - timestamp;
    const ageMinutes = Math.floor(ageMs / (1000 * 60));
    const ageHours = Math.floor(ageMinutes / 60);

    if (ageHours > 0) {
      return `${ageHours} hour${ageHours !== 1 ? 's' : ''} ago`;
    } else if (ageMinutes > 0) {
      return `${ageMinutes} minute${ageMinutes !== 1 ? 's' : ''} ago`;
    } else {
      return 'just now';
    }
  }, []);

  // Check for draft on mount
  useEffect(() => {
    checkForDraft();
  }, [checkForDraft]);

  return {
    showRestoreDialog,
    draftData,
    isRestoring,
    restoreFromDraft,
    discardDraft,
    saveDraft,
    formatDraftAge: draftData ? formatDraftAge(draftData.timestamp) : '',
    checkForDraft
  };
}

export default useSessionRecovery;