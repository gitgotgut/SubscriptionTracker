/**
 * Confluence Cloud publishing utility for Hugo documentation.
 *
 * Uses api.atlassian.com with Basic auth (email:token).
 *
 * Usage:
 *   node scripts/confluence.mjs publish        — publish all docs
 *   node scripts/confluence.mjs list           — list pages in the Hugo space
 *   node scripts/confluence.mjs test           — test the connection
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ──
function loadEnv() {
  const envPath = resolve(__dirname, "..", ".env.local");
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)="([^"]*)"/);
    if (match) process.env[match[1]] = process.env[match[1]] ?? match[2];
  }
}
loadEnv();

const CLOUD_ID = process.env.CONFLUENCE_CLOUD_ID;
const EMAIL = process.env.CONFLUENCE_EMAIL;
const TOKEN = process.env.CONFLUENCE_API_TOKEN;
const SPACE_KEY = process.env.CONFLUENCE_SPACE_KEY || "Hugo";

if (!CLOUD_ID || !EMAIL || !TOKEN) {
  console.error("Missing CONFLUENCE_CLOUD_ID, CONFLUENCE_EMAIL, or CONFLUENCE_API_TOKEN in .env.local");
  process.exit(1);
}

const BASE = `https://api.atlassian.com/ex/confluence/${CLOUD_ID}/wiki/rest/api`;
const AUTH = "Basic " + Buffer.from(`${EMAIL}:${TOKEN}`).toString("base64");

// ── API helpers ──

async function api(method, path, body) {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const opts = {
    method,
    headers: {
      Authorization: AUTH,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

async function getSpaceHomepage() {
  const data = await api("GET", `/space/${SPACE_KEY}?expand=homepage`);
  return data.homepage?.id;
}

async function findPageByTitle(title, spaceKey = SPACE_KEY) {
  const data = await api("GET", `/content?spaceKey=${spaceKey}&title=${encodeURIComponent(title)}&type=page`);
  return data.results?.[0] ?? null;
}

async function createPage(title, body, parentId) {
  return api("POST", "/content", {
    type: "page",
    title,
    space: { key: SPACE_KEY },
    ...(parentId ? { ancestors: [{ id: parentId }] } : {}),
    body: { storage: { value: body, representation: "storage" } },
  });
}

async function updatePage(id, title, body, version) {
  return api("PUT", `/content/${id}`, {
    id,
    type: "page",
    title,
    space: { key: SPACE_KEY },
    body: { storage: { value: body, representation: "storage" } },
    version: { number: version + 1 },
  });
}

async function upsertPage(title, body, parentId) {
  const existing = await findPageByTitle(title);
  if (existing) {
    const full = await api("GET", `/content/${existing.id}?expand=version`);
    console.log(`  ↻ Updating "${title}" (v${full.version.number} → v${full.version.number + 1})`);
    return updatePage(existing.id, title, body, full.version.number);
  }
  console.log(`  + Creating "${title}"`);
  return createPage(title, body, parentId);
}

// ── Documentation content ──

function platformOverview() {
  return `
<h2>What is Hugo?</h2>
<p>Hugo is an umbrella platform for managing recurring financial commitments. Named after the founder's child, it's a reminder that financial clarity isn't just about money — it's about the people it protects.</p>

<h3>Modules</h3>
<table>
<tr><th>Module</th><th>Status</th><th>Description</th></tr>
<tr><td><strong>Hugo Subscriptions</strong></td><td>✅ Live</td><td>Track recurring subscriptions with AI email import (Gmail &amp; Outlook)</td></tr>
<tr><td><strong>Hugo Insurance</strong></td><td>✅ Live</td><td>Review insurance policies, upload documents, AI coverage analysis</td></tr>
<tr><td><strong>Hugo Hub</strong></td><td>✅ Live</td><td>Unified dashboard with combined spending overview</td></tr>
</table>

<h3>Key Features</h3>
<ul>
<li>AI-powered email import (Gmail &amp; Outlook) — scans receipts to detect subscriptions</li>
<li>Insurance document analysis — AI finds coverage gaps and overlaps</li>
<li>Renewal alerts — notifications before subscriptions renew</li>
<li>Spending analytics — category breakdowns, trends, monthly comparisons</li>
<li>Multi-language support — full Danish and English i18n</li>
<li>Direct cancellation links — one-click to cancellation pages</li>
<li>Household sharing — family members can share subscriptions and policies</li>
<li>GDPR-compliant account deletion</li>
</ul>
`;
}

function techStack() {
  return `
<h2>Tech Stack</h2>
<table>
<tr><th>Layer</th><th>Technology</th><th>Notes</th></tr>
<tr><td>Framework</td><td>Next.js 14 (App Router)</td><td>TypeScript, server &amp; client components</td></tr>
<tr><td>Auth</td><td>NextAuth.js v5 beta</td><td>Credentials provider, JWT strategy</td></tr>
<tr><td>Database</td><td>PostgreSQL (Neon)</td><td>Serverless Postgres, connection pooling</td></tr>
<tr><td>ORM</td><td>Prisma</td><td>Type-safe DB access, migrations</td></tr>
<tr><td>Frontend</td><td>React 18 + Tailwind CSS</td><td>Radix UI primitives (shadcn-style)</td></tr>
<tr><td>Validation</td><td>Zod</td><td>Runtime schema validation</td></tr>
<tr><td>Charts</td><td>Recharts</td><td>SVG-based charting</td></tr>
<tr><td>AI</td><td>Anthropic Claude API</td><td>Haiku model for document analysis &amp; email parsing</td></tr>
<tr><td>Email</td><td>Resend</td><td>Transactional emails (reminders, password reset)</td></tr>
<tr><td>Hosting</td><td>Vercel (planned)</td><td>Edge functions, automatic deployments</td></tr>
</table>

<h3>Key Dependencies</h3>
<ul>
<li><code>next-auth</code> v5 — authentication</li>
<li><code>@prisma/client</code> — database ORM</li>
<li><code>@anthropic-ai/sdk</code> — AI document analysis</li>
<li><code>date-fns</code> — date utilities</li>
<li><code>recharts</code> — data visualization</li>
<li><code>lucide-react</code> — icon library</li>
<li><code>sonner</code> — toast notifications</li>
</ul>
`;
}

function architecture() {
  return `
<h2>Architecture Overview</h2>

<h3>Directory Structure</h3>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">text</ac:parameter><ac:plain-text-body><![CDATA[src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Login, register, password reset
│   ├── (dashboard)/        # Protected pages (dashboard, hub, insurance)
│   ├── api/                # API routes
│   │   ├── auth/           # NextAuth + registration
│   │   ├── subscriptions/  # CRUD for subscriptions
│   │   ├── insurance/      # CRUD for policies + AI analysis
│   │   ├── gmail/          # Gmail OAuth + import
│   │   ├── outlook/        # Outlook OAuth + import
│   │   └── me/             # User profile + settings
│   ├── about/              # Public pages
│   ├── features/           # 7 feature landing pages
│   └── page.tsx            # Landing page
├── components/             # React components
│   ├── ui/                 # shadcn primitives (Button, Card, etc.)
│   └── *.tsx               # Feature components
├── lib/                    # Shared utilities
│   ├── prisma.ts           # Prisma singleton
│   ├── utils.ts            # Amount formatting, cn()
│   ├── i18n.ts             # Client i18n hook
│   ├── server-i18n.ts      # Server i18n
│   └── validations/        # Zod schemas
├── messages/               # i18n JSON files (en.json, da.json)
└── middleware.ts            # Auth route protection
prisma/
└── schema.prisma           # Database schema]]></ac:plain-text-body></ac:structured-macro>

<h3>Authentication Flow</h3>
<ol>
<li>User registers via <code>POST /api/auth/register</code> (password hashed with bcrypt)</li>
<li>Login via NextAuth credentials provider → JWT token issued</li>
<li><code>middleware.ts</code> protects dashboard routes — redirects unauthenticated users to <code>/login</code></li>
<li>Session available via <code>auth()</code> server-side or <code>useSession()</code> client-side</li>
</ol>

<h3>Data Flow</h3>
<ul>
<li><strong>Amounts</strong> stored as integer cents (<code>amountCents: Int</code>) to avoid floating-point issues</li>
<li>API accepts decimal strings (<code>"9.99"</code>), converts to cents on write, returns decimal strings on read</li>
<li>Annual → monthly conversion: <code>divide by 12, round</code></li>
<li>Multi-currency: exchange rates fetched from external API, display currency stored per user</li>
</ul>
`;
}

function apiReference() {
  return `
<h2>API Routes Reference</h2>

<h3>Authentication</h3>
<table>
<tr><th>Method</th><th>Path</th><th>Description</th></tr>
<tr><td>POST</td><td><code>/api/auth/register</code></td><td>Create account (201 / 409 duplicate)</td></tr>
<tr><td>POST</td><td><code>/api/auth/[...nextauth]</code></td><td>NextAuth sign-in/sign-out</td></tr>
<tr><td>POST</td><td><code>/api/auth/forgot-password</code></td><td>Send password reset email</td></tr>
<tr><td>POST</td><td><code>/api/auth/reset-password</code></td><td>Reset password with token</td></tr>
</table>

<h3>Subscriptions</h3>
<table>
<tr><th>Method</th><th>Path</th><th>Description</th></tr>
<tr><td>GET</td><td><code>/api/subscriptions</code></td><td>List user's subscriptions</td></tr>
<tr><td>POST</td><td><code>/api/subscriptions</code></td><td>Create subscription</td></tr>
<tr><td>PATCH</td><td><code>/api/subscriptions/[id]</code></td><td>Update subscription (ownership checked)</td></tr>
<tr><td>DELETE</td><td><code>/api/subscriptions/[id]</code></td><td>Delete subscription (ownership checked)</td></tr>
</table>

<h3>Insurance</h3>
<table>
<tr><th>Method</th><th>Path</th><th>Description</th></tr>
<tr><td>GET</td><td><code>/api/insurance</code></td><td>List policies (incl. household)</td></tr>
<tr><td>POST</td><td><code>/api/insurance</code></td><td>Create policy</td></tr>
<tr><td>PATCH</td><td><code>/api/insurance/[id]</code></td><td>Update policy</td></tr>
<tr><td>DELETE</td><td><code>/api/insurance/[id]</code></td><td>Delete policy</td></tr>
<tr><td>POST</td><td><code>/api/insurance/[id]/documents/upload</code></td><td>Upload document to policy</td></tr>
<tr><td>POST</td><td><code>/api/insurance/[id]/documents/analyze</code></td><td>AI-analyze a document</td></tr>
<tr><td>POST</td><td><code>/api/insurance/analyze-all</code></td><td>Cross-policy AI coverage insights</td></tr>
</table>

<h3>Email Import</h3>
<table>
<tr><th>Method</th><th>Path</th><th>Description</th></tr>
<tr><td>GET</td><td><code>/api/gmail/auth</code></td><td>Start Gmail OAuth flow</td></tr>
<tr><td>GET</td><td><code>/api/gmail/callback</code></td><td>Gmail OAuth callback</td></tr>
<tr><td>POST</td><td><code>/api/gmail/scan</code></td><td>Scan Gmail for subscriptions</td></tr>
<tr><td>GET</td><td><code>/api/outlook/auth</code></td><td>Start Outlook OAuth flow</td></tr>
<tr><td>GET</td><td><code>/api/outlook/callback</code></td><td>Outlook OAuth callback</td></tr>
<tr><td>POST</td><td><code>/api/outlook/scan</code></td><td>Scan Outlook for subscriptions</td></tr>
</table>

<h3>Other</h3>
<table>
<tr><th>Method</th><th>Path</th><th>Description</th></tr>
<tr><td>GET/PATCH</td><td><code>/api/me</code></td><td>User profile &amp; settings</td></tr>
<tr><td>DELETE</td><td><code>/api/account</code></td><td>GDPR account deletion (cascade)</td></tr>
<tr><td>GET</td><td><code>/api/exchange-rates</code></td><td>Currency exchange rates</td></tr>
<tr><td>POST</td><td><code>/api/households</code></td><td>Create/join household</td></tr>
</table>
`;
}

function databaseSchema() {
  return `
<h2>Database Schema</h2>
<p>PostgreSQL via Prisma ORM. All amounts stored as integer cents.</p>

<h3>Models</h3>
<table>
<tr><th>Model</th><th>Key Fields</th><th>Purpose</th></tr>
<tr><td><strong>User</strong></td><td>email, passwordHash, displayCurrency, householdId, gmail/outlook tokens</td><td>User account &amp; settings</td></tr>
<tr><td><strong>Subscription</strong></td><td>name, category, amountCents, currency, billingCycle, renewalDate, status</td><td>Tracked subscriptions</td></tr>
<tr><td><strong>SubscriptionHistory</strong></td><td>field, oldValue, newValue, changedAt</td><td>Audit trail for subscription changes</td></tr>
<tr><td><strong>InsurancePolicy</strong></td><td>provider, type, premiumCents, currency, billingCycle, renewalDate, status</td><td>Insurance policies</td></tr>
<tr><td><strong>InsuranceDocument</strong></td><td>fileName, fileUrl, fileType, parsedStatus, analysisResult (JSON)</td><td>Uploaded policy documents + AI analysis</td></tr>
<tr><td><strong>Household</strong></td><td>name, ownerId</td><td>Family sharing group</td></tr>
<tr><td><strong>HouseholdMember</strong></td><td>householdId, userId, role</td><td>Members of a household</td></tr>
</table>

<h3>Insurance Types</h3>
<p><code>health</code>, <code>car</code>, <code>home</code>, <code>life</code>, <code>travel</code>, <code>pet</code>, <code>contents</code>, <code>liability</code>, <code>other</code></p>

<h3>Billing Cycles</h3>
<p><code>monthly</code>, <code>annual</code></p>
`;
}

function brandDesign() {
  return `
<h2>Brand &amp; Design System</h2>
<p>Hugo's visual identity was designed with Proposal C — a fintech-appropriate palette combining trust (slate blue) with warmth (terracotta).</p>

<h3>Color Palette</h3>
<table>
<tr><th>Token</th><th>Value</th><th>CSS Variable</th><th>Usage</th></tr>
<tr><td>Primary</td><td style="background:#4A6FA5;color:white;padding:4px 8px">#4A6FA5</td><td><code>--primary: 214 38% 47%</code></td><td>Buttons, links, active states</td></tr>
<tr><td>Accent</td><td style="background:#C8644A;color:white;padding:4px 8px">#C8644A</td><td><code>--accent: 14 52% 53%</code></td><td>Highlights, CTAs, logo dot</td></tr>
<tr><td>Background</td><td style="background:#F5F7FA;padding:4px 8px">#F5F7FA</td><td><code>--background: 220 20% 97%</code></td><td>Page backgrounds</td></tr>
<tr><td>Foreground</td><td style="background:#141C2E;color:white;padding:4px 8px">#141C2E</td><td><code>--foreground: 222 50% 13%</code></td><td>Text, dark footer</td></tr>
<tr><td>Destructive</td><td style="background:#C44B4B;color:white;padding:4px 8px">#C44B4B</td><td><code>--destructive: 0 55% 53%</code></td><td>Delete actions, errors</td></tr>
</table>

<h3>Typography</h3>
<table>
<tr><th>Role</th><th>Font</th><th>CSS Class</th><th>Usage</th></tr>
<tr><td>Display</td><td>Fraunces (serif)</td><td><code>font-display</code></td><td>Headings, hero text</td></tr>
<tr><td>UI / Body</td><td>Plus Jakarta Sans</td><td><code>font-sans</code></td><td>All body text, UI elements</td></tr>
</table>

<h3>Logo</h3>
<p>The "Orbital Ring" logo: a circle stroke in primary (#4A6FA5) with a lowercase "h" in Fraunces inside, and a terracotta dot (#C8644A) at the upper right.</p>
<p>Component: <code>src/components/hugo-logo.tsx</code></p>

<h3>Brand Story</h3>
<p><em>"Named after what matters most."</em> — Hugo was built by a parent who wanted a clearer view of the family's finances. Named after their child, it's a reminder that financial clarity isn't just about money — it's about the people it protects.</p>
`;
}

function integrations() {
  return `
<h2>External Integrations</h2>

<h3>Gmail Import</h3>
<ul>
<li><strong>OAuth 2.0</strong> via Google Cloud Console</li>
<li>Scopes: <code>gmail.readonly</code></li>
<li>Scans last 6 months of billing-related emails</li>
<li>AI (Claude Haiku) parses email content → extracts subscription name, amount, billing cycle</li>
<li>User reviews and approves before adding</li>
<li>Read-only access — Hugo never sends or modifies emails</li>
</ul>

<h3>Outlook Import</h3>
<ul>
<li><strong>OAuth 2.0</strong> via Microsoft Azure AD</li>
<li>Scopes: <code>Mail.Read</code></li>
<li>Same flow as Gmail — scan, parse, review, approve</li>
</ul>

<h3>Anthropic Claude API</h3>
<ul>
<li>Model: <code>claude-haiku-4-5-20251001</code></li>
<li>Used for:
  <ul>
    <li>Email subscription detection (Gmail/Outlook import)</li>
    <li>Insurance document extraction (PDF/image → structured data)</li>
    <li>Cross-policy coverage insights (overlap, gap, suggestion analysis)</li>
  </ul>
</li>
</ul>

<h3>Resend</h3>
<ul>
<li>Password reset emails</li>
<li>Subscription renewal reminders</li>
</ul>

<h3>Confluence (this documentation)</h3>
<ul>
<li>API: <code>api.atlassian.com</code> with Basic auth (email + API token)</li>
<li>Space: Hugo</li>
<li>Script: <code>scripts/confluence.mjs</code></li>
</ul>
`;
}

function processFlows() {
  return `
<h2>Process Flows</h2>
<p>Step-by-step flows for every major user journey in Hugo.</p>

<h3>1. User Registration &amp; Authentication</h3>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">text</ac:parameter><ac:plain-text-body><![CDATA[
┌─────────┐     POST /api/auth/register       ┌───────────┐     bcrypt.hash(pw,12)     ┌────────────┐
│  User    │ ──────────────────────────────────▸│  Next.js  │ ──────────────────────────▸│ PostgreSQL │
│  Browser │     {email, password}              │  API      │     prisma.user.create     │  (Neon)    │
└─────────┘                                    └───────────┘                            └────────────┘
     │                                              │
     │         POST /api/auth/[...nextauth]         │
     │ ────────────────────────────────────────────▸ │
     │         {email, password}                     │
     │                                              │
     │    ◀── JWT session cookie (httpOnly) ────── │
     │                                              │
     │         GET /dashboard                       │
     │ ────────────────────────────────────────────▸ │
     │         middleware.ts checks auth()           │
     │    ◀── 200 OK (or redirect to /login) ───── │
]]></ac:plain-text-body></ac:structured-macro>

<h3>2. Gmail Email Import Flow</h3>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">text</ac:parameter><ac:plain-text-body><![CDATA[
Step 1 — OAuth Connect
┌─────────┐  GET /api/gmail/connect  ┌───────────┐  redirect  ┌─────────────────┐
│  User    │ ───────────────────────▸ │  Hugo API │ ─────────▸ │ Google OAuth    │
│  Browser │                         │  (JWT     │            │ Consent Screen  │
│          │ ◀─────────────────────── │   state)  │ ◀───────── │ gmail.readonly  │
│          │  /dashboard?gmail=ok    │           │  callback  │                 │
└─────────┘                          └───────────┘  +code     └─────────────────┘
                                          │
                                          │ exchange code → access_token + refresh_token
                                          │ store tokens on User row
                                          ▼
                                     ┌────────────┐
                                     │ PostgreSQL │
                                     └────────────┘

Step 2 — Scan & Import
┌─────────┐  POST /api/gmail/import  ┌───────────┐  GET /users/me/messages  ┌───────────┐
│  Import  │ ───────────────────────▸ │  Hugo API │ ──────────────────────▸  │ Gmail API │
│  Modal   │                         │           │  q=receipt|invoice|...   │           │
│          │                         │           │ ◀────── message list ──── │           │
│          │                         │           │                          └───────────┘
│          │                         │           │
│          │                         │           │  POST /v1/messages (all emails as batch)
│          │                         │           │ ──────────────────────────────────────▸
│          │                         │           │                         ┌────────────┐
│          │                         │           │ ◀── JSON subscriptions ─ │ Claude AI  │
│          │                         │           │                         │ (Haiku)    │
│          │ ◀── {candidates[]}  ─── │           │                         └────────────┘
│          │                         └───────────┘
│          │  User reviews & selects
│          │  POST /api/subscriptions (per item)
│          │ ───────────────────────▸ DB
└─────────┘
]]></ac:plain-text-body></ac:structured-macro>

<h3>3. Outlook Email Import Flow</h3>
<p>Identical to Gmail except:</p>
<ul>
<li>OAuth via <strong>Microsoft Identity Platform</strong> (<code>login.microsoftonline.com</code>), scope: <code>Mail.Read</code></li>
<li>Emails fetched from <strong>Microsoft Graph</strong> (<code>graph.microsoft.com/v1.0/me/messages</code>)</li>
<li>Graph returns full HTML body → server strips tags before sending to Claude</li>
<li>No per-message fetch needed (Graph returns body inline)</li>
</ul>

<h3>4. Insurance Document Analysis Flow</h3>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">text</ac:parameter><ac:plain-text-body><![CDATA[
Step 1 — Upload
┌─────────┐  POST /api/insurance/upload   ┌───────────┐  fs.writeFile()  ┌──────────────┐
│  User    │  (multipart/form-data)       │  Hugo API │ ───────────────▸ │ Server Disk  │
│  Browser │ ────────────────────────────▸│           │                  │ /uploads/    │
│          │ ◀── {fileUrl, fileName} ──── │           │                  │ insurance/   │
│          │                              │           │                  └──────────────┘
│          │  POST /api/insurance/[id]/documents
│          │  {fileUrl, fileName, fileType}
│          │ ────────────────────────────▸│           │──▸ prisma.insuranceDocument.create
│          │ ◀── document (pending) ───── │           │    parsedStatus: "pending"
└─────────┘                              └───────────┘

Step 2 — AI Analysis
┌─────────┐  POST /api/insurance/[id]/documents/analyze  ┌───────────┐
│  User    │  {docId}                                    │  Hugo API │
│  clicks  │ ──────────────────────────────────────────▸ │           │
│  analyze │                                             │  1. Read file from disk
│          │                                             │  2. Convert to base64
│          │                                             │  3. Send to Claude:
│          │                                             │     ┌────────────┐
│          │                                             │ ──▸ │ Claude AI  │
│          │                                             │     │ (Haiku)    │
│          │                                             │     │            │
│          │                                             │ ◀── │ Extracted: │
│          │                                             │     │ coverage,  │
│          │                                             │     │ deductible │
│          │                                             │     │ exclusions │
│          │                                             │     │ limits,    │
│          │                                             │     │ key terms  │
│          │                                             │     └────────────┘
│          │                                             │  4. Store analysisResult (JSON) in DB
│          │ ◀── document (completed + analysis) ─────── │     parsedStatus: "completed"
└─────────┘                                              └───────────┘
]]></ac:plain-text-body></ac:structured-macro>

<h3>5. Cross-Policy AI Coverage Insights</h3>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">text</ac:parameter><ac:plain-text-body><![CDATA[
┌──────────────┐  POST /api/insurance/analyze-all  ┌───────────┐
│  Insights    │ ────────────────────────────────▸ │  Hugo API │
│  Component   │                                   │           │
│  (auto or    │                                   │  1. Fetch all active policies
│   refresh)   │                                   │     with analyzed documents
│              │                                   │  2. Build portfolio summary JSON
│              │                                   │  3. Send to Claude:
│              │                                   │     ┌────────────┐
│              │                                   │ ──▸ │ Claude AI  │
│              │                                   │     │ (Haiku)    │
│              │                                   │ ◀── │ Returns:   │
│              │                                   │     │ overlaps,  │
│              │                                   │     │ gaps,      │
│              │                                   │     │ suggestions│
│              │                                   │     └────────────┘
│              │ ◀── {insights[]} ──────────────── │
│              │  → cached in localStorage         │
└──────────────┘                                   └───────────┘
]]></ac:plain-text-body></ac:structured-macro>

<h3>6. Household Sharing Flow</h3>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">text</ac:parameter><ac:plain-text-body><![CDATA[
Owner creates household:
POST /api/household {name}
→ Creates Household + HouseholdMember(role:"owner")
→ Sets User.householdId

Owner invites member:
POST /api/household/invite {email}
→ Signs JWT (7-day expiry) with {householdId, invitedEmail}
→ Sends invite email via Resend

Invited user accepts:
GET /api/household/accept?token=<jwt>
→ Verifies JWT
→ Checks session email matches invitedEmail
→ Creates HouseholdMember(role:"member")
→ Sets User.householdId
→ Redirects to /dashboard?joined=1

Shared access:
All GET /api/subscriptions and GET /api/insurance queries include:
  WHERE userId = me OR householdId = myHouseholdId
Other members' items shown as readonly: true (no edit/delete buttons)
]]></ac:plain-text-body></ac:structured-macro>

<h3>7. Renewal Alert Cron Flow</h3>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">text</ac:parameter><ac:plain-text-body><![CDATA[
┌──────────┐  GET /api/cron/renewal-alerts  ┌───────────┐  query renewals  ┌────────────┐
│  Cron    │  Authorization: Bearer SECRET  │  Hugo API │  within 7 days   │ PostgreSQL │
│  (daily) │ ─────────────────────────────▸ │           │ ───────────────▸ │            │
│          │                                │           │ ◀─── results ─── │            │
│          │                                │           │                  └────────────┘
│          │                                │           │  group by user
│          │                                │           │  build HTML digest
│          │                                │           │ ────────────────────▸ ┌────────┐
│          │                                │           │  send via Resend     │ Resend │
│          │ ◀── {sent: count} ──────────── │           │ ◀─── 200 OK ──────── │        │
└──────────┘                                └───────────┘                      └────────┘
]]></ac:plain-text-body></ac:structured-macro>

<h3>8. Password Reset Flow</h3>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">text</ac:parameter><ac:plain-text-body><![CDATA[
POST /api/auth/forgot-password {email}
→ Generate 32-byte random token
→ SHA-256 hash → store hash + 15-min expiry in DB
→ Send email via Resend with link: /reset-password?token=<rawToken>
→ Always returns {ok:true} (no email leak)

POST /api/auth/reset-password {token, password}
→ SHA-256 hash the token
→ Lookup by hash where expiry > now
→ bcrypt.hash(newPassword, 12)
→ Update user, clear reset token fields
]]></ac:plain-text-body></ac:structured-macro>
`;
}

function dataProcessingPipeline() {
  return `
<h2>Data Processing &amp; AI Pipeline</h2>
<p>This document describes how data moves through Hugo's technology stack, with a focus on the AI (Anthropic Claude) integrations.</p>

<h3>System Architecture Overview</h3>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">text</ac:parameter><ac:plain-text-body><![CDATA[
┌──────────────────────────────────────────────────────────────────────────────┐
│                              USER BROWSER                                   │
│   React 18 + Tailwind CSS + Radix UI                                       │
│   Client-side: i18n, form validation (Zod), localStorage caching           │
└────────────────────────────────┬─────────────────────────────────────────────┘
                                 │ HTTPS (JSON / multipart)
                                 ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         NEXT.JS 14 APP ROUTER                               │
│                                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │ middleware.ts│  │ API Routes   │  │ Server        │  │ Zod           │   │
│  │ Auth guard   │  │ /api/*       │  │ Components    │  │ Validation    │   │
│  └──────┬──────┘  └──────┬───────┘  └───────────────┘  └───────────────┘   │
│         │                │                                                   │
│         ▼                ▼                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    NextAuth.js v5 (JWT Strategy)                      │   │
│  │              Credentials provider · bcrypt · httpOnly cookie          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬─────────────────────────────────────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
          ▼                      ▼                      ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│ PostgreSQL       │  │ Anthropic Claude │  │ External Services    │
│ (Neon)           │  │ API              │  │                      │
│                  │  │                  │  │ • Google Gmail API   │
│ • Users          │  │ Model:           │  │ • Microsoft Graph    │
│ • Subscriptions  │  │ claude-haiku-    │  │ • Resend (email)     │
│ • History        │  │ 4-5-20251001     │  │ • Frankfurter.app    │
│ • Policies       │  │                  │  │   (exchange rates)   │
│ • Documents      │  │ Uses:            │  │ • Confluence API     │
│ • Households     │  │ 1. Email parsing │  │   (documentation)    │
│                  │  │ 2. Doc analysis  │  │                      │
│ Prisma ORM      │  │ 3. Coverage AI   │  │                      │
└──────────────────┘  └──────────────────┘  └──────────────────────┘
]]></ac:plain-text-body></ac:structured-macro>

<h3>Claude AI — Three Integration Points</h3>

<h4>1. Email Subscription Detection</h4>
<table>
<tr><th>Property</th><th>Value</th></tr>
<tr><td>Trigger</td><td>User clicks "Scan" in Gmail/Outlook import modal</td></tr>
<tr><td>Model</td><td><code>claude-haiku-4-5-20251001</code></td></tr>
<tr><td>Max tokens</td><td>2048</td></tr>
<tr><td>Input</td><td>Up to 50 email bodies (truncated to 1500 chars each), batched into one prompt</td></tr>
<tr><td>Output</td><td>JSON array of detected subscriptions</td></tr>
<tr><td>Persisted?</td><td>No — results shown in modal, user selects which to save as Subscription rows</td></tr>
</table>

<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">text</ac:parameter><ac:plain-text-body><![CDATA[
Input pipeline:
  Gmail API / Microsoft Graph
    → raw email (MIME/HTML)
    → decode base64 / strip HTML tags
    → truncate to 1500 chars
    → bundle all into one prompt string

Claude prompt extracts:
  - serviceName, amount, currency
  - billingCycle (monthly/annual)
  - renewalDate, category

Post-processing:
  - Normalize names (lowercase, strip non-alpha)
  - Compare against existing subscriptions
  - Annotate: isExisting, priceChanged, existingId
  - Return candidates to UI for user review
]]></ac:plain-text-body></ac:structured-macro>

<h4>2. Insurance Document Extraction</h4>
<table>
<tr><th>Property</th><th>Value</th></tr>
<tr><td>Trigger</td><td>User clicks analyze (✨) icon on an uploaded document</td></tr>
<tr><td>Model</td><td><code>claude-haiku-4-5-20251001</code></td></tr>
<tr><td>Max tokens</td><td>2048</td></tr>
<tr><td>Input</td><td>One document: PDF (as <code>type:document</code>) or image (as <code>type:image</code>), base64-encoded</td></tr>
<tr><td>Output</td><td>Structured JSON with coverage details</td></tr>
<tr><td>Persisted?</td><td>Yes — stored as <code>InsuranceDocument.analysisResult</code> (JSON column)</td></tr>
</table>

<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">text</ac:parameter><ac:plain-text-body><![CDATA[
Input pipeline:
  Server disk (/uploads/insurance/{userId}/{file})
    → fs.readFile() → Buffer
    → Buffer.toString("base64")
    → PDF: {type:"document", source:{type:"base64", media_type:"application/pdf", data}}
    → Image: {type:"image", source:{type:"base64", media_type:"image/png|jpeg", data}}

Claude extracts:
  {
    coverageType, coveredItems[], deductible,
    coverageLimits, exclusions[], effectiveDates {start, end},
    keyTerms[], summary
  }

Post-processing:
  - Regex extract JSON from response: /{[\s\S]*}/
  - Store in DB: parsedStatus → "completed", analysisResult → JSON
  - On error: parsedStatus → "failed"
]]></ac:plain-text-body></ac:structured-macro>

<h4>3. Cross-Policy Coverage Insights</h4>
<table>
<tr><th>Property</th><th>Value</th></tr>
<tr><td>Trigger</td><td>Auto on page load (if no cache), on new analysis, or manual refresh</td></tr>
<tr><td>Model</td><td><code>claude-haiku-4-5-20251001</code></td></tr>
<tr><td>Max tokens</td><td>2048</td></tr>
<tr><td>Input</td><td>Full portfolio: all active policies with their document analysis results</td></tr>
<tr><td>Output</td><td>JSON array of insights (overlaps, gaps, suggestions)</td></tr>
<tr><td>Persisted?</td><td>Client-side only (localStorage cache, key: <code>hugo_ai_insights</code>)</td></tr>
</table>

<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">text</ac:parameter><ac:plain-text-body><![CDATA[
Input pipeline:
  DB: all InsurancePolicy (status: active)
    → include InsuranceDocument (parsedStatus: completed)
    → filter policies with ≥ 1 analyzed doc
    → build portfolio summary:
      [{provider, type, policyNumber, analyses: [analysisResult, ...]}]

Claude identifies:
  - Overlaps: same coverage from multiple policies (wasteful)
  - Gaps: important coverage types missing entirely
  - Suggestions: money-saving or coverage-improvement ideas

Output:
  [{type, title, description, severity, relatedPolicies[]}]

Caching:
  - Stored in localStorage as {insights[], cachedAt: timestamp}
  - Invalidated when: refreshKey increments (new doc analyzed) or manual refresh
  - NOT persisted server-side (computed on demand)
]]></ac:plain-text-body></ac:structured-macro>

<h3>Amount Processing Pipeline</h3>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">text</ac:parameter><ac:plain-text-body><![CDATA[
User input         Zod transform           Database              API response
─────────────────────────────────────────────────────────────────────────────
"9.99"      →  Math.round(9.99 * 100)  →  amountCents: 999  →  "9.99"
(decimal         = 999 (int cents)         (Int column)         (centsToDisplay)
 string)

Annual → Monthly conversion:
  amountCents: 11988 (annual)  →  Math.round(11988 / 12) = 999 (monthly)

Multi-currency display:
  amountCents (in original currency)
    → fetch exchange rates from Frankfurter.app (1-hour ISR cache)
    → Math.round(cents / rate[displayCurrency])
    → format with user's displayCurrency symbol
]]></ac:plain-text-body></ac:structured-macro>

<h3>Data Persistence Summary</h3>
<table>
<tr><th>Data</th><th>Where</th><th>Lifetime</th></tr>
<tr><td>User accounts, credentials</td><td>PostgreSQL (Neon)</td><td>Until GDPR deletion</td></tr>
<tr><td>Subscriptions &amp; history</td><td>PostgreSQL</td><td>Until deleted or GDPR cascade</td></tr>
<tr><td>Insurance policies</td><td>PostgreSQL</td><td>Until deleted or GDPR cascade</td></tr>
<tr><td>Uploaded documents (files)</td><td>Server disk (<code>/public/uploads/</code>)</td><td>Until document deleted</td></tr>
<tr><td>Document analysis results</td><td>PostgreSQL (JSON column)</td><td>Persisted with document row</td></tr>
<tr><td>Cross-policy AI insights</td><td>localStorage (browser)</td><td>Until cache invalidated</td></tr>
<tr><td>Email import candidates</td><td>Not persisted</td><td>Session only (modal state)</td></tr>
<tr><td>OAuth tokens (Gmail/Outlook)</td><td>PostgreSQL (User row)</td><td>Until disconnect or GDPR</td></tr>
<tr><td>JWT session</td><td>httpOnly cookie</td><td>NextAuth default expiry</td></tr>
<tr><td>Exchange rates</td><td>Next.js ISR cache</td><td>1 hour (revalidate: 3600)</td></tr>
</table>

<h3>Security Boundaries</h3>
<table>
<tr><th>Boundary</th><th>Protection</th></tr>
<tr><td>User input</td><td>Zod schema validation on all API routes</td></tr>
<tr><td>Authentication</td><td>NextAuth JWT, middleware route guard</td></tr>
<tr><td>Authorization</td><td>Ownership check on every PATCH/DELETE (userId match)</td></tr>
<tr><td>Passwords</td><td>bcrypt hash (cost 12), never stored in plain text</td></tr>
<tr><td>OAuth tokens</td><td>Stored encrypted in DB, never exposed to client</td></tr>
<tr><td>File uploads</td><td>10MB limit, type whitelist (pdf/png/jpg), random filenames</td></tr>
<tr><td>Reset tokens</td><td>SHA-256 hashed in DB, raw token in email, 15-min expiry</td></tr>
<tr><td>Household invites</td><td>JWT-signed (7-day expiry), email verification on accept</td></tr>
<tr><td>Cron endpoint</td><td>Bearer token auth (CRON_SECRET)</td></tr>
</table>
`;
}

function apiExamples() {
  return `
<h2>API Examples — Request &amp; Response JSON</h2>
<p>Example payloads for all major Hugo API endpoints. All authenticated routes require a valid NextAuth session cookie.</p>

<h3>Authentication</h3>

<h4>Register</h4>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">json</ac:parameter><ac:plain-text-body><![CDATA[// POST /api/auth/register
// Request:
{
  "email": "carlo@example.com",
  "password": "MySecurePass123"
}

// Response (201):
{
  "id": "clx1abc23000001",
  "email": "carlo@example.com",
  "createdAt": "2026-03-08T10:30:00.000Z"
}

// Response (409 — duplicate):
{
  "error": "Email already in use"
}]]></ac:plain-text-body></ac:structured-macro>

<h4>Forgot Password</h4>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">json</ac:parameter><ac:plain-text-body><![CDATA[// POST /api/auth/forgot-password
// Request:
{
  "email": "carlo@example.com"
}

// Response (200 — always, no email leak):
{
  "ok": true
}]]></ac:plain-text-body></ac:structured-macro>

<h4>Reset Password</h4>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">json</ac:parameter><ac:plain-text-body><![CDATA[// POST /api/auth/reset-password
// Request:
{
  "token": "a3f7b2c1d4e5f6...",
  "password": "NewSecurePass456"
}

// Response (200):
{
  "ok": true
}]]></ac:plain-text-body></ac:structured-macro>

<hr/>

<h3>Subscriptions</h3>

<h4>Create Subscription</h4>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">json</ac:parameter><ac:plain-text-body><![CDATA[// POST /api/subscriptions
// Request:
{
  "name": "Netflix Premium",
  "category": "entertainment",
  "amount": "15.99",
  "currency": "USD",
  "billingCycle": "monthly",
  "renewalDate": "2026-04-01",
  "status": "active",
  "notes": "Family plan, 4 screens"
}

// Response (201):
{
  "id": "clx2def45000002",
  "name": "Netflix Premium",
  "category": "entertainment",
  "amount": "15.99",
  "currency": "USD",
  "billingCycle": "monthly",
  "renewalDate": "2026-04-01T00:00:00.000Z",
  "status": "active",
  "notes": "Family plan, 4 screens",
  "trialEndDate": null,
  "monthlySavingsHint": null,
  "readonly": false,
  "createdAt": "2026-03-08T10:35:00.000Z",
  "updatedAt": "2026-03-08T10:35:00.000Z"
}]]></ac:plain-text-body></ac:structured-macro>

<h4>List Subscriptions</h4>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">json</ac:parameter><ac:plain-text-body><![CDATA[// GET /api/subscriptions
// Response (200):
[
  {
    "id": "clx2def45000002",
    "name": "Netflix Premium",
    "category": "entertainment",
    "amount": "15.99",
    "currency": "USD",
    "billingCycle": "monthly",
    "renewalDate": "2026-04-01T00:00:00.000Z",
    "status": "active",
    "readonly": false
  },
  {
    "id": "clx3ghi67000003",
    "name": "Spotify Family",
    "category": "entertainment",
    "amount": "16.99",
    "currency": "USD",
    "billingCycle": "monthly",
    "renewalDate": "2026-03-15T00:00:00.000Z",
    "status": "active",
    "readonly": true
  }
]]]></ac:plain-text-body></ac:structured-macro>

<h4>Update Subscription (with history tracking)</h4>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">json</ac:parameter><ac:plain-text-body><![CDATA[// PATCH /api/subscriptions/clx2def45000002
// Request (partial update):
{
  "amount": "17.99",
  "status": "active"
}

// Response (200):
{
  "id": "clx2def45000002",
  "name": "Netflix Premium",
  "amount": "17.99",
  "status": "active",
  ...
}

// Side effect: SubscriptionHistory rows created:
// { field: "amountCents", oldValue: "1599", newValue: "1799" }]]></ac:plain-text-body></ac:structured-macro>

<h4>Subscription History</h4>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">json</ac:parameter><ac:plain-text-body><![CDATA[// GET /api/subscriptions/clx2def45000002/history
// Response (200):
[
  {
    "id": "clx4jkl89000004",
    "field": "amountCents",
    "oldValue": "1599",
    "newValue": "1799",
    "changedAt": "2026-03-08T11:00:00.000Z",
    "relativeTime": "2 minutes ago"
  }
]]]></ac:plain-text-body></ac:structured-macro>

<hr/>

<h3>Insurance</h3>

<h4>Create Insurance Policy</h4>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">json</ac:parameter><ac:plain-text-body><![CDATA[// POST /api/insurance
// Request:
{
  "provider": "Tryg",
  "type": "home",
  "premium": "245.00",
  "currency": "DKK",
  "billingCycle": "monthly",
  "renewalDate": "2026-06-01",
  "policyNumber": "HOM-2024-1234",
  "status": "active",
  "coverageNotes": "Apartment coverage, water damage included"
}

// Response (201):
{
  "id": "clx5mno01000005",
  "provider": "Tryg",
  "type": "home",
  "premium": "245.00",
  "currency": "DKK",
  "billingCycle": "monthly",
  "renewalDate": "2026-06-01T00:00:00.000Z",
  "policyNumber": "HOM-2024-1234",
  "status": "active",
  "coverageNotes": "Apartment coverage, water damage included",
  "readonly": false,
  "createdAt": "2026-03-08T12:00:00.000Z"
}]]></ac:plain-text-body></ac:structured-macro>

<h4>Upload Document</h4>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">json</ac:parameter><ac:plain-text-body><![CDATA[// POST /api/insurance/upload
// Content-Type: multipart/form-data
// Body: file=<binary PDF/PNG/JPG, max 10MB>

// Response (200):
{
  "fileUrl": "/uploads/insurance/clx1abc23000001/1709899200000-a1b2c3.pdf",
  "fileName": "tryg-home-policy.pdf",
  "fileType": "application/pdf"
}

// Then attach to policy:
// POST /api/insurance/clx5mno01000005/documents
// Request:
{
  "fileUrl": "/uploads/insurance/clx1abc23000001/1709899200000-a1b2c3.pdf",
  "fileName": "tryg-home-policy.pdf",
  "fileType": "application/pdf"
}

// Response (201):
{
  "id": "clx6pqr23000006",
  "fileName": "tryg-home-policy.pdf",
  "fileUrl": "/uploads/insurance/clx1abc23000001/1709899200000-a1b2c3.pdf",
  "fileType": "application/pdf",
  "parsedStatus": "pending",
  "analysisResult": null,
  "uploadedAt": "2026-03-08T12:05:00.000Z"
}]]></ac:plain-text-body></ac:structured-macro>

<h4>Analyze Document (AI)</h4>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">json</ac:parameter><ac:plain-text-body><![CDATA[// POST /api/insurance/clx5mno01000005/documents/analyze
// Request:
{
  "docId": "clx6pqr23000006"
}

// Response (200):
{
  "document": {
    "id": "clx6pqr23000006",
    "parsedStatus": "completed",
    "analysisResult": {
      "coverageType": "Home Insurance",
      "coveredItems": [
        "Building structure",
        "Personal belongings",
        "Water damage",
        "Fire damage",
        "Theft"
      ],
      "deductible": "DKK 3,500 per claim",
      "coverageLimits": "DKK 2,000,000 building, DKK 500,000 contents",
      "exclusions": [
        "War and terrorism",
        "Nuclear contamination",
        "Intentional damage",
        "Normal wear and tear"
      ],
      "effectiveDates": {
        "start": "2025-06-01",
        "end": "2026-06-01"
      },
      "keyTerms": [
        "All-risk",
        "Replacement value",
        "Water damage",
        "Fire",
        "Theft"
      ],
      "summary": "Comprehensive home insurance covering building and contents with standard exclusions. Includes water damage and theft with a DKK 3,500 deductible."
    }
  }
}]]></ac:plain-text-body></ac:structured-macro>

<h4>Cross-Policy AI Insights</h4>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">json</ac:parameter><ac:plain-text-body><![CDATA[// POST /api/insurance/analyze-all
// Request: (empty body)

// Response (200):
{
  "insights": [
    {
      "type": "overlap",
      "title": "Duplicate personal liability coverage",
      "description": "Both your home insurance (Tryg) and car insurance (Alka) include personal liability coverage. You may be paying for the same protection twice.",
      "severity": "medium",
      "relatedPolicies": ["Tryg Home", "Alka Car"]
    },
    {
      "type": "gap",
      "title": "No travel insurance detected",
      "description": "Your portfolio lacks travel insurance. Consider adding coverage for medical emergencies, trip cancellation, and lost luggage.",
      "severity": "high",
      "relatedPolicies": []
    },
    {
      "type": "suggestion",
      "title": "Bundle discount opportunity",
      "description": "Having both home and car insurance with the same provider often qualifies for a 10-15% bundle discount. Consider consolidating with one provider.",
      "severity": "low",
      "relatedPolicies": ["Tryg Home", "Alka Car"]
    }
  ]
}

// Response when no analyzed documents:
{
  "insights": [],
  "noData": true
}]]></ac:plain-text-body></ac:structured-macro>

<hr/>

<h3>Gmail Import</h3>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">json</ac:parameter><ac:plain-text-body><![CDATA[// POST /api/gmail/import
// Request: (empty body, uses stored OAuth tokens)

// Response (200):
{
  "candidates": [
    {
      "serviceName": "Netflix",
      "amount": "15.99",
      "currency": "USD",
      "billingCycle": "monthly",
      "renewalDate": "2026-04-01",
      "category": "entertainment",
      "isExisting": false,
      "priceChanged": false,
      "existingId": null,
      "existingAmountCents": null,
      "newAmountCents": 1599
    },
    {
      "serviceName": "Spotify",
      "amount": "16.99",
      "currency": "USD",
      "billingCycle": "monthly",
      "renewalDate": "2026-03-15",
      "category": "entertainment",
      "isExisting": true,
      "priceChanged": true,
      "existingId": "clx3ghi67000003",
      "existingAmountCents": 1499,
      "newAmountCents": 1699
    }
  ],
  "scanned": 42
}]]></ac:plain-text-body></ac:structured-macro>

<hr/>

<h3>Household</h3>

<h4>Create Household</h4>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">json</ac:parameter><ac:plain-text-body><![CDATA[// POST /api/household
// Request:
{
  "name": "The Johansen Family"
}

// Response (201):
{
  "id": "clx7stu45000007",
  "name": "The Johansen Family",
  "ownerId": "clx1abc23000001",
  "members": [
    {
      "userId": "clx1abc23000001",
      "role": "owner",
      "user": { "id": "clx1abc23000001", "email": "carlo@example.com" }
    }
  ]
}]]></ac:plain-text-body></ac:structured-macro>

<h4>Invite Member</h4>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">json</ac:parameter><ac:plain-text-body><![CDATA[// POST /api/household/invite
// Request:
{
  "email": "partner@example.com"
}

// Response (200):
{
  "ok": true,
  "message": "Invitation sent"
}
// Side effect: Sends HTML email via Resend with JWT-signed accept link]]></ac:plain-text-body></ac:structured-macro>

<hr/>

<h3>User Profile &amp; Settings</h3>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">json</ac:parameter><ac:plain-text-body><![CDATA[// GET /api/me
// Response (200):
{
  "id": "clx1abc23000001",
  "email": "carlo@example.com",
  "displayCurrency": "DKK",
  "householdId": "clx7stu45000007",
  "gmailConnected": true,
  "outlookConnected": false,
  "emailReminders": true
}

// PATCH /api/me
// Request:
{
  "displayCurrency": "EUR",
  "emailReminders": false
}

// Response (200):
{
  "id": "clx1abc23000001",
  "displayCurrency": "EUR",
  "emailReminders": false
}]]></ac:plain-text-body></ac:structured-macro>

<hr/>

<h3>Hub (Unified Dashboard)</h3>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">json</ac:parameter><ac:plain-text-body><![CDATA[// GET /api/hub
// Response (200):
{
  "totalMonthlySubscriptionsCents": 8497,
  "totalMonthlyInsuranceCents": 24500,
  "subscriptionCount": 5,
  "policyCount": 3,
  "upcomingRenewals": [
    {
      "type": "subscription",
      "name": "Spotify Family",
      "amount": "16.99",
      "currency": "USD",
      "renewalDate": "2026-03-15T00:00:00.000Z",
      "daysUntil": 7
    },
    {
      "type": "insurance",
      "name": "Tryg Home",
      "premium": "245.00",
      "currency": "DKK",
      "renewalDate": "2026-03-20T00:00:00.000Z",
      "daysUntil": 12
    }
  ],
  "recommendations": [
    {
      "type": "annual_savings",
      "title": "Switch Netflix to annual billing",
      "description": "Save approximately 16% by switching to annual billing."
    },
    {
      "type": "insurance_gap",
      "title": "Consider travel insurance",
      "description": "No travel insurance detected in your portfolio."
    }
  ]
}]]></ac:plain-text-body></ac:structured-macro>

<hr/>

<h3>Spending History</h3>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">json</ac:parameter><ac:plain-text-body><![CDATA[// GET /api/spending-history
// Optional: ?categories=entertainment,productivity

// Response (200):
{
  "months": [
    { "label": "Oct 2025", "totalCents": 7498 },
    { "label": "Nov 2025", "totalCents": 7498 },
    { "label": "Dec 2025", "totalCents": 8497 },
    { "label": "Jan 2026", "totalCents": 8497 },
    { "label": "Feb 2026", "totalCents": 8497 },
    { "label": "Mar 2026", "totalCents": 8497 }
  ]
}]]></ac:plain-text-body></ac:structured-macro>

<hr/>

<h3>Exchange Rates</h3>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">json</ac:parameter><ac:plain-text-body><![CDATA[// GET /api/exchange-rates
// Response (200):
{
  "base": "USD",
  "rates": {
    "USD": 1,
    "EUR": 0.92,
    "DKK": 6.87,
    "GBP": 0.79,
    "SEK": 10.45,
    "NOK": 10.72
  }
}

// Fallback response (on error):
{
  "base": "USD",
  "rates": { "USD": 1 },
  "fallback": true
}]]></ac:plain-text-body></ac:structured-macro>
`;
}

// ── Publishing logic ──

const PAGES = [
  { title: "Hugo — Platform Overview", content: platformOverview },
  { title: "Hugo — Tech Stack", content: techStack },
  { title: "Hugo — Architecture", content: architecture },
  { title: "Hugo — API Reference", content: apiReference },
  { title: "Hugo — Database Schema", content: databaseSchema },
  { title: "Hugo — Brand & Design System", content: brandDesign },
  { title: "Hugo — Integrations", content: integrations },
  { title: "Hugo — Process Flows", content: processFlows },
  { title: "Hugo — Data Processing & AI Pipeline", content: dataProcessingPipeline },
  { title: "Hugo — API Examples", content: apiExamples },
];

async function publish() {
  console.log("Publishing Hugo documentation to Confluence...\n");
  const homepageId = await getSpaceHomepage();
  if (!homepageId) {
    console.error("Could not find Hugo space homepage.");
    process.exit(1);
  }
  console.log(`Space: ${SPACE_KEY}, homepage ID: ${homepageId}\n`);

  for (const page of PAGES) {
    try {
      const result = await upsertPage(page.title, page.content(), homepageId);
      console.log(`    → ${result._links?.webui ? `https://hugodocu.atlassian.net/wiki${result._links.webui}` : "OK"}\n`);
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}\n`);
    }
  }

  console.log("Done!");
}

async function listPages() {
  const data = await api("GET", `/space/${SPACE_KEY}/content/page?limit=50&expand=version`);
  console.log(`Pages in "${SPACE_KEY}" space:\n`);
  for (const page of data.page?.results ?? []) {
    console.log(`  [v${page.version.number}] ${page.title} (id: ${page.id})`);
  }
}

async function test() {
  console.log("Testing Confluence connection...");
  const data = await api("GET", `/space/${SPACE_KEY}?expand=homepage`);
  console.log(`✓ Connected to space "${data.name}" (key: ${data.key})`);
  console.log(`  Homepage ID: ${data.homepage?.id}`);
  console.log(`  Type: ${data.type}`);
}

// ── CLI ──
const cmd = process.argv[2] || "test";
switch (cmd) {
  case "publish": await publish(); break;
  case "list": await listPages(); break;
  case "test": await test(); break;
  default:
    console.log("Usage: node scripts/confluence.mjs [test|publish|list]");
}
