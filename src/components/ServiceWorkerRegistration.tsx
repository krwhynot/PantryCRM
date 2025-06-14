'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only run on client side after component mounts
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    
    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) return;
    
    const registerServiceWorker = () => {
      navigator.serviceWorker.register('/sw.js')
        .then(function(registration) {
          console.log('SW registered: ', registration);
        })
        .catch(function(registrationError) {
          console.log('SW registration failed: ', registrationError);
        });
    };

    // Register immediately if page is already loaded
    if (document.readyState === 'complete') {
      registerServiceWorker();
    } else {
      // Wait for load event
      window.addEventListener('load', registerServiceWorker);
      return () => window.removeEventListener('load', registerServiceWorker);
    }
  }, []);

  // This component doesn't render anything
  return null;
}