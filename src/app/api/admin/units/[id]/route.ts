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
        
        // Check if user has admin access
        if (!session.pageAccess.pgAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const unitId = parseInt(id);
        const { unit, address, phone, email, active } = await request.json();

        // Validate required fields
        if (!unit || !address) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Update unit
        const updatedUnit = await prisma.unit.update({
            where: { id: unitId },
            data: {
                unit,
                address,
                phone: phone || '',
                email: email || '',
                active: active ?? true
            }
        });

        return NextResponse.json(updatedUnit);
    } catch (error) {
        console.error('Error updating unit:', error);
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
        
        // Check if user has admin access
        if (!session.pageAccess.pgAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const unitId = parseInt(id);

        // Delete unit
        await prisma.unit.delete({
            where: { id: unitId }
        });

        return NextResponse.json({ message: 'Unit deleted successfully' });
    } catch (error) {
        console.error('Error deleting unit:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}