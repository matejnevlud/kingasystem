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
        const userId = parseInt(id);
        const { name, userName, password, active, unitAccess, pageAccess } = await request.json();

        // Validate required fields
        if (!name || !userName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if userName already exists for another user
        const existingUser = await prisma.user.findFirst({
            where: { 
                userName,
                NOT: { id: userId }
            }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
        }

        // Prepare update data
        const updateData: any = {
            name,
            userName,
            active,
        };

        // Only update password if provided
        if (password && password.trim() !== '') {
            updateData.password = password; // In production, this should be hashed
        }

        // Update user with unit access and page access
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                ...updateData,
                unitAccess: {
                    deleteMany: {}, // Remove all existing unit access
                    create: unitAccess.map((unitId: number) => ({
                        idUnit: unitId
                    }))
                },
                pageAccess: {
                    deleteMany: {}, // Remove all existing page access
                    create: [{
                        ...pageAccess
                    }]
                }
            },
            include: {
                unitAccess: {
                    include: {
                        unit: true
                    }
                },
                pageAccess: true
            }
        });

        // Transform data to match frontend expectations
        const transformedUser = {
            ...user,
            pageAccess: user.pageAccess[0] || {
                pgSales: false,
                pgSalesConfirm: false,
                pgSalesOverview: false,
                pgExpenses: false,
                pgExpensesView: false,
                pgResult: false,
                pgBusiness: false,
                pgAdmin: false,
            }
        };

        return NextResponse.json(transformedUser);
    } catch (error) {
        console.error('Error updating user:', error);
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
        const userId = parseInt(id);

        // Don't allow deleting user with ID 1 (admin)
        if (userId === 1) {
            return NextResponse.json({ error: 'Cannot delete admin user' }, { status: 400 });
        }

        // Delete user (this will cascade to unitAccess and pageAccess)
        await prisma.user.delete({
            where: { id: userId }
        });

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}