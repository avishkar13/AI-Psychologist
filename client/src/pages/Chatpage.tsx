import Sidebar from "../components/SidebarLayout";
import ChatWindow from "../components/ChatWindow";

export default function ChatPage() {
  return (
    <div className="flex h-screen text-gray-900 dark:text-white">
      <Sidebar />
      <div className="flex-1">
        <ChatWindow />
      </div>
    </div>
  );
}
