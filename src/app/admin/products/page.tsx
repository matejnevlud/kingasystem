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

type Product = {
    id: number;
    idUnit: number;
    productName: string;
    sellPrice: number;
    marginPerc: number;
    active: boolean;
    unit?: Unit;
};

// Define the type for user session
type UserSession = {
    userId: number;
    name: string;
    pageAccess: {
        [key: string]: any;
    };
};

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<UserSession | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isNewProduct, setIsNewProduct] = useState(false);
    const [formData, setFormData] = useState({
        idUnit: '',
        productName: '',
        sellPrice: '',
        marginPerc: '',
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

                // Check if user is admin (ID 1)
                if (data.userId !== 1) {
                    // Redirect to menu if user is not admin
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

    // Fetch products and units after user session is loaded
    useEffect(() => {
        if (!user) return;

        async function fetchData() {
            try {
                const [productsResponse, unitsResponse] = await Promise.all([
                    fetch('/api/admin/products'),
                    fetch('/api/admin/units')
                ]);

                if (!productsResponse.ok || !unitsResponse.ok) {
                    throw new Error('Failed to fetch data');
                }

                const [productsData, unitsData] = await Promise.all([
                    productsResponse.json(),
                    unitsResponse.json()
                ]);

                setProducts(productsData);
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

    // Handle new product
    const handleNewProduct = () => {
        setIsNewProduct(true);
        setSelectedProduct(null);
        setFormData({
            idUnit: '',
            productName: '',
            sellPrice: '',
            marginPerc: '',
            active: true
        });
        setIsModalOpen(true);
    };

    // Handle product edit
    const handleProductEdit = (product: Product) => {
        setIsNewProduct(false);
        setSelectedProduct(product);
        setFormData({
            idUnit: product.idUnit.toString(),
            productName: product.productName,
            sellPrice: product.sellPrice.toString(),
            marginPerc: product.marginPerc.toString(),
            active: product.active
        });
        setIsModalOpen(true);
    };

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
        if (!formData.idUnit || !formData.productName || !formData.sellPrice || !formData.marginPerc) {
            setError('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const url = isNewProduct ? '/api/admin/products' : `/api/admin/products/${selectedProduct?.id}`;
            const method = isNewProduct ? 'POST' : 'PUT';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    idUnit: parseInt(formData.idUnit),
                    productName: formData.productName,
                    sellPrice: parseFloat(formData.sellPrice),
                    marginPerc: parseFloat(formData.marginPerc),
                    active: formData.active
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save product');
            }

            const savedProduct = await response.json();

            if (isNewProduct) {
                setProducts(prev => [...prev, savedProduct]);
            } else {
                setProducts(prev => prev.map(p => p.id === savedProduct.id ? savedProduct : p));
            }

            setIsModalOpen(false);
            setSelectedProduct(null);
        } catch (err) {
            setError('Error saving product. Please try again.');
            console.error('Error saving product:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle product delete
    const handleDeleteProduct = async (product: Product) => {
        if (!confirm(`Are you sure you want to delete product "${product.productName}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/products/${product.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete product');
            }

            setProducts(prev => prev.filter(p => p.id !== product.id));
        } catch (err) {
            setError('Error deleting product. Please try again.');
            console.error('Error deleting product:', err);
        }
    };

    // Handle modal close
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedProduct(null);
        setIsNewProduct(false);
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
                        <h1 className="text-2xl font-bold text-gray-800">Admin - Products</h1>
                        <button
                            onClick={handleNewProduct}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            Add Product
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

                    {/* Products Table */}
                    {!loading && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sell Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin %</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {products.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {product.productName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {product.unit?.unit || `Unit ${product.idUnit}`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {product.sellPrice.toFixed(0)},-
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {product.marginPerc.toFixed(1)}%
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                product.active 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {product.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleProductEdit(product)}
                                                    className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(product)}
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

            {/* Product Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                {isNewProduct ? 'Add New Product' : 'Edit Product'}
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Unit */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Unit *
                                    </label>
                                    <Select
                                        name="idUnit"
                                        value={formData.idUnit}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select Unit</option>
                                        {units.map((unit) => (
                                            <option key={unit.id} value={unit.id}>
                                                {unit.unit}
                                            </option>
                                        ))}
                                    </Select>
                                </div>

                                {/* Product Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Product Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="productName"
                                        value={formData.productName}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                {/* Sell Price */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Sell Price *
                                    </label>
                                    <input
                                        type="number"
                                        name="sellPrice"
                                        value={formData.sellPrice}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        min="0"
                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                {/* Margin Percentage */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Margin Percentage *
                                    </label>
                                    <input
                                        type="number"
                                        name="marginPerc"
                                        value={formData.marginPerc}
                                        onChange={handleInputChange}
                                        step="0.1"
                                        min="0"
                                        max="100"
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