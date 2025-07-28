import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';

// Define public paths that don't require authentication
const publicPaths = ['/login'];

export function middleware(request: NextRequest) {
    const {pathname} = request.nextUrl;

    // Check if the path is public
    if (publicPaths.includes(pathname)) {
        return NextResponse.next();
    }

    // Check for user session cookie
    const sessionCookie = request.cookies.get('user_session');

    // If no session cookie is found, redirect to login
    if (!sessionCookie) {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    try {
        // Parse the session data
        const session = JSON.parse(sessionCookie.value);

        // If we're accessing the menu or a specific page, check permissions
        if (pathname !== '/' && pathname !== '/menu') {
            // Map paths to their corresponding page access keys
            const pathToPermissionMap: { [key: string]: keyof typeof session.pageAccess } = {
                '/sales': 'pgSales',
                '/salesconfirmation': 'pgSalesConfirm',
                '/salesoverview': 'pgSalesOverview',
                '/expenses': 'pgExpenses',
                '/expensesoverview': 'pgExpensesView',
                '/business': 'pgBusiness',
                '/planoverview': 'pgResult'
            };

            // Get the permission key for this path
            let pageAccessKey = pathToPermissionMap[pathname];

            // Handle admin paths (any path starting with /admin requires pgAdmin)
            if (pathname.startsWith('/admin')) {
                pageAccessKey = 'pgAdmin';
            }

            // If we have a mapping and the user doesn't have access, redirect
            if (pageAccessKey && !session.pageAccess[pageAccessKey]) {
                const menuUrl = new URL('/menu', request.url);
                return NextResponse.redirect(menuUrl);
            }
        }

        return NextResponse.next();
    } catch (error) {
        // If there's an error parsing the session, redirect to login
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }
}

// Configure the middleware to run on specific paths
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (public directory)
         * - api routes (API endpoints)
         */
        '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
    ],
};