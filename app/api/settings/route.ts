import { NextRequest, NextResponse } from 'next/server';
import { prismadb } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Get all settings with optimized selection
    const settings = await prismadb.setting.findMany({
      select: {
        id: true,
        key: true,
        label: true,
        category: true,
        sortOrder: true,
        color: true,
        active: true,
        createdAt: true,
        updatedAt: true
      },
      where: {
        active: true
      },
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' }
      ]
    });

    return NextResponse.json({
      settings,
      count: settings.length
    });
  } catch (error) {
    console.error('Settings API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Basic validation
    if (!body.key || !body.label || !body.category) {
      return NextResponse.json(
        { error: 'Key, label, and category are required' },
        { status: 400 }
      );
    }

    const setting = await prismadb.setting.create({
      data: {
        key: body.key,
        label: body.label,
        category: body.category,
        sortOrder: body.sortOrder || 0,
        color: body.color,
        active: body.active ?? true
      }
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
