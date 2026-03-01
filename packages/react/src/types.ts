import type { CSSProperties } from "react";

export interface ReferKitWidgetProps {
  campaignId: string;
  userEmail: string;
  userId?: string;
  apiUrl?: string;
  className?: string;
  style?: CSSProperties;
}

export interface UseReferKitReturn {
  share: (platform: "twitter" | "facebook" | "email" | "copy") => void;
  referralLink: string | null;
  stats: {
    referrals: number;
    conversions: number;
  } | null;
}
