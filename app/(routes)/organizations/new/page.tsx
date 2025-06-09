'use client';

import { OrganizationForm } from "@/components/organizations/OrganizationForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NewOrganizationPage() {
  const router = useRouter();
  
  const handleSuccess = () => {
    // Redirect to the organizations list after successful creation
    setTimeout(() => {
      router.push('/organizations');
      router.refresh();
    }, 1000);
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
            onSuccess={handleSuccess}
          />
        </CardContent>
      </Card>
    </div>
  );
}
