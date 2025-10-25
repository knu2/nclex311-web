# Xendit Sandbox Setup Guide

This guide will walk you through setting up a Xendit sandbox account for testing the premium subscription workflow.

## Step 1: Create Xendit Account

1. **Navigate to Xendit Registration**
   - Open [https://dashboard.xendit.co/register](https://dashboard.xendit.co/register)
   - Or go to [xendit.co](https://xendit.co) and click "Sign Up"

2. **Complete Registration Form**
   - Business Email: Use your work/personal email
   - Password: Choose a strong password
   - Business Name: Enter "NCLEX311" or your company name
   - Country: Select "Philippines"
   - Click "Create Account"

3. **Verify Email**
   - Check your email inbox for verification link
   - Click the verification link to activate your account

## Step 2: Complete Business Profile (Optional for Sandbox)

You may be prompted to complete your business profile. For sandbox testing, you can:
- Skip or provide minimal information
- Use test business details
- Note: Full verification is only needed for production API keys

## Step 3: Get API Keys

1. **Navigate to API Keys**
   - Log in to [dashboard.xendit.co](https://dashboard.xendit.co)
   - Click **Settings** (gear icon) in the left sidebar
   - Select **Developers** → **API Keys**

2. **Switch to Test Mode**
   - Look for a toggle/dropdown that says **"Test"** or **"Live"**
   - Make sure you're in **TEST MODE** (this is important!)
   - Test mode keys are safe for development and won't process real money

3. **Copy Your Test Secret Key**
   - You should see a key starting with `xnd_development_`
   - Click the **eye icon** to reveal the full key
   - Click **Copy** or manually select and copy
   - **Keep this key secure** - treat it like a password

4. **Add to Your Environment File**
   ```bash
   cd /Users/knu2/Dev/nclex311-bmad/apps/web
   
   # Edit .env.local
   nano .env.local  # or use your preferred editor
   
   # Add this line (replace with your actual key):
   XENDIT_SECRET_KEY=xnd_development_YOUR_ACTUAL_KEY_HERE
   ```

## Step 4: Generate Webhook Verification Token

1. **Navigate to Callbacks/Webhooks**
   - In Xendit Dashboard, go to **Settings** → **Developers** → **Callbacks**
   - Or **Settings** → **Developers** → **Webhooks** (terminology varies)

2. **Generate Verification Token**
   - Look for "Callback Verification Token" or "Webhook Token"
   - Click **Generate Token** or **Show Token**
   - Copy the token (it will be a random string)

3. **Add to Environment File**
   ```bash
   # Add to .env.local:
   XENDIT_WEBHOOK_TOKEN=YOUR_WEBHOOK_TOKEN_HERE
   ```

## Step 5: Configure Webhook URL (For Local Testing)

For local development, Xendit needs to send webhooks to your machine. You have two options:

### Option A: Use ngrok (Recommended for Active Testing)

1. **Install ngrok**
   ```bash
   # macOS with Homebrew
   brew install ngrok
   
   # Or download from https://ngrok.com/download
   ```

2. **Start ngrok**
   ```bash
   # Start your Next.js app first
   npm run dev
   
   # In a new terminal, expose port 3000
   ngrok http 3000
   ```

3. **Copy ngrok URL**
   - ngrok will display a forwarding URL like: `https://abcd1234.ngrok.io`
   - Copy this URL

4. **Configure in Xendit Dashboard**
   - Go to **Settings** → **Developers** → **Callbacks**
   - Find "Invoice Paid" or "Payment Callbacks"
   - Set Webhook URL to: `https://YOUR-NGROK-URL.ngrok.io/api/webhooks/xendit`
   - Example: `https://abcd1234.ngrok.io/api/webhooks/xendit`
   - Click **Save**

### Option B: Skip Webhook Setup (Manual Testing)

If you don't need real-time webhook testing:
- Leave webhook URL blank for now
- You can manually test payment status by checking the Xendit Dashboard
- Webhooks are only needed for automatic subscription activation

## Step 6: Verify Environment Setup

Check that all required environment variables are configured:

```bash
cd /Users/knu2/Dev/nclex311-bmad/apps/web

# View your environment file (DO NOT commit this file!)
cat .env.local | grep -E "XENDIT|EMAIL"
```

You should see:
```
XENDIT_SECRET_KEY=xnd_development_xxxxx
XENDIT_WEBHOOK_TOKEN=xxxxx
SENDGRID_API_KEY=SG.xxxxx (if email configured)
EMAIL_FROM=noreply@yourdomain.com (if email configured)
```

## Step 7: Restart Development Server

After adding environment variables:

```bash
# Stop the current dev server (Ctrl+C)
# Then restart
npm run dev
```

## Step 8: Test Payment Flow

1. **Create Test User**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - Sign up or log in

2. **Access Premium Content**
   - Try to access Chapter 5, 6, 7, or 8
   - You should see an "Upgrade to Premium" prompt

3. **Select Plan**
   - Choose either Monthly (₱200/month) or Annual (₱1,920/year)
   - Click "Checkout"

4. **Complete Test Payment**
   - You'll be redirected to Xendit's test checkout page
   - Use these test card details:

   **Successful Payment:**
   - Card Number: `4000000000000002`
   - CVV: Any 3 digits (e.g., `123`)
   - Expiry: Any future date (e.g., `12/26`)
   - Name: Any name

   **Failed Payment (for testing):**
   - Card Number: `4000000000000010`

5. **Verify Subscription Activation**
   - After payment, you should be redirected to success page
   - Check your account - you should now have premium access
   - Try accessing Chapter 5-8 content

## Test Cards and Payment Methods

### Credit/Debit Cards
| Scenario | Card Number | Result |
|----------|-------------|---------|
| Success | `4000000000000002` | Payment succeeds |
| Declined | `4000000000000010` | Payment fails |
| 3DS Challenge | `4000000000000028` | Requires 3DS authentication |

### E-Wallets (Sandbox)
- GCash: Xendit provides test credentials in sandbox
- Maya/PayMaya: Xendit provides test credentials in sandbox
- Check Xendit Dashboard → Documentation for current test accounts

## Troubleshooting

### "Invalid API Key" Error

**Problem**: API calls fail with authentication error

**Solution**:
- Verify you copied the complete key (starts with `xnd_development_`)
- Ensure no extra spaces or line breaks
- Confirm you're using the TEST key, not LIVE key
- Restart dev server after adding key

### Webhook Not Received

**Problem**: Payment succeeds but subscription doesn't activate

**Solution**:
1. Check ngrok is running: `ngrok http 3000`
2. Verify webhook URL in Xendit Dashboard includes `/api/webhooks/xendit`
3. Check webhook logs in Xendit Dashboard → Developers → Webhooks
4. View your app logs for webhook processing errors

### "Invoice Creation Failed"

**Problem**: Cannot create payment invoice

**Solution**:
- Verify Xendit secret key is in `.env.local`
- Check internet connection
- Ensure you're in test mode
- Check browser console for API errors

### Payment Page Not Loading

**Problem**: Redirect to Xendit fails or page doesn't load

**Solution**:
- Check that `NEXT_PUBLIC_APP_URL` is set in `.env.local`
- Verify network connectivity
- Try a different browser
- Check Xendit Dashboard → Invoices to see if invoice was created

## Next Steps

Once you have Xendit configured:

1. **Optional**: Set up SendGrid for email confirmations
   - See README.md → Payment Gateway Setup → Email Service Setup
   
2. **Test Different Scenarios**:
   - Monthly subscription
   - Annual subscription
   - Payment failure handling
   - Subscription cancellation (monthly only)

3. **Production Setup** (when ready):
   - Complete Xendit business verification
   - Link bank account for settlements
   - Replace test keys with production keys
   - Update webhook URLs to production domain

## Security Reminders

- ❌ **NEVER commit** `.env.local` to git
- ❌ **NEVER share** your secret keys publicly
- ✅ **ALWAYS use** test keys for development
- ✅ **ROTATE keys** if accidentally exposed

## Additional Resources

- [Xendit API Documentation](https://developers.xendit.co/api-reference/)
- [Xendit Test Credentials](https://developers.xendit.co/api-reference/#test-scenarios)
- [Xendit Dashboard](https://dashboard.xendit.co)
- Project Documentation: `docs/architecture/xendit-payment-integration.md`

---

**Need Help?**  
Check the troubleshooting section in README.md or review application logs for detailed error messages.
