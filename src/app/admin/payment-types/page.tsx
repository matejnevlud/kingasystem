'use client';

import {useState, useEffect} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';

// Define types based on the Prisma schema
type PaymentType = {
    id: number;
    name: string;
    abreviation: string;
    active: boolean;
};

// Define the type for user session
type UserSession = {
    userId: number;
    name: string;
    pageAccess: {
        [key: string]: any;
    };
};

export default function AdminPaymentTypesPage() {
    const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<UserSession | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentType | null>(null);
    const [isNewPaymentType, setIsNewPaymentType] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        abreviation: '',
        active: true
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

                // Check if user has admin access
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

    // Fetch payment types after user session is loaded
    useEffect(() => {
        if (!user) return;

        async function fetchPaymentTypes() {
            try {
                const response = await fetch('/api/admin/payment-types');
                if (!response.ok) {
                    throw new Error('Failed to fetch payment types');
                }
                const data = await response.json();
                setPaymentTypes(data);
                setLoading(false);
            } catch (err) {
                setError('Error loading payment types. Please try again later.');
                setLoading(false);
                console.error('Error fetching payment types:', err);
            }
        }

        fetchPaymentTypes();
    }, [user]);

    // Handle new payment type
    const handleNewPaymentType = () => {
        setIsNewPaymentType(true);
        setSelectedPaymentType(null);
        setFormData({
            name: '',
            abreviation: '',
            active: true
        });
        setIsModalOpen(true);
    };

    // Handle payment type edit
    const handlePaymentTypeEdit = (paymentType: PaymentType) => {
        setIsNewPaymentType(false);
        setSelectedPaymentType(paymentType);
        setFormData({
            name: paymentType.name,
            abreviation: paymentType.abreviation,
            active: paymentType.active
        });
        setIsModalOpen(true);
    };

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.abreviation) {
            setError('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const url = isNewPaymentType ? '/api/admin/payment-types' : `/api/admin/payment-types/${selectedPaymentType?.id}`;
            const method = isNewPaymentType ? 'POST' : 'PUT';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Failed to save payment type');
            }

            const savedPaymentType = await response.json();

            if (isNewPaymentType) {
                setPaymentTypes(prev => [...prev, savedPaymentType]);
            } else {
                setPaymentTypes(prev => prev.map(p => p.id === savedPaymentType.id ? savedPaymentType : p));
            }

            setIsModalOpen(false);
            setSelectedPaymentType(null);
        } catch (err) {
            setError('Error saving payment type. Please try again.');
            console.error('Error saving payment type:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle payment type delete
    const handleDeletePaymentType = async (paymentType: PaymentType) => {
        if (!confirm(`Are you sure you want to delete payment type "${paymentType.name}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/payment-types/${paymentType.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete payment type');
            }

            setPaymentTypes(prev => prev.filter(p => p.id !== paymentType.id));
        } catch (err) {
            setError('Error deleting payment type. Please try again.');
            console.error('Error deleting payment type:', err);
        }
    };

    // Handle modal close
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedPaymentType(null);
        setIsNewPaymentType(false);
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
                        <h1 className="text-2xl font-bold text-gray-800">Admin - Payment Types</h1>
                        <button
                            onClick={handleNewPaymentType}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            Add Payment Type
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

                    {/* Payment Types Table */}
                    {!loading && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abbreviation</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {paymentTypes.map((paymentType) => (
                                    <tr key={paymentType.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {paymentType.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {paymentType.abreviation}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                paymentType.active 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {paymentType.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handlePaymentTypeEdit(paymentType)}
                                                    className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePaymentType(paymentType)}
                                                    className="px-3 py-1 text-xs font-medium text-red-600 bg-red-100 rounded hover:bg-red-200"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Type Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                {isNewPaymentType ? 'Add New Payment Type' : 'Edit Payment Type'}
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

                                {/* Abbreviation */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Abbreviation *
                                    </label>
                                    <input
                                        type="text"
                                        name="abreviation"
                                        value={formData.abreviation}
                                        onChange={handleInputChange}
                                        maxLength={10}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
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