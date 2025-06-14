"use client";

import dynamic from "next/dynamic";

// Dynamically import SyncStatusIndicator for client-side only
const SyncStatusIndicator = dynamic(
  () => import('@/components/ui/sync-status-indicator'),
  {
    ssr: false,
    loading: () => <div className="h-4 w-4" />
  }
);

export default SyncStatusIndicator;