/**
 * ReferKit Embed Widget
 * Renders a referral sharing box in any SaaS app.
 * Usage: <script src="https://cdn.referkit.threestack.io/widget.js" data-api-key="rk_live_..." data-user-id="user_123"></script>
 */

interface ReferKitConfig {
  apiKey: string;
  userId: string;
  containerId?: string;
  theme?: "light" | "dark";
}

interface ReferrerData {
  referralCode: string;
  referralUrl: string;
  totalReferrals: number;
  pendingReward: string;
  paidReward: string;
}

const API_BASE = "https://referkit.threestack.io";

async function getReferrer(apiKey: string, userId: string): Promise<ReferrerData> {
  const res = await fetch(`${API_BASE}/api/widget/referrer?userId=${encodeURIComponent(userId)}`, {
    headers: { "X-API-Key": apiKey },
  });
  if (!res.ok) throw new Error("Failed to fetch referrer data");
  return res.json() as Promise<ReferrerData>;
}

function copyToClipboard(text: string, btn: HTMLButtonElement) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => { btn.textContent = orig; }, 2000);
  });
}

function injectStyles(theme: string) {
  const isDark = theme === "dark";
  const s = document.createElement("style");
  s.textContent = `
    .rk-box{font-family:system-ui,sans-serif;background:${isDark?"#111827":"#fff"};border:1px solid ${isDark?"#374151":"#e5e7eb"};border-radius:10px;padding:16px;max-width:400px}
    .rk-title{font-size:15px;font-weight:700;color:${isDark?"#f9fafb":"#111"};margin-bottom:4px}
    .rk-subtitle{font-size:13px;color:${isDark?"#9ca3af":"#6b7280"};margin-bottom:12px}
    .rk-url-row{display:flex;gap:8px;margin-bottom:12px}
    .rk-url{flex:1;padding:8px 10px;background:${isDark?"#1f2937":"#f9fafb"};border:1px solid ${isDark?"#374151":"#e5e7eb"};border-radius:6px;font-size:12px;color:${isDark?"#9ca3af":"#6b7280"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .rk-btn{padding:8px 14px;background:#22c55e;color:#000;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer}
    .rk-btn:hover{background:#16a34a}
    .rk-stats{display:flex;gap:12px}
    .rk-stat{text-align:center}
    .rk-stat-val{font-size:20px;font-weight:700;color:${isDark?"#22c55e":"#16a34a"}}
    .rk-stat-lbl{font-size:11px;color:${isDark?"#6b7280":"#9ca3af"}}
  `;
  document.head.appendChild(s);
}

export function init(config: ReferKitConfig) {
  const { apiKey, userId, containerId = "referkit-widget", theme = "dark" } = config;
  const container = document.getElementById(containerId);
  if (!container) { console.error(`ReferKit: #${containerId} not found`); return; }
  injectStyles(theme);
  container.innerHTML = '<div class="rk-box"><div class="rk-subtitle">Loading…</div></div>';
  getReferrer(apiKey, userId).then(data => {
    const box = document.createElement("div");
    box.className = "rk-box";
    box.innerHTML = `
      <div class="rk-title">🎁 Refer friends, earn rewards</div>
      <div class="rk-subtitle">Share your link and earn when friends sign up.</div>
      <div class="rk-url-row">
        <div class="rk-url">${data.referralUrl}</div>
        <button class="rk-btn" id="rk-copy">Copy</button>
      </div>
      <div class="rk-stats">
        <div class="rk-stat"><div class="rk-stat-val">${data.totalReferrals}</div><div class="rk-stat-lbl">Referrals</div></div>
        <div class="rk-stat"><div class="rk-stat-val">$${data.pendingReward}</div><div class="rk-stat-lbl">Pending</div></div>
        <div class="rk-stat"><div class="rk-stat-val">$${data.paidReward}</div><div class="rk-stat-lbl">Earned</div></div>
      </div>`;
    container.innerHTML = "";
    container.appendChild(box);
    const copyBtn = document.getElementById("rk-copy") as HTMLButtonElement | null;
    if (copyBtn) copyBtn.addEventListener("click", () => copyToClipboard(data.referralUrl, copyBtn));
  }).catch(() => {
    container.innerHTML = '<div class="rk-box"><div class="rk-subtitle">Could not load referral widget.</div></div>';
  });
}

const script = document.currentScript as HTMLScriptElement | null;
if (script?.dataset.apiKey && script?.dataset.userId) {
  document.addEventListener("DOMContentLoaded", () => {
    init({ apiKey: script.dataset.apiKey!, userId: script.dataset.userId!, theme: (script.dataset.theme as "light"|"dark") || "dark" });
  });
}
(window as unknown as Record<string, unknown>).ReferKit = { init };
