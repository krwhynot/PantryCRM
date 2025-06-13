"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckIcon, XIcon, SearchIcon, TimerIcon } from 'lucide-react'; // Using Lucide for icons
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useDebounce } from 'use-debounce';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useSessionRecovery } from '@/hooks/useSessionRecovery';
import { SessionRecoveryDialog } from '@/components/ui/session-recovery-dialog';
import { SyncStatusIndicator } from '@/components/ui/sync-status-indicator';
import { VoiceInput } from '@/components/ui/voice-input';

// Assuming these interfaces exist or will be created
interface Organization {
  id: string;
  name: string;
  city?: string;
  priority?: { key: string; color: string };
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  isPrimary?: boolean;
  position?: { label: string };
}

// Zod schema for validation
const interactionSchema = z.object({
  organizationId: z.string().min(1, 'Organization is required'),
  contactId: z.string().min(1, 'Contact is required'),
  type: z.enum(['Email', 'Call', 'In Person', 'Demo', 'Quoted price', 'Follow-up'], { message: 'Interaction type is required' }),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

type InteractionFormValues = z.infer<typeof interactionSchema>;

const interactionTypes = [
  'Email', 'Call', 'In Person', 'Demo', 'Quoted price', 'Follow-up'
];

interface QuickInteractionEntryProps {
  onSuccess?: () => void;
}

const QuickInteractionEntry: React.FC<QuickInteractionEntryProps> = ({ onSuccess }) => {
  const [organizationSearchTerm, setOrganizationSearchTerm] = useState('');
  const [debouncedOrganizationSearchTerm] = useDebounce(organizationSearchTerm, 200); // 200ms debounce
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isSearchingOrganizations, setIsSearchingOrganizations] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isFetchingContacts, setIsFetchingContacts] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const [timer, setTimer] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);

  const orgSearchInputRef = useRef<HTMLInputElement>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<InteractionFormValues>({
    resolver: zodResolver(interactionSchema),
    defaultValues: {
      organizationId: '',
      contactId: '',
      type: undefined,
      notes: '',
    }
  });

  const watchedOrganizationId = watch('organizationId');
  const watchedContactId = watch('contactId');
  const watchedInteractionType = watch('type');
  const watchedNotes = watch('notes');

  // Get all form data for auto-save
  const formData = watch();

  // Auto-save functionality
  const { saveDraft, clearDraft } = useAutoSave(formData, {
    key: 'quick-interaction-entry',
    delay: 3000,
    enabled: true,
    onSaveSuccess: () => {
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 1000);
    }
  });

  // Session recovery functionality
  const {
    showRestoreDialog,
    draftData,
    restoreFromDraft,
    discardDraft,
    formatDraftAge
  } = useSessionRecovery('interaction', 'quick-entry', {
    maxAge: 60 * 60 * 1000, // 1 hour
    autoRestore: false
  });

  // Handle draft restoration
  const handleRestoreDraft = async () => {
    const restoredData = await restoreFromDraft();
    if (restoredData) {
      // Restore form values
      if (restoredData.organizationId) setValue('organizationId', restoredData.organizationId);
      if (restoredData.contactId) setValue('contactId', restoredData.contactId);
      if (restoredData.type) setValue('type', restoredData.type);
      if (restoredData.notes) setValue('notes', restoredData.notes);
      
      // Restore related state if available
      // This would require storing additional state in the draft
    }
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timer]);

  // Auto-focus on organization search on load and start timer
  useEffect(() => {
    orgSearchInputRef.current?.focus();
    setIsTimerRunning(true);
  }, []);

  // Organization search API call
  useEffect(() => {
    const fetchOrganizations = async () => {
      if (debouncedOrganizationSearchTerm.length >= 2) {
        setIsSearchingOrganizations(true);
        try {
          const response = await fetch(`/api/organizations/search?query=${encodeURIComponent(debouncedOrganizationSearchTerm)}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data: Organization[] = await response.json();
          setOrganizations(data);
        } catch (e) {
          console.error('Organization search error:', e);
          setOrganizations([]);
        } finally {
          setIsSearchingOrganizations(false);
        }
      } else {
        setOrganizations([]);
      }
    };

    fetchOrganizations();
  }, [debouncedOrganizationSearchTerm]);

  // Fetch contacts when organization is selected
  useEffect(() => {
    const fetchContacts = async () => {
      if (selectedOrganization?.id) {
        setIsFetchingContacts(true);
        try {
          const response = await fetch(`/api/contacts/by-organization/${selectedOrganization.id}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data: Contact[] = await response.json();
          setContacts(data);

          // Auto-select primary contact or first contact
          const primary = data.find(c => c.isPrimary) || data[0];
          if (primary) {
            setSelectedContact(primary);
            setValue('contactId', primary.id);
          } else {
            setSelectedContact(null);
            setValue('contactId', '');
          }
        } catch (e) {
          console.error('Contact fetch error:', e);
          setContacts([]);
          setSelectedContact(null);
          setValue('contactId', '');
        } finally {
          setIsFetchingContacts(false);
        }
      } else {
        setContacts([]);
        setSelectedContact(null);
        setValue('contactId', '');
      }
    };

    fetchContacts();
  }, [selectedOrganization, setValue]);

  // Handle form submission
  const onSubmit = async (data: InteractionFormValues) => {
    setIsSubmitting(true);
    setSubmitSuccess(null);
    try {
      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          interactionDate: new Date().toISOString(), // Add current date
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setSubmitSuccess(true);
      // Clear draft on successful submission
      await clearDraft();
      resetForm();
      onSuccess?.();
    } catch (e) {
      console.error('Submission error:', e);
      setSubmitSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = useCallback(() => {
    reset(); // Reset react-hook-form fields
    setOrganizationSearchTerm('');
    setOrganizations([]);
    setSelectedOrganization(null);
    setContacts([]);
    setSelectedContact(null);
    setTimer(30);
    setIsTimerRunning(true);
    setSubmitSuccess(null);
    orgSearchInputRef.current?.focus();
  }, [reset]);

  // Keyboard shortcut for Ctrl+Enter
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.ctrlKey && event.key === 'Enter') {
      handleSubmit(onSubmit)();
    }
  }, [handleSubmit, onSubmit]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown as any);
    return () => {
      document.removeEventListener('keydown', handleKeyDown as any);
    };
  }, [handleKeyDown]);

  const notesCharCount = watchedNotes?.length || 0;

  return (
    <>
    <Card className="w-full max-w-2xl mx-auto mt-8 relative">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Quick Interaction Entry
          <div className="flex items-center space-x-2">
            <TimerIcon className="h-5 w-5 text-gray-500" />
            <Badge variant={timer <= 10 ? 'destructive' : 'default'}>{timer}s</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Organization Search */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="organizationSearch">Organization</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Input
                  id="organizationSearch"
                  ref={orgSearchInputRef}
                  placeholder="Search for organization..."
                  value={selectedOrganization?.name || organizationSearchTerm}
                  onChange={(e) => {
                    setOrganizationSearchTerm(e.target.value);
                    setSelectedOrganization(null);
                    setValue('organizationId', '');
                  }}
                  className="h-[44px]"
                  aria-invalid={errors.organizationId ? "true" : "false"}
                />
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                  {isSearchingOrganizations ? (
                    <CommandEmpty>Searching organizations...</CommandEmpty>
                  ) : organizations.length === 0 && organizationSearchTerm.length >= 2 ? (
                    <CommandEmpty>No organization found.</CommandEmpty>
                  ) : organizationSearchTerm.length < 2 ? (
                    <CommandEmpty>Type 2 or more characters to search.</CommandEmpty>
                  ) : null}
                  <CommandInput
                    placeholder="Search organization..."
                    value={organizationSearchTerm}
                    onValueChange={setOrganizationSearchTerm}
                  />
                  <CommandList>
                    <CommandGroup>
                      {organizations.map((org) => (
                        <CommandItem
                          key={org.id}
                          onSelect={() => {
                            setSelectedOrganization(org);
                            setValue('organizationId', org.id);
                            setOrganizationSearchTerm(org.name);
                            // Focus notes field after organization selection
                            notesTextareaRef.current?.focus();
                          }}
                          className="h-[44px]"
                        >
                          {org.name} {org.city && <span className="text-gray-500 text-sm">({org.city})</span>}
                          {org.priority && <Badge variant="secondary" className="ml-2" style={{ backgroundColor: org.priority.color }}>{org.priority.key}</Badge>}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.organizationId && (
              <p className="text-red-500 text-sm">{errors.organizationId.message}</p>
            )}
          </div>

          {/* Contact Selection */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="contactSelect">Contact</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between h-[44px]"
                  aria-invalid={errors.contactId ? "true" : "false"}
                  disabled={!selectedOrganization || isFetchingContacts}
                >
                  {isFetchingContacts ? 'Loading contacts...' : selectedContact ? `${selectedContact.firstName} ${selectedContact.lastName}` : 'Select contact...'}
                  <SearchIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                  {isFetchingContacts ? (
                    <CommandEmpty>Loading contacts...</CommandEmpty>
                  ) : contacts.length === 0 ? (
                    <CommandEmpty>No contacts found for this organization.</CommandEmpty>
                  ) : null}
                  <CommandInput placeholder="Search contact..." />
                  <CommandList>
                    <CommandGroup>
                      {contacts.map((contact) => (
                        <CommandItem
                          key={contact.id}
                          onSelect={() => {
                            setSelectedContact(contact);
                            setValue('contactId', contact.id);
                            // Focus notes field after contact selection
                            notesTextareaRef.current?.focus();
                          }}
                          className="h-[44px]"
                        >
                          {contact.firstName} {contact.lastName} {contact.isPrimary && <Badge variant="secondary" className="ml-2">Primary</Badge>}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.contactId && (
              <p className="text-red-500 text-sm">{errors.contactId.message}</p>
            )}
          </div>

          {/* Interaction Types */}
          <div className="grid w-full items-center gap-1.5">
            <Label>Interaction Type</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {interactionTypes.map((type) => (
                <Button
                  key={type}
                  variant={watchedInteractionType === type ? 'default' : 'outline'}
                  onClick={() => {
                    setValue('type', type as any);
                    // Focus notes field after interaction type selection
                    notesTextareaRef.current?.focus();
                  }}
                  className="h-[44px]"
                  type="button" // Prevent form submission
                >
                  {type}
                </Button>
              ))}
            </div>
            {errors.type && (
              <p className="text-red-500 text-sm">{errors.type.message}</p>
            )}
          </div>

          {/* Notes Field */}
          <div className="grid w-full items-center gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="notes">Notes</Label>
              <VoiceInput
                onTranscription={(text) => {
                  const currentNotes = watchedNotes || '';
                  const newNotes = currentNotes ? `${currentNotes} ${text}` : text;
                  setValue('notes', newNotes.slice(0, 500)); // Respect max length
                  
                  // Focus the textarea after voice input
                  setTimeout(() => {
                    notesTextareaRef.current?.focus();
                  }, 100);
                }}
                onError={(error) => {
                  console.error('Voice input error:', error);
                  // Could show a toast notification here
                }}
                className="flex-shrink-0"
              />
            </div>
            <Textarea
              id="notes"
              placeholder="Add notes (max 500 characters) - Auto-saved locally"
              {...register('notes')}
              className="min-h-[88px] resize-none touch-target auto-expand"
              maxLength={500}
              ref={notesTextareaRef}
              rows={3}
              onKeyDown={(e) => {
                if (!e.shiftKey && e.key === 'Tab') {
                  e.preventDefault();
                  submitButtonRef.current?.focus();
                }
              }}
              onChange={(e) => {
                // Auto-expand based on content
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.max(88, e.target.scrollHeight)}px`;
                
                // Call original onChange for react-hook-form
                const { onChange } = register('notes');
                onChange(e);
              }}
            />
            <p className="text-sm text-gray-500 text-right">{notesCharCount}/500</p>
            {errors.notes && (
              <p className="text-red-500 text-sm">{errors.notes.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full h-[44px]" disabled={isSubmitting} ref={submitButtonRef}>
            {isSubmitting ? 'Submitting...' : 'Log Interaction'}
          </Button>

          {submitSuccess !== null && (
            <div className={`mt-4 p-3 rounded-md text-center ${submitSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {submitSuccess ? (
                <div className="flex items-center justify-center"><CheckIcon className="mr-2 h-5 w-5" /> Interaction logged successfully!</div>
              ) : (
                <div className="flex items-center justify-center"><XIcon className="mr-2 h-5 w-5" /> Failed to log interaction.</div>
              )}
            </div>
          )}
        </form>
      </CardContent>
      
      {/* Draft saved indicator */}
      {draftSaved && (
        <div className="absolute top-2 right-2 bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
          Draft saved
        </div>
      )}
    </Card>
    
    {/* Session Recovery Dialog */}
    <SessionRecoveryDialog
      open={showRestoreDialog}
      onRestore={handleRestoreDraft}
      onDiscard={discardDraft}
      draftAge={formatDraftAge}
    />
    
    {/* Sync Status Indicator */}
    <SyncStatusIndicator />
  </>
  );
};

export default QuickInteractionEntry;
