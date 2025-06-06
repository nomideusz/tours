# Resend Setup Guide

To make the early access form work with Resend, you need to set up the following environment variables:

## Required Environment Variables

Create a `.env` file in your project root with:

```bash
RESEND_API_KEY=re_xxxxxxxxx
RESEND_AUDIENCE_ID=0dc8a6e6-f1c4-4f65-8611-c380dd599bfc
```

## How to get these values:

1. **RESEND_API_KEY**: 
   - Sign up at [Resend](https://resend.com)
   - Go to your dashboard
   - Navigate to API Keys section
   - Create a new API key
   - Copy the key (starts with `re_`)

2. **RESEND_AUDIENCE_ID**:
   - In your Resend dashboard, go to Audiences
   - Create a new audience (or use existing one)
   - Copy the Audience ID from the audience settings

## Testing

After setting up the environment variables, restart your dev server:

```bash
pnpm dev
```

The early access form will now save emails to your Resend audience! 