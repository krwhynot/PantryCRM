"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { ResponsiveCard } from "@/components/ui/responsive-card";
import { ResponsiveForm } from "@/components/form/ResponsiveForm";
import { useDevice } from "@/app/providers/DeviceProvider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IconButton } from "@/components/ui/IconButton";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { Plus, Search, Settings } from "lucide-react";/**
 * Test page for responsive UI components
 * Demonstrates touch-friendly components with minimum 44px touch targets
 */
export default function TestResponsivePage() {
  const { isTouchDevice, isTablet, isMobile, isDesktop } = useDevice();
  
  return (
    <ResponsiveLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Touch-Friendly UI Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ResponsiveCard 
            title="Device Detection" 
            description="Current device information"
          >
            <div className="space-y-2">
              <p><strong>Touch Device:</strong> {isTouchDevice ? "Yes" : "No"}</p>
              <p><strong>Device Type:</strong> {isTablet ? "Tablet" : isMobile ? "Mobile" : "Desktop"}</p>
              <p><strong>CSS Classes:</strong> {isTouchDevice ? "touch-device" : "mouse-device"}</p>
            </div>
          </ResponsiveCard>
          
          <ResponsiveCard 
            title="Interactive Elements" 
            description="Test touch targets (min 44px)"
          >
            <div className="flex flex-wrap gap-4">
              <Button>Default Button</Button>
              <Button variant="outline">Outline</Button>
              <IconButton icon={<Plus />} />
              <IconButton icon={<Search />} />
            </div>
          </ResponsiveCard>
        </div>
                <ResponsiveCard 
          title="Form Elements" 
          description="Touch-friendly form controls"
          className="mt-6"
        >
          <ResponsiveForm>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
              <div className="space-y-2">
                <label htmlFor="name">Name</label>
                <Input id="name" placeholder="Enter your name" />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email">Email</label>
                <Input id="email" type="email" placeholder="Enter your email" />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="type">Customer Type</label>
                <Select>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="cafe">Cafe</SelectItem>
                    <SelectItem value="bakery">Bakery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="priority">Priority</label>
                <Select>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
                        <div className="flex items-center space-x-2 mt-4">
              <Checkbox id="terms" />
              <label htmlFor="terms">I agree to the terms and conditions</label>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button type="submit">Submit</Button>
            </div>
          </ResponsiveForm>
        </ResponsiveCard>
        
        <ResponsiveCard 
          title="Data Table" 
          description="Touch-friendly table with 44px row height"
          className="mt-6"
        >
          <ResponsiveTable 
            headers={["Name", "Type", "Priority", "Status"]}
            data={[
              ["ABC Restaurant", "Restaurant", "High", "Active"],
              ["City Cafe", "Cafe", "Medium", "Active"],
              ["Sweet Bakery", "Bakery", "Low", "Inactive"],
              ["Gourmet Foods", "Distributor", "High", "Active"],
              ["Fresh Produce", "Supplier", "Medium", "Active"]
            ]}
            onRowClick={(index) => console.log(`Row ${index} clicked`)}
          />
        </ResponsiveCard>
      </div>
    </ResponsiveLayout>
  );
}