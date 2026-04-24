/// Main layout component that wraps all pages, handling authentication checks and rendering the sidebar and top navbar. - admin > app > LayoutContent.js///
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/TopNavbar";
import { useUser } from "./context/UserContext";
import { normalizeRole, canAccessSettings } from "../utils/permissions";

const normalizeApiBase = (raw) => {
  const trimmed = String(raw || "").trim().replace(/\/+$/, "");
  if (!trimmed) return "http://localhost:5000/api";
  if (trimmed.endsWith("/api")) return trimmed;
  return `${trimmed}/api`;
};

const resolveTenantId = () => {
  const envTenant = String(process.env.NEXT_PUBLIC_TENANT_ID || "").trim();
  if (envTenant) return envTenant;

  const host = typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
  if (host.includes("sportzpoint")) return "sportzpoint";
  if (host.includes("presstag")) return "presstag";
  return "presstag";
};

const titleCase = (input) =>
  String(input || "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());

const pageTitleFromPathname = (pathname) => {
  const path = String(pathname || "");
  if (path === "/") return "Dashboard";
  if (path === "/login") return "Login";
  const parts = path.split("/").filter(Boolean);
  const first = parts[0] || "Dashboard";
  if (first === "posts") {
    if (parts.length >= 2) return titleCase(parts[1]);
    return "Posts";
  }
  if (first === "settings") {
    if (parts.length >= 2) return `Settings - ${titleCase(parts[1])}`;
    return "Settings";
  }
  return titleCase(first);
};

export default function LayoutContent({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, isLoading, user } = useUser();
  const [siteTitle, setSiteTitle] = useState("");

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (isLoading) return;
    if (!isLoggedIn && !isLoginPage) {
      console.log('🔄 Redirecting to /login because isLoggedIn:', isLoggedIn, 'isLoading:', isLoading);
      router.push("/login");
    }
    if (isLoggedIn && isLoginPage) {
      router.push("/");
    }
    if (isLoggedIn && !isLoginPage) {
      const role = normalizeRole(user?.role);
      if (!canAccessSettings(role) && (pathname.startsWith('/settings') || pathname.startsWith('/team'))) {
        router.push("/");
      }
    }
  }, [isLoggedIn, isLoading, isLoginPage, router]);

  const tenantId = useMemo(() => resolveTenantId(), []);

  useEffect(() => {
    let cancelled = false;
    const apiBase = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");
    fetch(`${apiBase}/layout-config`, {
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
      },
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg) => {
        if (cancelled) return;
        const t = String(cfg?.branding?.siteTitle || "").trim();
        setSiteTitle(t || tenantId);
      })
      .catch(() => {
        if (cancelled) return;
        setSiteTitle(tenantId);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  useEffect(() => {
    const suffix = `${(siteTitle || tenantId) || "PressTag"} | PressTag`;
    const pageTitle = pageTitleFromPathname(pathname);
    document.title = `${pageTitle} - ${suffix}`;
  }, [pathname, siteTitle, tenantId]);

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
