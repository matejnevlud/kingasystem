'use client';

import {useState, useEffect} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {Select} from 'flowbite-react';
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

type Product = {
    id: number;
    idUnit: number;
    productName: string;
    sellPrice: number;
    marginPerc: number;
    active: boolean;
};

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
        pgSalesConfirm: boolean;
        [key: string]: any;
    };
};

export default function SalesConfirmationPage() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
    const [sales, setSales] = useState<Sale[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<UserSession | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [editFormData, setEditFormData] = useState({
        amount: '',
        paymentTypeId: ''
    });
    const [selectedSaleIds, setSelectedSaleIds] = useState<Set<number>>(new Set());
    const router = useRouter();
    
    // Add computed total property for sorting
    const salesWithTotal = sales.map(sale => ({
        ...sale,
        total: sale.sellPrice * sale.amount
    }));
    
    // Initialize sorting
    const { sortedData: sortedSales, requestSort, getSortIcon, getSortClasses } = useSorting(salesWithTotal, 'productName');

    // Fetch user session on component mount
    useEffect(() => {
        async function fetchUserSession() {
            try {
                const response = await fetch('/api/auth/session');
                if (!response.ok) {
                    throw new Error('Failed to get session');
                }
                const data = await response.json();

                // Check if user has access to sales confirmation page
                if (!data.pageAccess.pgSalesConfirm) {
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

                // Restore selected unit from localStorage
                const savedUnitId = localStorage.getItem('selectedUnitId');
                if (savedUnitId && data.some((unit: Unit) => unit.id === parseInt(savedUnitId))) {
                    setSelectedUnitId(parseInt(savedUnitId));
                }

                setLoading(false);
            } catch (err) {
                setError('Error loading units. Please try again later.');
                setLoading(false);
                console.error('Error fetching units:', err);
            }
        }

        fetchUnits();
    }, [user]);

    // Fetch sales when a unit is selected
    useEffect(() => {
        if (selectedUnitId) {
            async function fetchSales() {
                setLoading(true);
                try {
                    const response = await fetch(`/api/sales?unitId=${selectedUnitId}`);
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
        }
    }, [selectedUnitId]);

    // Fetch products when a unit is selected
    useEffect(() => {
        if (selectedUnitId) {
            async function fetchProducts() {
                try {
                    const response = await fetch(`/api/products?unitId=${selectedUnitId}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch products');
                    }
                    const data = await response.json();
                    setProducts(data);
                } catch (err) {
                    console.error('Error fetching products:', err);
                }
            }

            fetchProducts();
        } else {
            setProducts([]);
        }
    }, [selectedUnitId]);

    // Fetch payment types on component mount
    useEffect(() => {
        async function fetchPaymentTypes() {
            try {
                const response = await fetch('/api/payment-types');
                if (!response.ok) {
                    throw new Error('Failed to fetch payment types');
                }
                const data = await response.json();
                setPaymentTypes(data);
            } catch (err) {
                console.error('Error fetching payment types:', err);
            }
        }

        fetchPaymentTypes();
    }, []);

    // Handle unit selection
    const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const unitId = parseInt(e.target.value);
        setSelectedUnitId(unitId || null);

        // Save selected unit to localStorage
        if (unitId) {
            localStorage.setItem('selectedUnitId', unitId.toString());
        } else {
            localStorage.removeItem('selectedUnitId');
        }
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    // Handle sale edit
    const handleSaleEdit = (sale: Sale) => {
        setSelectedSale(sale);
        setEditFormData({
            amount: sale.amount.toString(),
            paymentTypeId: sale.idPaymentType.toString()
        });
        setIsEditModalOpen(true);
    };

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value} = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Calculate total price for edit modal
    const calculateEditTotal = () => {
        if (!selectedSale || !editFormData.amount) return 0;
        return selectedSale.sellPrice * parseInt(editFormData.amount);
    };

    // Handle edit form submission
    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSale || !editFormData.amount || !editFormData.paymentTypeId) {
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/sales/${selectedSale.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: editFormData.amount,
                    paymentTypeId: editFormData.paymentTypeId,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update sale');
            }

            const updatedSale = await response.json();
            setSales(prev => prev.map(sale =>
                sale.id === selectedSale.id ? updatedSale : sale
            ));
            setIsEditModalOpen(false);
            setSelectedSale(null);
            setEditFormData({
                amount: '',
                paymentTypeId: ''
            });
        } catch (err) {
            setError('Error updating sale. Please try again.');
            console.error('Error updating sale:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle modal close
    const handleCloseModal = () => {
        setIsEditModalOpen(false);
        setSelectedSale(null);
        setEditFormData({
            amount: '',
            paymentTypeId: ''
        });
    };

    // Calculate totals and stats
    const calculateStats = () => {
        if (!sales.length) return {total: 0, byPaymentType: {}, selectedTotal: 0, selectedByPaymentType: {}};

        const total = sales.reduce((sum, sale) => sum + (sale.sellPrice * sale.amount), 0);
        const byPaymentType: { [key: string]: number } = {};

        sales.forEach(sale => {
            const paymentType = sale.paymentType?.abreviation || 'UNK';
            byPaymentType[paymentType] = (byPaymentType[paymentType] || 0) + (sale.sellPrice * sale.amount);
        });

        // Calculate selected totals
        const selectedSales = sales.filter(sale => selectedSaleIds.has(sale.id));
        const selectedTotal = selectedSales.reduce((sum, sale) => sum + (sale.sellPrice * sale.amount), 0);
        const selectedByPaymentType: { [key: string]: number } = {};

        selectedSales.forEach(sale => {
            const paymentType = sale.paymentType?.abreviation || 'UNK';
            selectedByPaymentType[paymentType] = (selectedByPaymentType[paymentType] || 0) + (sale.sellPrice * sale.amount);
        });

        return {total, byPaymentType, selectedTotal, selectedByPaymentType};
    };

    // Handle row selection
    const handleRowSelection = (saleId: number, event: React.ChangeEvent<HTMLInputElement> | React.MouseEvent) => {
        event.stopPropagation();
        setSelectedSaleIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(saleId)) {
                newSet.delete(saleId);
            } else {
                newSet.add(saleId);
            }
            return newSet;
        });
    };

    // Handle select all/none
    const handleSelectAll = () => {
        if (selectedSaleIds.size === sortedSales.length) {
            setSelectedSaleIds(new Set());
        } else {
            setSelectedSaleIds(new Set(sortedSales.map(sale => sale.id)));
        }
    };

    // Handle confirm and lock
    const handleConfirmAndLock = async () => {
        if (!selectedUnitId || selectedSaleIds.size === 0) return;

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/sales/confirm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    unitId: selectedUnitId,
                    saleIds: Array.from(selectedSaleIds)
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to confirm sales');
            }

            // Refresh sales after confirmation
            const updatedResponse = await fetch(`/api/sales?unitId=${selectedUnitId}`);
            const updatedSales = await updatedResponse.json();
            setSales(updatedSales);
            setSelectedSaleIds(new Set());
        } catch (err) {
            setError('Error confirming sales. Please try again.');
            console.error('Error confirming sales:', err);
        } finally {
            setIsSubmitting(false);
        }
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
                        <h1 className="text-2xl font-bold text-gray-800">Sales Confirmation</h1>
                    </div>
                    
                    {/* Unit Selection */}
                    <Select
                        onChange={handleUnitChange}
                        value={selectedUnitId || ''}
                    >
                        <option value="">List of Units</option>
                        {units.map((unit) => (
                            <option key={unit.id} value={unit.id}>
                                {unit.unit}
                            </option>
                        ))}
                    </Select>
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
                    {selectedUnitId && (
                        <div className="px-4">
                            {/* Desktop Table */}
                            <div style={{display: 'none'}}>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <input
                                                type="checkbox"
                                                checked={selectedSaleIds.size === sortedSales.length && sortedSales.length > 0}
                                                onChange={handleSelectAll}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                        </th>
                                        <th 
                                            className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${getSortClasses('productName')}`}
                                            onClick={() => requestSort('productName')}
                                        >
                                            <div className="flex items-center space-x-1">
                                                <span>Product</span>
                                                <span className="text-gray-400">{getSortIcon('productName')}</span>
                                            </div>
                                        </th>
                                        <th 
                                            className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${getSortClasses('paymentType.abreviation')}`}
                                            onClick={() => requestSort('paymentType.abreviation')}
                                        >
                                            <div className="flex items-center space-x-1">
                                                <span>Payment</span>
                                                <span className="text-gray-400">{getSortIcon('paymentType.abreviation')}</span>
                                            </div>
                                        </th>
                                        <th 
                                            className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${getSortClasses('sellPrice')}`}
                                            onClick={() => requestSort('sellPrice')}
                                        >
                                            <div className="flex items-center space-x-1">
                                                <span>Price</span>
                                                <span className="text-gray-400">{getSortIcon('sellPrice')}</span>
                                            </div>
                                        </th>
                                        <th 
                                            className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${getSortClasses('amount')}`}
                                            onClick={() => requestSort('amount')}
                                        >
                                            <div className="flex items-center space-x-1">
                                                <span>Qty</span>
                                                <span className="text-gray-400">{getSortIcon('amount')}</span>
                                            </div>
                                        </th>
                                        <th 
                                            className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${getSortClasses('total')}`}
                                            onClick={() => requestSort('total')}
                                        >
                                            <div className="flex items-center space-x-1">
                                                <span>Total</span>
                                                <span className="text-gray-400">{getSortIcon('total')}</span>
                                            </div>
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {sortedSales.map((sale) => {
                                        const isSelected = selectedSaleIds.has(sale.id);
                                        return (
                                            <tr
                                                key={sale.id}
                                                className={`cursor-pointer transition-colors ${
                                                    isSelected 
                                                        ? 'bg-blue-50 border-2 border-blue-300 hover:bg-blue-100' 
                                                        : 'hover:bg-gray-50 border-2 border-transparent'
                                                }`}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={(e) => handleRowSelection(sale.id, e)}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    />
                                                </td>
                                                <td 
                                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                                    onClick={() => handleSaleEdit(sale)}
                                                >
                                                    {sale.productName}
                                                </td>
                                                <td 
                                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                                    onClick={() => handleSaleEdit(sale)}
                                                >
                                                    {sale.paymentType?.abreviation || 'UNK'}
                                                </td>
                                                <td 
                                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                                    onClick={() => handleSaleEdit(sale)}
                                                >
                                                    {sale.sellPrice.toFixed(0)},-
                                                </td>
                                                <td 
                                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                                    onClick={() => handleSaleEdit(sale)}
                                                >
                                                    {sale.amount}x
                                                </td>
                                                <td 
                                                    className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                                                    onClick={() => handleSaleEdit(sale)}
                                                >
                                                    {(sale.sellPrice * sale.amount).toFixed(0)},-
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile-First Layout */}
                            <div>
                                {/* Sortable Header */}
                                <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 mb-1">
                                    <div className="grid gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider" style={{gridTemplateColumns: '1rem 1fr 4rem 4rem 4rem'}}>
                                        <div className="flex items-center justify-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedSaleIds.size === sortedSales.length && sortedSales.length > 0}
                                                onChange={handleSelectAll}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                        </div>
                                        <div 
                                            className={`flex items-center space-x-1 ${getSortClasses('productName')}`}
                                            onClick={() => requestSort('productName')}
                                        >
                                            <span>Product</span>
                                            <span className="text-gray-400">{getSortIcon('productName')}</span>
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
                                                className={`flex items-center justify-center space-x-1 ${getSortClasses('sellPrice')}`}
                                                onClick={() => requestSort('sellPrice')}
                                            >
                                                <span>Price</span>
                                                <span className="text-gray-400">{getSortIcon('sellPrice')}</span>
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
                                
                                {/* Mobile Table Rows */}
                                <div className="space-y-1">
                                    {sortedSales.map((sale) => {
                                        const isSelected = selectedSaleIds.has(sale.id);
                                        return (
                                            <div
                                                key={sale.id}
                                                className={`border cursor-pointer transition-colors ${
                                                    isSelected 
                                                        ? 'bg-blue-50 border-blue-300 border-2' 
                                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                                }`}
                                            >
                                                {/* First Row - Main Info */}
                                                <div className="grid gap-2 px-3 py-2 items-center" style={{gridTemplateColumns: '1rem 1fr 4rem 4rem 4rem'}}>
                                                    <div className="flex items-center justify-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => handleRowSelection(sale.id, e)}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                        />
                                                    </div>
                                                    <div 
                                                        onClick={() => handleSaleEdit(sale)}
                                                    >
                                                        <div className="text-sm font-medium text-gray-900 leading-tight">
                                                            {sale.productName}
                                                        </div>
                                                    </div>
                                                    <div 
                                                        className="text-center"
                                                        onClick={() => handleSaleEdit(sale)}
                                                    >
                                                        <span className="text-sm text-gray-900">
                                                            {sale.paymentType?.abreviation || 'UNK'}
                                                        </span>
                                                    </div>
                                                    <div 
                                                        className="text-center"
                                                        onClick={() => handleSaleEdit(sale)}
                                                    >
                                                        <span className="text-sm text-gray-900">
                                                            {sale.sellPrice.toFixed(0)},-
                                                        </span>
                                                    </div>
                                                    <div 
                                                        className="text-right"
                                                        onClick={() => handleSaleEdit(sale)}
                                                    >
                                                        <span className="text-sm font-bold text-gray-900">
                                                            {(sale.sellPrice * sale.amount).toFixed(0)},-
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                {/* Second Row - Quantity Info */}
                                                <div className="grid gap-2 px-3 py-1 bg-gray-25 border-t border-gray-100" style={{gridTemplateColumns: '1rem 1fr 4rem 4rem 4rem'}}>
                                                    <div></div>
                                                    <div 
                                                        onClick={() => handleSaleEdit(sale)}
                                                    >
                                                        <span className="text-xs text-gray-500">
                                                            Tap to edit
                                                        </span>
                                                    </div>
                                                    <div 
                                                        className="text-center"
                                                        onClick={() => handleSaleEdit(sale)}
                                                    >
                                                        <span className="text-xs text-gray-500">
                                                            {sale.paymentType?.name || 'Unknown'}
                                                        </span>
                                                    </div>
                                                    <div 
                                                        className="text-center"
                                                        onClick={() => handleSaleEdit(sale)}
                                                    >
                                                        <span className="text-xs text-gray-500">
                                                            × {sale.amount}
                                                        </span>
                                                    </div>
                                                    <div 
                                                        className="text-right"
                                                        onClick={() => handleSaleEdit(sale)}
                                                    >
                                                        <span className="text-xs text-gray-500">
                                                            Qty: {sale.amount}x
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!selectedUnitId && (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-gray-500 text-center">Select a unit to view sales for confirmation</p>
                        </div>
                    )}
                </div>

                {/* Fixed Footer with Totals and Confirm Button */}
                {selectedUnitId && sales.length > 0 && (
                    <div className="flex-shrink-0 bg-gray-50 p-4 border-t border-gray-200">
                        {/* Desktop Layout */}
                        <div className="hidden md:block">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <span className="text-lg font-bold text-gray-900">SELECTED: </span>
                                    <span className="text-lg font-bold text-blue-600">
                                        {stats.selectedTotal.toFixed(0)},-
                                    </span>
                                    <span className="text-sm text-gray-600 ml-2">
                                        ({selectedSaleIds.size} of {sortedSales.length})
                                    </span>
                                </div>
                                <button
                                    onClick={handleConfirmAndLock}
                                    disabled={isSubmitting || selectedSaleIds.size === 0}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Processing...' : `Confirm ${selectedSaleIds.size} selected`}
                                </button>
                                <div>
                                    <span className="text-lg font-bold text-gray-900">TOTAL: </span>
                                    <span className="text-lg font-bold text-gray-900">
                                        {stats.total.toFixed(0)},-
                                    </span>
                                </div>
                            </div>
                            <div className="flex space-x-6 text-sm text-gray-700">
                                <div className="flex space-x-4">
                                    <span className="font-medium text-blue-600">Selected:</span>
                                    {Object.entries(stats.selectedByPaymentType).map(([type, amount]) => (
                                        <div key={type} className="flex space-x-1">
                                            <span className="font-medium text-blue-600">{type}</span>
                                            <span className="font-bold text-blue-600">{amount.toFixed(0)},-</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-l border-gray-300 pl-4 flex space-x-4">
                                    <span className="font-medium">Total:</span>
                                    {Object.entries(stats.byPaymentType).map(([type, amount]) => (
                                        <div key={type} className="flex space-x-1">
                                            <span className="font-medium">{type}</span>
                                            <span className="font-bold">{amount.toFixed(0)},-</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Mobile Layout */}
                        <div className="md:hidden">
                            <div className="flex justify-between items-center mb-3">
                                <div>
                                    <div className="text-sm font-bold text-blue-600">
                                        SELECTED: {stats.selectedTotal.toFixed(0)},-
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        ({selectedSaleIds.size} of {sortedSales.length})
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-gray-900">
                                        TOTAL: {stats.total.toFixed(0)},-
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 mb-4">
                                <div>
                                    <div className="text-xs font-medium text-blue-600 mb-1">Selected:</div>
                                    {Object.entries(stats.selectedByPaymentType).map(([type, amount]) => (
                                        <div key={type} className="flex justify-between text-blue-600">
                                            <span className="font-medium">{type}</span>
                                            <span className="font-bold">{amount.toFixed(0)},-</span>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-gray-700 mb-1">Total:</div>
                                    {Object.entries(stats.byPaymentType).map(([type, amount]) => (
                                        <div key={type} className="flex justify-between">
                                            <span className="font-medium">{type}</span>
                                            <span className="font-bold">{amount.toFixed(0)},-</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={handleConfirmAndLock}
                                disabled={isSubmitting || selectedSaleIds.size === 0}
                                className="w-full px-4 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Processing...' : `Confirm ${selectedSaleIds.size} selected`}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Sale Modal */}
            {isEditModalOpen && selectedSale && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
                        <div className="mt-3">
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                {/* Product Info */}
                                <div className="text-center">
                                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                                        {selectedSale.productName}
                                    </h3>
                                    <p className="text-2xl font-bold text-gray-800">
                                        {selectedSale.sellPrice.toFixed(0)},-
                                    </p>
                                </div>

                                {/* Quantity */}
                                <div className="flex items-center justify-center space-x-4 my-6">
                                    <input
                                        type="number"
                                        name="amount"
                                        value={editFormData.amount}
                                        onChange={handleInputChange}
                                        min="1"
                                        className="w-16 text-center text-2xl font-bold p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                    <span className="text-gray-800 font-medium">pcs</span>
                                    <span className="text-gray-800 font-bold text-xl">Σ</span>
                                    <span className="text-gray-800 font-bold text-2xl">
                                        {calculateEditTotal().toFixed(0)},-
                                    </span>
                                </div>

                                {/* Payment Type */}
                                <div>
                                    <Select
                                        name="paymentTypeId"
                                        value={editFormData.paymentTypeId}
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

                                {/* Modal Actions */}
                                <div className="flex justify-center space-x-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !editFormData.paymentTypeId}
                                        className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}