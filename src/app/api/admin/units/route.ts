import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Get session from cookie
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('user_session');
        
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const session = JSON.parse(sessionCookie.value);
        
        // Check if user has admin access
        if (!session.pageAccess.pgAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch all units
        const units = await prisma.unit.findMany({
            orderBy: {
                unit: 'asc'
            }
        });

        return NextResponse.json(units);
    } catch (error) {
        console.error('Error fetching units:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // Get session from cookie
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('user_session');
        
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const session = JSON.parse(sessionCookie.value);
        
        // Check if user has admin access
        if (!session.pageAccess.pgAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { unit, address, phone, email, active } = await request.json();

        // Validate required fields
        if (!unit || !address) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create unit
        const newUnit = await prisma.unit.create({
            data: {
                unit,
                address,
                phone: phone || '',
                email: email || '',
                active: active ?? true
            }
        });

        return NextResponse.json(newUnit);
    } catch (error) {
        console.error('Error creating unit:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}