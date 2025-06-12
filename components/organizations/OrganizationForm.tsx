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

          {/* Organization Type and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Organization Type</Label>
              <Select name="type" defaultValue={initialData?.type || 'PROSPECT'}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROSPECT">Prospect</SelectItem>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="isActive">Status</Label>
              <Select name="isActive" defaultValue={initialData?.isActive?.toString() || 'true'}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                  <SelectItem value="A">A - Top Priority</SelectItem>
                  <SelectItem value="B">B - High Priority</SelectItem>
                  <SelectItem value="C">C - Medium Priority</SelectItem>
                  <SelectItem value="D">D - Low Priority</SelectItem>
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

          {/* Financial Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="annualRevenue">Annual Revenue ($)</Label>
              <Input
                id="annualRevenue"
                name="annualRevenue"
                type="number"
                defaultValue={initialData?.annualRevenue || ''}
                placeholder="1000000"
                className="min-h-[44px]"
                min="0"
                step="1000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalValue">Total Value ($)</Label>
              <Input
                id="totalValue"
                name="totalValue"
                type="number"
                defaultValue={initialData?.totalValue || ''}
                placeholder="50000"
                className="min-h-[44px]"
                min="0"
                step="100"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={initialData?.phone || ''}
                placeholder="(555) 123-4567"
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={initialData?.email || ''}
                placeholder="contact@restaurant.com"
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                type="url"
                defaultValue={initialData?.website || ''}
                placeholder="https://www.restaurant.com"
                className="min-h-[44px]"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input
                id="addressLine1"
                name="addressLine1"
                defaultValue={initialData?.addressLine1 || ''}
                placeholder="123 Main Street"
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressLine2">Address Line 2</Label>
              <Input
                id="addressLine2"
                name="addressLine2"
                defaultValue={initialData?.addressLine2 || ''}
                placeholder="Suite 100"
                className="min-h-[44px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2 md:col-span-2">
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
          
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              name="country"
              defaultValue={initialData?.country || 'United States'}
              placeholder="United States"
              className="min-h-[44px]"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={initialData?.description || ''}
              placeholder="Business description, key products, etc."
              className="min-h-[88px]" // Double touch target for textarea
            />
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