/**
 * Email service for NCLEX311 application
 * Handles transactional emails using SendGrid
 */

import type { SubscriptionPlanType } from './db/schema';

/**
 * Email configuration interface
 */
interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

/**
 * Premium confirmation email data
 */
export interface PremiumConfirmationData {
  userEmail: string;
  userName?: string;
  planType: SubscriptionPlanType;
  amount: number; // Amount paid in centavos
  paymentMethod?: string;
  orderId: string;
  subscriptionStartDate: Date;
  subscriptionExpiresAt: Date;
  autoRenew: boolean;
}

/**
 * Renewal reminder email data
 */
export interface RenewalReminderData {
  userEmail: string;
  userName?: string;
  amount: number; // Amount to be charged in centavos
  renewalDate: Date;
  subscriptionExpiresAt: Date;
  cancelUrl: string;
}

/**
 * SendGrid API request interface
 */
interface SendGridRequest {
  personalizations: Array<{
    to: Array<{ email: string; name?: string }>;
    subject: string;
  }>;
  from: { email: string; name: string };
  content: Array<{ type: string; value: string }>;
}

/**
 * Email service class
 */
export class EmailService {
  private config: EmailConfig;

  constructor() {
    this.config = this.validateAndLoadConfig();
  }

  /**
   * Validate environment variables and load configuration
   */
  private validateAndLoadConfig(): EmailConfig {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.EMAIL_FROM || 'noreply@nclex311.com';
    const fromName = process.env.EMAIL_FROM_NAME || 'NCLEX311';

    if (!apiKey) {
      throw new Error(
        'SENDGRID_API_KEY environment variable is required for email service'
      );
    }

    return {
      apiKey,
      fromEmail,
      fromName,
    };
  }

  /**
   * Send email via SendGrid API
   */
  private async sendEmail(request: SendGridRequest): Promise<void> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[EmailService] SendGrid API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(
          `SendGrid API error: ${response.status} ${response.statusText}`
        );
      }

      console.log('[EmailService] Email sent successfully');
    } catch (error: unknown) {
      console.error('[EmailService] Failed to send email:', error);
      // Don't throw - email failures should not break payment flow
      // Log error for monitoring
      if (error instanceof Error) {
        console.error(`[EmailService] Error details: ${error.message}`);
      }
    }
  }

  /**
   * Send premium subscription confirmation email
   */
  async sendPremiumConfirmationEmail(
    data: PremiumConfirmationData
  ): Promise<void> {
    const isMonthly = data.planType === 'monthly_premium';
    const planName = isMonthly ? 'Monthly Premium' : 'Annual Premium';
    const amountFormatted = this.formatCurrency(data.amount);

    const subject = `🎉 Welcome to NCLEX311 ${planName}!`;

    // Generate HTML email content based on plan type
    const htmlContent = isMonthly
      ? this.generateMonthlyConfirmationHTML(data, planName, amountFormatted)
      : this.generateAnnualConfirmationHTML(data, planName, amountFormatted);

    const request: SendGridRequest = {
      personalizations: [
        {
          to: [
            {
              email: data.userEmail,
              name: data.userName,
            },
          ],
          subject,
        },
      ],
      from: {
        email: this.config.fromEmail,
        name: this.config.fromName,
      },
      content: [
        {
          type: 'text/html',
          value: htmlContent,
        },
      ],
    };

    await this.sendEmail(request);
  }

  /**
   * Send renewal reminder email for monthly subscribers
   */
  async sendRenewalReminderEmail(data: RenewalReminderData): Promise<void> {
    const amountFormatted = this.formatCurrency(data.amount);
    const renewalDateFormatted = this.formatDate(data.renewalDate);

    const subject = `⏰ Your NCLEX311 Monthly Premium Renews in 3 Days`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Renewal Reminder</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">⏰ Renewal Reminder</h1>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      ${data.userName ? `Hi ${data.userName},` : 'Hi there,'}
    </p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Your <strong>NCLEX311 Monthly Premium</strong> subscription will automatically renew in <strong>3 days</strong> on <strong>${renewalDateFormatted}</strong>.
    </p>

    <div style="background: #f5f5f5; padding: 20px; border-radius: 6px; margin: 25px 0;">
      <h2 style="margin-top: 0; font-size: 18px; color: #667eea;">📋 Renewal Details</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: 500;">Amount:</td>
          <td style="padding: 8px 0; text-align: right;">${amountFormatted}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 500;">Renewal Date:</td>
          <td style="padding: 8px 0; text-align: right;">${renewalDateFormatted}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 500;">Next Expiration:</td>
          <td style="padding: 8px 0; text-align: right;">${this.formatDate(new Date(data.subscriptionExpiresAt.getTime() + 30 * 24 * 60 * 60 * 1000))}</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Your payment method will be charged automatically. No action is needed to continue your subscription.
    </p>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0;">
      <p style="margin: 0; font-size: 14px; color: #856404;">
        <strong>💡 Want to cancel?</strong> You can cancel auto-renewal anytime from your account settings. Your access will continue until ${this.formatDate(data.subscriptionExpiresAt)}.
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.cancelUrl}" style="display: inline-block; background: #6c757d; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 500; font-size: 16px;">
        Manage Subscription
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

    <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
      Thank you for being a NCLEX311 Premium member! 💜
    </p>

    <p style="font-size: 14px; color: #666; margin-bottom: 0;">
      Questions? Reply to this email or contact us at support@nclex311.com
    </p>

  </div>

  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #999; font-size: 12px;">
    <p style="margin: 5px 0;">NCLEX311 - Your NCLEX Prep Partner</p>
    <p style="margin: 5px 0;">This is an automated reminder about your subscription renewal.</p>
  </div>

</body>
</html>
    `;

    const request: SendGridRequest = {
      personalizations: [
        {
          to: [
            {
              email: data.userEmail,
              name: data.userName,
            },
          ],
          subject,
        },
      ],
      from: {
        email: this.config.fromEmail,
        name: this.config.fromName,
      },
      content: [
        {
          type: 'text/html',
          value: htmlContent,
        },
      ],
    };

    await this.sendEmail(request);
  }

  /**
   * Generate monthly confirmation email HTML
   */
  private generateMonthlyConfirmationHTML(
    data: PremiumConfirmationData,
    planName: string,
    amountFormatted: string
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Premium Subscription Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">🎉 Welcome to Premium!</h1>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      ${data.userName ? `Hi ${data.userName},` : 'Hi there,'}
    </p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Your payment was successful! You now have full access to all 323 NCLEX311 concepts with your <strong>${planName}</strong> subscription.
    </p>

    <div style="background: #f5f5f5; padding: 20px; border-radius: 6px; margin: 25px 0;">
      <h2 style="margin-top: 0; font-size: 18px; color: #667eea;">📋 Order Summary</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: 500;">Plan:</td>
          <td style="padding: 8px 0; text-align: right;">${planName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 500;">Amount Paid:</td>
          <td style="padding: 8px 0; text-align: right;">${amountFormatted}</td>
        </tr>
        ${
          data.paymentMethod
            ? `
        <tr>
          <td style="padding: 8px 0; font-weight: 500;">Payment Method:</td>
          <td style="padding: 8px 0; text-align: right;">${data.paymentMethod}</td>
        </tr>
        `
            : ''
        }
        <tr>
          <td style="padding: 8px 0; font-weight: 500;">Order ID:</td>
          <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 12px;">${data.orderId}</td>
        </tr>
      </table>
    </div>

    <div style="background: #e8f5e9; padding: 20px; border-radius: 6px; margin: 25px 0;">
      <h2 style="margin-top: 0; font-size: 18px; color: #2e7d32;">✅ Your Subscription</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: 500;">Started:</td>
          <td style="padding: 8px 0; text-align: right;">${this.formatDate(data.subscriptionStartDate)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 500;">Next Renewal:</td>
          <td style="padding: 8px 0; text-align: right;">${this.formatDate(data.subscriptionExpiresAt)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 500;">Auto-Renew:</td>
          <td style="padding: 8px 0; text-align: right;">Enabled (${amountFormatted}/month)</td>
        </tr>
      </table>
    </div>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0;">
      <p style="margin: 0; font-size: 14px; color: #856404;">
        <strong>💡 Auto-Renewal:</strong> Your subscription will automatically renew monthly for ${amountFormatted}. You can cancel anytime from your account settings—your access will continue until the current period ends.
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://nclex311.com'}/chapters" style="display: inline-block; background: #667eea; color: white; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-weight: 500; font-size: 16px; margin-bottom: 10px;">
        Start Learning Now
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

    <h3 style="font-size: 18px; color: #667eea; margin-bottom: 15px;">🚀 What's Included:</h3>
    <ul style="padding-left: 20px; margin-bottom: 20px;">
      <li style="margin-bottom: 10px;">Access to all 323 concepts (Chapters 5-8)</li>
      <li style="margin-bottom: 10px;">Unlimited practice questions</li>
      <li style="margin-bottom: 10px;">Progress tracking and analytics</li>
      <li style="margin-bottom: 10px;">Priority support</li>
    </ul>

    <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
      Thank you for choosing NCLEX311! We're excited to help you succeed. 💜
    </p>

    <p style="font-size: 14px; color: #666; margin-bottom: 0;">
      Questions? Reply to this email or contact us at support@nclex311.com
    </p>

  </div>

  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #999; font-size: 12px;">
    <p style="margin: 5px 0;">NCLEX311 - Your NCLEX Prep Partner</p>
    <p style="margin: 5px 0;">You received this email because you purchased a premium subscription.</p>
  </div>

</body>
</html>
    `;
  }

  /**
   * Generate annual confirmation email HTML
   */
  private generateAnnualConfirmationHTML(
    data: PremiumConfirmationData,
    planName: string,
    amountFormatted: string
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Premium Subscription Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">🎉 Welcome to Premium!</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">You saved 20% with Annual Plan! 🎊</p>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      ${data.userName ? `Hi ${data.userName},` : 'Hi there,'}
    </p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Your payment was successful! You now have <strong>one full year</strong> of access to all 323 NCLEX311 concepts with your <strong>${planName}</strong> subscription.
    </p>

    <div style="background: #f5f5f5; padding: 20px; border-radius: 6px; margin: 25px 0;">
      <h2 style="margin-top: 0; font-size: 18px; color: #667eea;">📋 Order Summary</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: 500;">Plan:</td>
          <td style="padding: 8px 0; text-align: right;">${planName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 500;">Amount Paid:</td>
          <td style="padding: 8px 0; text-align: right;">${amountFormatted}</td>
        </tr>
        ${
          data.paymentMethod
            ? `
        <tr>
          <td style="padding: 8px 0; font-weight: 500;">Payment Method:</td>
          <td style="padding: 8px 0; text-align: right;">${data.paymentMethod}</td>
        </tr>
        `
            : ''
        }
        <tr>
          <td style="padding: 8px 0; font-weight: 500;">Order ID:</td>
          <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 12px;">${data.orderId}</td>
        </tr>
      </table>
    </div>

    <div style="background: #e8f5e9; padding: 20px; border-radius: 6px; margin: 25px 0;">
      <h2 style="margin-top: 0; font-size: 18px; color: #2e7d32;">✅ Your Subscription</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: 500;">Started:</td>
          <td style="padding: 8px 0; text-align: right;">${this.formatDate(data.subscriptionStartDate)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 500;">Valid Until:</td>
          <td style="padding: 8px 0; text-align: right;">${this.formatDate(data.subscriptionExpiresAt)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 500;">Auto-Renew:</td>
          <td style="padding: 8px 0; text-align: right;">Not Enabled (One-time payment)</td>
        </tr>
      </table>
    </div>

    <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 25px 0;">
      <p style="margin: 0; font-size: 14px; color: #0d47a1;">
        <strong>📅 One-Time Payment:</strong> Your annual subscription is valid for 365 days. You won't be charged again unless you choose to renew. We'll send you a reminder before your subscription expires.
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://nclex311.com'}/chapters" style="display: inline-block; background: #667eea; color: white; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-weight: 500; font-size: 16px; margin-bottom: 10px;">
        Start Learning Now
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

    <h3 style="font-size: 18px; color: #667eea; margin-bottom: 15px;">🚀 What's Included:</h3>
    <ul style="padding-left: 20px; margin-bottom: 20px;">
      <li style="margin-bottom: 10px;">Access to all 323 concepts (Chapters 5-8)</li>
      <li style="margin-bottom: 10px;">Unlimited practice questions</li>
      <li style="margin-bottom: 10px;">Progress tracking and analytics</li>
      <li style="margin-bottom: 10px;">Priority support</li>
      <li style="margin-bottom: 10px;"><strong>Full year of access - no recurring charges!</strong></li>
    </ul>

    <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
      Thank you for choosing NCLEX311! We're excited to help you succeed. 💜
    </p>

    <p style="font-size: 14px; color: #666; margin-bottom: 0;">
      Questions? Reply to this email or contact us at support@nclex311.com
    </p>

  </div>

  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #999; font-size: 12px;">
    <p style="margin: 5px 0;">NCLEX311 - Your NCLEX Prep Partner</p>
    <p style="margin: 5px 0;">You received this email because you purchased a premium subscription.</p>
  </div>

</body>
</html>
    `;
  }

  /**
   * Format currency in Philippine Pesos
   */
  private formatCurrency(centavos: number): string {
    const pesos = centavos / 100;
    return `₱${pesos.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Manila',
    });
  }
}

// Export singleton instance
let emailService: EmailService | null = null;

/**
 * Get email service singleton instance
 */
export function getEmailService(): EmailService {
  if (!emailService) {
    emailService = new EmailService();
  }
  return emailService;
}
