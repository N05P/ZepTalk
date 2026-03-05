import ConversationList from "@/components/ConversationList";
import ChatHeader from "@/components/ChatHeader";

export default function ChatLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (

        <div className="flex flex-col h-screen overflow-hidden">
            <ChatHeader />
            <div className='flex flex-1 overflow-hidden'>
            {/* Sidebar */}
            <div className="w-80 border-r bg-white hidden md:flex flex-col">
                <div className="p-4 font-bold text-lg border-b">
                    Chats
                </div>
                <ConversationList />
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {children}
            </div>
        </div>
        </div>
    );
}