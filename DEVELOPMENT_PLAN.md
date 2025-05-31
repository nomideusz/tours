# 🗺 Zaur Development Plan - Complete Roadmap

## 📋 Project Overview
**Goal:** Build a QR-code booking system for independent tour guides using SvelteKit 5 with runes
**Timeline:** 4-6 weeks to MVP
**Target:** Launch with 10-20 beta tour guides

---

## 🛠 Phase 0: Project Setup & Foundation (Week 1, Days 1-2)

### Setup Instructions for Cursor/Claude:

```bash
# Project initialization prompt for Claude:
"Create a new SvelteKit project with the following requirements:
- SvelteKit 5 with Svelte 5 runes
- TypeScript configuration
- Tailwind CSS for styling
- Pocketbase for database and authentication
- Stripe for payments
- QR code generation library
- Email service integration
- PWA configuration for mobile-first experience

Please set up the complete project structure with all configuration files."
```

### Expected File Structure:
```
zaur/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   ├── server/
│   │   ├── stores/
│   │   └── utils/
│   ├── routes/
│   │   ├── (app)/
│   │   ├── (auth)/
│   │   ├── api/
│   │   └── qr/
│   └── app.html
├── static/
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

### Environment Variables Setup:
```env
DATABASE_URL=
AUTH_SECRET=
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
EMAIL_SERVER=
EMAIL_FROM=
PUBLIC_APP_URL=
```

**Acceptance Criteria:**
- [X] Project runs locally with `pnpm dev`
- [X] Tailwind CSS working
- [X] TypeScript compilation successful

---

## 🗄 Phase 1: Database Design & Schema (Week 1, Days 2-3)

### Claude Prompt for Database Schema:
```
"Design a comprehensive schema for the Zaur tour booking system with the following entities:

1. User (tour guides) - authentication, profile, stripe account
2. Tour - tour types offered by guides (name, description, price, duration)
3. TimeSlot - available time slots for each tour
4. Booking - customer bookings with status tracking
5. QRCode - generated QR codes for tours with analytics
6. Customer - customer information from bookings
7. Payment - payment tracking and status

Include proper relationships, indexes, and constraints. Add created/updated timestamps."
```

### Expected Schema Structure:
// User model for tour guides
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String
  businessName  String?
  stripeAccountId String?
  tours         Tour[]
  qrCodes       QRCode[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

// Continue with other models...
```

**Acceptance Criteria:**
- [X] Schema compiles without errors
- [X] Database migration runs successfully
- [X] All relationships properly defined
- [X] Proper indexing for performance

---

## 🔐 Phase 2: Authentication System (Week 1, Days 3-4)

### Claude Prompt for Auth Implementation:
```
"Implement authentication for Zaur with the following requirements:

1. Email/password authentication for tour guides
2. Google OAuth as alternative login
3. Protected routes middleware
4. User session management with Svelte 5 runes
5. Registration flow with email verification
6. Password reset functionality
7. User profile management

Create all necessary route handlers, components, and stores using Svelte 5 syntax."
```

### Key Files to Create:
- `src/hooks.server.ts` - Auth handling
- `src/lib/server/auth.ts` - Auth configuration
- `src/lib/stores/auth.svelte.ts` - Auth store with runes
- `src/routes/(auth)/login/+page.svelte`
- `src/routes/(auth)/register/+page.svelte`
- `src/routes/(auth)/forgot-password/+page.svelte`

**Acceptance Criteria:**
- [X] User can register and receive verification email
- [X] Login/logout works correctly
- [X] Protected routes redirect to login
- [X] Auth state persists across page refreshes
- [X] Password reset flow functional

---

## 🎯 Phase 3: Core Tour Management (Week 1, Day 5 - Week 2, Day 2)

### Claude Prompt for Tour Management:
```
"Build the core tour management system with the following features:

1. Tour CRUD operations (Create, Read, Update, Delete)
2. Tour form with validation (name, description, price, duration, capacity)
3. Image upload for tours
4. Time slot management (recurring schedules, one-off slots)
5. Availability calendar view
6. Tour listing dashboard
7. Mobile-responsive design with Svelte 5 runes for state management

Use TypeScript throughout and implement proper error handling."
```

### Components to Build:
- `TourForm.svelte` - Create/edit tours
- `TourCard.svelte` - Display tour info
- `TourList.svelte` - Dashboard view
- `TimeSlotManager.svelte` - Manage availability
- `Calendar.svelte` - Visual calendar
- `ImageUpload.svelte` - Handle tour images

### API Routes:
- `src/routes/api/tours/+server.ts` - CRUD operations
- `src/routes/api/tours/[id]/+server.ts` - Individual tour
- `src/routes/api/tours/[id]/timeslots/+server.ts` - Time slots
- `src/routes/api/upload/+server.ts` - Image upload

**Acceptance Criteria:**
- [ ] Tour guides can create tours with all details
- [ ] Time slots can be set for recurring schedules
- [ ] Calendar shows availability clearly
- [ ] Mobile interface works smoothly
- [ ] Image upload and display functional

---

## 📱 Phase 4: QR Code System (Week 2, Days 2-4)

### Claude Prompt for QR Implementation:
```
"Implement the QR code system with these requirements:

1. Generate unique QR codes for each tour
2. QR code leads to mobile-optimized booking page
3. Track QR code scans and analytics
4. Downloadable QR codes in multiple formats (PNG, SVG, PDF)
5. Custom QR code styling with tour guide branding
6. QR code management dashboard
7. URL structure: zaur.app/book/[qr-code-id]

Include proper error handling for invalid QR codes and mobile optimization."
```

### Key Components:
- `QRGenerator.svelte` - Generate and customize QR codes
- `QRList.svelte` - Manage existing QR codes
- `QRAnalytics.svelte` - View scan statistics
- `BookingPage.svelte` - Mobile booking interface

### Unique Features:
- Custom branding (colors, logo overlay)
- Download in multiple formats
- Usage analytics (scans, conversions)
- A/B testing different QR designs

**Acceptance Criteria:**
- [ ] QR codes generate correctly for each tour
- [ ] Scanning leads to proper booking page
- [ ] Mobile booking page is optimized
- [ ] Analytics track scans and conversions
- [ ] Multiple download formats available

---

## 💳 Phase 5: Booking & Payment System (Week 2, Day 4 - Week 3, Day 2)

### Claude Prompt for Booking System:
```
"Build the complete booking and payment system:

1. Mobile-optimized booking flow from QR code scan
2. Customer information collection (name, email, phone)
3. Time slot selection with real-time availability
4. Stripe payment integration (one-time payments)
5. Booking confirmation emails
6. Tour guide notification system
7. Booking management dashboard for guides
8. Customer booking lookup/modification

Ensure PCI compliance and handle payment failures gracefully."
```

### Booking Flow:
1. **QR Scan** → Booking page with tour details
2. **Select Time** → Show available slots
3. **Customer Info** → Collect details
4. **Payment** → Stripe checkout
5. **Confirmation** → Email + SMS notifications
6. **Dashboard** → Booking appears in guide's calendar

### Key Files:
- `src/routes/book/[qrId]/+page.svelte` - Main booking page
- `src/routes/api/bookings/+server.ts` - Booking creation
- `src/routes/api/payments/+server.ts` - Payment handling
- `src/routes/api/webhooks/stripe/+server.ts` - Stripe webhooks
- `BookingCalendar.svelte` - Guide's booking calendar
- `BookingDetails.svelte` - Individual booking view

**Acceptance Criteria:**
- [ ] Complete booking flow works on mobile
- [ ] Payments process correctly via Stripe
- [ ] Confirmation emails sent automatically
- [ ] Real-time availability updates
- [ ] Guides can view and manage bookings

---

## 📊 Phase 6: Dashboard & Analytics (Week 3, Days 2-4)

### Claude Prompt for Dashboard:
```
"Create a comprehensive dashboard for tour guides with:

1. Revenue analytics (daily, weekly, monthly)
2. Booking statistics and trends
3. QR code performance metrics
4. Customer insights and repeat bookings
5. Upcoming tours calendar view
6. Quick actions (generate QR, create tour, view bookings)
7. Mobile-responsive with progressive web app features

Use charts/graphs for data visualization and real-time updates."
```

### Dashboard Components:
- `Dashboard.svelte` - Main dashboard layout
- `RevenueChart.svelte` - Earnings visualization
- `BookingStats.svelte` - Booking metrics
- `QRPerformance.svelte` - QR analytics
- `UpcomingTours.svelte` - Today's schedule
- `QuickActions.svelte` - Fast access buttons

**Acceptance Criteria:**
- [ ] Real-time revenue and booking data
- [ ] Visual charts show trends clearly
- [ ] Mobile dashboard works offline (PWA)
- [ ] Quick actions for common tasks
- [ ] Performance metrics help optimize marketing

---

## 🔔 Phase 7: Notifications & Communication (Week 3, Day 4 - Week 4, Day 1)

### Claude Prompt for Notifications:
```
"Implement comprehensive notification system:

1. Email notifications (booking confirmations, reminders, updates)
2. SMS notifications for time-sensitive updates
3. In-app notifications for tour guides
4. Automated reminder sequences (24h, 2h before tour)
5. Cancellation and rescheduling notifications
6. WhatsApp integration for customer communication
7. Email templates with branding customization

Include notification preferences and opt-out mechanisms."
```

### Notification Types:
- **Customer**: Booking confirmation, reminders, updates
- **Guide**: New booking, cancellation, payment received
- **Automated**: Weather alerts, tour reminders
- **Marketing**: Follow-up for reviews, repeat bookings

**Acceptance Criteria:**
- [ ] All notification types work reliably
- [ ] Templates are mobile-friendly
- [ ] Customers can manage preferences
- [ ] Delivery status tracking
- [ ] Integration with WhatsApp/SMS providers

---

## 🎨 Phase 8: Branding & Customization (Week 4, Days 1-2)

### Claude Prompt for Branding:
```
"Add customization features for tour guides:

1. Custom branding (logo, colors, fonts)
2. Personalized booking pages
3. Custom QR code designs
4. Email template customization
5. Business information management
6. Social media integration
7. Review collection and display

Ensure all customizations work across mobile and desktop."
```

### Customization Features:
- Logo upload and positioning
- Color scheme selection
- Custom domain support (future)
- Branded email templates
- Social media links
- Review widgets

**Acceptance Criteria:**
- [ ] Guides can upload and customize branding
- [ ] Booking pages reflect custom branding
- [ ] QR codes include branding elements
- [ ] Email templates use custom styling

---

## 🚀 Phase 9: Testing & Optimization (Week 4, Days 2-4)

### Testing Strategy:
```
"Implement comprehensive testing:

1. Unit tests for critical functions
2. Integration tests for booking flow
3. E2E tests with Playwright
4. Performance testing and optimization
5. Mobile device testing (iOS/Android)
6. Payment flow testing (test mode)
7. Security audit and penetration testing

Focus on the complete user journey from QR scan to booking completion."
```

### Test Cases:
- QR code generation and scanning
- Complete booking flow
- Payment processing
- Email delivery
- Mobile responsiveness
- Error handling
- Edge cases (sold out tours, expired QR codes)

**Acceptance Criteria:**
- [ ] 95%+ test coverage for critical paths
- [ ] All user flows tested end-to-end
- [ ] Performance meets mobile standards
- [ ] Security vulnerabilities addressed
- [ ] Cross-browser compatibility verified

---

## 🌐 Phase 10: Deployment & Launch (Week 4, Days 4-5)

### Claude Prompt for Deployment:
```
"Set up production deployment with:

1. Vercel deployment configuration
2. Production database (PlanetScale or Supabase)
3. Environment variable management
4. Custom domain setup (zaur.app)
5. SSL certificates and security headers
6. Analytics integration (Google Analytics, Hotjar)
7. Error monitoring (Sentry)
8. Backup and monitoring systems

Include staging environment for testing."
```

### Deployment Checklist:
- [ ] Production database configured
- [ ] Environment variables set
- [ ] Custom domain pointing correctly
- [ ] SSL certificate active
- [ ] Analytics tracking implemented
- [ ] Error monitoring active
- [ ] Backup systems in place
- [ ] Performance monitoring enabled

---

## 📈 Phase 11: Beta Launch & Iteration (Week 5-6)

### Beta Launch Strategy:
1. **Recruit 10-20 beta tour guides** from validation list
2. **Onboard personally** with 1-on-1 calls
3. **Monitor usage** and collect feedback
4. **Weekly iterations** based on feedback
5. **Document issues** and feature requests
6. **Prepare for public launch**

### Success Metrics:
- **Active users**: 80% of beta guides use weekly
- **Bookings**: 50+ bookings through the platform
- **Revenue**: €500+ processed for guides
- **NPS Score**: 8+ from beta users
- **Retention**: 70%+ monthly retention

---

## 🛠 Development Best Practices

### For Cursor/Claude Implementation:

1. **Break into small prompts**: Each phase can be broken into 2-3 Claude prompts
2. **Use specific file names**: Always specify exact file paths
3. **Include error handling**: Ask Claude to include proper error handling
4. **Test incrementally**: Test each feature before moving to next
5. **Mobile-first**: Always emphasize mobile optimization
6. **TypeScript strict**: Use strict TypeScript throughout

### Sample Prompt Format:
```
"I'm building [specific feature] for Zaur. 

Requirements:
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

Technical specs:
- SvelteKit 5 with runes
- TypeScript
- Tailwind CSS
- File: src/[specific-path]

Please implement with proper error handling and mobile optimization."
```

---

## 📋 Weekly Milestones

### Week 1: Foundation
- ✅ Project setup complete
- ✅ Database schema implemented
- ✅ Authentication working
- ✅ Basic tour management

### Week 2: Core Features
- ✅ QR code generation
- ✅ Mobile booking flow
- ✅ Payment integration
- ✅ Email notifications

### Week 3: Polish
- ✅ Dashboard analytics
- ✅ Advanced notifications
- ✅ Branding customization
- ✅ Performance optimization

### Week 4: Launch
- ✅ Comprehensive testing
- ✅ Production deployment
- ✅ Beta user onboarding
- ✅ Initial feedback collection

---

## 🎯 Success Criteria

### Technical:
- **Performance**: Page load < 2s on mobile
- **Reliability**: 99.9% uptime
- **Security**: PCI compliance for payments
- **Mobile**: PWA with offline capabilities

### Business:
- **User Satisfaction**: NPS > 8
- **Conversion**: 10%+ QR scan to booking
- **Revenue**: €1000+ monthly recurring revenue
- **Growth**: 20% month-over-month user growth

---

## 🔄 Post-Launch Roadmap

### Month 2-3: Optimization
- A/B testing on booking conversion
- Advanced analytics and reporting
- Integration with popular tools (Airbnb, etc.)
- Multi-language support

### Month 4-6: Scale
- White-label solutions for tour agencies
- Advanced marketing tools
- API for third-party integrations
- Enterprise features

### Month 7-12: Expansion
- New verticals (activities, experiences)
- Marketplace features
- International markets
- Advanced AI features

---

This plan provides a clear roadmap that can be executed with Cursor + Claude LLM by breaking each phase into specific, actionable prompts. Each phase builds on the previous one and includes clear acceptance criteria for validation.