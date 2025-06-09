// emails/InviteUser.tsx - Simple email template
interface InviteUserEmailProps {
  invitedByUsername: string;
  username: string;
  invitedUserPassword: string;
  userLanguage: string;
}

const InviteUserEmail = ({
  invitedByUsername,
  username,
  invitedUserPassword,
  userLanguage
}: InviteUserEmailProps) => {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <h1>Welcome to Kitchen Pantry CRM</h1>
      <p>Hi {username},</p>
      <p>You have been invited by {invitedByUsername} to join Kitchen Pantry CRM.</p>
      <p><strong>Your login credentials:</strong></p>
      <p>Password: {invitedUserPassword}</p>
      <p>Please login at: {process.env.NEXT_PUBLIC_APP_URL}</p>
      <p>Best regards,<br/>Kitchen Pantry CRM Team</p>
    </div>
  );
};

export default InviteUserEmail;