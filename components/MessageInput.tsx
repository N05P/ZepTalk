"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export default function MessageInput({
                                         conversationId,
                                     }: {
    conversationId: string;
}) {
    const [text, setText] = useState("");
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const sendMessage = useMutation(api.messages.sendMessage);
    const setTyping = useMutation(api.conversations.setTyping);

    const handleSend = async () => {
        if (!text.trim()) return;

        await sendMessage({
            conversationId: conversationId as Id<"conversations">,
            text,
        });

        setText("");
        await setTyping({ conversationId, isTyping: false });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setText(e.target.value);

        setTyping({ conversationId, isTyping: true });

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            setTyping({ conversationId, isTyping: false });
        }, 2000);
    };

    return (
        <div className="p-4 border-t bg-white flex gap-2">
            <input
                type="text"
                value={text}
                onChange={handleChange}
                placeholder="Type a message..."
                className="flex-1 border rounded-lg px-3 py-2 outline-none"
                onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                }}
            />

            <button
                onClick={handleSend}
                className="bg-blue-500 text-white px-4 rounded-lg"
            >
                Send
            </button>
        </div>
    );
}