# @referkit/react

React components and hooks for ReferKit referral widgets.

## Installation

```bash
npm install @referkit/react
# or
pnpm add @referkit/react
```

## Usage

```tsx
import { ReferKitWidget, useReferKit } from "@referkit/react";

// Embed the referral widget
function ReferralPage() {
  return (
    <ReferKitWidget
      campaignId="your-campaign-id"
      userEmail={user.email}
      userId={user.id}
    />
  );
}

// Use the hook for custom UI
function ShareButtons() {
  const { share, referralLink, stats } = useReferKit("campaign-id", user.email);

  return (
    <div>
      <p>Your link: {referralLink}</p>
      <p>Referrals: {stats?.referrals ?? 0}</p>
      <button onClick={() => share("twitter")}>Share on Twitter</button>
      <button onClick={() => share("copy")}>Copy Link</button>
    </div>
  );
}
```

## Props

### ReferKitWidget

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| campaignId | string | required | Your ReferKit campaign ID |
| userEmail | string | required | Current user's email |
| userId | string | undefined | Current user's ID |
| apiUrl | string | undefined | Custom API URL override |
| className | string | undefined | CSS class for container div |
| style | CSSProperties | undefined | Inline styles for container div |

### useReferKit

Returns `{ share, referralLink, stats }` — share to social platforms, get the referral link, and see referral stats.
