import {NextRequest, NextResponse} from 'next/server';
import {cookies} from 'next/headers';

export async function POST(request: NextRequest) {
    try {
        // Get the cookie store
        const cookieStore = await cookies();

        // Delete the session cookie
        cookieStore.delete('user_session');

        // Return success response
        return NextResponse.json({success: true});
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            {error: 'Failed to logout'},
            {status: 500}
        );
    }
}