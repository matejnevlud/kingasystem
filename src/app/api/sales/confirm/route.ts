import {NextRequest, NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {cookies} from 'next/headers';

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

        const {unitId, saleIds} = await request.json();

        if (!unitId || !saleIds || !Array.isArray(saleIds)) {
            return NextResponse.json(
                {error: 'Unit ID and Sale IDs are required'},
                {status: 400}
            );
        }

        // Check if user has access to this unit (skip check for user ID 1)
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

        // Verify all sales belong to the specified unit and are not already confirmed
        const sales = await prisma.sale.findMany({
            where: {
                id: {in: saleIds.map(id => parseInt(id))},
                idUnit: parseInt(unitId),
                confirmed: false,
                active: true,
            },
        });

        if (sales.length !== saleIds.length) {
            return NextResponse.json(
                {error: 'Some sales are invalid or already confirmed'},
                {status: 400}
            );
        }

        // Confirm all sales
        const confirmedSales = await prisma.sale.updateMany({
            where: {
                id: {in: saleIds.map(id => parseInt(id))},
                idUnit: parseInt(unitId),
                confirmed: false,
                active: true,
            },
            data: {
                confirmed: true,
            },
        });

        return NextResponse.json({
            message: 'Sales confirmed successfully',
            confirmedCount: confirmedSales.count,
        });
    } catch (error) {
        console.error('Error confirming sales:', error);
        return NextResponse.json(
            {error: 'Failed to confirm sales'},
            {status: 500}
        );
    }
}