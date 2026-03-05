import ChatWindow from "@/components/ChatWindow";
import MessageInput from "@/components/MessageInput";

export default async function ChatPage({
                                           params,
                                       }: {
    params: Promise<{ conversationId: string }>;
}) {
    const { conversationId } = await params;

    if (!conversationId) {
        return <div>Invalid conversation</div>;
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <div className="flex-1 min-h-0">
                <ChatWindow conversationId={conversationId} />
            </div>

            <MessageInput conversationId={conversationId} />
        </div>
    );
}