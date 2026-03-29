"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as LucideIcons from "lucide-react";
import { useTheme } from "../app/context/ThemeContext";
import { useUser } from "../app/context/UserContext";

const {
  Menu,
  ChevronRight,
  Home,
  FileText,
  Image,
  Layers,
  Settings,
  Users,
  Tag,
  Folder,
  Megaphone,
  CheckCircle,
  Clock,
  Edit,
  Zap,
  X,
  Sun,
  Moon,
} = LucideIcons;

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const { isDark, toggleTheme } = useTheme();
  const { user } = useUser();

  const toggleSubmenu = (key) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const menuItems = [
    { label: "Home", href: "/", icon: Home },
    {
      label: "Posts",
      icon: FileText,
      submenu: [
        { label: "Published", href: "/posts/published", icon: CheckCircle },
        { label: "LIVE", href: "/posts/live-blog", icon: Zap },
        { label: "Pending Approval", href: "/posts/pending-approval", icon: Clock },
        { label: "Drafts", href: "/posts/drafts", icon: Edit },
      ],
    },
    {
      label: "Media",
      icon: Image,
      submenu: [
        { label: "Images", href: "/media/images", icon: Folder },
        { label: "Files", href: "/media/files", icon: Folder },
      ],
    },
    {
      label: "Sections",
      icon: Layers,
      submenu: [
        { label: "Categories", href: "/categories", icon: Tag },
        { label: "Tags", href: "/tags", icon: Tag },
      ],
    },
    {
      label: "Settings",
      icon: Settings,
      submenu: [
        { label: "Members", href: "/team", icon: Users },
        { label: "Configuration", href: "/settings/configuration", icon: Megaphone },
        { label: "Customization", href: "/settings/customization", icon: Edit },
        { label: "Ad Inserter", href: "/settings/ad-inserter", icon: Megaphone },
      ],
    },
  ];

  const isActive = (href) => {
    if (!href) return false;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return "AD";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const theme = isDark
    ? {
        bg: "bg-blue-950",
        border: "border-blue-900/50",
        text: "text-blue-300/70",
        textHover: "hover:text-blue-100",
        activeText: "text-white",
        activeBg: "bg-blue-900/50",
        hoverBg: "hover:bg-blue-900/30",
        subBorder: "border-blue-800/50",
        headerText: "text-white",
        gradientFrom: "from-blue-400",
        gradientTo: "to-cyan-400",
        userBg: "from-cyan-500 to-blue-500",
        userText: "text-white",
        userSubtext: "text-blue-300/70",
        toggleBg: "bg-blue-900/50",
        toggleHover: "hover:bg-blue-800/50",
        toggleIcon: "text-blue-300",
      }
    : {
        bg: "bg-white",
        border: "border-gray-200",
        text: "text-gray-600",
        textHover: "hover:text-gray-900",
        activeText: "text-blue-600",
        activeBg: "bg-blue-50",
        hoverBg: "hover:bg-gray-50",
        subBorder: "border-gray-200",
        headerText: "text-gray-900",
        gradientFrom: "from-blue-500",
        gradientTo: "to-blue-600",
        userBg: "from-blue-500 to-blue-600",
        userText: "text-gray-900",
        userSubtext: "text-gray-500",
        toggleBg: "bg-gray-100",
        toggleHover: "hover:bg-gray-200",
        toggleIcon: "text-gray-600",
      };

  return (
    <aside
      className={`${theme.bg} ${theme.text} h-full flex flex-col transition-all duration-300 ease-in-out border-r ${theme.border} ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header */}
      <div className={`h-16 flex items-center justify-between px-4 border-b ${theme.border}`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 bg-gradient-to-br ${theme.gradientFrom} ${theme.gradientTo} rounded-lg flex items-center justify-center`}
            >
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <span className={`text-sm font-semibold ${theme.headerText}`}>PressTag</span>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded-lg ${theme.toggleHover}`}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <Menu size={18} /> : <X size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const hasSub = Boolean(item.submenu);
          const activeChild = item.submenu?.some((s) => isActive(s.href));
          const isItemActive = isActive(item.href) || activeChild;

          return (
            <div key={item.label}>
              <Link
                href={hasSub ? "#" : item.href}
                onClick={(e) => {
                  if (hasSub) {
                    e.preventDefault();
                    toggleSubmenu(item.label);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  isItemActive ? theme.activeText : theme.textHover
                } ${collapsed ? "justify-center" : "justify-between"}`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </div>

                {!collapsed && hasSub && (
                  <ChevronRight
                    size={14}
                    className={`transition-transform ${openMenus[item.label] ? "rotate-90" : ""}`}
                  />
                )}
              </Link>

              {/* Submenu */}
              {hasSub && openMenus[item.label] && !collapsed && (
                <div className={`mt-1 ml-3 pl-3 border-l ${theme.subBorder} space-y-0.5`}>
                  {item.submenu.map((sub) => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all ${
                        isActive(sub.href)
                          ? `${theme.activeBg} ${theme.activeText}`
                          : theme.hoverBg
                      }`}
                    >
                      <sub.icon size={16} />
                      <span className="text-sm">{sub.label}</span>

                      {isActive(sub.href) && (
                        <div
                          className={`w-1 h-1 ${
                            isDark ? "bg-white" : "bg-blue-600"
                          } rounded-full ml-auto`}
                        />
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className={`px-3 pb-3 border-t ${theme.border} pt-3`}>
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg ${theme.toggleBg} ${theme.toggleHover} ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {isDark ? (
            <>
              <Sun size={18} className={theme.toggleIcon} />
              {!collapsed && <span className={`text-sm ${theme.toggleIcon}`}>Light Mode</span>}
            </>
          ) : (
            <>
              <Moon size={18} className={theme.toggleIcon} />
              {!collapsed && <span className={`text-sm ${theme.toggleIcon}`}>Dark Mode</span>}
            </>
          )}
        </button>
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className={`p-3 border-t ${theme.border}`}>
          <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${theme.hoverBg} cursor-pointer`}>
            <div className={`w-8 h-8 bg-gradient-to-br ${theme.userBg} rounded-full flex items-center justify-center flex-shrink-0`}>
              <span className="text-white text-xs font-semibold">{getInitials(user?.name)}</span>
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-medium truncate ${theme.userText}`}>
                {user?.name || 'Admin'}
              </p>
              <p className={`text-xs truncate ${theme.userSubtext}`}>
                {user?.email || 'admin@presstag.com'}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}