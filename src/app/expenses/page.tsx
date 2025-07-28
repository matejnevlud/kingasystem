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
    vendor: string;
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


export default function ExpensesPage() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<UserSession | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
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

    // Cleanup preview URLs on unmount
    useEffect(() => {
        return () => {
            imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [imagePreviewUrls]);

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
                    vendor: formData.vendor,
                    category: formData.category
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create expense');
            }

            const createdExpense = await response.json();

            // Upload images if any are selected
            if (selectedImages.length > 0) {
                try {
                    const imageFormData = new FormData();
                    imageFormData.append('expenseId', createdExpense.id.toString());
                    
                    selectedImages.forEach(file => {
                        imageFormData.append('images', file);
                    });

                    const imageResponse = await fetch('/api/upload/images', {
                        method: 'POST',
                        body: imageFormData,
                    });

                    if (!imageResponse.ok) {
                        throw new Error('Failed to upload images');
                    }

                    const imageResult = await imageResponse.json();
                    console.log('Images uploaded:', imageResult.images);
                } catch (imageError) {
                    console.error('Error uploading images:', imageError);
                    alert('Expense created successfully, but failed to upload some images. You can add them later from the overview page.');
                }
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

            // Clear images
            setSelectedImages([]);
            imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
            setImagePreviewUrls([]);

            // Show success message
            const imageMessage = selectedImages.length > 0 ? ` with ${selectedImages.length} image(s)` : '';
            alert(`Expense created successfully${imageMessage}!`);
        } catch (err) {
            setError('Error creating expense. Please try again.');
            console.error('Error creating expense:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle image selection
    const handleImageSelect = (files: FileList | null) => {
        if (!files) return;

        const fileArray = Array.from(files);
        const validFiles = fileArray.filter(file => {
            if (!file.type.startsWith('image/')) {
                alert(`${file.name} is not an image file`);
                return false;
            }
            if (file.size > 10 * 1024 * 1024) {
                alert(`${file.name} is too large (max 10MB)`);
                return false;
            }
            return true;
        });

        setSelectedImages(prev => [...prev, ...validFiles]);

        // Create preview URLs
        const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
        setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
    };

    // Remove selected image
    const removeSelectedImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviewUrls(prev => {
            const newUrls = prev.filter((_, i) => i !== index);
            // Revoke the removed URL to free memory
            URL.revokeObjectURL(prev[index]);
            return newUrls;
        });
    };

    // Format file size for display
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
                                    <input
                                        type="text"
                                        id="vendor"
                                        name="vendor"
                                        value={formData.vendor}
                                        onChange={handleInputChange}
                                        placeholder="Vendor name"
                                        maxLength={50}
                                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
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

                                {/* Image Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Images (Optional)
                                    </label>
                                    
                                    {/* Upload Buttons */}
                                    <div className="flex space-x-2 mb-3">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) => handleImageSelect(e.target.files)}
                                            className="hidden"
                                            id="fileInput"
                                        />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={(e) => handleImageSelect(e.target.files)}
                                            className="hidden"
                                            id="cameraInput"
                                        />
                                        
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('fileInput')?.click()}
                                            className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Select Images
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('cameraInput')?.click()}
                                            className="flex items-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            Take Photo
                                        </button>
                                    </div>

                                    {/* Selected Images Preview */}
                                    {selectedImages.length > 0 && (
                                        <div>
                                            <p className="text-sm text-gray-600 mb-2">
                                                Selected Images ({selectedImages.length})
                                            </p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {imagePreviewUrls.map((url, index) => (
                                                    <div key={index} className="relative group">
                                                        <img
                                                            src={url}
                                                            alt={selectedImages[index].name}
                                                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeSelectedImage(index)}
                                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg">
                                                            {formatFileSize(selectedImages[index].size)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-center pt-6">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-8 py-3 text-lg font-bold text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isSubmitting ? 'Creating...' : selectedImages.length > 0 ? `Confirm & Upload ${selectedImages.length} Image${selectedImages.length > 1 ? 's' : ''}` : 'Confirm'}
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