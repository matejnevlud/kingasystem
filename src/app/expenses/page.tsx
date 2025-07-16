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

type PaymentType = {
    id: number;
    name: string;
    abreviation: string;
    active: boolean;
};

type Vendor = {
    id: number;
    name: string;
    active: boolean;
};

type Expense = {
    id: number;
    idUser: number;
    idUnit: number;
    idPaymentType: number;
    vendor: number;
    description: string;
    cost: number;
    category: string;
    datetime: string;
    active: boolean;
    unit?: Unit;
    paymentType?: PaymentType;
};

// Define the type for user session
type UserSession = {
    userId: number;
    name: string;
    pageAccess: {
        pgExpenses: boolean;
        [key: string]: any;
    };
};

const categoryOptions = [
    {value: 'D', label: 'Direct'},
    {value: 'I', label: 'Indirect'},
    {value: 'O', label: 'Other'},
    {value: 'T', label: 'Tax'}
];

const vendorOptions = [
    {value: 1, label: 'Vendor 1'},
    {value: 2, label: 'Vendor 2'},
    {value: 3, label: 'Vendor 3'},
    {value: 4, label: 'Vendor 4'},
    {value: 5, label: 'Vendor 5'}
];

export default function ExpensesPage() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<UserSession | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        datetime: new Date().toISOString().slice(0, 16), // Default to now
        unitId: '',
        paymentTypeId: '',
        amount: '',
        description: '',
        vendor: '',
        category: ''
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

                // Check if user has access to expenses page
                if (!data.pageAccess.pgExpenses) {
                    // Redirect to menu if user doesn't have access
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

    // Fetch units and payment types after user session is loaded
    useEffect(() => {
        if (!user) return;

        async function fetchData() {
            try {
                const [unitsResponse, paymentTypesResponse] = await Promise.all([
                    fetch('/api/units'),
                    fetch('/api/payment-types')
                ]);

                if (!unitsResponse.ok || !paymentTypesResponse.ok) {
                    throw new Error('Failed to fetch data');
                }

                const [unitsData, paymentTypesData] = await Promise.all([
                    unitsResponse.json(),
                    paymentTypesResponse.json()
                ]);

                setUnits(unitsData);
                setPaymentTypes(paymentTypesData);
                setLoading(false);
            } catch (err) {
                setError('Error loading data. Please try again later.');
                setLoading(false);
                console.error('Error fetching data:', err);
            }
        }

        fetchData();
    }, [user]);

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.unitId || !formData.paymentTypeId || !formData.amount || !formData.description || !formData.vendor || !formData.category) {
            setError('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/expenses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    datetime: formData.datetime,
                    unitId: parseInt(formData.unitId),
                    paymentTypeId: parseInt(formData.paymentTypeId),
                    amount: parseFloat(formData.amount),
                    description: formData.description,
                    vendor: parseInt(formData.vendor),
                    category: formData.category
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create expense');
            }

            // Reset form after successful submission
            setFormData({
                datetime: new Date().toISOString().slice(0, 16),
                unitId: '',
                paymentTypeId: '',
                amount: '',
                description: '',
                vendor: '',
                category: ''
            });

            // Show success message (you could add a toast notification here)
            alert('Expense created successfully!');
        } catch (err) {
            setError('Error creating expense. Please try again.');
            console.error('Error creating expense:', err);
        } finally {
            setIsSubmitting(false);
        }
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
                        <h1 className="text-2xl font-bold text-gray-800">Expenses</h1>
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

                    {/* Main Form */}
                    {!loading && (
                        <div className="p-4">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Date and time */}
                                <div>
                                    <label htmlFor="datetime" className="block text-sm font-medium text-gray-700 mb-2">
                                        Date and time
                                    </label>
                                    <input
                                        type="datetime-local"
                                        id="datetime"
                                        name="datetime"
                                        value={formData.datetime}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                {/* Unit */}
                                <div>
                                    <label htmlFor="unitId" className="block text-sm font-medium text-gray-700 mb-2">
                                        Unit
                                    </label>
                                    <Select
                                        id="unitId"
                                        name="unitId"
                                        value={formData.unitId}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Unit</option>
                                        {units.map((unit) => (
                                            <option key={unit.id} value={unit.id}>
                                                {unit.unit}
                                            </option>
                                        ))}
                                    </Select>
                                </div>

                                {/* Payment type */}
                                <div>
                                    <label htmlFor="paymentTypeId" className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment type
                                    </label>
                                    <Select
                                        id="paymentTypeId"
                                        name="paymentTypeId"
                                        value={formData.paymentTypeId}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Payment type</option>
                                        {paymentTypes.map((paymentType) => (
                                            <option key={paymentType.id} value={paymentType.id}>
                                                {paymentType.name}
                                            </option>
                                        ))}
                                    </Select>
                                </div>

                                {/* Amount */}
                                <div>
                                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                                        Amount
                                    </label>
                                    <input
                                        type="number"
                                        id="amount"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        min="0"
                                        placeholder="Amount"
                                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <input
                                        type="text"
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Description"
                                        maxLength={30}
                                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                {/* Vendor */}
                                <div>
                                    <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 mb-2">
                                        Vendor
                                    </label>
                                    <Select
                                        id="vendor"
                                        name="vendor"
                                        value={formData.vendor}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Vendor</option>
                                        {vendorOptions.map((vendor) => (
                                            <option key={vendor.value} value={vendor.value}>
                                                {vendor.label}
                                            </option>
                                        ))}
                                    </Select>
                                </div>

                                {/* Category */}
                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                                        Category
                                    </label>
                                    <Select
                                        id="category"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Direct/Indirect/OOC/Tax</option>
                                        {categoryOptions.map((category) => (
                                            <option key={category.value} value={category.value}>
                                                {category.label}
                                            </option>
                                        ))}
                                    </Select>
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-center pt-6">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-8 py-3 text-lg font-bold text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isSubmitting ? 'Creating...' : 'Confirm'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}