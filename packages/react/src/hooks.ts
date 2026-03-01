"use client";
import { useState, useEffect, useCallback } from "react";
import type { UseReferKitReturn } from "./types";

export function useReferKit(
  campaignId: string,
  userEmail: string,
  apiUrl?: string
): UseReferKitReturn {
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [stats, setStats] = useState<{ referrals: number; conversions: number } | null>(null);

  const baseUrl = apiUrl || "https://api-referkit.threestack.io";

  useEffect(() => {
    if (!campaignId || !userEmail) return;

    fetch(`${baseUrl}/api/referrals/link?campaignId=${campaignId}&email=${encodeURIComponent(userEmail)}`)
      .then((r) => r.json())
      .then((data) => {
        setReferralLink(data.link ?? null);
        setStats(data.stats ?? null);
      })
      .catch(() => {});
  }, [campaignId, userEmail, baseUrl]);

  const share = useCallback(
    (platform: "twitter" | "facebook" | "email" | "copy") => {
      if (!referralLink) return;
      const encoded = encodeURIComponent(referralLink);
      const text = encodeURIComponent("Check this out!");
      const urls: Record<string, string> = {
        twitter: `https://twitter.com/intent/tweet?url=${encoded}&text=${text}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
        email: `mailto:?subject=Check this out&body=${encoded}`,
        copy: "",
      };
      if (platform === "copy") {
        navigator.clipboard.writeText(referralLink).catch(() => {});
      } else {
        window.open(urls[platform], "_blank");
      }
    },
    [referralLink]
  );

  return { share, referralLink, stats };
}
