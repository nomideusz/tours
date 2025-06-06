# PocketBase to PostgreSQL Migration - Next Steps

## ✅ Completed Steps
1. **Database Setup** - PostgreSQL connection configured
2. **Schema Creation** - All tables created with proper relationships
3. **Lucia Authentication** - Set up with Argon2 password hashing
4. **Migration Script** - Created script to migrate data from PocketBase

## 📋 Next Steps

### 1. **Run Data Migration**
First, ensure your PostgreSQL database is running and set environment variables:

```bash
# Set environment variables for migration
export POCKETBASE_URL=https://z.xeon.pl
export POCKETBASE_ADMIN_EMAIL=your-admin-email
export POCKETBASE_ADMIN_PASSWORD=your-admin-password

# Run the migration script
pnpm tsx scripts/migrate-from-pocketbase.ts
```

**Note**: All users will get a temporary password (their email address) and will need to reset passwords.

### 2. **Update Environment Variables**
Add these to your `.env` file:

```bash
# Database Configuration
DATABASE_URL=postgresql://zaur_dev:zaur_dev_password@localhost:5432/zaur_local
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your-password
DATABASE_NAME=zaur_local
DATABASE_SSL=false

# Remove or comment out PocketBase variables once migration is complete
# PUBLIC_POCKETBASE_URL=https://z.xeon.pl
```

### 3. **Update Authentication Routes**
The following routes need to be updated to use Lucia:

- [x] `/auth/login` - Already updated
- [ ] `/auth/register` - Create new user with Lucia
- [ ] `/auth/logout` - Clear Lucia session
- [ ] `/auth/forgot-password` - Implement password reset
- [ ] `/auth/reset-password` - Handle password reset
- [ ] `/auth/verify` - Email verification

### 4. **Update API Endpoints**
Convert API endpoints from PocketBase to Drizzle queries:

**High Priority:**
- [ ] `/api/dashboard-stats` - Tour guide dashboard
- [ ] `/api/bookings/*` - Booking management
- [ ] `/api/payments/*` - Payment processing
- [ ] `/api/qr/*` - QR code scanning

**Medium Priority:**
- [ ] `/api/auth/sync` - Remove or update
- [ ] `/api/early-access` - Update to use new DB
- [ ] `/api/send-booking-email` - Update email sending

### 5. **Update Server Hooks**
Currently `src/hooks.server.ts` uses PocketBase. You need to:

1. **Transition Approach** (Recommended during migration):
   - Keep PocketBase for now
   - Add Lucia session validation alongside
   - Gradually move routes to use Lucia
   - Remove PocketBase once all routes migrated

2. **Or Full Switch** (After testing):
   - Replace PocketBase auth with Lucia completely
   - Update all `locals.pb` references to use `locals.user`

### 6. **Update Frontend Components**
Components that check authentication state need updates:
- Navigation components checking `$page.data.user`
- Protected route guards
- User profile displays

### 7. **Image Migration**
Currently images point to PocketBase URLs. Options:
1. **Keep PocketBase** as file storage (easiest short-term)
2. **Migrate to S3/Cloudflare R2** (recommended long-term)
3. **Use local storage** (not recommended for production)

### 8. **Testing Checklist**
- [ ] User registration flow
- [ ] Login/logout functionality
- [ ] Password reset flow
- [ ] Tour creation and editing
- [ ] Booking process
- [ ] QR code generation and scanning
- [ ] Payment processing
- [ ] Email notifications

### 9. **Production Deployment**
1. Set up PostgreSQL on production (e.g., Supabase, Neon, Railway)
2. Run migrations on production database
3. Update environment variables
4. Deploy updated application
5. Monitor for issues

## 🚨 Important Considerations

### Data Integrity
- Backup PocketBase data before migration
- Test migration on staging environment first
- Keep PocketBase running until fully migrated

### Session Management
- Users will need to log in again after migration
- Consider sending password reset emails to all users

### Stripe Integration
- Verify Stripe webhooks still work
- Update webhook endpoints if needed
- Test payment flows thoroughly

### Performance
- Add database indexes for frequently queried fields
- Consider connection pooling for production
- Monitor query performance

## 🛠️ Troubleshooting

### Common Issues:
1. **Module not found errors**: Restart dev server after changes
2. **Type errors**: Run `pnpm run check` to update types
3. **Database connection**: Check PostgreSQL is running and credentials are correct
4. **Migration fails**: Check PocketBase credentials and data format

### Rollback Plan:
Keep PocketBase instance running until you're confident in the migration. You can switch back by:
1. Reverting code changes
2. Updating environment variables
3. Redeploying previous version 