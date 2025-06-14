"use client";

import dynamic from 'next/dynamic';

// Dynamically import Toaster to prevent SSR issues
const Toaster = dynamic(
  () => import("react-hot-toast").then(mod => ({ default: mod.Toaster })),
  { 
    ssr: false,
    loading: () => null // No loading state needed for toast provider
  }
);

export const SSRSafeToastProvider = () => {
  return <Toaster />;
};