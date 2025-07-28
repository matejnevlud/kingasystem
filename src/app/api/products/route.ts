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

        // Check if user has access to this unit (admin has access to all units)
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

        // Fetch products for the specified unit
        const products = await prisma.product.findMany({
            where: {
                idUnit: parseInt(unitId),
                active: true,
            },
            orderBy: {
                productName: 'asc',
            },
        });

        return NextResponse.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json(
            {error: 'Failed to fetch products'},
            {status: 500}
        );
    }
}