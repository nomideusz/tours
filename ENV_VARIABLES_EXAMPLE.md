# Environment Variables Configuration

## Required Environment Variables

Copy these to your `.env` file or configure in your hosting platform:

### Google Maps Integration
```bash
# Google Maps API Key (Public - exposed to client)
PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### Weather Integration  
```bash
# OpenWeatherMap API Key (Private - server-side only)
OPENWEATHER_API_KEY=your_openweather_api_key_here

# Optional: Make available to client for direct API calls
# PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key_here
```

### Database
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/zaur_db
```

### Stripe Payments
```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Application
```bash
PUBLIC_APP_URL=https://zaur.app
NODE_ENV=production
```

## Setup Instructions

See **GOOGLE_MAPS_WEATHER_SETUP.md** for detailed setup instructions.

## Security Notes

- Variables with `PUBLIC_` prefix are exposed to client-side code
- Keep server-side API keys private
- Never commit `.env` to version control
- Use environment variables in your hosting platform for production

