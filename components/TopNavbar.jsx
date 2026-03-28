"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  FileText,
  Zap,
  Globe,
  Image,
  Video,
} from "lucide-react";
import { useTheme } from "context/ThemeContext";

export default function TopNavbar() {
  const router = useRouter();
  const { isDark } = useTheme();
  
  const [showNewPostMenu, setShowNewPostMenu] = useState(false);

  const lightTheme = {
    bg: "bg-white",
    border: "border-gray-200",
    text: "text-gray-700",
    inputBg: "bg-gray-50",
    inputBorder: "border-gray-200",
    inputText: "text-gray-900",
    inputPlaceholder: "placeholder-gray-400",
    buttonHover: "hover:bg-gray-100",
    iconColor: "text-gray-600",
    activeIcon: "text-blue-600 bg-blue-50",
    dropdownBg: "bg-white",
    dropdownHover: "hover:bg-gray-50",
  };

  const darkTheme = {
    bg: "bg-blue-950",
    border: "border-blue-900/50",
    text: "text-blue-300/70",
    inputBg: "bg-blue-900/30",
    inputBorder: "border-blue-800/50",
    inputText: "text-white",
    inputPlaceholder: "placeholder-blue-400/50",
    buttonHover: "hover:bg-blue-900/40",
    iconColor: "text-blue-300",
    activeIcon: "text-white bg-blue-800/50",
    dropdownBg: "bg-blue-950",
    dropdownHover: "hover:bg-blue-900/40",
  };

  const theme = isDark ? darkTheme : lightTheme;

  const postTypes = [
    { label: "Article", icon: FileText, href: "/posts/article/edit" },
    { label: "Live Blog", icon: Zap, href: "/posts/live-blog/edit" },
    { label: "Web Story", icon: Globe, href: "/posts/web-story/edit" },
    { label: "Photo Gallery", icon: Image, href: "/posts/photo-gallery/edit" },
    { label: "Video", icon: Video, href: "/posts/video/edit" },
  ];

  return (
    <header className={`flex justify-between items-center ${theme.bg} pl-6 pr-14 py-3 border-b ${theme.border} transition-colors duration-300`}>
      <div className="flex items-center gap-4 flex-1 max-w-2xl">
        <div className="relative w-full">
          <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.iconColor}`} />
          <input
            type="text"
            placeholder="Search posts, media, categories..."
            className={`w-full pl-10 pr-4 py-2 ${theme.inputBg} border ${theme.inputBorder} ${theme.inputText} ${theme.inputPlaceholder} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all`}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        

        <div className="relative">
          <button
            onClick={() => setShowNewPostMenu(!showNewPostMenu)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md"
          >
            <Plus size={20} strokeWidth={2.5} />
            <span className="font-medium">New Post</span>
          </button>

          {showNewPostMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNewPostMenu(false)}></div>
              <div className={`absolute right-0 mt-2 w-56 ${theme.dropdownBg} border ${theme.border} rounded-lg shadow-xl z-50`}>
                <div className="py-2">
                  {postTypes.map((type) => (
                    <button
                      key={type.label}
                      onClick={() => {
                        setShowNewPostMenu(false);
                        router.push(type.href + '/new');
                      }}
                      className={`flex items-center gap-3 px-4 py-2.5 ${theme.text} ${theme.dropdownHover} transition-colors`}
                    >
                      <type.icon size={18} className={theme.iconColor} />
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
