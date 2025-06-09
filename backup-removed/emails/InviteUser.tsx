// Simplified email template without @react-email/components dependency
// Kitchen Pantry CRM - Performance Optimization

interface InviteUserEmailProps {
  username?: string;
  userEmail?: string;
  invitedBy?: string;
  inviteLink?: string;
}

export const InviteUserEmail = ({
  username = "User",
  userEmail = "user@example.com",
  invitedBy = "Kitchen Pantry CRM",
  inviteLink = "https://kitchenpantry.com/invite",
}: InviteUserEmailProps) => {
  // Simple HTML email template
  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Kitchen Pantry CRM Invitation</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.5; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #0f172a; font-size: 24px; margin-bottom: 10px;">Kitchen Pantry CRM</h1>
          <p style="color: #64748b; font-size: 16px;">Food Service Sales Management</p>
        </div>
        
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #0f172a; font-size: 20px; margin-bottom: 10px;">You've been invited!</h2>
          <p style="color: #334155; font-size: 16px;">
            Hello ${username},
          </p>
          <p style="color: #334155; font-size: 16px;">
            ${invitedBy} has invited you to join Kitchen Pantry CRM. Click the button below to accept the invitation and create your account.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold;">
              Accept Invitation
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">
            If you're having trouble with the button above, copy and paste the URL below into your web browser:
          </p>
          <p style="color: #64748b; font-size: 14px; word-break: break-all;">
            ${inviteLink}
          </p>
        </div>
        
        <div style="text-align: center; color: #94a3b8; font-size: 14px;">
          <p>Kitchen Pantry CRM - Food Service Sales Management</p>
          <p>© ${new Date().getFullYear()} Kitchen Pantry. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  return { html: emailHtml };
};

export default InviteUserEmail;