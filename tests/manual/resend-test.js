/**
 * Manual Resend Email Test
 * Run with: node tests/manual/resend-test.js
 *
 * This script tests the Resend email service by sending a simple test email.
 * Requires RESEND_API_KEY and EMAIL_FROM env vars to be set.
 */

import dotenv from 'dotenv';
import { emailService } from '../../utils/emailService.js';
import { logger } from '../../utils/logger.js';

// Load environment variables
dotenv.config();

const testEmail = async () => {
  const apiKey = process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.error('❌ RESEND_API_KEY not found in environment variables');
    console.error('   Set RESEND_API_KEY in your .env file or export it before running this test');
    process.exit(1);
  }

  if (!process.env.EMAIL_FROM) {
    console.warn('⚠️  EMAIL_FROM not set, using default: noreply@klean.com');
  }

  console.log('🚀 Starting Resend Email Test...\n');
  console.log(`📧 FROM: ${process.env.EMAIL_FROM || 'noreply@klean.com'}`);
  console.log(`📧 TO: test@example.com\n`);

  try {
    const testUser = {
      fullname: 'Test User',
      email: 'test@example.com',
      role: 'CUSTOMER'
    };

    console.log('📤 Sending welcome email...');
    const result = await emailService.sendWelcomeEmail(testUser);

    if (result) {
      console.log('✅ Welcome email sent successfully!');
      console.log('   Check the recipient email (test@example.com) for the message.');
    } else {
      console.error('❌ Failed to send welcome email (check logs for details)');
      process.exit(1);
    }

    console.log('\n✨ Resend integration test completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
};

// Run test
testEmail();
