'use client';

import React, { useEffect, useState } from 'react';
import { FiBarChart2 } from 'react-icons/fi';
import { motion } from 'framer-motion';

export function RevenueChart() {
    const [chartData, setChartData] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [maxVal, setMaxVal] = useState(0);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await fetch('/api/admin/metrics');
                if (response.ok) {
                    const data = await response.json();
                    if (data.chartData && Array.isArray(data.chartData)) {
                        setChartData(data.chartData);
                        setMaxVal(Math.max(...data.chartData, 1000)); // Ensure non-zero scale
                    }
                }
            } catch (error) {
                console.error('Failed to fetch chart data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, []);

    const formatCurrency = (val: number) => {
        if (val >= 1000000) return `₦${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `₦${(val / 1000).toFixed(1)}k`;
        return `₦${val}`;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 h-[400px] animate-pulse flex flex-col">
                <div className="h-8 w-48 bg-gray-100 rounded mb-8"></div>
                <div className="flex-1 flex items-end justify-between gap-2 px-4">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="w-full bg-gray-100 rounded-t-lg" style={{ height: `${Math.random() * 80 + 20}%` }}></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 lg:p-8 h-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="font-heading font-bold text-gray-900 text-xl flex items-center gap-2">
                        <FiBarChart2 className="text-gray-400" /> Revenue Overview
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Monthly revenue performance for the current year</p>
                </div>
                <div className="text-right hidden sm:block">
                    <div className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">Total Year</div>
                    <div className="text-2xl font-bold text-rare-primary">
                        ₦{chartData.reduce((a, b) => a + b, 0).toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="relative h-64 flex items-end justify-between gap-2 sm:gap-4 mt-4">
                {/* Y-Axis Grid Lines (Simplified) */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    <div className="border-t border-gray-100 w-full h-0"></div>
                    <div className="border-t border-gray-100 w-full h-0"></div>
                    <div className="border-t border-gray-100 w-full h-0"></div>
                    <div className="border-t border-gray-100 w-full h-0"></div>
                    <div className="border-b border-gray-100 w-full h-0"></div>
                </div>

                {chartData.map((value, index) => {
                    const heightPercent = maxVal > 0 ? (value / maxVal) * 100 : 0;
                    const isCurrentMonth = index === currentMonth;

                    return (
                        <div key={index} className="flex-1 flex flex-col items-center group relative z-10 h-full justify-end">
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg z-20 pointer-events-none">
                                {formatCurrency(value)}
                            </div>

                            {/* Bar */}
                            <div className="w-full h-full flex items-end px-1 sm:px-2">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${heightPercent}%` }}
                                    transition={{ duration: 0.8, delay: index * 0.05, ease: "easeOut" }}
                                    className={`w-full rounded-t-lg transition-all duration-300 ${isCurrentMonth
                                        ? 'bg-rare-primary shadow-lg shadow-rare-primary/30'
                                        : 'bg-rare-secondary/30 hover:bg-rare-secondary'
                                        }`}
                                />
                            </div>

                            {/* Label */}
                            <div className={`mt-3 text-[10px] sm:text-xs font-medium uppercase tracking-wider ${isCurrentMonth ? 'text-rare-primary font-bold' : 'text-gray-400'}`}>
                                {months[index]}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
