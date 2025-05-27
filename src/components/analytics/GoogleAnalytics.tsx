
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Define gtag on the window object
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[]; // dataLayer should be initialized by the script
  }
}

export function GoogleAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || typeof window.gtag !== 'function') {
      return;
    }
    // Send page_view event for initial load and client-side navigations
    window.gtag('event', 'page_view', {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
      send_to: GA_MEASUREMENT_ID,
    });
  }, [pathname]); // pathname is the primary dependency that triggers re-tracking

  if (!GA_MEASUREMENT_ID) {
    // Don't render scripts if GA_MEASUREMENT_ID is not set
    return null;
  }

  return (
    <>
      <Script
        id="ga-gtag-js" // Added a more specific ID
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="ga-init" // Added a more specific ID
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              send_page_view: false, // We are sending page_view manually via useEffect
              page_path: window.location.pathname, // Set initial page path for config
            });
          `,
        }}
      />
    </>
  );
}
