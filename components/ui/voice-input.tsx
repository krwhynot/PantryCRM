'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscription,
  onError,
  className,
  disabled = false,
  language = 'en-US',
  continuous = false,
  interimResults = true
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      
      // Configure recognition settings
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      // Handle successful transcription
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptPart = result[0].transcript;
          
          if (result.isFinal) {
            finalTranscript += transcriptPart;
            setConfidence(result[0].confidence);
          } else {
            interimTranscript += transcriptPart;
          }
        }

        // Update interim transcript
        if (interimTranscript) {
          setTranscript(interimTranscript);
        }

        // Handle final transcript
        if (finalTranscript) {
          setTranscript(finalTranscript);
          onTranscription(finalTranscript);
          
          if (!continuous) {
            stopListening();
          }
        }
      };

      // Handle errors
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        
        let errorMessage = 'Speech recognition error';
        switch (event.error) {
          case 'network':
            errorMessage = 'Network error - check your internet connection';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied - please allow microphone permissions';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected - try speaking closer to the microphone';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not available - check your audio settings';
            break;
          case 'service-not-allowed':
            errorMessage = 'Speech recognition service not available';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }

        onError?.(errorMessage);
        stopListening();
      };

      // Handle end of speech recognition
      recognition.onend = () => {
        setIsListening(false);
        setTranscript('');
      };

      // Handle start of speech recognition
      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [language, continuous, interimResults, onTranscription, onError]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening || disabled) return;

    try {
      recognitionRef.current.start();
      
      // Auto-stop after 30 seconds for single-shot mode
      if (!continuous) {
        timeoutRef.current = setTimeout(() => {
          stopListening();
        }, 30000);
      }
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      onError?.('Failed to start speech recognition');
    }
  }, [isListening, disabled, continuous, onError]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;

    try {
      recognitionRef.current.stop();
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Don't render if not supported
  if (!isSupported) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        variant={isListening ? "default" : "ghost"}
        size="sm"
        className={cn(
          "h-10 w-10 p-0 touch-target transition-all duration-200",
          isListening && "bg-red-500 hover:bg-red-600 text-white",
          !isListening && "hover:bg-gray-100"
        )}
        onClick={toggleListening}
        disabled={disabled}
        aria-label={isListening ? "Stop voice input" : "Start voice input"}
      >
        {isListening ? (
          <MicOff className={cn("h-4 w-4", isListening && "animate-pulse")} />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>

      {/* Visual feedback during listening */}
      {isListening && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Volume2 className="h-4 w-4 animate-pulse" />
          <span className="animate-pulse">
            {transcript || "Listening..."}
          </span>
          {confidence > 0 && (
            <span className="text-xs text-gray-400">
              ({Math.round(confidence * 100)}%)
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceInput;