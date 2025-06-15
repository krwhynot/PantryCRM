/**
 * Quick Interaction Form Component
 * 
 * Optimized for rapid interaction logging on iPad. Features large touch targets,
 * smart defaults, and single-screen workflow for food service sales reps.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Clock, CheckCircle, XCircle, Phone, Mail, MessageSquare, MapPin, Package, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OrganizationSummary, ContactSummary, InteractionType, InteractionOutcome } from '@/types/crm';

// Food service specific interaction types
const INTERACTION_TYPES = [
  { value: 'CALL', label: 'Phone Call', icon: Phone, color: 'bg-blue-500', description: 'Phone conversation' },
  { value: 'EMAIL', label: 'Email', icon: Mail, color: 'bg-green-500', description: 'Email correspondence' },
  { value: 'IN_PERSON', label: 'In-Person Visit', icon: MessageSquare, color: 'bg-purple-500', description: 'Face-to-face meeting' },
  { value: 'DEMO_SAMPLED', label: 'Demo/Sample', icon: Package, color: 'bg-orange-500', description: 'Product demonstration or sampling' },
  { value: 'QUOTED_PRICE', label: 'Price Quote', icon: DollarSign, color: 'bg-indigo-500', description: 'Pricing discussion or quote' },
  { value: 'FOLLOW_UP', label: 'Follow-up', icon: MapPin, color: 'bg-gray-500', description: 'Follow-up contact' }
] as const;

const INTERACTION_OUTCOMES = [
  { value: 'POSITIVE', label: 'Positive', icon: CheckCircle, color: 'text-green-600', description: 'Good response, interested' },
  { value: 'NEUTRAL', label: 'Neutral', icon: MessageSquare, color: 'text-gray-600', description: 'Standard interaction' },
  { value: 'NEGATIVE', label: 'Negative', icon: XCircle, color: 'text-red-600', description: 'Not interested or negative' },
  { value: 'FOLLOW_UP_NEEDED', label: 'Follow-up Needed', icon: Clock, color: 'text-orange-600', description: 'Requires follow-up action' }
] as const;

// Form validation schema
const interactionSchema = z.object({
  type: z.enum(['CALL', 'EMAIL', 'IN_PERSON', 'DEMO_SAMPLED', 'QUOTED_PRICE', 'FOLLOW_UP']),
  subject: z.string().min(1, 'Subject is required').max(255),
  description: z.string().max(2000).optional(),
  date: z.string(),
  duration: z.number().min(1).max(1440).optional(),
  outcome: z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'FOLLOW_UP_NEEDED']).optional(),
  nextAction: z.string().max(500).optional(),
  organizationId: z.string(),
  contactId: z.string().optional()
});

type InteractionFormData = z.infer<typeof interactionSchema>;

interface QuickInteractionFormProps {
  organization?: OrganizationSummary;
  contacts?: ContactSummary[];
  onSubmit: (data: InteractionFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  className?: string;
}

export default function QuickInteractionForm({
  organization,
  contacts = [],
  onSubmit,
  onCancel,
  isSubmitting = false,
  className
}: QuickInteractionFormProps) {
  const [selectedType, setSelectedType] = useState<InteractionType | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<InteractionOutcome | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const subjectRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm<InteractionFormData>({
    resolver: zodResolver(interactionSchema),
    defaultValues: {
      organizationId: organization?.id || '',
      date: new Date().toISOString().slice(0, 16), // Current date/time
      type: 'CALL' // Default to most common type
    },
    mode: 'onChange'
  });

  const watchedType = watch('type');
  const watchedOutcome = watch('outcome');

  // Auto-focus subject field
  useEffect(() => {
    const timer = setTimeout(() => {
      subjectRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Update selected type when form value changes
  useEffect(() => {
    const typeConfig = INTERACTION_TYPES.find(t => t.value === watchedType);
    setSelectedType(typeConfig?.value || null);
  }, [watchedType]);

  // Update selected outcome when form value changes
  useEffect(() => {
    const outcomeConfig = INTERACTION_OUTCOMES.find(o => o.value === watchedOutcome);
    setSelectedOutcome(outcomeConfig?.value || null);
  }, [watchedOutcome]);

  // Handle type selection with haptic feedback
  const handleTypeSelect = (type: InteractionType) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    setValue('type', type);
    setSelectedType(type);

    // Auto-generate subject if empty
    const typeConfig = INTERACTION_TYPES.find(t => t.value === type);
    const currentSubject = subjectRef.current?.value;
    if (!currentSubject && typeConfig && organization) {
      const autoSubject = `${typeConfig.label} with ${organization.name}`;
      setValue('subject', autoSubject);
    }
  };

  // Handle outcome selection
  const handleOutcomeSelect = (outcome: InteractionOutcome) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    setValue('outcome', outcome);
    setSelectedOutcome(outcome);
  };

  // Smart duration suggestions based on interaction type
  const getDurationSuggestions = (type: InteractionType) => {
    switch (type) {
      case 'CALL': return [15, 30, 45, 60];
      case 'EMAIL': return [5, 10, 15];
      case 'IN_PERSON': return [30, 60, 90, 120];
      case 'DEMO_SAMPLED': return [45, 60, 90];
      case 'QUOTED_PRICE': return [30, 45, 60];
      case 'FOLLOW_UP': return [15, 30];
      default: return [15, 30, 45];
    }
  };

  const onFormSubmit = async (data: InteractionFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Failed to submit interaction:', error);
    }
  };

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 p-6 space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Log Interaction</h2>
          {organization && (
            <p className="text-sm text-gray-600 mt-1">
              with {organization.name}
            </p>
          )}
        </div>
        <Button variant="ghost" onClick={onCancel} className="p-2">
          <XCircle className="w-5 h-5" />
        </Button>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Interaction Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Interaction Type
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {INTERACTION_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.value;
              
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleTypeSelect(type.value)}
                  className={cn(
                    'p-4 rounded-lg border-2 transition-all duration-200',
                    'min-h-[80px] flex flex-col items-center justify-center space-y-2',
                    'hover:shadow-md active:scale-95',
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                  aria-label={type.description}
                >
                  <div className={cn('p-2 rounded-md', isSelected ? 'bg-blue-100' : type.color)}>
                    <Icon className={cn('w-5 h-5', isSelected ? 'text-blue-700' : 'text-white')} />
                  </div>
                  <span className="text-sm font-medium text-center">{type.label}</span>
                </button>
              );
            })}
          </div>
          {errors.type && (
            <p className="mt-2 text-sm text-red-600">{errors.type.message}</p>
          )}
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
            Subject *
          </label>
          <Input
            id="subject"
            ref={subjectRef}
            {...register('subject')}
            placeholder="Brief description of the interaction"
            className="min-h-[44px] text-base"
            aria-describedby={errors.subject ? 'subject-error' : undefined}
          />
          {errors.subject && (
            <p id="subject-error" className="mt-2 text-sm text-red-600">{errors.subject.message}</p>
          )}
        </div>

        {/* Date and Duration Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Date/Time */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Date & Time
            </label>
            <Input
              id="date"
              type="datetime-local"
              {...register('date')}
              className="min-h-[44px]"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes)
            </label>
            <div className="flex space-x-2">
              {getDurationSuggestions(selectedType || 'CALL').map((duration) => (
                <Button
                  key={duration}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setValue('duration', duration)}
                  className="min-h-[44px] flex-1"
                >
                  {duration}m
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Selection */}
        {contacts.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact (optional)
            </label>
            <Select onValueChange={(value) => setValue('contactId', value)}>
              <SelectTrigger className="min-h-[44px]">
                <SelectValue placeholder="Select a contact" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    <div className="flex items-center space-x-2">
                      <span>{contact.firstName} {contact.lastName}</span>
                      {contact.isPrimary && (
                        <Badge variant="secondary" className="text-xs">Primary</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Outcome Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Outcome
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {INTERACTION_OUTCOMES.map((outcome) => {
              const Icon = outcome.icon;
              const isSelected = selectedOutcome === outcome.value;
              
              return (
                <button
                  key={outcome.value}
                  type="button"
                  onClick={() => handleOutcomeSelect(outcome.value)}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all duration-200',
                    'min-h-[60px] flex flex-col items-center justify-center space-y-1',
                    'hover:shadow-sm active:scale-95',
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                  aria-label={outcome.description}
                >
                  <Icon className={cn('w-4 h-4', isSelected ? 'text-blue-700' : outcome.color)} />
                  <span className={cn('text-xs font-medium text-center', isSelected ? 'text-blue-700' : 'text-gray-700')}>
                    {outcome.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-gray-600"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </Button>

        {/* Advanced Fields */}
        {showAdvanced && (
          <div className="space-y-4 border-t border-gray-200 pt-4">
            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Notes
              </label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Additional details about the interaction..."
                className="min-h-[100px] text-base"
                rows={4}
              />
            </div>

            {/* Next Action */}
            <div>
              <label htmlFor="nextAction" className="block text-sm font-medium text-gray-700 mb-2">
                Next Action Required
              </label>
              <Input
                id="nextAction"
                {...register('nextAction')}
                placeholder="What needs to be done next?"
                className="min-h-[44px] text-base"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="flex-1 min-h-[44px]"
          >
            {isSubmitting ? 'Saving...' : 'Save Interaction'}
          </Button>
        </div>
      </form>
    </div>
  );
}