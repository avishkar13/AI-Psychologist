import { useState, useEffect, useRef } from "react";
import { Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../store/authStore";
import SidebarContent from "./SidebarContent";

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const { fetchChats } = useChatStore();
  const { user } = useAuthStore();

  //Toggle hamburger
  const toggleSidebar = () => setOpen((prev) => !prev);

  useEffect(() => {
    if (user) void fetchChats();
    else useChatStore.getState().reset();
  }, [fetchChats, user]);

  // Close sidebar on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="flex h-screen overflow-hidden relative min-w-[15vw]  bg-purple-500/10">
      {/* Hamburger (mobile only) */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-3 z-9999 bg-gray-600/20 text-white p-2 rounded-md shadow-md cursor-pointer hover:bg-gray-600/40 transition"
      >
        <Menu size={20} />
      </button>

      {/* Sidebar (mobile slide-in) */}
      <AnimatePresence mode="sync">
        {open && (
          <motion.aside
            ref={sidebarRef}
            key="sidebar"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="fixed top-0 left-0 z-30 w-[80vw] sm:w-[60vw] md:hidden h-full 
                       bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 shadow-2xl"
          >
            <SidebarContent onChatSelect={() => setOpen(false)} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Static sidebar on md+ */}
      <aside className="hidden md:flex flex-col w-72 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 shadow-md">
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
