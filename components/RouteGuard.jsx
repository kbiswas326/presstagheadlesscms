"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function RouteGuard({ children, requiredRole }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // 1. Try to get role from direct 'role' key
    let role = localStorage.getItem("role");

    // 2. If not found, try to get from 'user' object
    if (!role) {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                role = user.role || user.type; // Check 'role' or 'type' just in case
            } catch (e) {
                console.error("Failed to parse user from localStorage", e);
            }
        }
    }

    // 3. Validation Logic
    if (!role) {
      // No role found -> Redirect to login
      router.replace("/login");
    } else if (requiredRole && role.toLowerCase() !== requiredRole.toLowerCase()) {
      // Role found but doesn't match requirement -> Redirect to home (or unauthorized page)
      console.warn(`Unauthorized access. Required: ${requiredRole}, Found: ${role}`);
      router.replace("/"); 
    } else {
      // Authorized
      setAuthorized(true);
    }
  }, [requiredRole, router]);

  // Never protect login
  if (pathname.startsWith("/login")) {
    return children;
  }

  // Never protect posts pages
  if (pathname.startsWith("/posts")) {
    return children;
  }

  if (!authorized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return children;
}
