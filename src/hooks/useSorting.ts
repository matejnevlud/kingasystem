import { useState, useMemo } from 'react';

export type SortDirection = 'off' | 'asc' | 'desc';

export interface SortConfig {
    key: string | null;
    direction: SortDirection;
}

export interface SortableColumn {
    key: string;
    label: string;
    sortable?: boolean;
    sortFn?: (a: any, b: any) => number;
}

export function useSorting<T>(data: T[], defaultSortKey?: string) {
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: defaultSortKey || null,
        direction: 'off'
    });

    const sortedData = useMemo(() => {
        if (!sortConfig.key || sortConfig.direction === 'off') {
            return data;
        }

        const sorted = [...data].sort((a: any, b: any) => {
            const aValue = getNestedValue(a, sortConfig.key!);
            const bValue = getNestedValue(b, sortConfig.key!);
            
            // Handle null/undefined values
            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return 1;
            if (bValue == null) return -1;
            
            // Handle different data types
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return aValue.toLowerCase().localeCompare(bValue.toLowerCase());
            }
            
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return aValue - bValue;
            }
            
            if (aValue instanceof Date && bValue instanceof Date) {
                return aValue.getTime() - bValue.getTime();
            }
            
            // Handle boolean values
            if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
                return aValue === bValue ? 0 : aValue ? -1 : 1;
            }
            
            // Fallback to string comparison
            return String(aValue).toLowerCase().localeCompare(String(bValue).toLowerCase());
        });

        return sortConfig.direction === 'desc' ? sorted.reverse() : sorted;
    }, [data, sortConfig]);

    const requestSort = (key: string) => {
        setSortConfig(prevConfig => {
            if (prevConfig.key !== key) {
                return { key, direction: 'asc' };
            }
            
            // Cycle through: off -> asc -> desc -> off
            switch (prevConfig.direction) {
                case 'off':
                    return { key, direction: 'asc' };
                case 'asc':
                    return { key, direction: 'desc' };
                case 'desc':
                    return { key: null, direction: 'off' };
                default:
                    return { key, direction: 'asc' };
            }
        });
    };

    const getSortIcon = (columnKey: string) => {
        if (sortConfig.key !== columnKey) {
            return '↕️'; // Neutral sort icon
        }
        
        switch (sortConfig.direction) {
            case 'asc':
                return '↑';
            case 'desc':
                return '↓';
            default:
                return '↕️';
        }
    };

    const getSortClasses = (columnKey: string) => {
        const baseClasses = 'cursor-pointer hover:bg-gray-100 select-none transition-colors';
        
        if (sortConfig.key === columnKey && sortConfig.direction !== 'off') {
            return `${baseClasses} bg-blue-50`;
        }
        
        return baseClasses;
    };

    return {
        sortedData,
        sortConfig,
        requestSort,
        getSortIcon,
        getSortClasses
    };
}

// Helper function to get nested object values using dot notation
function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}