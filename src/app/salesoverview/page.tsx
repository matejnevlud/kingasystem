'use client';

import {useState, useEffect} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import { useSorting } from '@/hooks/useSorting';

// Define types based on the Prisma schema
type Unit = {
    id: number;
    unit: string;
    address: string;
    phone: string;
    email: string;
    active: boolean;
};

type Sale = {
    id: number;
    idUser: number;
    idUnit: number;
    idPaymentType: number;
    amount: number;
    productName: string;
    sellPrice: number;
    marginPerc: number;
    datetime: string;
    confirmed: boolean;
    active: boolean;
    // Include related data
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
        pgSalesOverview: boolean;
        [key: string]: any;
    };
};

export default function SalesOverviewPage() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [selectedUnitIds, setSelectedUnitIds] = useState<number[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<UserSession | null>(null);
    const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
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

                // Check if user has access to sales overview page
                if (!data.pageAccess.pgSalesOverview) {
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

    // Fetch units after user session is loaded
    useEffect(() => {
        if (!user) return;

        async function fetchUnits() {
            try {
                const response = await fetch('/api/units');
                if (!response.ok) {
                    throw new Error('Failed to fetch units');
                }
                const data = await response.json();
                setUnits(data);
                setLoading(false);
            } catch (err) {
                setError('Error loading units. Please try again later.');
                setLoading(false);
                console.error('Error fetching units:', err);
            }
        }

        fetchUnits();
    }, [user]);

    // Set default date range (first day of current month to current date)
    useEffect(() => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

        setDateFrom(firstDay.toISOString().split('T')[0]);
        setDateTo(today.toISOString().split('T')[0]);
    }, []);

    // Fetch sales when filters change
    useEffect(() => {
        if (selectedUnitIds.length > 0 && dateFrom && dateTo) {
            async function fetchSales() {
                setLoading(true);
                try {
                    const unitParams = selectedUnitIds.map(id => `unitIds=${id}`).join('&');
                    const response = await fetch(`/api/sales/overview?${unitParams}&dateFrom=${dateFrom}&dateTo=${dateTo}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch sales');
                    }
                    const data = await response.json();
                    setSales(data);
                    setLoading(false);
                } catch (err) {
                    setError('Error loading sales. Please try again later.');
                    setLoading(false);
                    console.error('Error fetching sales:', err);
                }
            }

            fetchSales();
        } else {
            setSales([]);
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

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    // Handle sale unlock
    const handleSaleUnlock = (sale: Sale) => {
        setSelectedSale(sale);
        setIsUnlockModalOpen(true);
    };

    // Handle unlock confirmation
    const handleUnlockConfirm = async () => {
        if (!selectedSale) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/sales/${selectedSale.id}/unlock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to unlock sale');
            }

            // Remove the unlocked sale from the overview
            setSales(prev => prev.filter(sale => sale.id !== selectedSale.id));
            setIsUnlockModalOpen(false);
            setSelectedSale(null);
        } catch (err) {
            setError('Error unlocking sale. Please try again.');
            console.error('Error unlocking sale:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle modal close
    const handleCloseModal = () => {
        setIsUnlockModalOpen(false);
        setSelectedSale(null);
    };

    // Add computed total property for sorting
    const salesWithTotal = sales.map(sale => ({
        ...sale,
        total: sale.sellPrice * sale.amount
    }));
    
    // Initialize sorting
    const { sortedData: sortedSales, requestSort, getSortIcon, getSortClasses } = useSorting(salesWithTotal, 'datetime');

    // Calculate totals and stats
    const calculateStats = () => {
        if (!sales.length) return {total: 0, byPaymentType: {}};

        const total = sales.reduce((sum, sale) => sum + (sale.sellPrice * sale.amount), 0);
        const byPaymentType: { [key: string]: number } = {};

        sales.forEach(sale => {
            const paymentType = sale.paymentType?.abreviation || 'UNK';
            byPaymentType[paymentType] = (byPaymentType[paymentType] || 0) + (sale.sellPrice * sale.amount);
        });

        return {total, byPaymentType};
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
                        <h1 className="text-2xl font-bold text-gray-800">Sales Overview</h1>
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
                                Select Units
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

                    {/* Sales Display - Responsive */}
                    {selectedUnitIds.length > 0 && (
                        <div className="px-4">

                            
                            {/* Mobile-First Layout */}
                            <div>
                                {/* Sortable Header */}
                                <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 mb-1">
                                    <div className="grid grid-cols-5 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <div className="col-span-2">
                                            <div 
                                                className={`flex items-center space-x-1 ${getSortClasses('productName')}`}
                                                onClick={() => requestSort('productName')}
                                            >
                                                <span>Description</span>
                                                <span className="text-gray-400">{getSortIcon('productName')}</span>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div 
                                                className={`flex items-center justify-center space-x-1 ${getSortClasses('paymentType.abreviation')}`}
                                                onClick={() => requestSort('paymentType.abreviation')}
                                            >
                                                <span>Payment</span>
                                                <span className="text-gray-400">{getSortIcon('paymentType.abreviation')}</span>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div 
                                                className={`flex items-center justify-center space-x-1 ${getSortClasses('unit.unit')}`}
                                                onClick={() => requestSort('unit.unit')}
                                            >
                                                <span>Unit</span>
                                                <span className="text-gray-400">{getSortIcon('unit.unit')}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div 
                                                className={`flex items-center justify-end space-x-1 ${getSortClasses('total')}`}
                                                onClick={() => requestSort('total')}
                                            >
                                                <span>Total</span>
                                                <span className="text-gray-400">{getSortIcon('total')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Table Rows */}
                                <div className="space-y-1">
                                    {sortedSales.map((sale) => (
                                        <div
                                            key={sale.id}
                                            onClick={() => handleSaleUnlock(sale)}
                                            className={`border cursor-pointer transition-colors ${
                                                sale.confirmed 
                                                    ? 'bg-white border-gray-200 hover:bg-gray-50' 
                                                    : 'bg-orange-50 border-orange-300 border-l-4 border-l-orange-400 hover:bg-orange-100'
                                            }`}
                                        >
                                            {/* Main Info Row */}
                                            <div className="grid grid-cols-5 gap-2 px-3 py-2 items-center">
                                                <div className="col-span-2">
                                                    <div className={`text-sm font-medium leading-tight ${
                                                        sale.confirmed ? 'text-gray-900' : 'text-orange-900'
                                                    }`}>
                                                        {sale.productName}
                                                        {!sale.confirmed && (
                                                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                                                Unconfirmed
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <span className={`text-sm ${
                                                        sale.confirmed ? 'text-gray-900' : 'text-orange-900'
                                                    }`}>
                                                        {sale.paymentType?.abreviation || 'UNK'}
                                                    </span>
                                                </div>
                                                <div className="text-center">
                                                    <span className={`text-sm ${
                                                        sale.confirmed ? 'text-gray-900' : 'text-orange-900'
                                                    }`}>
                                                        {sale.unit?.unit || `Unit ${sale.idUnit}`}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-sm font-bold ${
                                                        sale.confirmed ? 'text-gray-900' : 'text-orange-900'
                                                    }`}>
                                                        {(sale.sellPrice * sale.amount).toFixed(0)},-
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {/* Additional Info Row */}
                                            <div className={`grid grid-cols-5 gap-2 px-3 py-1 border-t border-gray-100 ${
                                                sale.confirmed ? 'bg-gray-25' : 'bg-orange-25'
                                            }`}>
                                                <div className="col-span-2">
                                                    <span className="text-xs text-gray-500">
                                                        Tap to unlock
                                                    </span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-xs text-gray-500">
                                                        {sale.paymentType?.name || 'Unknown'}
                                                    </span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-xs text-gray-500">
                                                        Qty: {sale.amount}x
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs text-gray-500">
                                                        {formatDate(sale.datetime)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {selectedUnitIds.length === 0 && (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-gray-500 text-center">Please select at least one unit to view sales overview.</p>
                        </div>
                    )}
                </div>

                {/* Fixed Footer with Totals */}
                {selectedUnitIds.length > 0 && sales.length > 0 && (
                    <div className="flex-shrink-0 bg-gray-50 p-4 border-t border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-lg font-bold text-gray-900">TOTAL:</span>
                            <span className="text-lg font-bold text-gray-900">
                                {stats.total.toFixed(0)},-
                            </span>
                        </div>
                        <div className="flex space-x-6 text-sm text-gray-700">
                            {Object.entries(stats.byPaymentType).map(([type, amount]) => (
                                <div key={type} className="flex space-x-2">
                                    <span className="font-medium">{type}</span>
                                    <span className="font-bold">{amount.toFixed(0)},-</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Unlock Sale Modal */}
            {isUnlockModalOpen && selectedSale && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
                        <div className="mt-3 text-center">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Unlock Sale</h3>
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-2">Product:</p>
                                <p className="font-medium text-gray-900">{selectedSale.productName}</p>
                            </div>
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-2">Total:</p>
                                <p className="font-bold text-gray-900 text-xl">
                                    {(selectedSale.sellPrice * selectedSale.amount).toFixed(0)},-
                                </p>
                            </div>
                            <p className="text-sm text-gray-600 mb-6">
                                This item will be unlocked and can be modified at the 'SALES CONFIRMATION' screen.
                            </p>
                            <div className="flex justify-center space-x-4">
                                <button
                                    onClick={handleCloseModal}
                                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUnlockConfirm}
                                    disabled={isSubmitting}
                                    className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Unlocking...' : 'Unlock'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}