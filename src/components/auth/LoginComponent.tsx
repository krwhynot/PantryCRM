import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LoginComponentProps {
  onLogin: (email: string, password: string) => void;
  className?: string;
}

export const LoginComponent: React.FC<LoginComponentProps> = ({ onLogin, className = '' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <Card className={`mx-auto max-w-sm ${className}`}>
      <CardHeader>
        <CardTitle className="text-2xl text-center">Login</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4" data-testid="login-form">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ minHeight: '44px' }} // iPad touch target
              data-testid="email-input"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ minHeight: '44px' }} // iPad touch target
              data-testid="password-input"
            />
          </div>
          <Button type="submit" className="w-full" style={{ minHeight: '44px' }} data-testid="login-submit">
            Sign In
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
