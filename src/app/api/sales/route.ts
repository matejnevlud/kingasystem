import {NextRequest, NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {cookies} from 'next/headers';

export async function GET(request: NextRequest) {
    try {
        // Get the session cookie
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('user_session');

        if (!sessionCookie) {
            return NextResponse.json(
                {error: 'No active session'},
                {status: 401}
            );
        }

        // Parse the session data
        const session = JSON.parse(sessionCookie.value);
        const userId = session.userId;

        const searchParams = request.nextUrl.searchParams;
        const unitId = searchParams.get('unitId');

        if (!unitId) {
            return NextResponse.json(
                {error: 'Unit ID is required'},
                {status: 400}
            );
        }

        // Check if user has access to this unit (admin ID 1 has access to all units)
        if (userId !== 1) {
            const unitAccess = await prisma.unitAccess.findFirst({
                where: {
                    idUser: userId,
                    idUnit: parseInt(unitId),
                },
            });

            if (!unitAccess) {
                return NextResponse.json(
                    {error: 'You do not have access to this unit'},
                    {status: 403}
                );
            }
        }

        // Fetch unconfirmed sales for the specified unit
        const sales = await prisma.sale.findMany({
            where: {
                idUnit: parseInt(unitId),
                active: true,
                confirmed: false,
            },
            include: {
                paymentType: {
                    select: {
                        name: true,
                        abreviation: true,
                    },
                },
            },
            orderBy: {
                datetime: 'desc',
            },
        });

        return NextResponse.json(sales);
    } catch (error) {
        console.error('Error fetching sales:', error);
        return NextResponse.json(
            {error: 'Failed to fetch sales'},
            {status: 500}
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        // Get the session cookie
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('user_session');

        if (!sessionCookie) {
            return NextResponse.json(
                {error: 'No active session'},
                {status: 401}
            );
        }

        // Parse the session data
        const session = JSON.parse(sessionCookie.value);
        const userId = session.userId;

        const {unitId, productId, amount, paymentTypeId} = await request.json();

        if (!unitId || !productId || !amount || !paymentTypeId) {
            return NextResponse.json(
                {error: 'Unit ID, Product ID, Amount, and Payment Type ID are required'},
                {status: 400}
            );
        }

        // Check if user has access to this unit (admin ID 1 has access to all units)
        if (userId !== 1) {
            const unitAccess = await prisma.unitAccess.findFirst({
                where: {
                    idUser: userId,
                    idUnit: parseInt(unitId),
                },
            });

            if (!unitAccess) {
                return NextResponse.json(
                    {error: 'You do not have access to this unit'},
                    {status: 403}
                );
            }
        }

        // Get product details
        const product = await prisma.product.findFirst({
            where: {
                id: parseInt(productId),
                idUnit: parseInt(unitId),
                active: true,
            },
        });

        if (!product) {
            return NextResponse.json(
                {error: 'Product not found'},
                {status: 404}
            );
        }

        // Create the sale
        const sale = await prisma.sale.create({
            data: {
                idUser: userId,
                idUnit: parseInt(unitId),
                idPaymentType: parseInt(paymentTypeId),
                amount: parseInt(amount),
                productName: product.productName,
                sellPrice: product.sellPrice,
                marginPerc: product.marginPerc,
                confirmed: false,
                active: true,
            },
            include: {
                paymentType: {
                    select: {
                        name: true,
                        abreviation: true,
                    },
                },
            },
        });

        return NextResponse.json(sale);
    } catch (error) {
        console.error('Error creating sale:', error);
        return NextResponse.json(
            {error: 'Failed to create sale'},
            {status: 500}
        );
    }
}
