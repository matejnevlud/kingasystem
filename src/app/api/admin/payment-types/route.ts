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

        // Fetch all payment types
        const paymentTypes = await prisma.paymentType.findMany({
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json(paymentTypes);
    } catch (error) {
        console.error('Error fetching payment types:', error);
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

        const { name, abreviation, active } = await request.json();

        // Validate required fields
        if (!name || !abreviation) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create payment type
        const newPaymentType = await prisma.paymentType.create({
            data: {
                name,
                abreviation,
                active: active ?? true
            }
        });

        return NextResponse.json(newPaymentType);
    } catch (error) {
        console.error('Error creating payment type:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}