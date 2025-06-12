'use client';
import { useActionState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { createContactAction, CreateContactState } from '@/actions/contacts/create-contact';
import { getOrganizations } from '@/lib/organizations';
import { OrganizationSelect } from './OrganizationSelect';


interface ContactFormProps {
  onSuccess?: () => void;
  initialData?: Record<string, any>;
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
  const { toast } = useToast();
  const [state, formAction, pending] = useActionState<CreateContactState | null, FormData>(
    createContactAction,
    null
  );

  // Create organizations promise for Suspense
  const organizationsPromise = getOrganizations();

  // Handle success/error states
  useEffect(() => {
    if (state?.success) {
      toast({ title: 'Success', description: 'Contact created successfully' });
      onSuccess?.();
    } else if (state?.error) {
      toast({
        title: 'Error',
        description: state.error,
        variant: 'destructive'
      });
    }
  }, [state, toast, onSuccess]);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>New Contact</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {/* Organization Selection */}
          <Suspense fallback={<div className="space-y-2"><Label>Organization *</Label><div className="min-h-[44px] flex items-center text-sm text-gray-500">Loading organizations...</div></div>}>
            <OrganizationSelect 
              organizationsPromise={organizationsPromise}
              preselectedOrganizationId={preselectedOrganizationId}
            />
          </Suspense>

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                name="firstName"
                required
                defaultValue={initialData?.firstName || ''}
                placeholder="John"
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                name="lastName"
                required
                defaultValue={initialData?.lastName || ''}
                placeholder="Smith"
                className="min-h-[44px]"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={initialData?.email || ''}
                placeholder="john.smith@restaurant.com"
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={initialData?.phone || ''}
                placeholder="(555) 123-4567"
                className="min-h-[44px]"
              />
            </div>
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label htmlFor="positionKey">Position/Role</Label>
            <Select name="positionKey" defaultValue={initialData?.positionKey || ''}>
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
              name="isPrimary"
              defaultChecked={initialData?.isPrimary || false}
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
              name="notes"
              defaultValue={initialData?.notes || ''}
              placeholder="Additional information about this contact..."
              className="min-h-[88px]"
            />
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={pending}
            className="w-full min-h-[44px] mt-6"
          >
            {pending ? 'Creating...' : 'Create Contact'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
