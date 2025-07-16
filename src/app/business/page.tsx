'use client';

import {useState, useEffect, useCallback} from 'react';
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

type BusinessPlan = {
    id: number;
    idUnit: number;
    year: number;
    month: number;
    revenue: number;
    indirectPerc: number;
    tax: number;
    ooc: number;
    unit?: Unit;
};

// Define the type for user session
type UserSession = {
    userId: number;
    name: string;
    pageAccess: {
        pgBusiness: boolean;
        [key: string]: any;
    };
};

// Define modal data type
type ModalData = {
    unitId: number;
    unitName: string;
    field: string;
    fieldLabel: string;
    currentValue: number;
    isPercentage: boolean;
};

// Generate years from current year - 2 to current year + 2
const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
        years.push(i);
    }
    return years;
};

// Generate months
const months = [
    {value: 1, label: 'January'},
    {value: 2, label: 'February'},
    {value: 3, label: 'March'},
    {value: 4, label: 'April'},
    {value: 5, label: 'May'},
    {value: 6, label: 'June'},
    {value: 7, label: 'July'},
    {value: 8, label: 'August'},
    {value: 9, label: 'September'},
    {value: 10, label: 'October'},
    {value: 11, label: 'November'},
    {value: 12, label: 'December'},
];

export default function BusinessPlanPage() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [businessPlans, setBusinessPlans] = useState<BusinessPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<UserSession | null>(null);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState<ModalData | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
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

                // Check if user has access to business page
                if (!data.pageAccess.pgBusiness) {
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

    // Fetch business plans when year/month changes
    useEffect(() => {
        if (!user || !selectedYear || !selectedMonth) return;

        async function fetchBusinessPlans() {
            try {
                const response = await fetch(`/api/business-plan?year=${selectedYear}&month=${selectedMonth}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch business plans');
                }
                const data = await response.json();
                setBusinessPlans(data);
            } catch (err) {
                setError('Error loading business plans. Please try again later.');
                console.error('Error fetching business plans:', err);
            }
        }

        fetchBusinessPlans();
    }, [user, selectedYear, selectedMonth]);

    // Get business plan for specific unit
    const getBusinessPlanForUnit = useCallback((unitId: number): BusinessPlan | null => {
        return businessPlans.find(plan => plan.idUnit === unitId) || null;
    }, [businessPlans]);

    // Handle cell click to open modal
    const handleCellClick = (unitId: number, field: string, currentValue: number | undefined, isPercentage: boolean = false) => {
        const unit = units.find(u => u.id === unitId);
        if (!unit) return;

        const fieldLabels: { [key: string]: string } = {
            revenue: 'Revenue',
            tax: 'Fix',
            indirectPerc: 'Indirect (%)',
            ooc: 'OOC'
        };

        setModalData({
            unitId,
            unitName: unit.unit,
            field,
            fieldLabel: fieldLabels[field] || field,
            currentValue: currentValue || 0,
            isPercentage
        });
        setInputValue((currentValue || 0).toString());
        setIsModalOpen(true);
    };

    // Handle modal save
    const handleModalSave = async () => {
        if (!modalData || !inputValue.trim()) return;

        setIsSubmitting(true);
        try {
            const currentPlan = getBusinessPlanForUnit(modalData.unitId);
            const numericValue = modalData.isPercentage ? parseFloat(inputValue) : parseInt(inputValue);

            const planData = {
                year: selectedYear,
                month: selectedMonth,
                unitId: modalData.unitId,
                revenue: modalData.field === 'revenue' ? numericValue : (currentPlan?.revenue || 0),
                indirectPerc: modalData.field === 'indirectPerc' ? numericValue : (currentPlan?.indirectPerc || 0),
                tax: modalData.field === 'tax' ? numericValue : (currentPlan?.tax || 0),
                ooc: modalData.field === 'ooc' ? numericValue : (currentPlan?.ooc || 0),
            };

            const response = await fetch('/api/business-plan', {
                method: currentPlan ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(planData),
            });

            if (!response.ok) {
                throw new Error('Failed to save business plan');
            }

            const updatedPlan = await response.json();

            // Update local state
            setBusinessPlans(prev => {
                const existingIndex = prev.findIndex(plan => plan.idUnit === modalData.unitId);
                if (existingIndex >= 0) {
                    const updated = [...prev];
                    updated[existingIndex] = updatedPlan;
                    return updated;
                } else {
                    return [...prev, updatedPlan];
                }
            });

            handleModalClose();
        } catch (err) {
            setError('Error saving business plan. Please try again.');
            console.error('Error saving business plan:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle modal close
    const handleModalClose = () => {
        setIsModalOpen(false);
        setModalData(null);
        setInputValue('');
    };

    // Render clickable cell
    const renderClickableCell = (unitId: number, field: string, value: number | undefined, isPercentage: boolean = false) => {
        const displayValue = value !== undefined ? value.toString() : '';

        return (
            <div
                onClick={() => handleCellClick(unitId, field, value, isPercentage)}
                className="w-full px-2 py-1 cursor-pointer bg-gray-100 hover:bg-gray-200 rounded transition-colors min-h-[2rem] min-w-[4rem]"
            >
                {displayValue}{isPercentage && displayValue ? '%' : ''}
            </div>
        );
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
                        <h1 className="text-2xl font-bold text-gray-800">Business Plan</h1>
                    </div>
                    
                    {/* Controls */}
                    {!loading && (
                        <div className="grid grid-cols-2 gap-4">
                            {/* Year Selection */}
                            <div>
                                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                                    Year
                                </label>
                                <Select
                                    id="year"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                >
                                    {generateYears().map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </Select>
                            </div>

                            {/* Month Selection */}
                            <div>
                                <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
                                    Month
                                </label>
                                <Select
                                    id="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                >
                                    {months.map((month) => (
                                        <option key={month.value} value={month.value}>
                                            {month.label}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                        </div>
                    )}
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

                    {/* Business Plan Table */}
                    {!loading && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fix</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Indirect (%)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OOC</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {units.map((unit) => {
                                    const businessPlan = getBusinessPlanForUnit(unit.id);
                                    return (
                                        <tr key={unit.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {unit.unit}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {renderClickableCell(unit.id, 'revenue', businessPlan?.revenue)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {renderClickableCell(unit.id, 'tax', businessPlan?.tax)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {renderClickableCell(unit.id, 'indirectPerc', businessPlan?.indirectPerc, true)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {renderClickableCell(unit.id, 'ooc', businessPlan?.ooc)}
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Fixed Footer with Instructions */}
                <div className="flex-shrink-0 bg-blue-50 border-t border-blue-200 p-4">
                    <p className="text-blue-700 text-sm">
                        <strong>Instructions:</strong> Click on any cell in the Revenue, Fix, Indirect (%), or OOC columns to edit.
                        A modal will open where you can enter the new value. Changes are automatically saved to the database.
                    </p>
                </div>
            </div>

            {/* Edit Value Modal */}
            {isModalOpen && modalData && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Edit {modalData.fieldLabel}
                            </h3>
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-2">Unit: <strong>{modalData.unitName}</strong></p>
                                <p className="text-sm text-gray-600 mb-2">Field: <strong>{modalData.fieldLabel}</strong></p>
                                <p className="text-sm text-gray-600 mb-4">
                                    Current Value: <strong>{modalData.currentValue}{modalData.isPercentage ? '%' : ''}</strong>
                                </p>
                            </div>

                            <div className="mb-6">
                                <label htmlFor="inputValue" className="block text-sm font-medium text-gray-700 mb-2">
                                    New Value
                                </label>
                                <input
                                    type="number"
                                    id="inputValue"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    step={modalData.isPercentage ? "0.1" : "1"}
                                    min="0"
                                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder={`Enter ${modalData.fieldLabel.toLowerCase()}`}
                                    autoFocus
                                />
                            </div>

                            <div className="flex justify-center space-x-4">
                                <button
                                    onClick={handleModalClose}
                                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleModalSave}
                                    disabled={isSubmitting || !inputValue.trim()}
                                    className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={handleModalClose}
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