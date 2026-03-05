"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";

export default function PresenceHandler() {
    const { isLoaded, isSignedIn } = useUser();

    const setOnline = useMutation(api.presence.setOnline);
    const setOffline = useMutation(api.presence.setOffline);

    useEffect(() => {
        if (!isLoaded || !isSignedIn) return;

        // ✅ Set online when component mounts
        setOnline();

        // ✅ Set offline when tab closes
        const handleUnload = () => {
            setOffline();
        };

        window.addEventListener("beforeunload", handleUnload);

        return () => {
            setOffline();
            window.removeEventListener("beforeunload", handleUnload);
        };
    }, [isLoaded, isSignedIn, setOnline, setOffline]);

    return null;
}