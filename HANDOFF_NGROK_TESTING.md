# Handoff: Test Premium Subscription with ngrok

## Context
Story 2.1 (Premium Subscription Workflow) is 95% complete. All integration work is done - upgrade page, session management, APIs, and payment flow are working. We successfully tested payment up to Xendit checkout, but need to test the webhook activation flow with ngrok.

## Current Status
- ✅ Database migrated (orders, webhook_logs, user subscription fields)
- ✅ Upgrade page created at `/upgrade`
- ✅ Session includes subscription status
- ✅ Payment APIs functional
- ✅ Xendit integration working (invoice creation tested)
- ✅ Email service implemented
- ⚠️ Webhook needs local testing with ngrok

## What Needs Testing
Test the complete payment flow with webhook activation:
1. Set up ngrok to expose local dev server
2. Configure ngrok URL in Xendit dashboard
3. Create test user and initiate payment
4. Complete payment in Xendit sandbox
5. Verify webhook receives payment notification
6. Confirm subscription activates in database
7. Verify email confirmation sent
8. Check premium access granted in UI
9. Test session refresh shows premium status

## Environment Info
- **Project**: NCLEX 311 - Premium Subscription (Story 2.1)
- **Directory**: `/Users/knu2/Dev/nclex311-bmad`
- **Dev Server**: `npm run dev` (port 3000)
- **Database**: Supabase (already migrated)
- **Payment Gateway**: Xendit (test mode)
- **Xendit Keys**: Already configured in `apps/web/.env.local`

## Key Files
- Webhook handler: `apps/web/src/app/api/webhooks/xendit/route.ts`
- Upgrade page: `apps/web/src/app/upgrade/page.tsx`
- Session config: `apps/web/src/app/api/auth/[...nextauth]/route.ts`
- Email service: `apps/web/src/lib/email.ts`

## Documentation
- Setup guide: `docs/XENDIT_SANDBOX_SETUP.md` (Step 5 explains ngrok)
- Gaps analysis: `docs/stories/2.1-development-gaps.md`
- Completion summary: `docs/stories/2.1-completion-summary.md`
- Story document: `docs/stories/2.1.premium-subscription-workflow.md`

## Test Credentials
- **Test User**: `testpremium@example.com` / `TestPass123!` (already created)
- **Test Card**: `4000000000000002` (Xendit sandbox success card)
- **CVV**: `123`
- **Expiry**: `12/26`

## Known Working
- Invoice creation ✅
- Xendit checkout ✅
- Payment with 3DS ✅
- Redirect to success page ✅
- Xendit webhook endpoint exists ✅

## What to Do
1. Start ngrok: `ngrok http 3000`
2. Copy ngrok HTTPS URL
3. Configure in Xendit Dashboard:
   - Go to: Settings → Developers → Callbacks
   - Set Invoice Paid webhook to: `https://YOUR-NGROK-URL.ngrok.io/api/webhooks/xendit`
4. Run dev server if not running: `npm run dev`
5. Test payment flow:
   - Login as `testpremium@example.com`
   - Go to `/upgrade`
   - Select plan and checkout
   - Complete payment
6. Monitor webhook in terminal logs
7. Verify subscription activation
8. Check email sent (if SendGrid configured)
9. Verify premium access in UI

## Success Criteria
- [ ] Webhook receives PAID notification
- [ ] Order status updated to 'paid' in database
- [ ] User subscription_status changed to 'premium'
- [ ] Subscription expiration date calculated correctly
- [ ] Auto-renew flag set based on plan type
- [ ] Confirmation email sent (if SendGrid configured)
- [ ] User sees premium access after payment
- [ ] Session shows subscriptionStatus: 'premium'
- [ ] Chapters 5-8 unlocked in UI

## Commands Reference
```bash
# Start ngrok
ngrok http 3000

# Start dev server (separate terminal)
npm run dev

# Check if dev server is running
curl http://localhost:3000/api/health

# Test webhook endpoint locally (after ngrok)
curl https://YOUR-NGROK-URL.ngrok.io/api/webhooks/xendit
```

## Troubleshooting
- If webhook 401: Check `XENDIT_WEBHOOK_TOKEN` in `.env.local`
- If webhook 404: Verify ngrok URL includes `/api/webhooks/xendit`
- If no webhook received: Check ngrok is running and URL in Xendit is correct
- If subscription not activated: Check terminal logs for webhook processing errors
- If session doesn't refresh: Try logging out and back in

## Next Steps After Success
Once webhook testing passes:
1. Document test results
2. Update story status to 100% complete
3. Prepare for production deployment
4. Configure Vercel environment variables

## Important Notes
- ngrok free tier URL changes on restart (need to update Xendit each time)
- Don't commit ngrok URL to code
- Test mode webhooks are sent immediately by Xendit
- Session may need manual refresh (logout/login) to see subscription status

---

**Ready to test?** Start by running `ngrok http 3000` and copy the HTTPS URL.
