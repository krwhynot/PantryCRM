'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RotateCcw, Trash2, Clock } from 'lucide-react';

interface SessionRecoveryDialogProps {
  open: boolean;
  onRestore: () => void;
  onDiscard: () => void;
  draftAge: string;
  isRestoring?: boolean;
}

export const SessionRecoveryDialog: React.FC<SessionRecoveryDialogProps> = ({
  open,
  onRestore,
  onDiscard,
  draftAge,
  isRestoring = false
}) => {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-blue-600" />
            Restore Previous Work?
          </DialogTitle>
          <DialogDescription>
            We found unsaved work from your previous session.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-blue-200 bg-blue-50">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <strong>Draft saved:</strong> {draftAge}
            <br />
            Your form data including notes and selections are preserved.
          </AlertDescription>
        </Alert>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onDiscard}
            disabled={isRestoring}
            className="flex items-center gap-2 touch-target"
          >
            <Trash2 className="h-4 w-4" />
            Start Fresh
          </Button>
          <Button
            onClick={onRestore}
            disabled={isRestoring}
            className="flex items-center gap-2 touch-target"
          >
            <RotateCcw className="h-4 w-4" />
            {isRestoring ? 'Restoring...' : 'Restore Draft'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SessionRecoveryDialog;