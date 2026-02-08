"use client";

import { useEffect } from "react";

export function PWADevCleanup() {
    useEffect(() => {
        // Only run in development
        if (process.env.NODE_ENV === "development" && "serviceWorker" in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
                for (const registration of registrations) {
                    console.log("👻 Ninja Flow: Unregistering zombie service worker in dev mode:", registration);
                    registration.unregister();
                }
            });
        }
    }, []);

    return null;
}
