"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

type Props = {
    conversationId: Id<"conversations">;
};

function formatTime(ts: number) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatWindow({ conversationId }: Props) {
    const currentUser = useQuery(api.users.getCurrentUser);

    const messages = useQuery(
        api.messages.getMessages,
        conversationId ? { conversationId } : "skip"
    );

    const conversation = useQuery(
        api.conversations.getConversationById,
        conversationId ? { conversationId } : "skip"
    );

    const markRead = useMutation(api.messages.markAsRead);

    const containerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const prevLengthRef = useRef(0);
    const isAtBottomRef = useRef(true);

    const [showNewBtn, setShowNewBtn] = useState(false);

    /* ===============================
       MARK AS READ
    =============================== */
    useEffect(() => {
        if (!conversationId || !messages || !currentUser) return;

        const hasUnread = messages.some(
            (m) => m.senderId !== currentUser._id && !m.isRead
        );

        if (hasUnread) {
            markRead({ conversationId });
        }
    }, [conversationId, messages, currentUser, markRead]);

    /* ===============================
       REAL BOTTOM DETECTION (FIXED)
    =============================== */
    useEffect(() => {
        if (!bottomRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                isAtBottomRef.current = entry.isIntersecting;

                if (entry.isIntersecting) {
                    setShowNewBtn(false);
                }
            },
            {
                root: containerRef.current,
                threshold: 1.0,
            }
        );

        observer.observe(bottomRef.current);

        return () => observer.disconnect();
    }, []);

    /* ===============================
       MESSAGE CHANGE HANDLER
    =============================== */
    useEffect(() => {
        if (!messages) return;

        const isFirstLoad = prevLengthRef.current === 0;
        const newMessageAdded = messages.length > prevLengthRef.current;

        if (isFirstLoad) {
            // Always go bottom on first load
            bottomRef.current?.scrollIntoView({ behavior: "auto" });
        } else if (newMessageAdded) {
            if (isAtBottomRef.current) {
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            } else {
                setShowNewBtn(true);
            }
        }

        prevLengthRef.current = messages.length;
    }, [messages]);

    if (!messages || !currentUser) {
        return (
            <div className="flex h-full items-center justify-center text-gray-500">
                Loading chat...
            </div>
        );
    }

    return (
        <div className="relative h-full">
            <div
                ref={containerRef}
                className="flex flex-col gap-3 p-4 overflow-y-auto h-full"
            >
                {messages.map((msg) => {
                    const isMe = msg.senderId === currentUser._id;

                    return (
                        <div
                            key={msg._id}
                            className={`flex items-end gap-2 ${
                                isMe ? "justify-end" : "justify-start"
                            }`}
                        >
                            {!isMe && msg.senderImage && (
                                <Image
                                    src={msg.senderImage}
                                    alt="avatar"
                                    width={30}
                                    height={30}
                                    className="rounded-full"
                                />
                            )}

                            <div
                                className={`px-4 py-2 rounded-2xl max-w-xs ${
                                    isMe
                                        ? "bg-black text-white rounded-br-none"
                                        : "bg-gray-200 rounded-bl-none"
                                }`}
                            >
                                <p className="text-sm break-words">{msg.text}</p>

                                <div className="flex items-center gap-1 justify-end mt-1">
                  <span className="text-[10px] opacity-60">
                    {formatTime(msg.createdAt)}
                  </span>

                                    {isMe && (
                                        <Check
                                            size={14}
                                            className={
                                                msg.isRead
                                                    ? "text-blue-500"
                                                    : "text-gray-400"
                                            }
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                <div ref={bottomRef} />
            </div>

            {showNewBtn && (
                <button
                    onClick={() => {
                        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
                        setShowNewBtn(false);
                    }}
                    className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-full shadow-lg"
                >
                    ↓ New Messages
                </button>
            )}
        </div>
    );
}