// Simplified email sending utility without nodemailer dependency
// Kitchen Pantry CRM - Performance Optimization

interface EmailOptions {
  from: string | undefined;
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Simplified email sending function that logs emails instead of sending them
 * In a production environment, this would be replaced with a proper email service
 * like SendGrid, Mailgun, or Azure Communication Services Email
 */
export default async function sendEmail(
  emailOptions: EmailOptions
): Promise<void> {
  // In development/testing, just log the email details
  console.log('Email would be sent with the following details:');
  console.log(`From: ${emailOptions.from}`);
  console.log(`To: ${emailOptions.to}`);
  console.log(`Subject: ${emailOptions.subject}`);
  console.log(`Text: ${emailOptions.text.substring(0, 100)}...`);
  
  if (process.env.NODE_ENV === 'production') {
    // In production, you would implement a proper email service here
    // For example, using Azure Communication Services Email which aligns with our Azure infrastructure
    console.log('Production email sending would be implemented here');
    // Example implementation would use Azure SDK or a REST API call
  }
  
  return Promise.resolve();
}