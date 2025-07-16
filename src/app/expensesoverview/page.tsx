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
    paymentType?: {
        name: string;
        abreviation: string;
    };
};

// Define the type for user session
type UserSession = {
    userId: number;
    name: string;
    pageAccess: {
        pgExpensesView: boolean;
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

export default function ExpensesOverviewPage() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [selectedUnitIds, setSelectedUnitIds] = useState<number[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<UserSession | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [formData, setFormData] = useState({
        datetime: '',
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

                // Check if user has access to expenses view page
                if (!data.pageAccess.pgExpensesView) {
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

    // Set default date range (last 30 days)
    useEffect(() => {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
        setDateTo(today.toISOString().split('T')[0]);
    }, []);

    // Fetch expenses when filters change
    useEffect(() => {
        if (selectedUnitIds.length > 0 && dateFrom && dateTo) {
            async function fetchExpenses() {
                setLoading(true);
                try {
                    const unitParams = selectedUnitIds.map(id => `unitIds=${id}`).join('&');
                    const response = await fetch(`/api/expenses/overview?${unitParams}&dateFrom=${dateFrom}&dateTo=${dateTo}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch expenses');
                    }
                    const data = await response.json();
                    setExpenses(data);
                    setLoading(false);
                } catch (err) {
                    setError('Error loading expenses. Please try again later.');
                    setLoading(false);
                    console.error('Error fetching expenses:', err);
                }
            }

            fetchExpenses();
        } else {
            setExpenses([]);
            setLoading(false);
        }
    }, [selectedUnitIds, dateFrom, dateTo]);

    // Handle unit selection
    const handleUnitChange = (unitId: number) => {
        setSelectedUnitIds(prev => {
            if (prev.includes(unitId)) {
                return prev.filter(id => id !== unitId);
            } else {
                return [...prev, unitId];
            }
        });
    };

    // Handle select all units
    const handleSelectAll = () => {
        if (selectedUnitIds.length === units.length) {
            setSelectedUnitIds([]);
        } else {
            setSelectedUnitIds(units.map(unit => unit.id));
        }
    };

    // Handle expense click (open edit modal)
    const handleExpenseClick = (expense: Expense) => {
        setSelectedExpense(expense);
        setFormData({
            datetime: new Date(expense.datetime).toISOString().slice(0, 16),
            unitId: expense.idUnit.toString(),
            paymentTypeId: expense.idPaymentType.toString(),
            amount: expense.cost.toString(),
            description: expense.description,
            vendor: expense.vendor.toString(),
            category: expense.category
        });
        setIsEditModalOpen(true);
    };

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle expense update
    const handleUpdateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedExpense) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/expenses/${selectedExpense.id}`, {
                method: 'PUT',
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
                throw new Error('Failed to update expense');
            }

            const updatedExpense = await response.json();
            setExpenses(prev => prev.map(expense =>
                expense.id === selectedExpense.id ? updatedExpense : expense
            ));
            setIsEditModalOpen(false);
            setSelectedExpense(null);
        } catch (err) {
            setError('Error updating expense. Please try again.');
            console.error('Error updating expense:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle delete confirmation
    const handleDeleteExpense = async () => {
        if (!selectedExpense) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/expenses/${selectedExpense.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete expense');
            }

            // Remove the expense from the list
            setExpenses(prev => prev.filter(expense => expense.id !== selectedExpense.id));
            setIsDeleteModalOpen(false);
            setIsEditModalOpen(false);
            setSelectedExpense(null);
        } catch (err) {
            setError('Error deleting expense. Please try again.');
            console.error('Error deleting expense:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle modal close
    const handleCloseModals = () => {
        setIsEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setSelectedExpense(null);
    };

    // Calculate totals and stats
    const calculateStats = () => {
        if (!expenses.length) return {total: 0, byCategory: {}};

        const total = expenses.reduce((sum, expense) => sum + expense.cost, 0);
        const byCategory: { [key: string]: number } = {};

        expenses.forEach(expense => {
            byCategory[expense.category] = (byCategory[expense.category] || 0) + expense.cost;
        });

        return {total, byCategory};
    };

    const stats = calculateStats();

    return (
        <div className="absolute inset-0 bg-gray-50">
            <div className="bg-white shadow-md rounded-lg m-4 h-[calc(100vh-2rem)] flex flex-col">
                {/* Fixed Header */}
                <div className="flex-shrink-0 p-4 border-b">
                    <div className="flex justify-between items-center mb-4">
                        <Link
                            href="/menu"
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/>
                            </svg>
                            Back
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-800">Expenses Overview</h1>
                    </div>
                    
                    {/* Filters */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Date From */}
                            <div>
                                <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
                                    Date From
                                </label>
                                <input
                                    type="date"
                                    id="dateFrom"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Date To */}
                            <div>
                                <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
                                    Date To
                                </label>
                                <input
                                    type="date"
                                    id="dateTo"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Unit Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                List of Units
                            </label>
                            <div className="flex space-x-2 overflow-x-auto pb-2">
                                <button
                                    onClick={handleSelectAll}
                                    className={`px-3 py-1 text-sm rounded-full border whitespace-nowrap ${
                                        selectedUnitIds.length === units.length
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    ALL
                                </button>
                                {units.map((unit) => (
                                    <button
                                        key={unit.id}
                                        onClick={() => handleUnitChange(unit.id)}
                                        className={`px-3 py-1 text-sm rounded-full border whitespace-nowrap ${
                                            selectedUnitIds.includes(unit.id)
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {unit.unit}
                                    </button>
                                ))}
                            </div>
                        </div>
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

                    {/* Expenses Table */}
                    {selectedUnitIds.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit/Cat</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {expenses.map((expense) => (
                                    <tr
                                        key={expense.id}
                                        className="hover:bg-gray-50 cursor-pointer"
                                        onClick={() => handleExpenseClick(expense)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {expense.description}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(expense.datetime).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {expense.unit?.unit || `Unit ${expense.idUnit}`} | {expense.category}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {expense.cost.toFixed(0)},-
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Empty State */}
                    {selectedUnitIds.length === 0 && (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-gray-500 text-center">Please select at least one unit to view expenses overview.</p>
                        </div>
                    )}
                </div>

                {/* Fixed Footer with Totals */}
                {selectedUnitIds.length > 0 && expenses.length > 0 && (
                    <div className="flex-shrink-0 bg-gray-50 p-4 border-t border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-lg font-bold text-gray-900">TOTAL:</span>
                            <span className="text-lg font-bold text-gray-900">
                                {stats.total.toFixed(0)},-
                            </span>
                        </div>
                        <div className="flex space-x-6 text-sm text-gray-700">
                            <div className="flex space-x-2">
                                <span className="font-medium">D</span>
                                <span className="font-bold">{(stats.byCategory.D || 0).toFixed(0)},-</span>
                            </div>
                            <div className="flex space-x-2">
                                <span className="font-medium">I</span>
                                <span className="font-bold">{(stats.byCategory.I || 0).toFixed(0)},-</span>
                            </div>
                            <div className="flex space-x-2">
                                <span className="font-medium">O</span>
                                <span className="font-bold">{(stats.byCategory.O || 0).toFixed(0)},-</span>
                            </div>
                            <div className="flex space-x-2">
                                <span className="font-medium">T</span>
                                <span className="font-bold">{(stats.byCategory.T || 0).toFixed(0)},-</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Expense Modal */}
            {isEditModalOpen && selectedExpense && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Expense</h3>
                            <form onSubmit={handleUpdateExpense} className="space-y-4">
                                {/* Date and time */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date and time
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="datetime"
                                        value={formData.datetime}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                {/* Unit */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Unit
                                    </label>
                                    <Select
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Payment type
                                    </label>
                                    <Select
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Amount
                                    </label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        min="0"
                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <input
                                        type="text"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        maxLength={30}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                {/* Vendor */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Vendor
                                    </label>
                                    <Select
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category
                                    </label>
                                    <Select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Direct/Indirect/OOC/Asset</option>
                                        {categoryOptions.map((category) => (
                                            <option key={category.value} value={category.value}>
                                                {category.label}
                                            </option>
                                        ))}
                                    </Select>
                                </div>

                                {/* Modal Actions */}
                                <div className="flex justify-center space-x-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Updating...' : 'Confirm'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsDeleteModalOpen(true)}
                                        className="px-6 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                        Delete
                                    </button>
                                </div>

                                {/* Close button */}
                                <button
                                    type="button"
                                    onClick={handleCloseModals}
                                    className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && selectedExpense && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
                        <div className="mt-3 text-center">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete expense?</h3>
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-2">Expense description:</p>
                                <p className="font-medium text-gray-900">{selectedExpense.description}</p>
                            </div>
                            <div className="mb-6">
                                <p className="font-bold text-gray-900 text-xl">
                                    {selectedExpense.cost.toFixed(0)},-
                                </p>
                            </div>
                            <div className="flex justify-center space-x-4">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteExpense}
                                    disabled={isSubmitting}
                                    className="px-6 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}