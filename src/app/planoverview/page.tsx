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

type PlanOverviewData = {
    revenue: {
        budget: number;
        real: number;
        delta: number;
        deltaPercentage: number;
    };
    direct: {
        budget: number;
        real: number;
        delta: number;
        deltaPercentage: number;
    };
    indirect: {
        budget: number;
        real: number;
        delta: number;
        deltaPercentage: number;
    };
    ooc: {
        budget: number;
        real: number;
        delta: number;
        deltaPercentage: number;
    };
    fix: {
        budget: number;
        real: number;
        delta: number;
        deltaPercentage: number;
    };
    expenses: {
        budget: number;
        real: number;
        delta: number;
        deltaPercentage: number;
    };
    profit: {
        budget: number;
        real: number;
        delta: number;
        deltaPercentage: number;
    };
};

// Define the type for user session
type UserSession = {
    userId: number;
    name: string;
    pageAccess: {
        pgResult: boolean;
        [key: string]: any;
    };
};

export default function PlanOverviewPage() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [selectedUnitIds, setSelectedUnitIds] = useState<number[]>([]);
    const [planData, setPlanData] = useState<PlanOverviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<UserSession | null>(null);
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

                // Check if user has access to plan overview page
                if (!data.pageAccess.pgResult) {
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

    // Fetch plan overview data when filters change
    useEffect(() => {
        if (selectedUnitIds.length > 0 && dateFrom && dateTo) {
            async function fetchPlanOverview() {
                setLoading(true);
                try {
                    const unitParams = selectedUnitIds.map(id => `unitIds=${id}`).join('&');
                    const response = await fetch(`/api/plan-overview?${unitParams}&dateFrom=${dateFrom}&dateTo=${dateTo}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch plan overview');
                    }
                    const data = await response.json();
                    setPlanData(data);
                    setLoading(false);
                } catch (err) {
                    setError('Error loading plan overview. Please try again later.');
                    setLoading(false);
                    console.error('Error fetching plan overview:', err);
                }
            }

            fetchPlanOverview();
        } else {
            setPlanData(null);
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

    // Format number with proper sign and color
    const formatDelta = (value: number) => {
        const sign = value >= 0 ? '+' : '';
        const color = value >= 0 ? 'text-green-600' : 'text-red-600';
        return <span className={color}>{sign}{value.toFixed(0)}</span>;
    };

    // Format percentage with proper sign and color
    const formatDeltaPercentage = (value: number) => {
        const sign = value >= 0 ? '+' : '';
        const color = value >= 0 ? 'text-green-600' : 'text-red-600';
        return <span className={color}>{sign}{value.toFixed(1)}%</span>;
    };

    // Render data row
    const renderDataRow = (label: string, data: any, isSubCategory: boolean = false) => {
        if (!data) return null;

        // Check if this row should be bold (Revenue, Expenses, Profit)
        const shouldBeBold = ['Revenue', 'Expenses', 'Profit'].includes(label);
        
        let rowClasses, textClasses, labelClasses;
        
        if (shouldBeBold) {
            // Main categories (Revenue, Expenses, Profit)
            rowClasses = "border-b border-gray-200 bg-gray-50 font-bold";
            textClasses = "px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900";
            labelClasses = "px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900";
        } else if (isSubCategory) {
            // Sub-categories (Direct, Indirect, Fix)
            rowClasses = "border-b border-gray-100 bg-gray-25";
            textClasses = "pl-12 pr-6 py-2 whitespace-nowrap text-sm text-gray-600";
            labelClasses = "pl-12 pr-6 py-2 whitespace-nowrap text-sm text-gray-600 italic";
        } else {
            // Regular categories
            rowClasses = "border-b border-gray-200";
            textClasses = "px-6 py-4 whitespace-nowrap text-sm text-gray-900";
            labelClasses = "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900";
        }

        return (
            <tr key={label} className={rowClasses}>
                <td className={labelClasses}>
                    {isSubCategory && <span className="text-gray-400 mr-2">└</span>}
                    {label}
                </td>
                <td className={textClasses}>
                    {data.budget.toFixed(0)}
                </td>
                <td className={textClasses}>
                    {data.real.toFixed(0)}
                </td>
                <td className={textClasses}>
                    {formatDelta(data.delta)}
                </td>
            </tr>
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
                        <h1 className="text-2xl font-bold text-gray-800">Plan Overview</h1>
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

                    {/* Plan Overview Table */}
                    {selectedUnitIds.length > 0 && planData && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Real</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Delta</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {renderDataRow('Revenue', planData.revenue)}
                                {renderDataRow('Expenses', planData.expenses)}
                                {renderDataRow('Direct', planData.direct, true)}
                                {renderDataRow('Indirect', planData.indirect, true)}
                                {renderDataRow('OOC', planData.ooc, true)}
                                {renderDataRow('Fix', planData.fix, true)}
                                {renderDataRow('Profit', planData.profit)}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Empty State */}
                    {selectedUnitIds.length === 0 && (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-gray-500 text-center">Please select at least one unit to view plan overview.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}