"use client";

import { UserButton } from "@clerk/nextjs";
import { MessageCircle } from "lucide-react";

export default function ChatHeader() {
    return (
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b shadow-sm">

            {/* LEFT SIDE */}
            <div className="flex items-center gap-4">

                {/* Logo */}
                <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center">
                    <MessageCircle size={20} />
                </div>

                {/* Title + Subtitle */}
                <div>
                    <h1 className="font-semibold text-lg text-gray-800">
                        Tars Chat
                    </h1>
                    <p className="text-sm text-gray-500">
                        Start conversations
                    </p>
                </div>
            </div>

            {/* RIGHT SIDE */}
            <UserButton afterSignOutUrl="/" />

        </div>
    );
}