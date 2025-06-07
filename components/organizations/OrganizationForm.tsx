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
  priorityId: z.string().optional(),
  segmentId: z.string().optional(),
  distributorId: z.string().optional(),
  accountManagerId: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
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
              <Label htmlFor="priorityId">Priority Level</Label>
              <Select onValueChange={(value) => form.setValue('priorityId', value)} defaultValue={initialData?.priorityId}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority-a">A - High Priority</SelectItem>
                  <SelectItem value="priority-b">B - Medium Priority</SelectItem>
                  <SelectItem value="priority-c">C - Low Priority</SelectItem>
                  <SelectItem value="priority-d">D - Watch List</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="segmentId">Market Segment</Label>
              <Select onValueChange={(value) => form.setValue('segmentId', value)} defaultValue={initialData?.segmentId}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select segment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fine-dining">Fine Dining</SelectItem>
                  <SelectItem value="fast-food">Fast Food</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="catering">Catering</SelectItem>
                  <SelectItem value="institutional">Institutional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="distributorId">Distributor</Label>
              <Select onValueChange={(value) => form.setValue('distributorId', value)} defaultValue={initialData?.distributorId}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select distributor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sysco">Sysco</SelectItem>
                  <SelectItem value="usf">US Foods</SelectItem>
                  <SelectItem value="pfg">Performance Food Group</SelectItem>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
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
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                {...form.register('website')}
                placeholder="https://restaurant.com"
                className="min-h-[44px]"
              />
            </div>
          </div>

          {/* Address Fields */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              {...form.register('address')}
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