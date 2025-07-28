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

        // Fetch all users with their unit access and page access
        const users = await prisma.user.findMany({
            include: {
                unitAccess: {
                    include: {
                        unit: true
                    }
                },
                pageAccess: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        // Transform data to match frontend expectations
        const transformedUsers = users.map(user => ({
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
        }));

        return NextResponse.json(transformedUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
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

        const { name, userName, password, active, unitAccess, pageAccess } = await request.json();

        // Validate required fields
        if (!name || !userName || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if userName already exists
        const existingUser = await prisma.user.findFirst({
            where: { userName }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
        }

        // Create user with unit access and page access
        const user = await prisma.user.create({
            data: {
                name,
                userName,
                password, // In production, this should be hashed
                active,
                unitAccess: {
                    create: unitAccess.map((unitId: number) => ({
                        idUnit: unitId
                    }))
                },
                pageAccess: {
                    create: [pageAccess]
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
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}