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

        if (!unitIds.length) {
            return NextResponse.json(
                {error: 'Unit IDs are required'},
                {status: 400}
            );
        }

        if (!dateFrom || !dateTo) {
            return NextResponse.json(
                {error: 'Date range is required'},
                {status: 400}
            );
        }

        // Convert unitIds to numbers
        const unitIdNumbers = unitIds.map(id => parseInt(id));

        // Check if user has access to all requested units (admin ID 1 has access to all units)
        if (!session.pageAccess.pgAdmin) {
            const unitAccess = await prisma.unitAccess.findMany({
                where: {
                    idUser: userId,
                    idUnit: {in: unitIdNumbers},
                },
            });

            if (unitAccess.length !== unitIdNumbers.length) {
                return NextResponse.json(
                    {error: 'You do not have access to all requested units'},
                    {status: 403}
                );
            }
        }

        // Create date range for filtering
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999); // Include the entire end date

        // Fetch expenses for the specified units and date range
        const expenses = await prisma.expense.findMany({
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

        return NextResponse.json(expenses);
    } catch (error) {
        console.error('Error fetching expenses overview:', error);
        return NextResponse.json(
            {error: 'Failed to fetch expenses overview'},
            {status: 500}
        );
    }
}