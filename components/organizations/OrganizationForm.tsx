'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrganizationValidation, OrganizationFormData } from '@/lib/validations/organization';
import { PriorityBadge } from '@/components/food-service/PriorityBadge';
import { SegmentSelector } from '@/components/food-service/SegmentSelector';
import { DistributorField } from '@/components/food-service/DistributorField';

interface OrganizationFormProps {
  onSubmit: (data: OrganizationFormData) => Promise<void>;
  initialData?: Partial<OrganizationFormData>;
  isLoading?: boolean;
}

export function OrganizationForm({ onSubmit, initialData, isLoading }: OrganizationFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(OrganizationValidation),
    defaultValues: initialData
  });

  const priority = watch('priority');

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Organization Details
          {priority && <PriorityBadge priority={priority} />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Organization Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter organization name"
              className="h-12" // iPad touch target
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Priority Level */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority Level *</Label>
            <Select 
              onValueChange={(value) => setValue('priority', value as any)}
              defaultValue={initialData?.priority}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select priority level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">A - High Priority (Green)</SelectItem>
                <SelectItem value="B">B - Medium Priority (Yellow)</SelectItem>
                <SelectItem value="C">C - Low Priority (Orange)</SelectItem>
                <SelectItem value="D">D - Inactive (Red)</SelectItem>
              </SelectContent>
            </Select>
            {errors.priority && (
              <p className="text-sm text-red-600">{errors.priority.message}</p>
            )}
          </div>

          {/* Market Segment */}
          <div className="space-y-2">
            <Label htmlFor="segment">Market Segment *</Label>
            <SegmentSelector
              value={watch('segment') || ''}
              onValueChange={(value) => setValue('segment', value as any)}
            />
            {errors.segment && (
              <p className="text-sm text-red-600">{errors.segment.message}</p>
            )}
          </div>

          {/* Distributor */}
          <div className="space-y-2">
            <Label htmlFor="distributor">Primary Distributor *</Label>
            <DistributorField
              value={watch('distributor') || ''}
              onValueChange={(value) => setValue('distributor', value as any)}
            />
            {errors.distributor && (
              <p className="text-sm text-red-600">{errors.distributor.message}</p>
            )}
          </div>

          {/* Account Manager */}
          <div className="space-y-2">
            <Label htmlFor="accountManager">Account Manager *</Label>
            <Input
              id="accountManager"
              {...register('accountManager')}
              placeholder="Enter account manager name"
              className="h-12"
              disabled={isLoading}
            />
            {errors.accountManager && (
              <p className="text-sm text-red-600">{errors.accountManager.message}</p>
            )}
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="(555) 123-4567"
                className="h-12"
                disabled={isLoading}
              />
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="contact@restaurant.com"
                className="h-12"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="addressLine1">Address</Label>
            <Input
              id="addressLine1"
              {...register('addressLine1')}
              placeholder="Street address"
              className="h-12"
              disabled={isLoading}
            />
            {errors.addressLine1 && (
              <p className="text-sm text-red-600">{errors.addressLine1.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full h-12 text-lg"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Organization'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
