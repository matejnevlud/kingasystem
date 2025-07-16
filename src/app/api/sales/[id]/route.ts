import {NextRequest, NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {cookies} from 'next/headers';

export async function PUT(
    request: NextRequest,
    {params}: { params: Promise<{ id: string }> }
) {
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

        const {amount, paymentTypeId} = await request.json();
        const { id } = await params;
        const saleId = parseInt(id);

        if (!amount || !paymentTypeId) {
            return NextResponse.json(
                {error: 'Amount and Payment Type ID are required'},
                {status: 400}
            );
        }

        // Get the sale to check ownership and unit access
        const existingSale = await prisma.sale.findUnique({
            where: {id: saleId},
            include: {
                unit: true,
            },
        });

        if (!existingSale) {
            return NextResponse.json(
                {error: 'Sale not found'},
                {status: 404}
            );
        }

        // Check if sale is already confirmed
        if (existingSale.confirmed) {
            return NextResponse.json(
                {error: 'Cannot edit confirmed sale'},
                {status: 400}
            );
        }

        // Check if user has access to this unit (skip for user ID 1)
        if (userId !== 1) {
            const unitAccess = await prisma.unitAccess.findFirst({
                where: {
                    idUser: userId,
                    idUnit: existingSale.idUnit,
                },
            });

            if (!unitAccess) {
                return NextResponse.json(
                    {error: 'You do not have access to this unit'},
                    {status: 403}
                );
            }
        }

        // Update the sale
        const updatedSale = await prisma.sale.update({
            where: {id: saleId},
            data: {
                amount: parseInt(amount),
                idPaymentType: parseInt(paymentTypeId),
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

        return NextResponse.json(updatedSale);
    } catch (error) {
        console.error('Error updating sale:', error);
        return NextResponse.json(
            {error: 'Failed to update sale'},
            {status: 500}
        );
    }
}