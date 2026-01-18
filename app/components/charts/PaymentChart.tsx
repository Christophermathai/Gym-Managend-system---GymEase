'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

interface PaymentChartProps {
    paidCount: number;
    unpaidCount: number;
}

export function PaymentChart({ paidCount, unpaidCount }: PaymentChartProps) {
    const data = [
        { name: 'Paid Fees', value: paidCount, color: '#10b981' },
        { name: 'Unpaid Fees', value: unpaidCount, color: '#ef4444' },
    ];

    const total = paidCount + unpaidCount;
    const paidPercentage = total > 0 ? ((paidCount / total) * 100).toFixed(1) : 0;
    const unpaidPercentage = total > 0 ? ((unpaidCount / total) * 100).toFixed(1) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl p-6"
        >
            <h3 className="text-xl font-bold text-white mb-4">Payment Status</h3>

            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-full md:w-1/2">
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                animationBegin={0}
                                animationDuration={800}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="w-full md:w-1/2 space-y-4">
                    <div className="bg-green-500/20 backdrop-blur-sm rounded-xl p-4 border border-green-500/30">
                        <div className="flex items-center justify-between">
                            <span className="text-green-100 font-medium">Paid</span>
                            <span className="text-2xl font-bold text-green-400">{paidPercentage}%</span>
                        </div>
                        <p className="text-green-200 text-sm mt-1">{paidCount} members</p>
                    </div>

                    <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-4 border border-red-500/30">
                        <div className="flex items-center justify-between">
                            <span className="text-red-100 font-medium">Unpaid</span>
                            <span className="text-2xl font-bold text-red-400">{unpaidPercentage}%</span>
                        </div>
                        <p className="text-red-200 text-sm mt-1">{unpaidCount} members</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
