import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import AnimatedBackground from "../AnimatedBackground";
import { Menu } from "lucide-react";

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative h-screen w-full text-white overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-black animate-gradient bg-[length:200%_200%]">

      {/* Animated Background */}
      <AnimatedBackground />

      <div className="relative z-10 flex flex-col h-full backdrop-blur-sm">

        {/* Navbar */}
        <div className="flex-shrink-0 relative z-20">
          <Navbar />
        </div>

        {/* Main Layout */}
        <div className="flex flex-1 overflow-hidden">

          {/* Sidebar */}
          <div
  className={`
    fixed md:relative
    z-40
    inset-y-0 md:inset-auto
    left-0
    w-64
    bg-transparent
    border-r border-white/5
    transform transition-transform duration-300 ease-in-out
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
    md:translate-x-0
  `}
>
            <Sidebar closeSidebar={() => setSidebarOpen(false)} />
          </div>

          {/* Overlay (Mobile) */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 md:hidden z-30"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Chat / Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Mobile Menu */}
            <div className="p-3 md:hidden">
              <Menu
                className="cursor-pointer hover:scale-110 transition-transform duration-200"
                onClick={() => setSidebarOpen(true)}
              />
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-5 md:px-6 py-4">
              {children}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;