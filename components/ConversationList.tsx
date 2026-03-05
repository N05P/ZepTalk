"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";

export default function ConversationList() {
    const { isLoaded, isSignedIn } = useUser();
    const router = useRouter();
    const params = useParams();

    const users = useQuery(
        api.users.getUsers,
        isLoaded && isSignedIn ? {} : "skip"
    );

    const conversations = useQuery(
        api.conversations.getMyConversations,
        isLoaded && isSignedIn ? {} : "skip"
    );

    const createConversation = useMutation(
        api.conversations.createOrGetConversation
    );

    const activeId =
        typeof params?.conversationId === "string"
            ? params.conversationId
            : undefined;

    if (!isLoaded) return null;
    if (!isSignedIn) return null;
    if (!users || !conversations) return null;

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            {users.map(user => {
                const conversation = conversations.find(
                    c => c.otherUser?._id === user._id
                );

                const isActive = conversation?._id === activeId;

                const unreadCount = conversation?.unreadCount || 0;

                return (
                    <div
                        key={user._id}
                        onClick={async () => {
                            if (conversation) {
                                router.push(`/chat/${conversation._id}`);
                            } else {
                                const id = await createConversation({
                                    otherUserId: user._id,
                                });
                                router.push(`/chat/${id}`);
                            }
                        }}
                        className={`flex items-center gap-3 p-4 cursor-pointer border-b hover:bg-gray-100 transition ${
                            isActive ? "bg-gray-200" : ""
                        }`}
                    >
                        <div className="relative">
                            <Image
                                src={user.image}
                                alt="avatar"
                                width={40}
                                height={40}
                                className="rounded-full object-cover"
                            />

                            {user.isOnline && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                                {user.name}
                            </p>

                            <p className="text-sm text-gray-500 truncate">
                                {conversation?.lastMessage || "Start chatting"}
                            </p>
                        </div>

                        {unreadCount > 0 && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}