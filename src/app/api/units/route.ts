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

        // Fetch units - admin gets all units, others get only accessible units
        const units = await prisma.unit.findMany({
            where: {
                active: true,
                ...(!session.pageAccess.pgAdmin && {
                    unitAccess: {
                        some: {
                            idUser: userId
                        }
                    }
                })
            },
            orderBy: {
                unit: 'asc',
            },
        });

        return NextResponse.json(units);
    } catch (error) {
        console.error('Error fetching units:', error);
        return NextResponse.json(
            {error: 'Failed to fetch units'},
            {status: 500}
        );
    }
}
