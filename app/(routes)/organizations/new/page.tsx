'use client';

import { useState } from 'react';
import { OrganizationForm } from "@/components/organizations/OrganizationForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrganizationFormData } from "@/lib/validations/organization";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NewOrganizationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const handleSubmit = async (data: OrganizationFormData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create organization');
      }
      
      const result = await response.json();
      toast.success('Organization created successfully!');
      
      // Redirect to the organizations list after successful creation
      setTimeout(() => {
        router.push('/organizations');
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create organization');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/organizations">
          <Button variant="ghost" className="h-12 min-w-[44px]">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Organizations
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">New Organization</CardTitle>
        </CardHeader>
        <CardContent>
          <OrganizationForm 
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
