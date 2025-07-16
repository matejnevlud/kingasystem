import {NextRequest, NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {cookies} from 'next/headers';

// In a real application, you would use a proper hashing library like bcrypt
// For simplicity, we're doing a direct comparison here
// In production, NEVER store passwords in plain text

export async function POST(request: NextRequest) {
    try {
        const {username, password} = await request.json();

        if (!username || !password) {
            return NextResponse.json(
                {error: 'Username and password are required'},
                {status: 400}
            );
        }

        // Find the user by username
        const user = await prisma.user.findFirst({
            where: {
                userName: username,
                active: true,
            },
            include: {
                pageAccess: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                {error: 'Invalid username or password'},
                {status: 401}
            );
        }

        // Check if password matches
        // In a real app, you would use bcrypt.compare
        if (user.password !== password) {
            return NextResponse.json(
                {error: 'Invalid username or password'},
                {status: 401}
            );
        }

        // Create a session object with user info and permissions
        const session = {
            userId: user.id,
            name: user.name,
            pageAccess: user.pageAccess[0] || {},
        };

        // Set a cookie with the session information
        // In a real app, you would encrypt this or use JWT
        const cookieStore = await cookies();
        cookieStore.set('user_session', JSON.stringify(session), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        // Return user info (excluding sensitive data)
        return NextResponse.json({
            id: user.id,
            name: user.name,
            pageAccess: user.pageAccess[0] || {},
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            {error: 'An error occurred during login'},
            {status: 500}
        );
    }
}