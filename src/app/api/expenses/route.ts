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
        if (!session.pageAccess.pgAdmin) {
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

        // Fetch expenses for the specified unit
        const expenses = await prisma.expense.findMany({
            where: {
                idUnit: parseInt(unitId),
                active: true,
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
        console.error('Error fetching expenses:', error);
        return NextResponse.json(
            {error: 'Failed to fetch expenses'},
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

        const {datetime, unitId, paymentTypeId, amount, description, vendor, category} = await request.json();

        if (!unitId || !paymentTypeId || !amount || !description || !vendor || !category) {
            return NextResponse.json(
                {error: 'All fields are required'},
                {status: 400}
            );
        }

        // Validate category
        const validCategories = ['D', 'I', 'O', 'T'];
        if (!validCategories.includes(category)) {
            return NextResponse.json(
                {error: 'Invalid category. Must be one of: D, I, O, T'},
                {status: 400}
            );
        }

        // Check if user has access to this unit (admin ID 1 has access to all units)
        if (!session.pageAccess.pgAdmin) {
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

        // Validate payment type exists
        const paymentType = await prisma.paymentType.findFirst({
            where: {
                id: parseInt(paymentTypeId),
                active: true,
            },
        });

        if (!paymentType) {
            return NextResponse.json(
                {error: 'Payment type not found'},
                {status: 404}
            );
        }

        // Create the expense
        const expense = await prisma.expense.create({
            data: {
                idUser: userId,
                idUnit: parseInt(unitId),
                idPaymentType: parseInt(paymentTypeId),
                vendor: parseInt(vendor),
                description: description,
                cost: parseFloat(amount),
                category: category,
                datetime: datetime ? new Date(datetime) : new Date(),
                active: true,
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
        });

        return NextResponse.json(expense);
    } catch (error) {
        console.error('Error creating expense:', error);
        return NextResponse.json(
            {error: 'Failed to create expense'},
            {status: 500}
        );
    }
}