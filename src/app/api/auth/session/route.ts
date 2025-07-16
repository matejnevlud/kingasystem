import {NextRequest, NextResponse} from 'next/server';
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

        // Return the session data
        return NextResponse.json(session);
    } catch (error) {
        console.error('Session error:', error);
        return NextResponse.json(
            {error: 'Failed to retrieve session'},
            {status: 500}
        );
    }
}