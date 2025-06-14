'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
          .then(function(registration) {
            console.log('SW registered: ', registration);
          })
          .catch(function(registrationError) {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  // This component doesn't render anything
  return null;
}