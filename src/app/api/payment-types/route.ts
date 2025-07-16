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

        // Fetch all active payment types
        const paymentTypes = await prisma.paymentType.findMany({
            where: {
                active: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        return NextResponse.json(paymentTypes);
    } catch (error) {
        console.error('Error fetching payment types:', error);
        return NextResponse.json(
            {error: 'Failed to fetch payment types'},
            {status: 500}
        );
    }
}