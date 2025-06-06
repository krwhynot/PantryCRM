'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/food-service/PriorityBadge";

interface Setting {
  id: string;
  key: string;
  value: string;
  category: string;
  sortOrder: number;
  color?: string;
}

type SettingsByCategory = Record<string, Setting[]>;

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsByCategory>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PRIORITY');

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          
          // Group settings by category
          const grouped = data.settings.reduce((acc: SettingsByCategory, setting: Setting) => {
            const category = setting.category;
            if (!acc[category]) {
              acc[category] = [];
            }
            acc[category].push(setting);
            return acc;
          }, {});
          
          setSettings(grouped);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchSettings();
  }, []);

  // Get unique categories
  const categories = Object.keys(settings).sort();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Food Service Settings</h1>
      
      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="text-center">Loading settings...</div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Setting Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs 
              defaultValue={activeTab} 
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 lg:grid-cols-9 h-auto">
                {categories.map(category => (
                  <TabsTrigger 
                    key={category} 
                    value={category}
                    className="h-12 text-sm"
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {categories.map(category => (
                <TabsContent key={category} value={category} className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{category} Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Key</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead>Sort Order</TableHead>
                            {category === 'PRIORITY' && <TableHead>Color</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {settings[category]?.sort((a, b) => a.sortOrder - b.sortOrder).map((setting) => (
                            <TableRow key={setting.id}>
                              <TableCell>{setting.key}</TableCell>
                              <TableCell>{setting.value}</TableCell>
                              <TableCell>{setting.sortOrder}</TableCell>
                              {category === 'PRIORITY' && (
                                <TableCell>
                                  <PriorityBadge priority={setting.key as 'A' | 'B' | 'C' | 'D'} />
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
