# OAuth2 Setup Guide for Zaur App

This guide will help you set up OAuth2 authentication for your Zaur app using PocketBase.

## Overview

- **PocketBase URL**: `https://z.xeon.pl`
- **App URL**: `https://zaur.app`
- **Redirect URL**: `https://z.xeon.pl/api/oauth2-redirect`

## 1. Configure OAuth2 Providers

### Google OAuth2 Setup

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create or select a project**
3. **Enable Google+ API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. **Create OAuth2 credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "Zaur App"
   - Authorized redirect URIs: `https://z.xeon.pl/api/oauth2-redirect`
5. **Copy Client ID and Client Secret**

### GitHub OAuth2 Setup

1. **Go to GitHub Settings**: https://github.com/settings/developers
2. **Click "New OAuth App"**
3. **Fill in the details**:
   - Application name: "Zaur App"
   - Homepage URL: `https://zaur.app`
   - Authorization callback URL: `https://z.xeon.pl/api/oauth2-redirect`
4. **Copy Client ID and Client Secret**

### Microsoft OAuth2 Setup

1. **Go to Azure Portal**: https://portal.azure.com/
2. **Navigate to "Azure Active Directory" > "App registrations"**
3. **Click "New registration"**
4. **Fill in the details**:
   - Name: "Zaur App"
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: Web - `https://z.xeon.pl/api/oauth2-redirect`
5. **Copy Application (client) ID**
6. **Create a client secret**:
   - Go to "Certificates & secrets"
   - Click "New client secret"
   - Copy the secret value

## 2. Configure PocketBase

1. **Access PocketBase Admin**: `https://z.xeon.pl/_/`
2. **Go to Collections > users > Edit collection (⚙️ icon)**
3. **Click on "Options" tab**
4. **Scroll down to "OAuth2" section**
5. **Enable and configure each provider**:

### Google Configuration
- **Enabled**: ✅ Check
- **Client ID**: Paste from Google Cloud Console
- **Client Secret**: Paste from Google Cloud Console

### GitHub Configuration
- **Enabled**: ✅ Check
- **Client ID**: Paste from GitHub
- **Client Secret**: Paste from GitHub

### Microsoft Configuration
- **Enabled**: ✅ Check
- **Client ID**: Paste from Azure Portal
- **Client Secret**: Paste from Azure Portal

6. **Save the collection settings**

## 3. Test OAuth2 Integration

### Development Testing

1. **Start your SvelteKit app**: The OAuth2 buttons should appear on login/register pages
2. **Click on an OAuth2 provider button**
3. **Complete the OAuth2 flow in the popup**
4. **Verify successful authentication and redirect to `/tours`**

### Production Testing

1. **Deploy your app to `https://zaur.app`**
2. **Test OAuth2 login/registration**
3. **Check PocketBase logs for any errors**

## 4. Customization Options

### Update Available Providers

Edit `src/lib/oauth2.ts` and modify the `getAvailableOAuth2Providers()` function:

```typescript
export async function getAvailableOAuth2Providers(): Promise<OAuth2Provider[]> {
    // Return only the providers you've configured in PocketBase
    return ['google', 'github', 'microsoft'];
}
```

### Add More Providers

1. **Configure the provider in PocketBase** (Discord, Twitter, Facebook, etc.)
2. **Update the provider list** in `getAvailableOAuth2Providers()`
3. **Optionally update provider icons** in `oauth2Providers` object

### Custom Styling

Modify the OAuth2Button component (`src/lib/components/OAuth2Button.svelte`) to match your brand:

- Update colors in `oauth2Providers` object
- Change button styling
- Replace emoji icons with SVG icons

## 5. Security Considerations

### HTTPS Required
- OAuth2 requires HTTPS in production
- Your redirect URL must use HTTPS: `https://z.xeon.pl/api/oauth2-redirect`

### Domain Verification
- Ensure your OAuth2 apps are configured with the correct domains
- Google: Verify domain ownership if required
- GitHub: Ensure callback URL matches exactly

### User Data Handling
- OAuth2 providers may return additional user data (avatar, name, etc.)
- This data is automatically stored in PocketBase user records
- Review privacy implications and update your privacy policy

## 6. Troubleshooting

### Common Issues

**Popup Blocked**
- Users need to allow popups for your domain
- The OAuth2 function includes popup detection and user guidance

**Invalid Redirect URI**
- Ensure redirect URI in OAuth2 app matches: `https://z.xeon.pl/api/oauth2-redirect`
- Check for trailing slashes or typos

**CORS Issues**
- PocketBase handles CORS for OAuth2 redirects automatically
- Ensure your app domain is properly configured

**Provider Not Available**
- Check if the provider is enabled in PocketBase admin
- Verify Client ID and Secret are correctly entered
- Check provider-specific requirements (API enablement, domain verification)

### Debug Steps

1. **Check browser console** for JavaScript errors
2. **Check PocketBase logs** for OAuth2 errors
3. **Verify OAuth2 app configuration** in provider dashboards
4. **Test with different browsers** to rule out browser-specific issues

## 7. User Experience

### Successful OAuth2 Flow
1. User clicks OAuth2 button
2. Popup opens with provider's login page
3. User authenticates with provider
4. Popup closes automatically
5. User is redirected to `/tours` page
6. User data is stored in PocketBase

### Error Handling
- Invalid/expired tokens are handled gracefully
- Users receive clear error messages
- Fallback to email/password authentication is always available

## 8. Monitoring

### PocketBase Admin
- Monitor OAuth2 usage in PocketBase admin dashboard
- Check user records for OAuth2 data
- Review authentication logs

### Analytics
- Track OAuth2 vs email registration rates
- Monitor authentication success/failure rates
- Analyze user preferences by provider

---

## Quick Setup Checklist

- [ ] Create OAuth2 apps for desired providers
- [ ] Configure redirect URI: `https://z.xeon.pl/api/oauth2-redirect`
- [ ] Enable providers in PocketBase admin
- [ ] Add Client IDs and Secrets to PocketBase
- [ ] Test OAuth2 flow on development
- [ ] Deploy and test on production
- [ ] Update available providers list in code
- [ ] Monitor authentication metrics

Your OAuth2 authentication should now be fully functional! 🎉 