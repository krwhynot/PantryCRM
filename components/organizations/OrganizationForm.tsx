'use client';
import { useActionState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { createOrganizationAction, CreateOrganizationState } from '@/actions/organizations/create-organization';


interface OrganizationFormProps {
  onSuccess?: () => void;
  initialData?: Record<string, any>;
}

export function OrganizationForm({ onSuccess, initialData }: OrganizationFormProps) {
  const { toast } = useToast();
  const [state, formAction, pending] = useActionState<CreateOrganizationState | null, FormData>(
    createOrganizationAction,
    null
  );

  // Handle success/error states
  useEffect(() => {
    if (state?.success) {
      toast({ title: 'Success', description: 'Organization created successfully' });
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
        <CardTitle>New Organization</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {/* Organization Name - Required */}
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name *</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={initialData?.name || ''}
              placeholder="Restaurant name, catering company, etc."
              className="min-h-[44px]" // Touch target compliance
            />
          </div>

          {/* Food Service Fields Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority Level</Label>
              <Select name="priority" defaultValue={initialData?.priority || ''}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A - High Priority</SelectItem>
                  <SelectItem value="B">B - Medium Priority</SelectItem>
                  <SelectItem value="C">C - Low Priority</SelectItem>
                  <SelectItem value="D">D - Watch List</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="segment">Market Segment</Label>
              <Select name="segment" defaultValue={initialData?.segment || ''}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select segment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fine Dining">Fine Dining</SelectItem>
                  <SelectItem value="Fast Food">Fast Food</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Catering">Catering</SelectItem>
                  <SelectItem value="Institutional">Institutional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="distributor">Distributor</Label>
              <Select name="distributor" defaultValue={initialData?.distributor || ''}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select distributor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sysco">Sysco</SelectItem>
                  <SelectItem value="USF">US Foods</SelectItem>
                  <SelectItem value="PFG">Performance Food Group</SelectItem>
                  <SelectItem value="Direct">Direct</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={initialData?.email || ''}
                placeholder="contact@restaurant.com"
                className="min-h-[44px]"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              defaultValue={initialData?.website || ''}
              placeholder="https://restaurant.com"
              className="min-h-[44px]"
            />
          </div>

          {/* Address Fields */}
          <div className="space-y-2">
            <Label htmlFor="addressLine1">Address</Label>
            <Input
              id="addressLine1"
              name="addressLine1"
              defaultValue={initialData?.addressLine1 || ''}
              placeholder="123 Main Street"
              className="min-h-[44px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                defaultValue={initialData?.city || ''}
                placeholder="Houston"
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                name="state"
                defaultValue={initialData?.state || ''}
                placeholder="TX"
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                name="zipCode"
                defaultValue={initialData?.zipCode || ''}
                placeholder="77001"
                className="min-h-[44px]"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={initialData?.notes || ''}
              placeholder="Additional information about this organization..."
              className="min-h-[88px]" // Double touch target for textarea
            />
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={pending}
            className="w-full min-h-[44px] mt-6"
          >
            {pending ? 'Creating...' : 'Create Organization'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}