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
        const unitIds = searchParams.getAll('unitIds');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');

        if (!unitIds.length || !dateFrom || !dateTo) {
            return NextResponse.json(
                {error: 'Unit IDs, date from, and date to are required'},
                {status: 400}
            );
        }

        // Convert unit IDs to numbers
        const unitIdNumbers = unitIds.map(id => parseInt(id));

        // Check if user has access to all requested units (admin ID 1 has access to all units)
        if (userId !== 1) {
            const userUnitAccess = await prisma.unitAccess.findMany({
                where: {
                    idUser: userId,
                    idUnit: {in: unitIdNumbers},
                },
            });

            if (userUnitAccess.length !== unitIdNumbers.length) {
                return NextResponse.json(
                    {error: 'You do not have access to all requested units'},
                    {status: 403}
                );
            }
        }

        // Create date objects for filtering
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        // Set time to end of day for toDate
        toDate.setHours(23, 59, 59, 999);

        // Fetch all sales for the specified units and date range (including unverified)
        const sales = await prisma.sale.findMany({
            where: {
                idUnit: {in: unitIdNumbers},
                active: true,
                datetime: {
                    gte: fromDate,
                    lte: toDate,
                },
            },
            include: {
                unit: {
                    select: {
                        unit: true,
                    },
                },
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
        console.error('Error fetching sales overview:', error);
        return NextResponse.json(
            {error: 'Failed to fetch sales overview'},
            {status: 500}
        );
    }
}