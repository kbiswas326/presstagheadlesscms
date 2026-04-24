/// admin> app> layout.js | Root layout component for the Presstag admin dashboard. This component sets up the overall structure of the admin interface, including global styles, context providers for user and theme management, and a toaster for notifications. It wraps the main content of the admin pages with a consistent layout and styling, ensuring a cohesive user experience across all admin pages. The layout also includes support for dark mode and responsive design to enhance usability on different devices. //
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { UserProvider } from "./context/UserContext";
import { ThemeProvider } from "./context/ThemeContext";
import LayoutContent from "./LayoutContent";
import { headers } from "next/headers";

const normalizeApiBase = (raw) => {
  const trimmed = String(raw || "").trim().replace(/\/+$/, "");
  if (!trimmed) return "http://localhost:5000/api";
  if (trimmed.endsWith("/api")) return trimmed;
  return `${trimmed}/api`;
};

const API_BASE = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");

const resolveTenantIdFromHost = (host) => {
  const envTenant = String(process.env.NEXT_PUBLIC_TENANT_ID || "").trim();
  if (envTenant) return envTenant;

  const h = String(host || "").toLowerCase();
  if (h.includes("sportzpoint")) return "sportzpoint";
  if (h.includes("presstag")) return "presstag";
  return "presstag";
};

async function getTenantSiteTitle(tenantId) {
  try {
    const res = await fetch(`${API_BASE}/layout-config`, {
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const cfg = await res.json();
    const title = String(cfg?.branding?.siteTitle || "").trim();
    return title || null;
  } catch {
    return null;
  }
}

export async function generateMetadata() {
  const h = await headers();
  const host = h.get("host") || "";
  const tenantId = resolveTenantIdFromHost(host);
  const siteTitle = (await getTenantSiteTitle(tenantId)) || tenantId;
  const suffix = `${siteTitle} | PressTag`;

  return {
    title: {
      default: `Dashboard - ${suffix}`,
      template: `%s - ${suffix}`,
    },
    description: "CMS Dashboard Layout",
    icons: {
      icon: [{ url: "/icon.png", type: "image/png" }],
      shortcut: [{ url: "/icon.png", type: "image/png" }],
      apple: [{ url: "/icon.png", type: "image/png" }],
    },
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-100 dark:bg-gray-900 h-screen overflow-hidden flex transition-colors duration-300">
        <ThemeProvider>
          <UserProvider>
            <LayoutContent>{children}</LayoutContent>
            <Toaster position="top-right" />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
