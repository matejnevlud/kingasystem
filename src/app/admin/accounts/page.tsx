'use client';

import {useState, useEffect} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {Select} from 'flowbite-react';

// Define types based on the Prisma schema
type Unit = {
    id: number;
    unit: string;
    address: string;
    phone: string;
    email: string;
    active: boolean;
};

type User = {
    id: number;
    name: string;
    userName: string;
    password: string;
    active: boolean;
    unitAccess: UnitAccess[];
    pageAccess?: PageAccess;
};

type UnitAccess = {
    id: number;
    idUser: number;
    idUnit: number;
    unit: Unit;
};

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
    pgAdmin: boolean;
};

// Define the type for user session
type UserSession = {
    userId: number;
    name: string;
    pageAccess: {
        pgAdmin: boolean;
        [key: string]: any;
    };
};

const pagePermissions = [
    { key: 'pgSales', label: 'Sales' },
    { key: 'pgSalesConfirm', label: 'Sales Confirmation' },
    { key: 'pgSalesOverview', label: 'Sales Overview' },
    { key: 'pgExpenses', label: 'Expenses' },
    { key: 'pgExpensesView', label: 'Expenses View' },
    { key: 'pgResult', label: 'Plan Overview' },
    { key: 'pgBusiness', label: 'Business Plan' },
    { key: 'pgAdmin', label: 'Admin' },
];

export default function AccountsPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<UserSession | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isNewUser, setIsNewUser] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        userName: '',
        password: '',
        active: true,
        unitAccess: [] as number[],
        pageAccess: {
            pgSales: false,
            pgSalesConfirm: false,
            pgSalesOverview: false,
            pgExpenses: false,
            pgExpensesView: false,
            pgResult: false,
            pgBusiness: false,
            pgAdmin: false,
        }
    });
    const router = useRouter();

    // Fetch user session on component mount
    useEffect(() => {
        async function fetchUserSession() {
            try {
                const response = await fetch('/api/auth/session');
                if (!response.ok) {
                    throw new Error('Failed to get session');
                }
                const data = await response.json();

                // Check if user has access to accounts page
                if (!data.pageAccess.pgAdmin) {
                    // Redirect to menu if user doesn't have admin access
                    router.push('/menu');
                    return;
                }

                setUser(data);
            } catch (error) {
                console.error('Error fetching user session:', error);
                // Redirect to login if session can't be retrieved
                router.push('/login');
            }
        }

        fetchUserSession();
    }, [router]);

    // Fetch users and units after user session is loaded
    useEffect(() => {
        if (!user) return;

        async function fetchData() {
            try {
                const [usersResponse, unitsResponse] = await Promise.all([
                    fetch('/api/users'),
                    fetch('/api/units')
                ]);

                if (!usersResponse.ok || !unitsResponse.ok) {
                    throw new Error('Failed to fetch data');
                }

                const [usersData, unitsData] = await Promise.all([
                    usersResponse.json(),
                    unitsResponse.json()
                ]);

                setUsers(usersData);
                setUnits(unitsData);
                setLoading(false);
            } catch (err) {
                setError('Error loading data. Please try again later.');
                setLoading(false);
                console.error('Error fetching data:', err);
            }
        }

        fetchData();
    }, [user]);

    // Handle new user
    const handleNewUser = () => {
        setIsNewUser(true);
        setSelectedUser(null);
        setFormData({
            name: '',
            userName: '',
            password: '',
            active: true,
            unitAccess: [],
            pageAccess: {
                pgSales: false,
                pgSalesConfirm: false,
                pgSalesOverview: false,
                pgExpenses: false,
                pgExpensesView: false,
                pgResult: false,
                pgBusiness: false,
                pgAdmin: false,
            }
        });
        setIsModalOpen(true);
    };

    // Handle user edit
    const handleUserEdit = (user: User) => {
        setIsNewUser(false);
        setSelectedUser(user);
        setFormData({
            name: user.name,
            userName: user.userName,
            password: '',
            active: user.active,
            unitAccess: user.unitAccess.map(ua => ua.idUnit),
            pageAccess: {
                pgSales: user.pageAccess?.pgSales ?? false,
                pgSalesConfirm: user.pageAccess?.pgSalesConfirm ?? false,
                pgSalesOverview: user.pageAccess?.pgSalesOverview ?? false,
                pgExpenses: user.pageAccess?.pgExpenses ?? false,
                pgExpensesView: user.pageAccess?.pgExpensesView ?? false,
                pgResult: user.pageAccess?.pgResult ?? false,
                pgBusiness: user.pageAccess?.pgBusiness ?? false,
                pgAdmin: user.pageAccess?.pgAdmin ?? false,
            }
        });
        setIsModalOpen(true);
    };

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        
        if (name.startsWith('pageAccess.')) {
            const pageKey = name.replace('pageAccess.', '');
            setFormData(prev => ({
                ...prev,
                pageAccess: {
                    ...prev.pageAccess,
                    [pageKey]: checked
                }
            }));
        } else if (type === 'checkbox') {
            setFormData(prev => ({
                ...prev,
                [name]: checked
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Handle unit access change
    const handleUnitAccessChange = (unitId: number) => {
        setFormData(prev => ({
            ...prev,
            unitAccess: prev.unitAccess.includes(unitId)
                ? prev.unitAccess.filter(id => id !== unitId)
                : [...prev.unitAccess, unitId]
        }));
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.userName || (isNewUser && !formData.password)) {
            setError('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const url = isNewUser ? '/api/users' : `/api/users/${selectedUser?.id}`;
            const method = isNewUser ? 'POST' : 'PUT';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Failed to save user');
            }

            const savedUser = await response.json();

            if (isNewUser) {
                setUsers(prev => [...prev, savedUser]);
            } else {
                setUsers(prev => prev.map(u => u.id === savedUser.id ? savedUser : u));
            }

            setIsModalOpen(false);
            setSelectedUser(null);
        } catch (err) {
            setError('Error saving user. Please try again.');
            console.error('Error saving user:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle modal close
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
        setIsNewUser(false);
    };

    return (
        <div className="absolute inset-0 bg-gray-50">
            <div className="bg-white shadow-md rounded-lg m-4 h-[calc(100vh-2rem)] flex flex-col">
                {/* Fixed Header */}
                <div className="flex-shrink-0 p-4 border-b">
                    <div className="flex justify-between items-center">
                        <Link
                            href="/menu"
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/>
                            </svg>
                            Back
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-800">Admin - User Management</h1>
                        <button
                            onClick={handleNewUser}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            Add User
                        </button>
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto">
                    {/* Loading and Error States */}
                    {loading && (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                                <p className="text-gray-600">Loading...</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="m-4 bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                            <p className="text-red-700 font-medium">{error}</p>
                        </div>
                    )}

                    {/* Users Table */}
                    {!loading && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="hover:bg-gray-50 cursor-pointer"
                                        onClick={() => handleUserEdit(user)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {user.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {user.userName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {user.unitAccess.map(ua => ua.unit.unit).join(', ')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                user.active 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {user.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white max-h-[80vh] overflow-y-auto">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                {isNewUser ? 'Add New User' : 'Edit User'}
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                {/* Username */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Username *
                                    </label>
                                    <input
                                        type="text"
                                        name="userName"
                                        value={formData.userName}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Password {isNewUser ? '*' : '(leave blank to keep current)'}
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required={isNewUser}
                                    />
                                </div>

                                {/* Active */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="active"
                                        checked={formData.active}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label className="ml-2 text-sm text-gray-700">
                                        Active
                                    </label>
                                </div>

                                {/* Unit Access */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Unit Access
                                    </label>
                                    <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                                        {units.map((unit) => (
                                            <label key={unit.id} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.unitAccess.includes(unit.id)}
                                                    onChange={() => handleUnitAccessChange(unit.id)}
                                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">{unit.unit}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Page Access */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Page Access
                                    </label>
                                    <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                                        {pagePermissions.map((perm) => (
                                            <label key={perm.key} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    name={`pageAccess.${perm.key}`}
                                                    checked={formData.pageAccess[perm.key as keyof typeof formData.pageAccess]}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">{perm.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Modal Actions */}
                                <div className="flex justify-center space-x-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={handleCloseModal}
                            className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}