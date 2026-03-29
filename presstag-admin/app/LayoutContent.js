/// Main layout component that wraps all pages, handling authentication checks and rendering the sidebar and top navbar. - admin > app > LayoutContent.js///
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/TopNavbar";
import { useUser } from "./context/UserContext";

export default function LayoutContent({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, isLoading } = useUser();

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (isLoading) return;
    if (!isLoggedIn && !isLoginPage) {
      router.push("/login");
    }
    if (isLoggedIn && isLoginPage) {
      router.push("/");
    }
  }, [isLoggedIn, isLoading, isLoginPage, router]);

  // Show spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in + not on login page = show nothing (redirect happening)
  if (!isLoggedIn && !isLoginPage) return null;

  // Logged in + on login page = show nothing (redirect happening)
  if (isLoggedIn && isLoginPage) return null;

  // Login page — no sidebar/navbar
  if (isLoginPage) {
    return <main className="h-full w-full">{children}</main>;
  }

  // Protected pages — full layout
  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </>
  );
}