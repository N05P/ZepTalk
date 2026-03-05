"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";

export default function UserList() {
    const users = useQuery(api.users.getUsers);
    const createOrGetConversation = useMutation(
        api.conversations.createOrGetConversation
    );
    const router = useRouter();

    if (!users) return <p>Loading users...</p>;

    if (users.length === 0)
        return <p className="text-gray-500">No users found</p>;

    const handleClick = async (userId: string) => {
        try {
            const conversationId = await createOrGetConversation({
                otherUserId: userId as any,
            });

            router.push(`/chat/${conversationId}`);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-3">
            {users.map((user) => (
                <div
                    key={user._id}
                    onClick={() => handleClick(user._id)}
                    className="flex items-center gap-3 p-3 border rounded-xl hover:bg-gray-50 cursor-pointer transition"
                >
                    <img
                        src={user.image}
                        alt={user.name}
                        className="w-10 h-10 rounded-full"
                    />
                    <p className="font-medium">{user.name}</p>
                </div>
            ))}
        </div>
    );
}