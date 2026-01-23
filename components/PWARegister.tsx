"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    // Unregister existing service workers to ensure no caching
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister();
          console.log("Service Worker unregistered to disable caching");
        }
      });
    }
  }, []);

  return null;
}
