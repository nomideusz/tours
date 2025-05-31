# Custom Email Templates for PocketBase

This directory contains custom email templates that override PocketBase's default email templates using PocketBase's JavaScript hooks and template rendering system.

## File Structure

```
pb_hooks/
├── main.pb.js              # Main hook file with email logic
├── views/
│   ├── layout.html         # Base email layout template
│   ├── reset-password.html # Password reset email template
│   ├── verification.html   # Email verification template
│   └── welcome.html        # Welcome email template (optional)
└── README.md               # This documentation
```

## Templates

### 1. Reset Password Email (`reset-password.html`)
- **Trigger**: When a user requests a password reset
- **Features**: 
  - Security notice with expiration time
  - Request details (time, email)
  - Prominent reset button
  - Alternative text link for accessibility
  - Proper URL format for SvelteKit routing

### 2. Email Verification (`verification.html`)
- **Trigger**: When a new user registers and needs to verify their email
- **Features**: 
  - Welcome message for new users
  - Benefits of verification
  - Green verification button
  - Tour-specific benefits listed

### 3. Welcome Email (`welcome.html`)
- **Trigger**: When a user's account is fully verified
- **Features**: 
  - Celebration of successful registration
  - Tour platform features overview
  - Call-to-action to start exploring
  - Social media follow encouragement

## Configuration

### Current Setup

This configuration is set up for:
- **PocketBase**: `https://z.xeon.pl`
- **App**: `https://zaur.app`
- **App Name**: "Zaur"

### Environment Variables

Set these environment variables in your PocketBase setup:

```bash
APP_URL=https://zaur.app        # Your app's public URL  
NODE_ENV=production             # Set to 'development' for testing
```

### Customization

1. **App Name**: Update the `APP_NAME` constant in `main.pb.js` (currently set to "Zaur")
2. **Styling**: Modify the CSS in `layout.html` to match your brand
3. **Content**: Edit the template files to customize messaging
4. **URLs**: Ensure the URL generation in `main.pb.js` matches your routing

## Template Data Available

Each template receives the following data:

```javascript
{
  appName: "Zaur",                   // Your app name
  userName: "User Display Name",     // User's name or username
  userEmail: "user@example.com",     // User's email address
  resetUrl: "https://zaur.app/auth/reset-password?token=...",     // Password reset URL (reset emails only)
  verificationUrl: "https://zaur.app/auth/verify?token=...",      // Verification URL (verification emails only)
  appUrl: "https://zaur.app",        // Your app's base URL (welcome emails)
  requestTime: "December 15, 2024..."// Formatted request timestamp
}
```

## Template Syntax

These templates use Go's `html/template` syntax:

- `{{.variableName}}` - Display a variable
- `{{block "blockName" .}}default{{end}}` - Define a block with default content
- `{{define "blockName"}}content{{end}}` - Define block content
- `{{.variable|raw}}` - Display unescaped HTML content

## Testing Templates

### Development Preview

Visit these URLs in development to preview your templates:

- Reset Password: `https://z.xeon.pl/dev/test-email/reset`
- Verification: `https://z.xeon.pl/dev/test-email/verification`
- Welcome: `https://z.xeon.pl/dev/test-email/welcome`

**Note**: These test routes only work when `NODE_ENV` is not set to "production".

### Production Testing

1. Create a test user account
2. Trigger actual password reset or verification flows
3. Check PocketBase logs for custom email sending confirmations

## Email Delivery

The custom templates use PocketBase's `$mails.send()` function, which respects your PocketBase SMTP configuration. Make sure you have configured your SMTP settings in PocketBase admin panel.

## Fallback Behavior

If custom template rendering fails:
- The error is logged to console
- The default PocketBase email template is used as fallback
- The user's workflow is not interrupted

## URL Routing

The templates generate URLs that work with your SvelteKit routing:

- **Reset Password**: `/auth/reset-password?token={TOKEN}`
- **Verification**: `/auth/verify?token={TOKEN}`

Make sure these routes exist in your SvelteKit app and handle the token parameter correctly.

## Troubleshooting

### Templates Not Loading
1. Check file paths in `main.pb.js`
2. Ensure `pb_hooks` directory is in the same directory as your PocketBase executable
3. Check PocketBase logs for template loading errors

### Emails Not Sending
1. Verify SMTP configuration in PocketBase admin
2. Check console logs for custom email errors
3. Confirm environment variables are set correctly

### Styling Issues
1. Email clients have limited CSS support - use inline styles
2. Test with multiple email clients (Gmail, Outlook, Apple Mail)
3. Use web-safe fonts and colors

## Advanced Customization

### Adding New Email Types
1. Create a new template file in `views/`
2. Add a corresponding hook in `main.pb.js`
3. Define the template data structure
4. Test with the development preview route

### Conditional Content
Use Go template syntax for conditional content:

```html
{{if .userVerified}}
  <p>Welcome back, verified user!</p>
{{else}}
  <p>Please verify your email first.</p>
{{end}}
```

### Internationalization
You can add language support by:
1. Creating language-specific template files
2. Detecting user language in the hook
3. Loading the appropriate template file

## Security Considerations

- Templates automatically escape HTML for security
- Use `|raw` filter only for trusted content
- Tokens in URLs are handled securely by PocketBase
- Email links expire automatically per PocketBase configuration 