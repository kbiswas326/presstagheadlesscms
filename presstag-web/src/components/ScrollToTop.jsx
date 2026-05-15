"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const ScrollToTop = () => {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const KEY = "presstag_tpl";

    const readTplFromLocation = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const raw = params.get("tpl");
        const tpl = String(raw || "").trim().toLowerCase();
        return tpl || "";
      } catch {
        return "";
      }
    };

    const readStoredTpl = () => {
      try {
        const raw = window.sessionStorage.getItem(KEY);
        const tpl = String(raw || "").trim().toLowerCase();
        return tpl || "";
      } catch {
        return "";
      }
    };

    const writeStoredTpl = (tpl) => {
      try {
        if (!tpl) {
          window.sessionStorage.removeItem(KEY);
          return;
        }
        window.sessionStorage.setItem(KEY, tpl);
      } catch {}
    };

    const appendTplToAnchors = (tpl) => {
      if (!tpl) return;
      const anchors = document.querySelectorAll("a[href]");
      anchors.forEach((a) => {
        try {
          const href = a.getAttribute("href");
          if (!href) return;
          if (href.startsWith("#")) return;
          if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return;

          const url = new URL(href, window.location.origin);
          if (url.origin !== window.location.origin) return;
          if (url.searchParams.has("tpl")) return;
          url.searchParams.set("tpl", tpl);
          const nextHref = `${url.pathname}${url.search}${url.hash}`;
          a.setAttribute("href", nextHref);
        } catch {}
      });
    };

    const tplFromUrl = readTplFromLocation();
    if (tplFromUrl) writeStoredTpl(tplFromUrl);
    const tpl = tplFromUrl || readStoredTpl();
    appendTplToAnchors(tpl);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
