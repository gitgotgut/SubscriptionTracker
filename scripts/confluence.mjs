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

import { readFileSync, existsSync } from "fs";
import { resolve, dirname, basename } from "path";
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

async function uploadAttachment(pageId, filePath) {
  const url = `${BASE}/content/${pageId}/child/attachment`;
  const fileName = basename(filePath);
  const fileData = readFileSync(filePath);
  const boundary = "----FormBoundary" + Date.now().toString(36);

  const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: image/png\r\n\r\n`;
  const footer = `\r\n--${boundary}--\r\n`;

  const body = Buffer.concat([
    Buffer.from(header, "utf-8"),
    fileData,
    Buffer.from(footer, "utf-8"),
  ]);

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: AUTH,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "X-Atlassian-Token": "nocheck",
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload ${fileName} → ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

async function uploadImages(pageId, files) {
  const diagramDir = resolve(__dirname, "..", "public", "diagrams");

  for (const file of files) {
    const filePath = resolve(diagramDir, file);
    if (!existsSync(filePath)) {
      console.log(`    ⚠ Skipping ${file} (not found)`);
      continue;
    }
    try {
      await uploadAttachment(pageId, filePath);
      console.log(`    📎 Uploaded ${file}`);
    } catch (err) {
      console.error(`    ✗ Failed to upload ${file}: ${err.message}`);
    }
  }
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
<p>Hugo's visual identity was designed through three brand proposals, with <strong>Proposal C (Slate Blue + Terracotta)</strong> selected as the final direction — a fintech-appropriate palette combining trust (slate blue) with warmth (terracotta).</p>

<h3>Design Process — Brand Proposals</h3>
<p>Three distinct brand directions were explored, each with full mockups including hero, dashboard preview, color palette, and typography:</p>

<h4>Proposal A — Warm Indigo + Gold</h4>
<p><ac:image ac:width="900"><ri:attachment ri:filename="brand-proposal-a.png" /></ac:image></p>
<p>Deep purple primary (#5B45A8) with gold accent (#E8C97B). Premium, confident feel but potentially too corporate for a family-focused product.</p>

<h4>Proposal B — Forest Green + Cream</h4>
<p><ac:image ac:width="900"><ri:attachment ri:filename="brand-proposal-b.png" /></ac:image></p>
<p>Nature-inspired green primary (#2D7A4E) with warm cream background (#F7F3EC). Organic and approachable, but lower perceived tech sophistication.</p>

<h4>Proposal C — Slate Blue + Terracotta ★ CHOSEN</h4>
<p><ac:image ac:width="900"><ri:attachment ri:filename="brand-proposal-c.png" /></ac:image></p>
<p>Balanced combination of trust (slate blue #4A6FA5) and warmth (terracotta #C8644A). Professional yet approachable — ideal for fintech serving families.</p>

<h3>Logo Explorations</h3>
<p>Four logo directions were explored before selecting the <strong>Orbital Ring</strong> (option 3):</p>
<p><ac:image ac:width="900"><ri:attachment ri:filename="brand-logo-explorations.png" /></ac:image></p>
<p>The Orbital Ring symbolizes recurring/cyclical finances, with the terracotta dot representing active monitoring. Component: <code>src/components/hugo-logo.tsx</code></p>

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

<h3>Dashboard Design</h3>
<p>The final dashboard design applying Proposal C's brand identity:</p>
<p><ac:image ac:width="900"><ri:attachment ri:filename="brand-dashboard-mockup.png" /></ac:image></p>
<p>Key elements: stat cards with KPIs, upcoming renewals table, AI insights sidebar (terracotta for overlaps, blue for suggestions), and spending-by-category bar chart.</p>

<h3>Landing Page Design</h3>
<p>The public-facing landing page:</p>
<p><ac:image ac:width="900"><ri:attachment ri:filename="brand-landing-page.png" /></ac:image></p>
<p>Sections: hero with dashboard preview, trust logos, 3-step "How It Works", feature grid, social proof stats, and dark footer with the brand story tagline.</p>

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
<p>Visual step-by-step flows for every major user journey in Hugo. Each diagram uses consistent color coding: <strong style="color:#4A6FA5;">blue</strong> for app/API layers, <strong style="color:#C8644A;">terracotta</strong> for AI processing, <strong style="color:#22C55E;">green</strong> for database/security, and <strong style="color:#F59E0B;">amber</strong> for user actions/output.</p>

<h3>1. System Architecture</h3>
<p><ac:image ac:width="900"><ri:attachment ri:filename="01-system-architecture.png" /></ac:image></p>

<h3>2. Auth &amp; Registration Flow</h3>
<p><ac:image ac:width="900"><ri:attachment ri:filename="02-auth-registration.png" /></ac:image></p>
<p><strong>Key endpoints:</strong> <code>POST /api/auth/register</code> → bcrypt hash → Prisma create → <code>POST /api/auth/[...nextauth]</code> → JWT httpOnly cookie → <code>middleware.ts auth()</code> guards all <code>/dashboard/*</code> routes.</p>

<h3>3. Gmail / Outlook Email Import Flow</h3>
<p><ac:image ac:width="900"><ri:attachment ri:filename="03-email-import.png" /></ac:image></p>
<p><strong>Gmail:</strong> OAuth 2.0 via Google → <code>googleapis</code> → fetch messages with <code>q=receipt|invoice</code> → Claude extracts subscription data.</p>
<p><strong>Outlook:</strong> Same flow via Microsoft Identity Platform → <code>Microsoft Graph API</code> (<code>graph.microsoft.com/v1.0/me/messages</code>) → Graph returns full HTML body inline → stripped before Claude.</p>

<h3>4. Insurance Document Analysis</h3>
<p><ac:image ac:width="900"><ri:attachment ri:filename="04-insurance-analysis.png" /></ac:image></p>
<p><strong>Upload:</strong> <code>POST /api/insurance/upload</code> (multipart) → stored to disk. <strong>Analysis:</strong> <code>POST /api/insurance/[id]/documents/analyze</code> → file read + base64 → Claude extracts coverage types, limits, deductibles, exclusions → JSON stored in DB.</p>

<h3>5. Cross-Policy AI Insights</h3>
<p><ac:image ac:width="900"><ri:attachment ri:filename="05-cross-policy-insights.png" /></ac:image></p>
<p><strong>Trigger:</strong> <code>POST /api/insurance/analyze-all</code> → fetches all active policies with analyzed documents → builds portfolio summary → Claude identifies overlaps, gaps, and savings → results cached in <code>localStorage</code> with 24h TTL.</p>

<h3>6. Household Sharing Flow</h3>
<p><ac:image ac:width="900"><ri:attachment ri:filename="06-household-sharing.png" /></ac:image></p>
<p><strong>Setup:</strong> <code>POST /api/household</code> creates group → <code>POST /api/household/invite</code> sends JWT invite email (7-day expiry) → <code>GET /api/household/accept?token=</code> joins member. <strong>Shared access:</strong> all queries include <code>WHERE userId = me OR householdId = myHouseholdId</code>. Other members' items shown as read-only.</p>

<hr/>
<h3>7. Renewal Alert Cron Flow</h3>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">text</ac:parameter><ac:plain-text-body><![CDATA[
GET /api/cron/renewal-alerts (Authorization: Bearer SECRET)
→ Query subscriptions renewing within 7 days
→ Group by user → Build HTML digest → Send via Resend
→ Returns {sent: count}
]]></ac:plain-text-body></ac:structured-macro>

<h3>8. Password Reset Flow</h3>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">text</ac:parameter><ac:plain-text-body><![CDATA[
POST /api/auth/forgot-password {email}
→ Generate 32-byte token → SHA-256 hash → store in DB (15-min expiry)
→ Send reset link via Resend → Always returns {ok:true} (no email leak)

POST /api/auth/reset-password {token, password}
→ SHA-256 hash token → Lookup by hash where expiry > now
→ bcrypt.hash(newPassword, 12) → Update user, clear reset fields
]]></ac:plain-text-body></ac:structured-macro>
`;
}

function dataProcessingPipeline() {
  return `
<h2>Data Processing &amp; AI Pipeline</h2>
<p>This document describes how data moves through Hugo's technology stack, with a focus on the AI (Anthropic Claude) integrations.</p>

<h3>System Architecture Overview</h3>
<p><ac:image ac:width="900"><ri:attachment ri:filename="01-system-architecture.png" /></ac:image></p>
<p>Three-tier architecture: React browser client → Next.js 14 App Router (middleware, API routes, Zod validation, NextAuth.js v5) → PostgreSQL (Prisma ORM), Anthropic Claude API, and external services (Gmail, Outlook, Resend).</p>

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

<p><ac:image ac:width="900"><ri:attachment ri:filename="03-email-import.png" /></ac:image></p>

<table>
<tr><th>Stage</th><th>Details</th></tr>
<tr><td><strong>1. Fetch emails</strong></td><td>Gmail API / Microsoft Graph → raw email (MIME/HTML)</td></tr>
<tr><td><strong>2. Pre-process</strong></td><td>Decode base64, strip HTML tags, truncate to 1500 chars per email, bundle into one prompt</td></tr>
<tr><td><strong>3. Claude extraction</strong></td><td>Extracts: <code>serviceName</code>, <code>amount</code>, <code>currency</code>, <code>billingCycle</code>, <code>renewalDate</code>, <code>category</code></td></tr>
<tr><td><strong>4. Post-processing</strong></td><td>Normalize names (lowercase, strip non-alpha), compare against existing subscriptions, annotate: <code>isExisting</code>, <code>priceChanged</code>, <code>existingId</code></td></tr>
<tr><td><strong>5. User review</strong></td><td>Return candidates to UI — user selects which to save as Subscription rows</td></tr>
</table>

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

<p><ac:image ac:width="900"><ri:attachment ri:filename="04-insurance-analysis.png" /></ac:image></p>

<table>
<tr><th>Stage</th><th>Details</th></tr>
<tr><td><strong>1. Read file</strong></td><td>Server disk <code>/uploads/insurance/{userId}/{file}</code> → <code>fs.readFile()</code> → Buffer → base64</td></tr>
<tr><td><strong>2. Format for Claude</strong></td><td>PDF: <code>{type:"document", media_type:"application/pdf"}</code> · Image: <code>{type:"image", media_type:"image/png|jpeg"}</code></td></tr>
<tr><td><strong>3. Claude extraction</strong></td><td>Extracts: <code>coverageType</code>, <code>coveredItems[]</code>, <code>deductible</code>, <code>coverageLimits</code>, <code>exclusions[]</code>, <code>effectiveDates</code>, <code>keyTerms[]</code>, <code>summary</code></td></tr>
<tr><td><strong>4. Post-processing</strong></td><td>Regex extract JSON from response (<code>/{[\\s\\S]*}/</code>), store in DB: <code>parsedStatus → "completed"</code>, <code>analysisResult → JSON</code></td></tr>
<tr><td><strong>5. Error handling</strong></td><td>On failure: <code>parsedStatus → "failed"</code>, error logged</td></tr>
</table>

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

<p><ac:image ac:width="900"><ri:attachment ri:filename="05-cross-policy-insights.png" /></ac:image></p>

<table>
<tr><th>Stage</th><th>Details</th></tr>
<tr><td><strong>1. Load portfolio</strong></td><td>All <code>InsurancePolicy</code> (status: active) → include analyzed documents → build summary array</td></tr>
<tr><td><strong>2. Claude analysis</strong></td><td><strong>Overlaps:</strong> same coverage from multiple policies · <strong>Gaps:</strong> important coverage missing · <strong>Suggestions:</strong> money-saving ideas</td></tr>
<tr><td><strong>3. Output format</strong></td><td><code>[{type, title, description, severity, relatedPolicies[]}]</code></td></tr>
<tr><td><strong>4. Caching</strong></td><td>localStorage: <code>{insights[], cachedAt}</code> — invalidated on new doc analysis or manual refresh. Falls back to cache on API errors.</td></tr>
</table>

<h3>Amount Processing Pipeline</h3>
<table>
<tr><th>Step</th><th>Example</th><th>Description</th></tr>
<tr><td><strong>User input</strong></td><td><code>"9.99"</code> (decimal string)</td><td>Zod schema accepts decimal string from form</td></tr>
<tr><td><strong>Zod transform</strong></td><td><code>Math.round(9.99 × 100) = 999</code></td><td>Convert to integer cents</td></tr>
<tr><td><strong>Database</strong></td><td><code>amountCents: 999</code> (Int column)</td><td>Stored as integer — no floating point issues</td></tr>
<tr><td><strong>API response</strong></td><td><code>"9.99"</code></td><td><code>centsToDisplay()</code> converts back to decimal string</td></tr>
</table>
<p><strong>Annual → Monthly:</strong> <code>Math.round(11988 / 12) = 999</code> cents/month</p>
<p><strong>Multi-currency:</strong> Fetch exchange rates from Frankfurter.app (1-hour ISR cache) → <code>Math.round(cents / rate)</code> → format with user's display currency symbol</p>

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

      // Upload images to relevant pages
      if (page.title === "Hugo — Process Flows") {
        console.log("  📎 Uploading process flow diagrams...");
        await uploadImages(result.id, [
          "01-system-architecture.png", "02-auth-registration.png",
          "03-email-import.png", "04-insurance-analysis.png",
          "05-cross-policy-insights.png", "06-household-sharing.png",
        ]);
      }
      if (page.title === "Hugo — Data Processing & AI Pipeline") {
        console.log("  📎 Uploading pipeline diagrams...");
        await uploadImages(result.id, [
          "01-system-architecture.png", "03-email-import.png",
          "04-insurance-analysis.png", "05-cross-policy-insights.png",
        ]);
      }
      if (page.title === "Hugo — Brand & Design System") {
        console.log("  📎 Uploading brand identity images...");
        await uploadImages(result.id, [
          "brand-proposal-a.png", "brand-proposal-b.png",
          "brand-proposal-c.png", "brand-logo-explorations.png",
          "brand-dashboard-mockup.png", "brand-landing-page.png",
        ]);
      }
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
