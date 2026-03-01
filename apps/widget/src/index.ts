/**
 * ReferKit Embed Widget v1.0.0
 *
 * Floating mode (default):
 *   <script src="https://cdn.referkit.threestack.io/widget.js"
 *           data-campaign-id="uuid" data-user-email="user@example.com"></script>
 *
 * Manual init:
 *   <script src="...widget.js"></script>
 *   <script>ReferKit.init({ campaignId: 'uuid', userEmail: 'user@example.com' });</script>
 *
 * Inline mode:
 *   <div id="referkit-widget"></div>
 *   <script>ReferKit.init({ campaignId: '...', userEmail: '...', mode: 'inline', target: '#referkit-widget' });</script>
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReferKitConfig {
  campaignId: string;
  userEmail: string;
  mode?: "floating" | "inline";
  target?: string;                       // CSS selector for inline mode
  primaryColor?: string;
  position?: "bottom-right" | "bottom-left";
  trigger?: "auto" | "manual";          // auto = show immediately, manual = wait for show()
  apiBase?: string;                      // override for self-hosted
}

interface RegisterResponse {
  ref_code: string;
  referral_link: string;
}

// ─── State ────────────────────────────────────────────────────────────────────

let _config: ReferKitConfig | null = null;
let _refCode = "";
let _referralLink = "";
let _floatBtn: HTMLElement | null = null;
let _modal: HTMLElement | null = null;
let _styleEl: HTMLStyleElement | null = null;
let _initialized = false;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function apiBase(): string {
  return (_config?.apiBase ?? "").replace(/\/$/, "");
}

function primary(): string {
  return _config?.primaryColor ?? "#8b5cf6";
}

// darken() removed — using CSS filter:brightness(.85) for hover states instead

// ─── API Calls ────────────────────────────────────────────────────────────────

async function registerUser(campaignId: string, userEmail: string): Promise<RegisterResponse> {
  const res = await fetch(`${apiBase()}/api/track/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ campaign_id: campaignId, user_email: userEmail }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<RegisterResponse>;
}

function trackClick(source: string): void {
  if (!_config) return;
  // Best-effort — endpoint may not exist yet; suppress errors
  fetch(`${apiBase()}/api/track/click`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      campaignId: _config.campaignId,
      referralCode: _refCode,
      source,
    }),
  }).catch(() => {/* suppress */});
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function injectStyles(): void {
  if (_styleEl) return;
  const p = primary();
  _styleEl = document.createElement("style");
  _styleEl.textContent = `.rk-fab{position:fixed;z-index:2147483646;width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;background:${p};box-shadow:0 4px 14px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;transition:filter .15s,transform .15s;outline:none}.rk-fab:hover{filter:brightness(.85);transform:scale(1.06)}.rk-fab svg{width:24px;height:24px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.rk-fab.rk-bottom-right{bottom:24px;right:24px}.rk-fab.rk-bottom-left{bottom:24px;left:24px}.rk-overlay{position:fixed;inset:0;z-index:2147483645;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center}.rk-overlay.rk-bottom-right{justify-content:flex-end}.rk-overlay.rk-bottom-left{justify-content:flex-start}.rk-panel{background:#fff;border-radius:16px;padding:20px;width:100%;max-width:340px;box-shadow:0 20px 60px rgba(0,0,0,.2);font-family:system-ui,-apple-system,sans-serif;box-sizing:border-box;margin:0 16px 96px}.rk-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}.rk-title{font-size:16px;font-weight:700;color:#111;margin:0}.rk-close{background:none;border:none;cursor:pointer;padding:4px;border-radius:6px;color:#6b7280;display:flex;line-height:1}.rk-close:hover{background:#f3f4f6;color:#111}.rk-close svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}.rk-sub{font-size:13px;color:#6b7280;margin:0 0 14px}.rk-link-row{display:flex;gap:8px;margin-bottom:14px}.rk-link-input{flex:1;padding:8px 10px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;font-size:12px;color:#374151;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;outline:none;box-sizing:border-box}.rk-copy-btn{flex-shrink:0;padding:8px 12px;background:${p};color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:filter .15s;white-space:nowrap}.rk-copy-btn:hover{filter:brightness(.85)}.rk-copy-btn.rk-copied{background:#22c55e}.rk-share-label{font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px}.rk-share-row{display:flex;gap:6px}.rk-share-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:8px 4px;border:1px solid #e5e7eb;border-radius:8px;font-size:11px;font-weight:600;color:#374151;background:#fff;cursor:pointer;text-decoration:none;transition:background .15s}.rk-share-btn:hover{background:#f9fafb}.rk-share-btn svg{width:14px;height:14px;flex-shrink:0}.rk-inline{font-family:system-ui,-apple-system,sans-serif;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;box-sizing:border-box}.rk-loading{font-size:13px;color:#9ca3af;padding:8px 0}.rk-error{font-size:13px;color:#ef4444}`;
  document.head.appendChild(_styleEl);
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function iconShare(): string {
  return `<svg viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>`;
}
function iconClose(): string {
  return `<svg viewBox="0 0 18 18"><line x1="2" y1="2" x2="16" y2="16"/><line x1="16" y1="2" x2="2" y2="16"/></svg>`;
}
// Compact social icons — recognizable minimal paths
function iconTwitter(): string {
  return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.2 2.25h3.3l-7.2 8.26 8.5 11.24h-5.2l-4.7-6.23-5.4 6.23H3.7l7.7-8.84L2.2 2.25H7.1l4.3 5.62zm-1.2 17.52h1.8L7.1 4.13H5.1z"/></svg>`;
}
function iconLinkedIn(): string {
  return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7H10v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>`;
}
function iconWhatsApp(): string {
  return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l5.08-1.33A9.93 9.93 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm4.6 13.86c-.19.54-1.1 1.03-1.52 1.09-.39.06-.88.08-1.42-.09-.33-.1-.75-.24-1.29-.47-2.27-.98-3.75-3.27-3.86-3.42-.11-.15-.9-1.2-.9-2.28 0-1.09.57-1.62.77-1.84.2-.22.44-.27.58-.27h.42c.13 0 .31-.05.48.37.18.44.6 1.5.65 1.6.05.11.08.24.01.38-.07.14-.1.23-.2.35-.1.12-.22.27-.31.37-.1.1-.21.22-.09.43.12.21.55.9 1.18 1.46.81.72 1.49.94 1.7 1.04.21.1.33.08.46-.05.12-.13.53-.62.67-.83.14-.21.28-.17.47-.1.19.07 1.22.58 1.43.68.21.1.35.15.4.23.05.09.05.5-.14 1.05z"/></svg>`;
}


// ─── Share URLs ───────────────────────────────────────────────────────────────

function shareUrl(platform: "twitter" | "linkedin" | "whatsapp"): string {
  const text = encodeURIComponent("Join me — use my referral link to get started!");
  const url = encodeURIComponent(_referralLink);
  if (platform === "twitter")   return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
  if (platform === "linkedin")  return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
  return `https://wa.me/?text=${text}%20${url}`;
}

// ─── Widget Content HTML ──────────────────────────────────────────────────────

function loadingHTML(): string {
  return `<div class="rk-loading">Loading your referral link…</div>`;
}

function errorHTML(msg: string): string {
  return `<div class="rk-error">⚠ ${msg}</div>`;
}

function contentHTML(): string {
  return `
    <div class="rk-header">
      <p class="rk-title">🎁 Share & Earn</p>
      <button class="rk-close" id="rk-close-btn" aria-label="Close">${iconClose()}</button>
    </div>
    <p class="rk-sub">Share your referral link with friends and earn rewards when they sign up.</p>
    <div class="rk-link-row">
      <input class="rk-link-input" id="rk-link-input" type="text" readonly value="${_referralLink}" aria-label="Your referral link" />
      <button class="rk-copy-btn" id="rk-copy-btn">Copy</button>
    </div>
    <p class="rk-share-label">Share via</p>
    <div class="rk-share-row">
      <a class="rk-share-btn" id="rk-tw" href="${shareUrl("twitter")}" target="_blank" rel="noopener noreferrer" aria-label="Share on X (Twitter)">${iconTwitter()}<span>Twitter</span></a>
      <a class="rk-share-btn" id="rk-li" href="${shareUrl("linkedin")}" target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn">${iconLinkedIn()}<span>LinkedIn</span></a>
      <a class="rk-share-btn" id="rk-wa" href="${shareUrl("whatsapp")}" target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp">${iconWhatsApp()}<span>WhatsApp</span></a>
    </div>
  `;
}

// ─── Event Wiring ─────────────────────────────────────────────────────────────

function wireEvents(container: HTMLElement, isModal: boolean): void {
  // Close button
  const closeBtn = container.querySelector<HTMLButtonElement>("#rk-close-btn");
  if (closeBtn) {
    if (isModal) {
      closeBtn.addEventListener("click", hide);
    } else {
      closeBtn.style.display = "none"; // no close in inline mode
    }
  }

  // Copy button
  const copyBtn = container.querySelector<HTMLButtonElement>("#rk-copy-btn");
  const linkInput = container.querySelector<HTMLInputElement>("#rk-link-input");
  if (copyBtn && linkInput) {
    copyBtn.addEventListener("click", () => {
      const txt = linkInput.value;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(txt).catch(() => fallbackCopy(txt));
      } else {
        fallbackCopy(txt);
      }
      copyBtn.textContent = "Copied!";
      copyBtn.classList.add("rk-copied");
      trackClick("copy");
      setTimeout(() => {
        copyBtn.textContent = "Copy";
        copyBtn.classList.remove("rk-copied");
      }, 2000);
    });
  }

  // Share buttons
  (["twitter", "linkedin", "whatsapp"] as const).forEach((platform) => {
    const idMap = { twitter: "rk-tw", linkedin: "rk-li", whatsapp: "rk-wa" } as const;
    const btn = container.querySelector<HTMLAnchorElement>(`#${idMap[platform]}`);
    if (btn) btn.addEventListener("click", () => trackClick(platform));
  });
}

function fallbackCopy(text: string): void {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  ta.remove();
}

// ─── Floating Mode ────────────────────────────────────────────────────────────

function createFloatButton(): void {
  const pos = _config?.position ?? "bottom-right";
  _floatBtn = document.createElement("button");
  _floatBtn.className = `rk-fab rk-${pos}`;
  _floatBtn.innerHTML = iconShare();
  _floatBtn.setAttribute("aria-label", "Share referral link");
  _floatBtn.addEventListener("click", () => {
    if (_modal) { hide(); } else { showModal(); }
  });
  document.body.appendChild(_floatBtn);
}

function showModal(): void {
  if (_modal) return;
  const pos = _config?.position ?? "bottom-right";
  _modal = document.createElement("div");
  _modal.className = `rk-overlay rk-${pos}`;
  _modal.setAttribute("role", "dialog");
  _modal.setAttribute("aria-modal", "true");
  _modal.setAttribute("aria-label", "Share your referral link");

  const panel = document.createElement("div");
  panel.className = "rk-panel";
  panel.innerHTML = loadingHTML();
  _modal.appendChild(panel);
  document.body.appendChild(_modal);

  // Close on overlay click
  _modal.addEventListener("click", (e) => {
    if (e.target === _modal) hide();
  });

  // Close on Escape
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") { hide(); document.removeEventListener("keydown", onKey); }
  };
  document.addEventListener("keydown", onKey);

  // Populate content
  if (_referralLink) {
    panel.innerHTML = contentHTML();
    wireEvents(panel, true);
  } else {
    loadContent().then(() => {
      if (!_modal) return;
      panel.innerHTML = contentHTML();
      wireEvents(panel, true);
    }).catch(() => {
      if (!_modal) return;
      panel.innerHTML = `<div class="rk-panel">${errorHTML("Could not load your referral link. Please try again.")}</div>`;
    });
  }
}

// ─── Inline Mode ──────────────────────────────────────────────────────────────

function renderInline(): void {
  if (!_config) return;
  const sel = _config.target ?? "#referkit-widget";
  const container = document.querySelector<HTMLElement>(sel);
  if (!container) return;
  const inner = document.createElement("div");
  inner.className = "rk-inline";
  inner.innerHTML = loadingHTML();
  container.innerHTML = "";
  container.appendChild(inner);

  loadContent().then(() => {
    inner.innerHTML = contentHTML();
    wireEvents(inner, false);
  }).catch(() => {
    inner.innerHTML = errorHTML("Could not load your referral link. Please try again.");
  });
}

// ─── Data Fetching ────────────────────────────────────────────────────────────

async function loadContent(): Promise<void> {
  if (!_config || _referralLink) return;
  const data = await registerUser(_config.campaignId, _config.userEmail);
  _refCode = data.ref_code;
  _referralLink = data.referral_link;
}

// ─── Public API ───────────────────────────────────────────────────────────────

function init(config: ReferKitConfig): void {
  if (_initialized) return;
  _config = config;
  _initialized = true;
  injectStyles();

  const mode = config.mode ?? "floating";
  const trigger = config.trigger ?? "auto";

  if (mode === "inline") {
    renderInline();
  } else {
    // Floating button
    createFloatButton();
    if (trigger === "auto") {
      // Pre-load referral link, then show modal after a short delay
      loadContent().catch(() => {/* will retry on open */}).finally(() => {
        setTimeout(() => { if (_initialized) showModal(); }, 800);
      });
    }
    // If trigger === "manual", wait for show() call
  }
}

function show(): void {
  if (!_initialized || _config?.mode === "inline") return;
  showModal();
}

function hide(): void {
  if (_modal) { _modal.remove(); _modal = null; }
}

function destroy(): void {
  hide();
  if (_floatBtn) { _floatBtn.remove(); _floatBtn = null; }
  if (_styleEl) { _styleEl.remove(); _styleEl = null; }
  _config = null;
  _refCode = "";
  _referralLink = "";
  _initialized = false;
}

// ─── Auto-Init from Script Tag ────────────────────────────────────────────────

(function autoInit() {
  const script = document.currentScript as HTMLScriptElement | null ??
    document.querySelector<HTMLScriptElement>('script[data-campaign-id]');
  if (!script) return;
  const campaignId = script.dataset.campaignId ?? script.getAttribute("data-campaign-id") ?? "";
  const userEmail  = script.dataset.userEmail  ?? script.getAttribute("data-user-email")  ?? "";
  if (!campaignId || !userEmail) return;

  const cfg: ReferKitConfig = {
    campaignId,
    userEmail,
    primaryColor: script.dataset.primaryColor ?? undefined,
    position: (script.dataset.position as ReferKitConfig["position"]) ?? "bottom-right",
    trigger: (script.dataset.trigger as ReferKitConfig["trigger"]) ?? "auto",
    mode: (script.dataset.mode as ReferKitConfig["mode"]) ?? "floating",
    target: script.dataset.target ?? undefined,
    apiBase: script.dataset.apiBase ?? undefined,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init(cfg));
  } else {
    init(cfg);
  }
})();

// Expose on window for UMD/IIFE global
(window as unknown as Record<string, unknown>).ReferKit = { init, show, hide, destroy };
