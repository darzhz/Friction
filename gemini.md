# Friction — Architecture Document
> A local-first PWA that adds a financial discipline layer on top of existing UPI apps.

---

## 1. Problem Statement

UPI apps are optimized for transaction speed, not spending awareness. Young earners with fixed monthly incomes make dozens of small daily payments — food, travel, recharges — with zero friction and zero feedback. This app inserts a lightweight, conscious checkpoint between intent-to-pay and actual payment.

**Core hypothesis:** Awareness at the moment of payment changes behavior better than retrospective dashboards.

---

## 2. Product Principles

| Principle | What it means in practice |
|-----------|--------------------------|
| **Zero backend (v1)** | No servers, no auth, no compliance risk |
| **Friction is the feature** | Intentional slowdown when limits are breached |
| **No interception** | We don't process payments — we redirect to trusted UPI apps |
| **Local-first data** | All budget state lives in IndexedDB on the device |
| **PWA-native** | Installable on Android, works offline, no app store needed |

---

## 3. System Overview

```
┌─────────────────────────────────────────────────────┐
│                    USER DEVICE                       │
│                                                     │
│  ┌──────────────┐    ┌────────────────────────────┐ │
│  │  PWA Shell   │    │     Budget Engine          │ │
│  │  (React/Vite)│◄──►│  (in-memory + IndexedDB)   │ │
│  └──────┬───────┘    └────────────────────────────┘ │
│         │                                           │
│  ┌──────▼───────┐    ┌────────────────────────────┐ │
│  │  QR Scanner  │    │     UPI Deep Link          │ │
│  │ (html5-qrcode│    │     Redirector             │ │
│  │  / zxing-js) │    │  window.location.href =... │ │
│  └──────┬───────┘    └────────────────────────────┘ │
│         │                                           │
│  ┌──────▼───────────────────────────────────────┐  │
│  │           UPI Link Parser                    │  │
│  │  upi://pay?pa=x@upi&pn=Name&am=250&cu=INR    │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
         │
         ▼ deep link
┌─────────────────┐
│  Google Pay /   │
│  PhonePe /      │  ← actual payment happens here, outside our app
│  Paytm / etc.   │
└─────────────────┘
```

---

## 4. Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | React 18 + Vite | Fast build, you know it already |
| Styling | Tailwind CSS | Utility-first, mobile-first |
| QR Scanning | `html5-qrcode` | Battle-tested, supports rear camera on Android |
| Storage | `idb` (IndexedDB wrapper) | Structured, queryable, survives app restarts |
| PWA | `vite-plugin-pwa` + Workbox | Service worker + manifest generation |
| State | Zustand | Lightweight, no boilerplate |
| Charts | Recharts | Simple enough for weekly summaries |
| Date utils | `date-fns` | Lightweight, tree-shakable |

**No backend. No auth. No third-party SDKs that phone home.**

---

## 5. Project Structure

```
upi-guardian/
├── public/
│   ├── manifest.json           # PWA manifest
│   └── icons/                  # App icons (192, 512px)
│
├── src/
│   ├── main.tsx
│   ├── App.tsx                 # Route shell
│   │
│   ├── pages/
│   │   ├── Home.tsx            # Budget summary widget
│   │   ├── Scan.tsx            # QR scanner view
│   │   ├── PaymentGate.tsx     # The checkpoint screen
│   │   ├── History.tsx         # Transaction log
│   │   └── Settings.tsx        # Limits, categories, UPI app preference
│   │
│   ├── components/
│   │   ├── BudgetMeter.tsx     # Visual remaining budget bar
│   │   ├── SpendImpactCard.tsx # "₹250 = 12% of weekly budget"
│   │   ├── FrictionBanner.tsx  # Warning when approaching/breaching limit
│   │   ├── QRScanner.tsx       # Camera + decode wrapper
│   │   └── TransactionItem.tsx
│   │
│   ├── engine/
│   │   ├── budgetEngine.ts     # Pure functions: remaining, impact, status
│   │   ├── upiParser.ts        # Parse upi:// deep link params
│   │   ├── upiRedirect.ts      # Build & fire the redirect
│   │   └── categories.ts       # Keyword → category mapping
│   │
│   ├── store/
│   │   ├── budgetStore.ts      # Zustand store (limits, period state)
│   │   └── transactionStore.ts # Zustand store (tx list, weekly rollup)
│   │
│   ├── db/
│   │   ├── schema.ts           # IndexedDB schema + migrations
│   │   └── queries.ts          # get/set/query helpers via idb
│   │
│   └── hooks/
│       ├── useBudgetStatus.ts  # Derived budget state for components
│       ├── useWeeklyRollup.ts  # Aggregate weekly/monthly totals
│       └── useQRScanner.ts     # Camera lifecycle management
│
├── vite.config.ts
└── package.json
```

---

## 6. Core Flows

### 6.1 Happy Path — Pay Within Budget

```
User opens app
      │
      ▼
Tap "Scan to Pay"
      │
      ▼
Camera opens → QR scanned
      │
      ▼
upiParser extracts { pa, pn, am, cu }
      │
      ▼
budgetEngine computes:
  - remaining this week
  - % of weekly budget this spend represents
  - projected balance after spend
      │
      ▼
PaymentGate renders SpendImpactCard
  ✅ "₹250 — You have ₹750 left this week"
      │
      ▼
User taps "Pay with [preferred UPI app]"
      │
      ▼
upiRedirect fires: window.location.href = upiLink
      │
      ▼
UPI app opens pre-filled
      │
      ▼ (user returns to app)
"Did you complete this payment?"
  [YES]  →  log transaction → update budget state
  [NO]   →  discard, return to Home
```

### 6.2 Friction Path — At or Over Limit

```
budgetEngine detects: spentThisWeek + amount >= weeklyLimit
      │
      ▼
FrictionBanner renders:
  ⚠ "This puts you ₹180 over your weekly limit"
      │
      ▼
"Pay Anyway" button appears after 3-second delay
(delay is the friction — intentional, not accidental)
      │
      ▼
User can still proceed — we don't block, we warn
```

### 6.3 Manual Entry (Bypass Flow)

For cash payments or QR codes that don't follow UPI spec:

```
Home → "Add Expense"
  Amount + Category (quick-select chips)
  → logged directly to IndexedDB
```

---

## 7. Budget Engine

All logic is pure functions — easy to test, zero side effects.

```ts
// engine/budgetEngine.ts

export type BudgetStatus = 'safe' | 'warning' | 'over';

export interface SpendImpact {
  remaining: number;
  afterSpend: number;
  percentOfWeekly: number;
  status: BudgetStatus;
  frictionDelay: number; // ms, 0 for safe, 3000 for over
}

export function computeSpendImpact(
  amount: number,
  spentThisWeek: number,
  weeklyLimit: number
): SpendImpact {
  const remaining = weeklyLimit - spentThisWeek;
  const afterSpend = remaining - amount;
  const percentOfWeekly = Math.round((amount / weeklyLimit) * 100);

  const status: BudgetStatus =
    afterSpend < 0 ? 'over' :
    afterSpend < weeklyLimit * 0.15 ? 'warning' : 'safe';

  return {
    remaining,
    afterSpend,
    percentOfWeekly,
    status,
    frictionDelay: status === 'over' ? 3000 : 0,
  };
}
```

### Status Thresholds

| Status | Condition | UI Behaviour |
|--------|-----------|-------------|
| `safe` | > 15% of limit remains after spend | Green card, instant proceed |
| `warning` | < 15% of limit will remain | Amber card, soft nudge |
| `over` | Spend exceeds remaining budget | Red banner, 3s delay on Pay button |

---

## 8. UPI Link Parser

```ts
// engine/upiParser.ts

export interface UPIPayload {
  pa: string;   // Payee VPA (e.g. merchant@okaxis)
  pn: string;   // Payee name
  am: number;   // Amount in INR
  cu: string;   // Currency (always INR)
  tn?: string;  // Transaction note
  mc?: string;  // Merchant category code
  raw: string;  // Original link for redirect
}

export function parseUPILink(raw: string): UPIPayload | null {
  try {
    // Handle both upi:// and plain QR text
    const url = raw.startsWith('upi://') ? raw : `upi://${raw}`;
    const params = new URLSearchParams(url.split('?')[1]);

    const am = parseFloat(params.get('am') ?? '0');
    if (!params.get('pa') || isNaN(am)) return null;

    return {
      pa: params.get('pa')!,
      pn: params.get('pn') ?? 'Unknown',
      am,
      cu: params.get('cu') ?? 'INR',
      tn: params.get('tn') ?? undefined,
      mc: params.get('mc') ?? undefined,
      raw,
    };
  } catch {
    return null;
  }
}
```

---

## 9. UPI Redirect Strategy

```ts
// engine/upiRedirect.ts

export type UPIApp = 'gpay' | 'phonepe' | 'paytm' | 'default';

const PACKAGE_MAP: Record<UPIApp, string> = {
  gpay:    'tez://upi/pay',
  phonepe: 'phonepe://pay',
  paytm:   'paytmmp://pay',
  default: '', // uses the raw upi:// link, Android OS picks handler
};

export function buildRedirectLink(
  payload: UPIPayload,
  preferredApp: UPIApp = 'default'
): string {
  // For 'default' — just fire the original upi:// link.
  // Android Intent chooser will prompt if multiple UPI apps installed.
  if (preferredApp === 'default') return payload.raw;

  // For named apps — swap scheme, keep query params
  const params = payload.raw.split('?')[1];
  return `${PACKAGE_MAP[preferredApp]}?${params}`;
}

export function redirect(link: string): void {
  window.location.href = link;
}
```

> **Note:** App-specific deep links (`tez://`, `phonepe://`) may vary by app version. Default `upi://` is the safest fallback — Android's intent system handles app selection.

---

## 10. Data Layer (IndexedDB Schema)

```ts
// db/schema.ts

interface Transaction {
  id:        string;    // crypto.randomUUID()
  amount:    number;
  payee:     string;    // pn from UPI
  vpa:       string;    // pa from UPI
  category:  Category;
  note?:     string;
  timestamp: number;    // Date.now()
  week:      string;    // "2025-W17" — for fast weekly queries
  month:     string;    // "2025-04"
  confirmed: boolean;   // false until user confirms payment went through
}

interface BudgetConfig {
  weeklyLimit:  number;
  monthlyLimit: number;
  warningPct:   number; // default 85 → warn when 85% spent
  preferredUPI: UPIApp;
  categories:   CategoryConfig[];
}

type Category =
  | 'food'
  | 'transport'
  | 'groceries'
  | 'subscriptions'
  | 'utilities'
  | 'shopping'
  | 'other';
```

**IndexedDB stores:**
- `transactions` — indexed on `week`, `month`, `timestamp`
- `config` — single-record store, key `"default"`

**No cloud sync in v1.** This is a feature, not a limitation — zero privacy risk.

---

## 11. State Management

Two Zustand stores, hydrated from IndexedDB on app load.

```
budgetStore
  ├── config: BudgetConfig
  ├── weeklySpent: number        ← derived from this week's confirmed txns
  ├── monthlySpent: number
  └── actions: { setLimits, refreshTotals }

transactionStore
  ├── transactions: Transaction[]
  ├── pendingConfirm: Transaction | null   ← set after redirect returns
  └── actions: { add, confirm, discard, loadRecent }
```

`pendingConfirm` is the bridge between "user left to pay" and "user came back" — it's persisted to `sessionStorage` to survive the redirect.

---

## 12. PWA Configuration

```ts
// vite.config.ts (relevant section)
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'Friction',
    short_name: 'Guardian',
    theme_color: '#0f172a',
    background_color: '#0f172a',
    display: 'standalone',         // fullscreen, no browser chrome
    orientation: 'portrait',
    start_url: '/',
    icons: [
      { src: '/icons/192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,svg,png}'],
    runtimeCaching: [], // no network calls to cache
  },
})
```

**Install prompt:** Trigger the `beforeinstallprompt` event to show a custom "Add to Home Screen" banner on first launch. This is your app store.

---

## 13. Screen Map

```
┌─────────────────────────────────────────────┐
│                  Home                        │
│  ┌─────────────────────────────────────────┐ │
│  │  ₹420 left this week                   │ │
│  │  [████████░░░░] 72% used               │ │
│  │  Monthly: ₹3,200 / ₹8,000              │ │
│  └─────────────────────────────────────────┘ │
│  [ Scan to Pay ]                            │
│  [ + Add Expense ]                          │
│  Recent: Café ₹120 · Petrol ₹300           │
└────────────────────┬────────────────────────┘
                     │
         ┌───────────┴──────────┐
         ▼                      ▼
  ┌─────────────┐        ┌──────────────┐
  │  Scan QR    │        │  History     │
  │  [Camera]   │        │  Weekly list │
  └──────┬──────┘        └──────────────┘
         │
         ▼
  ┌─────────────────────────┐
  │  Payment Gate           │
  │  ₹250 to Cafe Coffee    │
  │  ──────────────────     │
  │  Weekly: ₹1,350/₹2,000  │
  │  After: ₹400 left       │
  │  [████████████░░] 87%   │
  │                         │
  │  ⚠ Almost at limit      │
  │                         │
  │  [ Pay with PhonePe ]   │
  │  [ Cancel ]             │
  └─────────────────────────┘
         │
         ▼ (returns from UPI app)
  ┌─────────────────────────┐
  │  Confirm Payment        │
  │  Did ₹250 go through?   │
  │  [ ✓ Yes, log it ]      │
  │  [ ✗ No, cancel ]       │
  └─────────────────────────┘
```

---

## 14. Known Limitations (Accepted for v1)

| Limitation | Accepted because |
|------------|-----------------|
| User can bypass the app entirely | This is a habit tool, not enforcement |
| Payment confirmation is manual | No UPI callback API is publicly available |
| No automatic SMS/bank sync | Requires device permissions + compliance |
| App-specific deep links may break | Default `upi://` always works as fallback |
| No multi-device sync | Local-first is a privacy feature in v1 |
| QR codes with no `am` param | User enters amount manually on PaymentGate |

---

## 15. v2 Considerations (Don't Build Now)

These are explicitly out of scope for MVP but worth noting for architecture decisions:

- **Account Aggregator API (Sahamati / AA framework):** Real bank transaction pull — requires RBI-registered AA license and significant compliance work.
- **UPI mandate / recurring limits:** Possible via NPCI NACH but requires bank partnership.
- **Notification budget alerts:** Push notifications via Web Push API — add after validating core loop.
- **Cloud sync:** Firebase Firestore with anonymous auth — add only if users explicitly want cross-device history.
- **SMS parsing:** Sensitive, requires RECEIVE_SMS permission, and is being restricted on newer Android versions.
- **Spending categories via ML:** On-device classifier using payee VPA patterns — feasible with transformers.js once you have enough transaction data.

---

## 16. 1-Week Ship Plan

| Day | Deliverable |
|-----|-------------|
| 1 | Vite + React + Tailwind + PWA scaffold. Home screen with hardcoded budget state. |
| 2 | QR scanner working (`html5-qrcode`). `upiParser` parsing real QR codes. |
| 3 | `budgetEngine` logic + `PaymentGate` UI. Impact card showing correct numbers. |
| 4 | `upiRedirect` working on Android. Round-trip confirmed (scan → PhonePe → back). |
| 5 | IndexedDB persistence. Manual confirm flow. Budget state survives app restarts. |
| 6 | History screen. Weekly stats. Settings (set limits, preferred UPI app). |
| 7 | Polish. Install prompt. Icons. Test on 2–3 real Android devices. |

---

## 17. What Success Looks Like (v1)

**You are not building a fintech product.** You're running a behavioral experiment.

The v1 success metric is simple:

> "Did showing people their budget at the moment of payment make them pause, reconsider, or cancel at least 1 in 10 times?"

If yes — the friction works, the hypothesis holds, and you have a product worth building further.

Track this manually. Survey 5–10 early users. That's your entire analytics strategy for v1.

---

*Architecture version 1.0 — MVP scope only*
