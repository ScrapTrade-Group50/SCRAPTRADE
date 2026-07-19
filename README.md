# SCRAPTRADE

An industrial off-cut and circular economy marketplace for connecting **factories** (sellers) with **artisans** (buyers). Built with Spring Boot and Expo React Native.

## Project structure

```
SCRAPTRADE/
├── scraptrade-backend/   # Spring Boot REST API + PostgreSQL
└── scraptrade-mobile/    # Expo React Native app (iOS / Android / Web)
```

## Prerequisites

- **Java 25** and Maven (or use `./mvnw`)
- **PostgreSQL** running locally
- **Node.js 20+** and npm
- **Expo CLI** (`npx expo`)

## Backend setup

1. Create the database:
   ```sql
   CREATE DATABASE scraptrade_db;
   ```

2. Copy the environment template and fill in your values:
   ```bash
   cd scraptrade-backend
   cp application-local.properties.example application-local.properties
   ```

3. Set required environment variables (or use `application-local.properties` with Spring config import). Minimum for local dev:
   - `DATABASE_PASSWORD`
   - `JWT_SECRET` — generate with: `openssl rand -base64 64`
   - `SPRING_PROFILES_ACTIVE=dev` for local development (enables schema auto-update and test user seeding)

   **Optional (for listing photos):** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. The API starts without Cloudinary; listings work, but image uploads fail until credentials are set.

4. Run the API:
   ```bash
   ./mvnw spring-boot:run
   ```

5. Health check: `GET http://localhost:8080/api/health`

### Dev test accounts (only when `SPRING_PROFILES_ACTIVE=dev`)

| Role    | Email              | Password              |
|---------|--------------------|-----------------------|
| Factory | factory@test.com   | hashed_password_123   |
| Artisan | artisan@test.com   | hashed_password_456   |

When the dev profile is active, the backend also seeds **"Dev Sample Copper Off-Cuts"** owned by `factory@test.com` so you can test the full buy → scan flow immediately.

### Dev end-to-end gate pass test

1. Sign in as **artisan@test.com** → open **Dev Sample Copper Off-Cuts** → checkout (simulated MoMo).
2. On the gate pass screen, note the **QR-…** code (or open **Orders** → tap the pending order).
3. Sign out, sign in as **factory@test.com** → **Scan** tab → scan the QR or enter the code manually.
4. Verification succeeds only when the **factory that owns the listing** scans the pass.

### Password reset (production + SendGrid)

In **dev** with `app.password-reset.expose-token=true`, forgot-password returns a token in the API response.

With **SendGrid configured** (`app.mail.enabled=true`), the backend emails a browser link:

1. Deploy the web app to **Vercel** (see below).
2. Set backend env / `application-local.properties` (see `application-local.properties.example`).
3. Verify a sender in SendGrid; set `MAIL_FROM` to that address.
4. User flow: app → forgot password → email → `https://your-vercel-url/reset-password?token=...` → new password.

#### Deploy web reset page to Vercel (~5 min)

1. Install Vercel CLI: `npm i -g vercel`
2. From `scraptrade-mobile`:
   ```bash
   vercel login
   vercel
   ```
   Root directory: `scraptrade-mobile`. Project name: `scraptrade` → URL e.g. `https://scraptrade-kappa.vercel.app`
3. In Vercel **Environment Variables** (Production), set:
   - `EXPO_PUBLIC_API_URL` = your **public** backend URL (e.g. Railway/Render/ngrok + `/api`)
4. Redeploy: `vercel --prod`
5. Update backend `PASSWORD_RESET_WEB_URL` to match your Vercel URL, e.g. `https://scraptrade-kappa.vercel.app/reset-password`
6. Restart backend.

| Variable | Example |
|----------|---------|
| `PASSWORD_RESET_EXPOSE_TOKEN` | `false` |
| `PASSWORD_RESET_WEB_URL` | `https://scraptrade-kappa.vercel.app/reset-password` |
| `MAIL_ENABLED` | `true` |
| `MAIL_HOST` | `smtp.sendgrid.net` |
| `MAIL_PORT` | `587` |
| `MAIL_USERNAME` | `apikey` |
| `MAIL_PASSWORD` | SendGrid API key |
| `MAIL_FROM` | verified sender in SendGrid |

**Note:** The Vercel reset page calls your API from the user's browser — `localhost` only works on your PC. Use a hosted or tunneled backend for real users.

## Mobile setup

1. Install dependencies:
   ```bash
   cd scraptrade-mobile
   npm install
   ```

2. Copy environment file and set your LAN IP (required for physical devices):
   ```bash
   cp .env.example .env
   # Edit EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:8080/api
   ```

3. Start Expo:
   ```bash
   npm run start:sync
   ```
   (`start:sync` updates `.env` with your PC's LAN IP, then starts Expo — use this on a physical device.)

### App navigation

- **Welcome** screen for new visitors → sign in or create account.
- **Artisan tabs:** Discover, Saved, Orders, Profile. Detail screens (listing, checkout, gate pass) push on a stack above the tabs (back swipe works).
- **Factory tabs:** Dashboard, Scan, Sales, Profile. Create/edit listing and settings push on a stack above the tabs.

### Physical device (Expo Go) — important

Your phone and PC must be able to reach each other on the network.

**Option A — Same Wi‑Fi (recommended):**
1. Connect your phone to the **same Wi‑Fi** as your PC (not LTE/cellular).
2. Find your PC IP: `ipconfig` → look for `IPv4 Address` (e.g. `172.20.10.5`).
3. Set in `scraptrade-mobile/.env`:
   ```
   EXPO_PUBLIC_API_URL=http://YOUR_PC_IP:8080/api
   ```
4. Run `npm run start:sync` and scan the QR code.

**Option B — Phone on LTE or different network (tunnel):**
1. Run Expo with tunnel (routes through the internet):
   ```bash
   npm run start:tunnel
   ```
2. Scan the new QR code in Expo Go.
3. Your API URL in `.env` must still point to an address your phone can reach. Tunnel only fixes loading the app bundle — **not** API calls to `localhost` or a LAN IP. For API access from LTE you need the PC and phone on the same network, or expose the backend (e.g. ngrok).

**Common errors:**

| Error | Cause | Fix |
|-------|--------|-----|
| `Port 8080 was already in use` | Backend already running | Don't start a second instance; use existing server or kill PID on 8080 |
| `The request timed out` (Expo Go) | Phone on LTE, can't reach `172.20.10.5` | Use same Wi‑Fi as PC, or `npm run start:tunnel` |
| App loads but login fails | Wrong API URL in `.env` | Match `.env` IP to your PC's current `ipconfig` IPv4 |

**Only run one backend instance:**
```powershell
# Check what's using port 8080
netstat -ano | findstr :8080
# Stop it if needed (replace PID)
taskkill /PID <pid> /F
```

## User flows

**Artisan:** Browse feed → Listing detail → Checkout (Paystack or demo MoMo) → Gate pass QR → Pick up at factory

**Factory:** Dashboard → Create listing → Buyer pays → Scan gate pass QR → Order completed

## Security notes

- **Never commit** `.env`, `application-local.properties`, or real API keys.
- Rotate any credentials that were previously committed to git (DB, Cloudinary, JWT).
- Payment defaults to **simulated** mode. Set `PAYMENT_PROVIDER=paystack` with Paystack test/live keys for real checkout, or `PAYMENT_PROVIDER=momo` for MTN MoMo Collection API (sandbox).

### Paystack checkout

1. Create a [Paystack](https://paystack.com) account and copy your **test** keys (`pk_test_…`, `sk_test_…`).
2. In `application-local.properties` (or env vars):
   ```
   payment.provider=paystack
   payment.paystack.secret-key=sk_test_...
   payment.paystack.public-key=pk_test_...
   payment.paystack.callback-url=scraptrade://checkout
   ```
3. Restart the backend. Checkout opens Paystack in the browser; on success the app verifies payment and issues a gate pass.
4. Use Paystack test cards from their docs. For production, switch to live keys and host the API over HTTPS.

### Paystack escrow (real payout on pickup)

1. **Factory** → Profile → **Payout Account** → link MoMo wallet (creates a Paystack transfer recipient).
2. **Artisan** pays via Paystack → funds land in your Paystack balance; order status is `PAID_TO_ESCROW`.
3. **Factory** scans gate pass → backend sends a Paystack **Transfer** to the factory’s MoMo (item price only; 15 GHS platform fee stays on the platform balance).
4. Requires sufficient Paystack balance for transfers (test mode: fund test balance in the Paystack dashboard).

## Deployment (Docker)

From the repo root, set env vars then start:

```bash
export JWT_SECRET=your_base64_secret
export CLOUDINARY_CLOUD_NAME=...
export CLOUDINARY_API_KEY=...
export CLOUDINARY_API_SECRET=...
export DATABASE_PASSWORD=postgres
docker compose up --build
```

API runs at `http://localhost:8080`. For production mobile builds, set `EXPO_PUBLIC_API_URL` in `eas.json` to your hosted HTTPS URL.

## Building for stores

1. Install EAS CLI: `npm install -g eas-cli`
2. Configure `eas.json` production `EXPO_PUBLIC_API_URL` to your HTTPS API.
3. Run `eas build --platform android` or `eas build --platform ios`
4. Prepare privacy policy, terms of service, and store listing assets before submission.

## API endpoints (summary)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/me` | Yes | Current user |
| PATCH | `/api/auth/me` | Yes | Update profile |
| POST | `/api/auth/forgot-password` | No | Request password reset |
| POST | `/api/auth/reset-password` | No | Reset password with token |
| GET | `/api/listings` | No | Available listings |
| PUT | `/api/listings/{id}` | Factory | Update listing |
| POST | `/api/listings` | Factory | Create listing |
| GET | `/api/payments/config` | Yes | Payment provider info |
| POST | `/api/orders/checkout/init` | Artisan | Start Paystack checkout |
| POST | `/api/orders/checkout/complete` | Artisan | Verify Paystack & create order |
| POST | `/api/orders/checkout` | Artisan | Simulated checkout (dev) |
| GET | `/api/payouts/status` | Factory | Payout account setup status |
| POST | `/api/payouts/setup` | Factory | Link MoMo for escrow release |
| POST | `/api/orders/verify-pickup` | Factory | Scan gate pass & release payout |

## License

Academic / group project — Group 50.
