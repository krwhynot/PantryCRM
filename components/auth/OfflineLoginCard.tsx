'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, User, Clock, Shield } from 'lucide-react';

interface OfflineLoginCardProps {
  userName: string;
  userEmail: string;
  cacheAge: string;
  timeUntilExpiry: string;
  onOfflineLogin: () => Promise<boolean>;
  onClearCache: () => void;
  className?: string;
}

export const OfflineLoginCard: React.FC<OfflineLoginCardProps> = ({
  userName,
  userEmail,
  cacheAge,
  timeUntilExpiry,
  onOfflineLogin,
  onClearCache,
  className
}) => {
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  const handleOfflineLogin = async () => {
    setIsLoggingIn(true);
    try {
      await onOfflineLogin();
    } catch (error) {
      console.error('Offline login failed:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <WifiOff className="h-5 w-5 text-orange-600" />
          Offline Access Available
        </CardTitle>
        <CardDescription>
          You're currently offline, but you can continue working with your cached session.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* User Information */}
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900">{userName}</div>
            <div className="text-sm text-gray-500 truncate">{userEmail}</div>
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
              <span>Last login: {cacheAge}</span>
              <span>•</span>
              <span>Expires: {timeUntilExpiry}</span>
            </div>
          </div>
        </div>

        {/* Offline Access Information */}
        <Alert className="border-orange-200 bg-orange-50">
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Offline Mode:</strong> Your interactions will be saved locally and synced when you're back online.
            Some features may be limited.
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleOfflineLogin}
            disabled={isLoggingIn}
            className="w-full touch-target"
            size="lg"
          >
            {isLoggingIn ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Continuing Offline...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <WifiOff className="h-4 w-4" />
                <span>Continue Working Offline</span>
              </div>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={onClearCache}
            className="w-full touch-target"
            disabled={isLoggingIn}
          >
            <User className="h-4 w-4 mr-2" />
            Sign in as Different User
          </Button>
        </div>

        {/* Limitations Notice */}
        <div className="text-xs text-gray-500 space-y-1">
          <div className="font-medium">Offline Limitations:</div>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Search results may be limited to cached data</li>
            <li>New organization creation unavailable</li>
            <li>Real-time sync disabled until reconnected</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default OfflineLoginCard;