"use client";
import React, { useEffect, useRef } from "react";
import type { ReferKitWidgetProps } from "./types";

export function ReferKitWidget({
  campaignId,
  userEmail,
  userId,
  apiUrl,
  className,
  style,
}: ReferKitWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    // Load widget script
    const scriptId = "referkit-widget-js";
    const load = () => {
      if ((window as any).ReferKit) {
        (window as any).ReferKit.mount(containerRef.current, {
          campaignId,
          userEmail,
          userId,
          apiUrl: apiUrl || "https://api-referkit.threestack.io",
        });
      }
    };

    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://cdn.referkit.threestack.io/widget.js";
      script.async = true;
      script.onload = load;
      document.head.appendChild(script);
    } else {
      load();
    }

    return () => {
      if ((window as any).ReferKit?.unmount && containerRef.current) {
        (window as any).ReferKit.unmount(containerRef.current);
      }
    };
  }, [campaignId, userEmail, userId, apiUrl]);

  return <div ref={containerRef} className={className} style={style} />;
}
