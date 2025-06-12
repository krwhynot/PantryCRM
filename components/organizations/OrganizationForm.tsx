'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

const OrganizationFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  priority: z.enum(['A', 'B', 'C', 'D']).optional(),
  segment: z.enum(['Fine Dining', 'Fast Food', 'Healthcare', 'Catering', 'Institutional']).optional(),
  distributor: z.enum(['Sysco', 'USF', 'PFG', 'Direct', 'Other']).optional(),
  accountManagerId: z.string().optional(),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format').optional(),
  email: z.string().email('Invalid email format').optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
});

type OrganizationFormData = z.infer<typeof OrganizationFormSchema>;

interface OrganizationFormProps {
  onSuccess?: () => void;
  initialData?: Partial<OrganizationFormData>;
}

export function OrganizationForm({ onSuccess, initialData }: OrganizationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(OrganizationFormSchema),
    defaultValues: initialData || {},
  });

  const onSubmit = async (data: OrganizationFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create organization');
      }

      toast({ title: 'Success', description: 'Organization created successfully' });
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to create organization',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>New Organization</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Organization Name - Required */}
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name *</Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="Restaurant name, catering company, etc."
              className="min-h-[44px]" // Touch target compliance
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Food Service Fields Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority Level</Label>
              <Select onValueChange={(value) => form.setValue('priority', value as 'A' | 'B' | 'C' | 'D')} defaultValue={initialData?.priority}>
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
              <Select onValueChange={(value) => form.setValue('segment', value as 'Fine Dining' | 'Fast Food' | 'Healthcare' | 'Catering' | 'Institutional')} defaultValue={initialData?.segment}>
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
              <Select onValueChange={(value) => form.setValue('distributor', value as 'Sysco' | 'USF' | 'PFG' | 'Direct' | 'Other')} defaultValue={initialData?.distributor}>
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
                {...form.register('phone')}
                placeholder="(555) 123-4567"
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                placeholder="contact@restaurant.com"
                className="min-h-[44px]"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              {...form.register('website')}
              placeholder="https://restaurant.com"
              className="min-h-[44px]"
            />
          </div>

          {/* Address Fields */}
          <div className="space-y-2">
            <Label htmlFor="addressLine1">Address</Label>
            <Input
              id="addressLine1"
              {...form.register('addressLine1')}
              placeholder="123 Main Street"
              className="min-h-[44px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                {...form.register('city')}
                placeholder="Houston"
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                {...form.register('state')}
                placeholder="TX"
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                {...form.register('zipCode')}
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
              {...form.register('notes')}
              placeholder="Additional information about this organization..."
              className="min-h-[88px]" // Double touch target for textarea
            />
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full min-h-[44px] mt-6"
          >
            {isLoading ? 'Creating...' : 'Create Organization'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}