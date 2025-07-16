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
        pgSales: boolean;
        [key: string]: any;
    };
};

export default function SalesListPage() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
    const [sales, setSales] = useState<Sale[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<UserSession | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        productId: '',
        amount: '1',
        paymentTypeId: ''
    });
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
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

                // Check if user has access to sales page
                if (!data.pageAccess.pgSales) {
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
        return date.toLocaleString();
    };

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle product selection
    const handleProductSelect = (product: Product) => {
        setSelectedProduct(product);
        setFormData({
            productId: product.id.toString(),
            amount: '1',
            paymentTypeId: ''
        });
        setIsModalOpen(true);
    };

    // Calculate total price
    const calculateTotal = () => {
        if (!selectedProduct || !formData.amount) return 0;
        return selectedProduct.sellPrice * parseInt(formData.amount);
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUnitId || !formData.productId || !formData.amount || !formData.paymentTypeId) {
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/sales', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    unitId: selectedUnitId,
                    productId: formData.productId,
                    amount: formData.amount,
                    paymentTypeId: formData.paymentTypeId,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create sale');
            }

            const newSale = await response.json();
            setSales(prev => [newSale, ...prev]);
            setIsModalOpen(false);
            setFormData({
                productId: '',
                amount: '1',
                paymentTypeId: ''
            });
            setSelectedProduct(null);
        } catch (err) {
            setError('Error creating sale. Please try again.');
            console.error('Error creating sale:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle modal close
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData({
            productId: '',
            amount: '1',
            paymentTypeId: ''
        });
        setSelectedProduct(null);
    };

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
                        <h1 className="text-2xl font-bold text-gray-800">Sales</h1>
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
                    {/* Loading State */}
                    {loading && (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                                <p className="text-gray-600">Loading...</p>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="m-4 bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                            <p className="text-red-700 font-medium">{error}</p>
                        </div>
                    )}

                    {/* Products List */}
                    {selectedUnitId && !loading && (
                        <div className="p-4">
                            <div className="space-y-3">
                                {products.map((product) => (
                                    <div key={product.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                                        <div className="flex-1">
                                            <div className="text-gray-900 font-medium break-words pr-4">
                                                {product.productName}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <span className="text-gray-900 font-bold text-lg">
                                                {product.sellPrice.toFixed(0)},-
                                            </span>
                                            <button
                                                onClick={() => handleProductSelect(product)}
                                                className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                            >
                                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!selectedUnitId && !loading && (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-gray-500 text-center">Select a unit to view products</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Sale Modal */}
            {isModalOpen && selectedProduct && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
                        <div className="mt-3">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Product Info */}
                                <div className="text-center">
                                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                                        {selectedProduct.productName}
                                    </h3>
                                    <p className="text-2xl font-bold text-gray-800">
                                        {selectedProduct.sellPrice.toFixed(0)},-
                                    </p>
                                </div>

                                {/* Quantity */}
                                <div className="flex items-center justify-center space-x-4 my-6">
                                    <input
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleInputChange}
                                        min="1"
                                        className="w-16 text-center text-2xl font-bold p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                    <span className="text-gray-800 font-medium">pcs</span>
                                    <span className="text-gray-800 font-bold text-xl">Σ</span>
                                    <span className="text-gray-800 font-bold text-2xl">
                                        {calculateTotal().toFixed(0)},-
                                    </span>
                                </div>

                                {/* Payment Type */}
                                <div>
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

                                {/* Modal Actions */}
                                <div className="flex justify-center pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !formData.paymentTypeId}
                                        className="px-8 py-3 text-lg font-bold text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Adding...' : 'Confirm'}
                                    </button>
                                </div>

                                {/* Close button */}
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
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
        </div>
    );
}
