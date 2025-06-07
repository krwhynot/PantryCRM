'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

/**
 * Schema for contact form validation
 */
const ContactFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  positionKey: z.string().optional(),
  organizationId: z.string().cuid('Invalid organization'),
  isPrimary: z.boolean().default(false),
  notes: z.string().optional(),
});

type ContactFormData = z.infer<typeof ContactFormSchema>;

interface Organization {
  id: string;
  name: string;
}

interface ContactFormProps {
  onSuccess?: () => void;
  initialData?: Partial<ContactFormData>;
  preselectedOrganizationId?: string;
}

/**
 * ContactForm component for creating and editing contacts
 * 
 * @param onSuccess - Callback function to execute after successful form submission
 * @param initialData - Optional initial data for editing an existing contact
 * @param preselectedOrganizationId - Optional organization ID to preselect (e.g., when creating from org page)
 */
export function ContactForm({ onSuccess, initialData, preselectedOrganizationId }: ContactFormProps): JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationsLoading, setOrganizationsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  
  const form = useForm<ContactFormData>({
    resolver: zodResolver(ContactFormSchema),
    defaultValues: {
      organizationId: preselectedOrganizationId || '',
      isPrimary: false,
      ...initialData,
    },
  });

  // Fetch organizations for dropdown
  useEffect(() => {
    const fetchOrganizations = async (): Promise<void> => {
      try {
        const response = await fetch('/api/organizations?limit=200');
        if (response.ok) {
          const data = await response.json();
          setOrganizations(data);
        }
      } catch (error) {
        console.error('Failed to fetch organizations:', error);
      } finally {
        setOrganizationsLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  /**
   * Handle form submission
   * 
   * @param data - Form data to submit
   */
  const onSubmit = async (data: ContactFormData): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create contact');
      }

      toast({ title: 'Success', description: 'Contact created successfully' });
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to create contact',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>New Contact</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Organization Selection */}
          <div className="space-y-2">
            <Label htmlFor="organizationId">Organization *</Label>
            <Select 
              onValueChange={(value) => form.setValue('organizationId', value)}
              value={form.watch('organizationId')}
              disabled={!!preselectedOrganizationId || organizationsLoading}
            >
              <SelectTrigger className="min-h-[44px]">
                <SelectValue placeholder={organizationsLoading ? "Loading..." : "Select organization"} />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.organizationId && (
              <p className="text-sm text-red-500">{form.formState.errors.organizationId.message}</p>
            )}
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                {...form.register('firstName')}
                placeholder="John"
                className="min-h-[44px]"
              />
              {form.formState.errors.firstName && (
                <p className="text-sm text-red-500">{form.formState.errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                {...form.register('lastName')}
                placeholder="Smith"
                className="min-h-[44px]"
              />
              {form.formState.errors.lastName && (
                <p className="text-sm text-red-500">{form.formState.errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                placeholder="john.smith@restaurant.com"
                className="min-h-[44px]"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...form.register('phone')}
                placeholder="(555) 123-4567"
                className="min-h-[44px]"
              />
            </div>
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label htmlFor="positionKey">Position/Role</Label>
            <Select onValueChange={(value) => form.setValue('positionKey', value)}>
              <SelectTrigger className="min-h-[44px]">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exec-chef">Executive Chef</SelectItem>
                <SelectItem value="sous-chef">Sous Chef</SelectItem>
                <SelectItem value="kitchen-manager">Kitchen Manager</SelectItem>
                <SelectItem value="buyer">Buyer</SelectItem>
                <SelectItem value="purchasing-manager">Purchasing Manager</SelectItem>
                <SelectItem value="general-manager">General Manager</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="director-operations">Director of Operations</SelectItem>
                <SelectItem value="food-service-director">Food Service Director</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Primary Contact Toggle */}
          <div className="flex items-center space-x-2">
            <Switch 
              id="isPrimary"
              checked={form.watch('isPrimary')}
              onCheckedChange={(checked) => form.setValue('isPrimary', checked)}
            />
            <Label htmlFor="isPrimary" className="text-sm font-medium">
              Primary Contact for Organization
            </Label>
          </div>
          <p className="text-xs text-gray-500 ml-6">
            Only one primary contact per organization. Setting this will remove primary status from other contacts.
          </p>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...form.register('notes')}
              placeholder="Additional information about this contact..."
              className="min-h-[88px]"
            />
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={isLoading || !form.watch('organizationId')}
            className="w-full min-h-[44px] mt-6"
          >
            {isLoading ? 'Creating...' : 'Create Contact'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
