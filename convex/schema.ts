import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    /* ================= USERS ================= */
    users: defineTable({
        clerkId: v.string(),
        name: v.string(),
        email: v.string(),
        image: v.string(),
        isOnline: v.optional(v.boolean()),
        lastSeen: v.optional(v.number()),
    }).index("by_clerkId", ["clerkId"]),

    /* ============== CONVERSATIONS ============== */
    conversations: defineTable({
        participants: v.array(v.id("users")), // scalable (group ready)
        lastMessage: v.optional(v.string()),
        lastMessageTime: v.optional(v.number()),
        typingUserId: v.optional(v.id("users")),
        typingAt: v.optional(v.number()),
    })
        .index("by_participants", ["participants"]),

    /* ================= MESSAGES ================= */
    messages: defineTable({
        conversationId: v.id("conversations"),
        senderId: v.id("users"),
        text: v.string(),
        createdAt: v.number(),
        isRead: v.boolean(),
    })
        .index("by_conversation", ["conversationId"])
        .index("by_conversation_and_read", ["conversationId", "isRead"])
        .index("by_sender", ["senderId"]),
});