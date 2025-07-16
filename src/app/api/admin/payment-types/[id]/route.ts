import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        // Get session from cookie
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('user_session');
        
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const session = JSON.parse(sessionCookie.value);
        
        // Check if user is admin (ID 1)
        if (session.userId !== 1) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const paymentTypeId = parseInt(id);
        const { name, abreviation, active } = await request.json();

        // Validate required fields
        if (!name || !abreviation) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Update payment type
        const updatedPaymentType = await prisma.paymentType.update({
            where: { id: paymentTypeId },
            data: {
                name,
                abreviation,
                active: active ?? true
            }
        });

        return NextResponse.json(updatedPaymentType);
    } catch (error) {
        console.error('Error updating payment type:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        // Get session from cookie
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('user_session');
        
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const session = JSON.parse(sessionCookie.value);
        
        // Check if user is admin (ID 1)
        if (session.userId !== 1) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const paymentTypeId = parseInt(id);

        // Delete payment type
        await prisma.paymentType.delete({
            where: { id: paymentTypeId }
        });

        return NextResponse.json({ message: 'Payment type deleted successfully' });
    } catch (error) {
        console.error('Error deleting payment type:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}