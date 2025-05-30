# Tours - QR Code Booking Platform

A SvelteKit application that allows tour guides to create QR codes for instant tour bookings.

## Features

- QR code generation for tour bookings
- Early access email collection with Resend integration
- Tour management dashboard
- Instant booking notifications

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Resend (for Early Access Form)

The early access form uses Resend to collect email subscriptions. See `RESEND_SETUP.md` for detailed setup instructions.

Create a `.env` file in the project root:

```bash
RESEND_API_KEY=re_xxxxxxxxx
RESEND_AUDIENCE_ID=0dc8a6e6-f1c4-4f65-8611-c380dd599bfc
```

### 3. Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`.

## Development

- Everything inside `src/routes` contains the application pages
- The early access form is in `src/routes/(app)/+page.svelte`
- The Resend API endpoint is in `src/routes/api/early-access/+server.ts`

## Building

To create a production build:

```bash
pnpm build
```

To preview the production build:

```bash
pnpm preview
```

## Resend Integration

The early access form on the homepage automatically:
1. Validates email addresses
2. Adds subscribers to your Resend audience
3. Provides user feedback on success/error
4. Handles network errors gracefully

When a user submits their email, it gets added to your Resend audience for future marketing campaigns.
