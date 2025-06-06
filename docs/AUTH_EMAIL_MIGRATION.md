# Authentication Email System Migration

This document explains the migration from PocketBase email hooks to SvelteKit-based authentication emails.

## ✅ What's Changed

### Before (PocketBase Hooks)
- Password reset emails sent via PocketBase hooks
- Email verification handled by PocketBase
- Limited customization options
- Dependency on PocketBase for email functionality

### After (SvelteKit Integration)
- All authentication emails sent via SvelteKit + Resend
- Custom email templates with consistent branding
- Full control over email logic and design
- Unified email system for both booking and authentication emails

## 🆕 New Authentication Email System

### Email Types Supported

1. **Password Reset** (`password-reset`)
   - Sent when user requests password reset
   - Contains secure token with 1-hour expiration
   - Professional security warnings and instructions

2. **Email Verification** (`email-verification`)
   - Sent after user registration
   - Welcome message with verification benefits
   - 24-hour token expiration

3. **Welcome Email** (`welcome`)
   - Sent after successful email verification
   - Tour platform features overview
   - Call-to-action to explore tours

4. **Email Changed** (`email-changed`)
   - Sent when user updates their email address
   - Security notification with change details
   - Contact information for support

### New Database Tables

```sql
-- Password reset tokens
CREATE TABLE password_reset_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Email verification tokens  
CREATE TABLE email_verification_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

### New API Endpoints

#### `/api/send-auth-email` - Send Authentication Emails
```bash
POST /api/send-auth-email
{
  "emailType": "password-reset" | "email-verification" | "welcome" | "email-changed",
  "email": "user@example.com",
  "name": "User Name",
  "resetUrl": "https://zaur.app/auth/reset-password?token=...",
  "verificationUrl": "https://zaur.app/auth/verify?token=...",
  "newEmail": "newemail@example.com"
}
```

### Updated Auth Routes

#### `/auth/forgot-password` 
- ✅ Generates secure reset tokens
- ✅ Sends password reset emails via Resend
- ✅ Prevents email enumeration attacks

#### `/auth/reset-password`
- ✅ Validates and consumes reset tokens
- ✅ Updates passwords securely
- ✅ Auto-login after successful reset

#### `/auth/register`
- ✅ Creates users with email verification requirement
- ✅ Sends verification emails automatically
- ✅ Sets `emailVerified: false` initially

#### `/auth/verify`
- ✅ Validates and consumes verification tokens
- ✅ Marks email as verified
- ✅ Sends welcome email after verification
- ✅ Supports resending verification emails

## 🔧 Setup Instructions

### 1. Run Database Migration

Execute the SQL script to create token tables:

```bash
# If you have psql access:
psql -h localhost -U zaur_dev -d zaur_local -f create-token-tables.sql

# Or execute in your database client:
# (Copy SQL from create-token-tables.sql)
```

### 2. Environment Variables

Ensure you have the required environment variables:

```bash
# Required for email sending
RESEND_API_KEY=re_xxxxxxxxx

# Database connection (should already be set)
DATABASE_URL=postgresql://zaur_dev:zaur_dev_password@localhost:5432/zaur_local
```

### 3. Disable PocketBase Hooks

The PocketBase email hooks have been disabled to prevent conflicts:
- `pb_hooks/main.pb.js` → `pb_hooks/main.pb.js.backup`
- PocketBase will no longer send authentication emails

### 4. Test the System

Test all authentication email types:

```bash
# Test password reset
curl -X POST http://localhost:5173/api/send-auth-email \
  -H "Content-Type: application/json" \
  -d '{
    "emailType": "password-reset",
    "email": "test@example.com",
    "name": "Test User",
    "resetUrl": "https://zaur.app/auth/reset-password?token=test123"
  }'

# Test email verification
curl -X POST http://localhost:5173/api/send-auth-email \
  -H "Content-Type: application/json" \
  -d '{
    "emailType": "email-verification",
    "email": "test@example.com",
    "name": "Test User",
    "verificationUrl": "https://zaur.app/auth/verify?token=test123"
  }'

# Test welcome email
curl -X POST http://localhost:5173/api/send-auth-email \
  -H "Content-Type: application/json" \
  -d '{
    "emailType": "welcome",
    "email": "test@example.com",
    "name": "Test User"
  }'
```

## 🔐 Security Features

### Token Security
- ✅ Cryptographically secure tokens (32 bytes)
- ✅ Automatic expiration (1 hour for reset, 24 hours for verification)
- ✅ Single-use tokens (consumed after verification)
- ✅ Automatic cleanup of expired tokens

### Email Security
- ✅ Anti-enumeration protection in forgot password
- ✅ Security warnings in reset emails
- ✅ Professional email templates
- ✅ Proper error handling and logging

### Database Security
- ✅ Foreign key constraints
- ✅ Cascade deletion when user is deleted
- ✅ Indexed for performance
- ✅ Unique constraints on tokens

## 📧 Email Templates

All emails use consistent, professional templates with:
- 🎨 Zaur Tours branding
- 📱 Mobile-responsive design
- 🔗 Clear call-to-action buttons
- ⚠️ Security warnings where appropriate
- 🏢 Professional footer and styling

### Template Features
- Clean, modern HTML design
- Email client compatibility (Outlook, Gmail, etc.)
- Accessible color schemes
- Clear typography and spacing
- Branded button styles

## 🔄 Migration Benefits

### ✅ Advantages
- **Unified System**: All emails (booking + auth) use same infrastructure
- **Better Design**: Professional, branded email templates
- **Full Control**: Complete customization of email content and timing
- **Security**: Proper token-based authentication
- **Reliability**: Direct integration with Resend API
- **Maintainability**: Single codebase for all email functionality

### 🗑️ Removed Complexity
- ❌ PocketBase email hooks with limited customization
- ❌ Dependency on PocketBase for authentication emails
- ❌ Mixed email systems (PocketBase + SvelteKit)
- ❌ Limited error handling and logging

## 🐛 Troubleshooting

### Common Issues

1. **"Module not found" errors**
   - Restart your dev server after adding new dependencies
   - Check that all imports use `.js` extensions

2. **Token tables don't exist**
   - Run the SQL migration script manually
   - Check database connection settings

3. **Emails not sending**
   - Verify `RESEND_API_KEY` is set correctly
   - Check the API endpoint logs for error details
   - Test with the `/api/send-auth-email` endpoint

4. **PocketBase still sending emails**
   - Ensure `pb_hooks/main.pb.js` is renamed/disabled
   - Restart PocketBase if needed

### Logs to Check

```bash
# SvelteKit logs will show:
✅ password-reset email sent successfully to user@example.com
✅ Email verified successfully for user: user@example.com
✅ Welcome email sent to user@example.com

# PocketBase logs should show:
=== PocketBase Email Hooks DISABLED ===
Authentication emails are now handled by SvelteKit app
```

## 🚀 Next Steps

1. **Test thoroughly** in development
2. **Deploy** the changes to production
3. **Monitor** email delivery and user feedback
4. **Consider** adding email preferences/unsubscribe options
5. **Optimize** email templates based on user engagement 