import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * SEND MESSAGE
 */
export const sendMessage = mutation({
    args: {
        conversationId: v.id("conversations"),
        text: v.string(),
    },

    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        // Find sender
        const sender = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) =>
                q.eq("clerkId", identity.subject)
            )
            .unique();

        if (!sender) throw new Error("Sender not found");

        const now = Date.now();

        // Insert message
        await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            senderId: sender._id,
            text: args.text,
            createdAt: now,
            isRead: false,
        });

        // Update conversation preview
        await ctx.db.patch(args.conversationId, {
            lastMessage: args.text,
            lastMessageTime: now,
        });
    },
});

/**
 * GET MESSAGES (REALTIME)
 */
export const getMessages = query({
    args: {
        conversationId: v.id("conversations"),
    },

    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) =>
                q.eq("clerkId", identity.subject)
            )
            .unique();

        if (!currentUser) return [];

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) =>
                q.eq("conversationId", args.conversationId)
            )
            .order("asc")
            .collect();

        // Attach sender info + read status
        const enriched = await Promise.all(
            messages.map(async (msg) => {
                const sender = await ctx.db.get(msg.senderId);

                return {
                    _id: msg._id,
                    text: msg.text,
                    createdAt: msg.createdAt,
                    senderId: msg.senderId,
                    senderName: sender?.name,
                    senderImage: sender?.image,
                    isOwn: msg.senderId === currentUser._id,
                    isRead: msg.isRead,
                };
            })
        );

        return enriched;
    },
});

/**
 * MARK MESSAGES AS READ
 */
export const markAsRead = mutation({
    args: {
        conversationId: v.id("conversations"),
    },

    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) =>
                q.eq("clerkId", identity.subject)
            )
            .unique();

        if (!currentUser) return;

        const unreadMessages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) =>
                q.eq("conversationId", args.conversationId)
            )
            .collect();

        for (const msg of unreadMessages) {
            if (msg.senderId !== currentUser._id && !msg.isRead) {
                await ctx.db.patch(msg._id, {
                    isRead: true,
                });
            }
        }
    },
});

/**
 * GET UNREAD COUNT PER CONVERSATION
 */
export const getUnreadCounts = query({
    args: {},

    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return {};

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) =>
                q.eq("clerkId", identity.subject)
            )
            .unique();

        if (!currentUser) return {};

        const messages = await ctx.db.query("messages").collect();

        const unread: Record<string, number> = {};

        for (const msg of messages) {
            if (msg.senderId !== currentUser._id && !msg.isRead) {
                unread[msg.conversationId] =
                    (unread[msg.conversationId] || 0) + 1;
            }
        }

        return unread;
    },
});