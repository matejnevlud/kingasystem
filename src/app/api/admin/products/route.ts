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

        // Fetch all products with their unit information
        const products = await prisma.product.findMany({
            include: {
                unit: true
            },
            orderBy: {
                productName: 'asc'
            }
        });

        return NextResponse.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
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

        const { idUnit, productName, sellPrice, marginPerc, active } = await request.json();

        // Validate required fields
        if (!idUnit || !productName || sellPrice === undefined || marginPerc === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create product
        const newProduct = await prisma.product.create({
            data: {
                idUnit,
                productName,
                sellPrice,
                marginPerc,
                active: active ?? true
            },
            include: {
                unit: true
            }
        });

        return NextResponse.json(newProduct);
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}