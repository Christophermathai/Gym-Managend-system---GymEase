'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

interface PaymentChartProps {
    paidCount: number;
    unpaidCount: number;
    partialCount?: number;
}

export function PaymentChart({ paidCount, unpaidCount, partialCount = 0 }: PaymentChartProps) {
    const data = [
        { name: 'Paid Fees', value: paidCount, color: '#10b981' }, // green-500
        { name: 'Unpaid Fees', value: unpaidCount, color: '#ef4444' }, // red-500
    ];

    if (partialCount > 0) {
        data.push({ name: 'Outstanding Bal.', value: partialCount, color: '#f97316' }); // orange-500
    }

    const total = paidCount + unpaidCount + partialCount;
    const paidPercentage = total > 0 ? ((paidCount / total) * 100).toFixed(1) : 0;
    const unpaidPercentage = total > 0 ? ((unpaidCount / total) * 100).toFixed(1) : 0;
    const partialPercentage = total > 0 ? ((partialCount / total) * 100).toFixed(1) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full flex flex-col md:flex-row items-center gap-6"
        >
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
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc', fontSize: '12px', fontFamily: 'monospace' }}
                            itemStyle={{ color: '#f8fafc' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="w-full md:w-1/2 space-y-4">
                <div className="bg-obsidian-900 border border-obsidian-700/50 border-l-4 border-l-green-500 rounded p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest">Paid</span>
                        <span className="text-xl font-mono font-bold text-green-500">{paidPercentage}%</span>
                    </div>
                    <p className="text-industrial-500 font-mono text-xs mt-1">{paidCount} MEMBERS</p>
                </div>

                <div className="bg-obsidian-900 border border-obsidian-700/50 border-l-4 border-l-red-500 rounded p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest">Unpaid</span>
                        <span className="text-xl font-mono font-bold text-red-500">{unpaidPercentage}%</span>
                    </div>
                    <p className="text-industrial-500 font-mono text-xs mt-1">{unpaidCount} MEMBERS</p>
                </div>

                {partialCount > 0 && (
                    <div className="bg-obsidian-900 border border-obsidian-700/50 border-l-4 border-l-orange-500 rounded p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest">Outstanding Bal.</span>
                            <span className="text-xl font-mono font-bold text-orange-500">{partialPercentage}%</span>
                        </div>
                        <p className="text-industrial-500 font-mono text-xs mt-1">{partialCount} MEMBERS</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
