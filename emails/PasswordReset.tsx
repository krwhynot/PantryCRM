// emails/PasswordReset.tsx - Simple password reset template
interface PasswordResetEmailProps {
  username: string;
  avatar: string;
  email: string;
  password: string;
  userLanguage: string;
}

const PasswordResetEmail = ({
  username,
  password,
  userLanguage
}: PasswordResetEmailProps) => {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <h1>Password Reset - Kitchen Pantry CRM</h1>
      <p>Hi {username},</p>
      <p>Your password has been reset successfully.</p>
      <p><strong>Your new password:</strong> {password}</p>
      <p>Please login at: {process.env.NEXT_PUBLIC_APP_URL}</p>
      <p>For security, please change your password after logging in.</p>
      <p>Best regards,<br/>Kitchen Pantry CRM Team</p>
    </div>
  );
};

export default PasswordResetEmail;