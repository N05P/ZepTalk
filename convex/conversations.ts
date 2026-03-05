import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getFirstConversation = query({
    args: {
        clerkId: v.string(),
    },
    handler: async (ctx, args) => {

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", q =>
                q.eq("clerkId", args.clerkId)
            )
            .unique();

        if (!user) return null;

        // Fetch all conversations
        const conversations = await ctx.db
            .query("conversations")
            .collect();

        // Filter in JS (correct way)
        const firstConversation = conversations.find(conv =>
            conv.participants.includes(user._id)
        );

        return firstConversation ?? null;
    },
});

/* =========================================================
   CREATE OR GET CONVERSATION
========================================================= */
export const createOrGetConversation = mutation({
    args: {
        otherUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) throw new Error("User not found");

        // fetch conversations of current user only (faster)
        const conversations = await ctx.db.query("conversations").collect();

        const existing = conversations.find(
            conv =>
                conv.participants.length === 2 &&
                conv.participants.includes(currentUser._id) &&
                conv.participants.includes(args.otherUserId)
        );

        if (existing) return existing._id;

        return await ctx.db.insert("conversations", {
            participants: [currentUser._id, args.otherUserId],
            lastMessage: "",
            lastMessageTime: Date.now(),
        });
    },
});

/* =========================================================
   GET MY CONVERSATIONS (WITH UNREAD COUNT)
========================================================= */
export const getMyConversations = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", q =>
                q.eq("clerkId", identity.subject)
            )
            .unique();

        if (!currentUser) return [];

        const conversations = await ctx.db.query("conversations").collect();

        const myConversations = conversations.filter(conv =>
            conv.participants.includes(currentUser._id)
        );

        const formatted = await Promise.all(
            myConversations.map(async (conv) => {

                const otherUserId = conv.participants.find(
                    id => id !== currentUser._id
                );

                const otherUser = otherUserId
                    ? await ctx.db.get(otherUserId)
                    : null;

                // ✅ UNREAD COUNT (CORRECT PLACE)
                const unreadMessages = await ctx.db
                    .query("messages")
                    .withIndex("by_conversation_and_read", q =>
                        q
                            .eq("conversationId", conv._id)
                            .eq("isRead", false)
                    )
                    .collect();

                const unreadCount = unreadMessages.reduce((count, msg) => {
                    if (msg.senderId !== currentUser._id) {
                        return count + 1;
                    }
                    return count;
                }, 0);

                return {
                    _id: conv._id,
                    lastMessage: conv.lastMessage,
                    lastMessageTime: conv.lastMessageTime,
                    typingUserId: conv.typingUserId,
                    typingAt: conv.typingAt,
                    otherUser,
                    unreadCount,
                };
            })
        );

        return formatted.sort(
            (a, b) =>
                (b.lastMessageTime || 0) - (a.lastMessageTime || 0)
        );
    },
});

/* =========================================================
   MARK MESSAGES AS READ
========================================================= */
export const markAsRead = mutation({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) return;

        const unreadMessages = await ctx.db
            .query("messages")
            .withIndex("by_conversation_and_read", q =>
                q.eq("conversationId", args.conversationId).eq("isRead", false)
            )
            .collect();

        for (const msg of unreadMessages) {
            if (msg.senderId !== currentUser._id) {
                await ctx.db.patch(msg._id, { isRead: true });
            }
        }
    },
});

/* =========================================================
   TYPING INDICATOR
========================================================= */
export const setTyping = mutation({
    args: {
        conversationId: v.id("conversations"),
        isTyping: v.boolean(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) return;

        await ctx.db.patch(args.conversationId, {
            typingUserId: args.isTyping ? currentUser._id : undefined,
            typingAt: args.isTyping ? Date.now() : undefined,
        });
    },
});

/* =========================================================
   GET CONVERSATION BY ID
========================================================= */
export const getConversationById = query({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.conversationId);
    },
});