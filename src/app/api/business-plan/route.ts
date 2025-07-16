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
        const year = searchParams.get('year');
        const month = searchParams.get('month');

        if (!year || !month) {
            return NextResponse.json(
                {error: 'Year and month are required'},
                {status: 400}
            );
        }

        // Get units that user has access to
        let unitIds: number[];
        
        if (userId !== 1) {
            const userUnits = await prisma.unitAccess.findMany({
                where: {
                    idUser: userId,
                },
                select: {
                    idUnit: true,
                },
            });

            unitIds = userUnits.map(ua => ua.idUnit);

            if (unitIds.length === 0) {
                return NextResponse.json([]);
            }
        } else {
            // User ID 1 has access to all units
            const allUnits = await prisma.unit.findMany({
                select: {
                    id: true,
                },
            });
            unitIds = allUnits.map(unit => unit.id);
        }

        // Fetch business plans for the specified year, month, and user's units
        const businessPlans = await prisma.businessPlan.findMany({
            where: {
                year: parseInt(year),
                month: parseInt(month),
                idUnit: {in: unitIds},
            },
            include: {
                unit: {
                    select: {
                        id: true,
                        unit: true,
                    },
                },
            },
            orderBy: {
                unit: {
                    unit: 'asc',
                },
            },
        });

        return NextResponse.json(businessPlans);
    } catch (error) {
        console.error('Error fetching business plans:', error);
        return NextResponse.json(
            {error: 'Failed to fetch business plans'},
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

        const {year, month, unitId, revenue, indirectPerc, tax, ooc} = await request.json();

        if (!year || !month || !unitId || revenue === undefined || indirectPerc === undefined || tax === undefined || ooc === undefined) {
            return NextResponse.json(
                {error: 'Year, month, unitId, revenue, indirectPerc, tax, and ooc are required'},
                {status: 400}
            );
        }

        // Check if user has access to this unit
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

        // Create the business plan
        const businessPlan = await prisma.businessPlan.create({
            data: {
                year: parseInt(year),
                month: parseInt(month),
                idUnit: parseInt(unitId),
                revenue: parseInt(revenue),
                indirectPerc: parseFloat(indirectPerc),
                tax: parseInt(tax),
                ooc: parseInt(ooc),
            },
            include: {
                unit: {
                    select: {
                        id: true,
                        unit: true,
                    },
                },
            },
        });

        return NextResponse.json(businessPlan);
    } catch (error) {
        console.error('Error creating business plan:', error);
        return NextResponse.json(
            {error: 'Failed to create business plan'},
            {status: 500}
        );
    }
}

export async function PUT(request: NextRequest) {
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

        const {year, month, unitId, revenue, indirectPerc, tax, ooc} = await request.json();

        if (!year || !month || !unitId || revenue === undefined || indirectPerc === undefined || tax === undefined || ooc === undefined) {
            return NextResponse.json(
                {error: 'Year, month, unitId, revenue, indirectPerc, tax, and ooc are required'},
                {status: 400}
            );
        }

        // Check if user has access to this unit
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

        // Find existing business plan
        const existingPlan = await prisma.businessPlan.findFirst({
            where: {
                year: parseInt(year),
                month: parseInt(month),
                idUnit: parseInt(unitId),
            },
        });

        if (!existingPlan) {
            return NextResponse.json(
                {error: 'Business plan not found'},
                {status: 404}
            );
        }

        // Update the business plan
        const businessPlan = await prisma.businessPlan.update({
            where: {
                id: existingPlan.id,
            },
            data: {
                revenue: parseInt(revenue),
                indirectPerc: parseFloat(indirectPerc),
                tax: parseInt(tax),
                ooc: parseInt(ooc),
            },
            include: {
                unit: {
                    select: {
                        id: true,
                        unit: true,
                    },
                },
            },
        });

        return NextResponse.json(businessPlan);
    } catch (error) {
        console.error('Error updating business plan:', error);
        return NextResponse.json(
            {error: 'Failed to update business plan'},
            {status: 500}
        );
    }
}