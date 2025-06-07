'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquareIcon, SendIcon } from 'lucide-react';
import { toast } from 'sonner';

interface FeedbackProps {
  userId?: string;
  contextData?: Record<string, any>;
  onSubmit?: (feedback: string, contextData?: Record<string, any>) => Promise<void>;
}

/**
 * Feedback component for collecting user feedback
 * NextCRM standard component implementation
 */
export function Feedback({ userId, contextData, onSubmit }: FeedbackProps) {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast.error('Please enter feedback before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(feedback, contextData);
      } else {
        // Default submission to API endpoint
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feedback,
            userId,
            contextData,
            timestamp: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to submit feedback');
        }
      }
      
      toast.success('Thank you for your feedback!');
      setFeedback('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareIcon className="h-5 w-5" />
          Send Feedback
        </CardTitle>
        <CardDescription>
          Help us improve by sharing your thoughts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="What's on your mind?"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="min-h-[100px]"
          disabled={isSubmitting}
        />
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="gap-2"
        >
          <SendIcon className="h-4 w-4" />
          Submit Feedback
        </Button>
      </CardFooter>
    </Card>
  );
}

export default Feedback;