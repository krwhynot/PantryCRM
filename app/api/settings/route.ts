import { NextRequest, NextResponse } from 'next/server';
import { settingsService } from '@/lib/services/settings-service';
import { SettingCategories, SettingTypes } from '@/lib/db/schema/settings';

import { requireAuth, withRateLimit } from '@/lib/security';
import { withErrorHandler } from '@/lib/api-error-handler';

async function handleGET(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;
  try {
    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const searchTerm = searchParams.get('search');
    const grouped = searchParams.get('grouped') === 'true';

    if (grouped) {
      // Return settings grouped by category with metadata
      const settingsWithMetadata = await settingsService.getSettingsWithMetadata();
      const groupedSettings: Record<string, any[]> = {};
      
      settingsWithMetadata.forEach(setting => {
        if (!groupedSettings[setting.category]) {
          groupedSettings[setting.category] = [];
        }
        groupedSettings[setting.category].push(setting);
      });

      return NextResponse.json({
        settings: groupedSettings,
        categories: settingsService.getCategories(),
        count: settingsWithMetadata.length
      });
    } else {
      // Return flat list of settings
      const settings = await settingsService.getSettings({
        category: category as any,
        type: type as any,
        searchTerm: searchTerm || undefined,
        active: true
      });

      return NextResponse.json({
        settings,
        count: settings.length
      });
    }
  } catch (error) {
    console.error('Settings API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

async function handlePOST(req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<NextResponse> {
  // Check authentication
  const { user, error } = await requireAuth(req);
  if (error) return error;
  try {
    const body = await req.json();
    
    // Basic validation
    if (!body.key || !body.label || !body.category) {
      return NextResponse.json(
        { error: 'Key, label, and category are required' },
        { status: 400 }
      );
    }

    // Validate category
    if (!Object.values(SettingCategories).includes(body.category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Validate type if provided
    if (body.type && !Object.values(SettingTypes).includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid type' },
        { status: 400 }
      );
    }

    // Validate value if provided
    if (body.value && body.type) {
      const validation = settingsService.validateSettingValue(body.value, body.type);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }
    }

    const setting = await settingsService.upsertSetting({
      key: body.key,
      value: body.value || '',
      label: body.label,
      category: body.category,
      type: body.type || SettingTypes.STRING,
      sortOrder: body.sortOrder || 0,
      color: body.color,
      description: body.description,
      active: body.active ?? true
    });

    return NextResponse.json(setting, { status: 201 });
  } catch (error) {
    console.error('Create Setting Error:', error);
    return NextResponse.json(
      { error: 'Failed to create setting' },
      { status: 500 }
    );
  }
}




// Export with authentication, rate limiting, and error handling
export const GET = withRateLimit(withErrorHandler(handleGET), { maxAttempts: 100, windowMs: 60000 });
export const POST = withRateLimit(withErrorHandler(handlePOST), { maxAttempts: 100, windowMs: 60000 });