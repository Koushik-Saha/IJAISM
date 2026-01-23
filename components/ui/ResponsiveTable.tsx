import React from 'react';

interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    className?: string; // For adding specific styles like 'text-right'
    mobileLabel?: string; // Optional custom label for mobile view, defaults to header
    render?: (item: T) => React.ReactNode; // Optional custom renderer
}

interface ResponsiveTableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyExtractor: (item: T) => string | number;
    emptyMessage?: string;
    onRowClick?: (item: T) => void;
}

export default function ResponsiveTable<T>({
    columns,
    data,
    keyExtractor,
    emptyMessage = "No data found.",
    onRowClick
}: ResponsiveTableProps<T>) {

    const hasData = data.length > 0;

    if (!hasData) {
        return (
            <div className="bg-white p-8 text-center text-gray-500 rounded-lg shadow-sm border border-gray-100">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Desktop view (md and up) */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {columns.map((col, index) => (
                                    <th
                                        key={index}
                                        scope="col"
                                        className={`px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider ${col.className || ''}`}
                                    >
                                        {col.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.map((item, rowIndex) => (
                                <tr
                                    key={keyExtractor(item)}
                                    onClick={() => onRowClick && onRowClick(item)}
                                    className={onRowClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : 'hover:bg-gray-50 transition-colors'}
                                >
                                    {columns.map((col, colIndex) => (
                                        <td
                                            key={colIndex}
                                            className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${col.className || ''}`}
                                        >
                                            {col.render
                                                ? col.render(item)
                                                : typeof col.accessor === 'function'
                                                    ? col.accessor(item)
                                                    : (item[col.accessor] as React.ReactNode)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile view (< md) */}
            <div className="md:hidden space-y-4">
                {data.map((item) => (
                    <div
                        key={keyExtractor(item)}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3"
                        onClick={() => onRowClick && onRowClick(item)}
                    >
                        {columns.map((col, colIndex) => {
                            // Skip columns that might be action buttons if we want to treat them differently, 
                            // but for generic table we just render all
                            const content = col.render
                                ? col.render(item)
                                : typeof col.accessor === 'function'
                                    ? col.accessor(item)
                                    : (item[col.accessor] as React.ReactNode);

                            return (
                                <div key={colIndex} className="flex justify-between items-start border-b last:border-0 border-gray-100 pb-2 last:pb-0">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">
                                        {col.mobileLabel || col.header}
                                    </span>
                                    <div className={`text-sm text-gray-900 text-right ml-4 ${col.className || ''}`}>
                                        {content}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
