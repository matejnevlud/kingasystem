'use client';

import {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';

// Define the type for page access permissions
type PageAccess = {
    id: number;
    idUser: number;
    pgSales: boolean;
    pgSalesConfirm: boolean;
    pgSalesOverview: boolean;
    pgExpenses: boolean;
    pgExpensesView: boolean;
    pgResult: boolean;
    pgBusiness: boolean;
    pgAccounts: boolean;
};

// Define the type for user session
type UserSession = {
    userId: number;
    name: string;
    pageAccess: PageAccess;
};

export default function MenuPage() {
    const [user, setUser] = useState<UserSession | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Get user session from cookie
        const getUserSession = async () => {
            try {
                const response = await fetch('/api/auth/session');
                if (!response.ok) {
                    throw new Error('Failed to get session');
                }
                const data = await response.json();
                setUser(data);
            } catch (error) {
                console.error('Error fetching user session:', error);
                // Redirect to login if session can't be retrieved
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        getUserSession();
    }, [router]);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
            });
            router.push('/login');
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg">Loading...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg">Session expired. Redirecting to login...</p>
            </div>
        );
    }

    // Define menu items with their access requirements
    const menuItems = [
        {name: 'Sales', path: '/sales', access: user.pageAccess.pgSales},
        {name: 'Sales Confirmation', path: '/salesconfirmation', access: user.pageAccess.pgSalesConfirm},
        {name: 'Sales Overview', path: '/salesoverview', access: user.pageAccess.pgSalesOverview},
        {name: 'Expenses', path: '/expenses', access: user.pageAccess.pgExpenses},
        {name: 'Expenses Overview', path: '/expensesoverview', access: user.pageAccess.pgExpensesView},
        {name: 'Business Plan', path: '/business', access: user.pageAccess.pgBusiness},
        {name: 'Plan Overview', path: '/planoverview', access: user.pageAccess.pgResult},
        {name: 'Accounts', path: '/accounts', access: user.pageAccess.pgAccounts},
    ];

    // Define admin-only menu items (only for user ID 1)
    const adminMenuItems = [
        {name: 'Admin - Units', path: '/admin/units', access: user.userId === 1},
        {name: 'Admin - Products', path: '/admin/products', access: user.userId === 1},
        {name: 'Admin - Payment Types', path: '/admin/payment-types', access: user.userId === 1},
    ];

    // Filter menu items based on user's access permissions
    const accessibleMenuItems = menuItems.filter(item => item.access);
    const accessibleAdminMenuItems = adminMenuItems.filter(item => item.access);

    return (
        <div className="absolute inset-0 bg-gray-50">
            <div className="h-full flex flex-col">
                <div className="bg-white shadow-md rounded-lg m-4 flex-1 flex flex-col">
                    <div className="flex-1 overflow-y-auto p-6">
                        {accessibleMenuItems.length === 0 && accessibleAdminMenuItems.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">
                                You don't have access to any pages yet. Please contact your administrator.
                            </p>
                        ) : (
                            <nav className="space-y-2">
                                <div className="block w-full text-left px-4 py-2 bg-blue-50 rounded">
                                    <h1 className="text-2xl font-extrabold text-gray-900">Kinga System</h1>
                                </div>
                                {accessibleMenuItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        className="block w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                                {accessibleAdminMenuItems.length > 0 && (
                                    <>
                                        <div className="block w-full text-left px-4 py-2 bg-orange-50 rounded mt-4">
                                            <h2 className="text-lg font-bold text-gray-900">Admin</h2>
                                        </div>
                                        {accessibleAdminMenuItems.map((item) => (
                                            <Link
                                                key={item.path}
                                                href={item.path}
                                                className="block w-full text-left px-4 py-2 bg-orange-50 hover:bg-orange-100 rounded transition-colors text-orange-800"
                                            >
                                                {item.name}
                                            </Link>
                                        ))}
                                    </>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="block w-full text-left px-4 py-2 bg-red-50 hover:bg-red-100 rounded transition-colors text-red-600"
                                >
                                    Logout
                                </button>
                            </nav>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}