"use client";

import { useUser, SignInButton } from "@clerk/nextjs";
import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useRouter } from "next/navigation";

export default function Home() {
    const { user, isLoaded } = useUser();
    const router = useRouter();

    const syncUser = useMutation(api.users.syncUser);

    // Get first conversation
    const conversation = useQuery(
        api.conversations.getFirstConversation,
        user ? { clerkId: user.id } : "skip"
    );

    // 1️⃣ Sync user after login
    useEffect(() => {
        if (!isLoaded || !user) return;

        syncUser({
            clerkId: user.id,
            name: user.fullName || "No Name",
            email: user.primaryEmailAddress?.emailAddress || "",
            image: user.imageUrl,
        });
    }, [isLoaded, user, syncUser]);

    // 2️⃣ Redirect when conversation is available
    useEffect(() => {
        if (!conversation) return;

        router.replace(`/chat/${conversation._id}`);
    }, [conversation, router]);

    // 🔒 Not logged in
    if (!isLoaded) {
        return (
            <div className="flex h-screen items-center justify-center">
                Loading...
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex h-screen items-center justify-center">
                <SignInButton mode="modal">
                    <button className="px-6 py-3 bg-black text-white rounded-lg">
                        Sign In to Continue
                    </button>
                </SignInButton>
            </div>
        );
    }

    // While redirecting
    return (
        <div className="flex h-screen items-center justify-center">
            Redirecting to chat...
        </div>
    );
}