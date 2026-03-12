'use client';

import { useState } from 'react';
import { useAuth } from './AuthContext';
import { formatCurrency, formatDate } from '@/app/lib/utils';
import { toast } from 'sonner';

type ReportType = 'members' | 'payments' | 'expenses' | 'summary' | 'expiring';

interface ReportResult {
    type: ReportType;
    generatedAt: number;
    dateRange?: { from: number; to: number };
    daysAhead?: number;
    summary: Record<string, any>;
    data: any[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function toDateInputValue(ts: number): string {
    return new Date(ts).toISOString().split('T')[0];
}

function fromDateInputValue(s: string): number {
    return new Date(s).getTime();
}

function getReportTitle(type: ReportType): string {
    const titles: Record<ReportType, string> = {
        members: 'Member List Report',
        payments: 'Payment Report',
        expenses: 'Expense Report',
        summary: 'Financial Summary Report',
        expiring: 'Expiring Memberships Report',
    };
    return titles[type];
}

// ─── Print helper — uses a hidden iframe (no new tab) ─────────────────────────

function printReport(result: ReportResult, columns: typeof COLUMNS[ReportType]) {
    const title = getReportTitle(result.type);
    const generatedAt = new Date(result.generatedAt).toLocaleString();
    const periodLine = result.dateRange
        ? `Period: ${formatDate(result.dateRange.from)} - ${formatDate(result.dateRange.to)}`
        : result.daysAhead
            ? `Next ${result.daysAhead} days`
            : '';

    // Build summary HTML
    let summaryHtml = '';
    const s = result.summary;
    if (result.type === 'members') {
        summaryHtml = `
            <div class="summary-grid">
                <div class="stat"><div class="stat-label">Total Members</div><div class="stat-value">${s.total}</div></div>
                <div class="stat"><div class="stat-label">Active</div><div class="stat-value green">${s.active}</div></div>
                <div class="stat"><div class="stat-label">Inactive</div><div class="stat-value red">${s.inactive}</div></div>
                <div class="stat"><div class="stat-label">With Active Sub.</div><div class="stat-value blue">${s.withActiveSubscription}</div></div>
            </div>`;
    } else if (result.type === 'payments') {
        summaryHtml = `
            <div class="summary-grid">
                <div class="stat"><div class="stat-label">Total Transactions</div><div class="stat-value">${s.totalTransactions}</div></div>
                <div class="stat"><div class="stat-label">Completed</div><div class="stat-value green">${s.completedTransactions}</div></div>
                <div class="stat"><div class="stat-label">Pending</div><div class="stat-value">${s.pendingTransactions}</div></div>
                <div class="stat"><div class="stat-label">Total Revenue</div><div class="stat-value green">${formatCurrency(s.totalRevenue)}</div></div>
                <div class="stat"><div class="stat-label">Pending Amount</div><div class="stat-value red">${formatCurrency(s.totalPending)}</div></div>
            </div>`;
    } else if (result.type === 'expenses') {
        summaryHtml = `
            <div class="summary-grid">
                <div class="stat"><div class="stat-label">Total Expenses</div><div class="stat-value red">${formatCurrency(s.totalExpenses)}</div></div>
                <div class="stat"><div class="stat-label">Transactions</div><div class="stat-value">${s.totalTransactions}</div></div>
            </div>`;
    } else if (result.type === 'summary') {
        const isProfit = s.netProfit >= 0;
        const revenueRows = Object.entries(s.revenueByType || {}).map(([k, v]) =>
            `<tr><td>${k.replace(/_/g, ' ')}</td><td class="green">${formatCurrency(v as number)}</td></tr>`).join('');
        const expenseRows = Object.entries(s.expensesByCategory || {}).map(([k, v]) =>
            `<tr><td>${k}</td><td class="red">${formatCurrency(v as number)}</td></tr>`).join('');
        summaryHtml = `
            <div class="summary-grid">
                <div class="stat"><div class="stat-label">Total Revenue</div><div class="stat-value green">${formatCurrency(s.totalRevenue)}</div></div>
                <div class="stat"><div class="stat-label">Total Expenses</div><div class="stat-value red">${formatCurrency(s.totalExpenses)}</div></div>
                <div class="stat"><div class="stat-label">Net Profit</div><div class="stat-value ${isProfit ? 'green' : 'red'}">${formatCurrency(s.netProfit)}</div></div>
                <div class="stat"><div class="stat-label">Profit Margin</div><div class="stat-value ${isProfit ? 'green' : 'red'}">${s.profitMargin}%</div></div>
                <div class="stat"><div class="stat-label">Active Members</div><div class="stat-value blue">${s.activeMembers}</div></div>
            </div>
            <div class="breakdown-tables">
                <div><h3>Revenue by Type</h3><table class="breakdown"><tbody>${revenueRows}</tbody></table></div>
                <div><h3>Expenses by Category</h3><table class="breakdown"><tbody>${expenseRows}</tbody></table></div>
            </div>`;
    } else if (result.type === 'expiring') {
        summaryHtml = `
            <div class="summary-grid">
                <div class="stat"><div class="stat-label">Expiring in ${result.daysAhead} Days</div><div class="stat-value">${s.expiringCount}</div></div>
            </div>`;
    }

    // Build table HTML
    let tableHtml = '';
    if (result.type !== 'summary' && result.data.length > 0) {
        const headers = columns.map(c => `<th>${c.label}</th>`).join('');
        const rows = result.data.map(row =>
            `<tr>${columns.map(c => `<td>${c.format ? c.format(row[c.key]) : (row[c.key] ?? '—')}</td>`).join('')}</tr>`
        ).join('');
        tableHtml = `
            <table>
                <thead><tr>${headers}</tr></thead>
                <tbody>${rows}</tbody>
                <tfoot><tr><td colspan="${columns.length}">${result.data.length} record${result.data.length !== 1 ? 's' : ''}</td></tr></tfoot>
            </table>`;
    }

    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>GymEase - ${title}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 24px; }
        .header { border-bottom: 2px solid #1d4ed8; padding-bottom: 12px; margin-bottom: 18px; }
        .header h1 { font-size: 20px; color: #1d4ed8; }
        .header p { font-size: 11px; color: #666; margin-top: 4px; }
        .summary-grid { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 18px; }
        .stat { border: 1px solid #e5e7eb; border-radius: 4px; padding: 10px 14px; min-width: 130px; }
        .stat-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
        .stat-value { font-size: 16px; font-weight: 700; color: #111; margin-top: 3px; }
        .green { color: #15803d !important; }
        .red { color: #b91c1c !important; }
        .blue { color: #1d4ed8 !important; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th { background: #f3f4f6; text-align: left; font-size: 10px; text-transform: uppercase;
             letter-spacing: 0.05em; padding: 7px 10px; border-bottom: 2px solid #d1d5db; }
        td { padding: 6px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
        tfoot td { background: #f9fafb; font-weight: 600; font-size: 10px; color: #6b7280; }
        .breakdown-tables { display: flex; gap: 24px; margin-top: 16px; }
        .breakdown-tables > div { flex: 1; }
        .breakdown-tables h3 { font-size: 12px; font-weight: 600; margin-bottom: 6px; color: #374151; }
        .breakdown td:first-child { color: #374151; text-transform: capitalize; }
        @media print {
            body { padding: 12px; }
            button { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>GymEase — ${title}</h1>
        <p>Generated: ${generatedAt}${periodLine ? ' &nbsp;|&nbsp; ' + periodLine : ''}</p>
    </div>
    ${summaryHtml}
    ${tableHtml}
    <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;

    // Inject a hidden iframe — write report into it, trigger print, then remove it
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) { document.body.removeChild(iframe); return; }

    doc.open();
    doc.write(html);
    doc.close();

    iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
            if (document.body.contains(iframe)) document.body.removeChild(iframe);
        }, 1000);
    };
}

// ─── Column definitions per report type ────────────────────────────────────────

const COLUMNS: Record<ReportType, { key: string; label: string; format?: (v: any) => string }[]> = {
    members: [
        { key: 'member_id', label: 'Member ID' },
        { key: 'name', label: 'Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'gender', label: 'Gender' },
        { key: 'admission_date', label: 'Admission Date', format: formatDate },
        { key: 'is_active', label: 'Status', format: v => v ? 'Active' : 'Inactive' },
        { key: 'plan_name', label: 'Plan' },
        { key: 'end_date', label: 'Sub. Ends', format: v => v ? formatDate(v) : '—' },
        { key: 'subscription_status', label: 'Sub. Status', format: v => v ?? '—' },
    ],
    payments: [
        { key: 'member_name', label: 'Member' },
        { key: 'member_display_id', label: 'Member ID' },
        { key: 'member_phone', label: 'Phone' },
        { key: 'payment_type', label: 'Type' },
        { key: 'payment_mode', label: 'Mode' },
        { key: 'amount', label: 'Amount', format: formatCurrency },
        { key: 'status', label: 'Status' },
        { key: 'payment_date', label: 'Date', format: formatDate },
        { key: 'transaction_id', label: 'Txn ID', format: v => v ?? '—' },
        { key: 'notes', label: 'Notes', format: v => v ?? '—' },
    ],
    expenses: [
        { key: 'category', label: 'Category' },
        { key: 'description', label: 'Description' },
        { key: 'amount', label: 'Amount', format: formatCurrency },
        { key: 'payment_mode', label: 'Mode' },
        { key: 'expense_date', label: 'Date', format: formatDate },
        { key: 'receipt_number', label: 'Receipt #', format: v => v ?? '—' },
        { key: 'recorded_by_name', label: 'Recorded By' },
        { key: 'notes', label: 'Notes', format: v => v ?? '—' },
    ],
    summary: [],
    expiring: [
        { key: 'member_id', label: 'Member ID' },
        { key: 'name', label: 'Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'plan_name', label: 'Plan' },
        { key: 'monthly_fee', label: 'Monthly Fee', format: formatCurrency },
        { key: 'end_date', label: 'Expiry Date', format: formatDate },
        { key: 'days_remaining', label: 'Days Left', format: v => `${v} day${v !== 1 ? 's' : ''}` },
    ],
};

// ─── Summary cards ──────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
    const colorMap: Record<string, string> = {
        green: 'text-green-500',
        red: 'text-red-500',
        blue: 'text-electric-500',
        yellow: 'text-orange-500',
    };
    return (
        <div className="bg-obsidian-800 border border-obsidian-600 rounded-lg p-4 shadow-lg">
            <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-xl font-mono font-bold ${color ? colorMap[color] : 'text-industrial-50'}`}>{value}</p>
        </div>
    );
}

function SummaryCards({ result }: { result: ReportResult }) {
    const { type, summary } = result;

    if (type === 'members') {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total Members" value={summary.total} />
                <StatCard label="Active" value={summary.active} color="green" />
                <StatCard label="Inactive" value={summary.inactive} color="red" />
                <StatCard label="With Active Sub." value={summary.withActiveSubscription} color="blue" />
            </div>
        );
    }
    if (type === 'payments') {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total Transactions" value={summary.totalTransactions} />
                <StatCard label="Completed" value={summary.completedTransactions} color="green" />
                <StatCard label="Pending" value={summary.pendingTransactions} color="yellow" />
                <StatCard label="Total Revenue" value={formatCurrency(summary.totalRevenue)} color="blue" />
                <StatCard label="Pending Amount" value={formatCurrency(summary.totalPending)} color="red" />
                {Object.entries(summary.byType || {}).map(([t, amt]) => (
                    <StatCard key={t} label={t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} value={formatCurrency(amt as number)} />
                ))}
            </div>
        );
    }
    if (type === 'expenses') {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total Expenses" value={formatCurrency(summary.totalExpenses)} color="red" />
                <StatCard label="Transactions" value={summary.totalTransactions} />
                {Object.entries(summary.byCategory || {}).map(([cat, amt]) => (
                    <StatCard key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)} value={formatCurrency(amt as number)} />
                ))}
            </div>
        );
    }
    if (type === 'summary') {
        const isProfit = summary.netProfit >= 0;
        return (
            <div className="space-y-6 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Total Revenue" value={formatCurrency(summary.totalRevenue)} color="green" />
                    <StatCard label="Total Expenses" value={formatCurrency(summary.totalExpenses)} color="red" />
                    <StatCard label="Net Profit" value={formatCurrency(summary.netProfit)} color={isProfit ? 'green' : 'red'} />
                    <StatCard label="Profit Margin" value={`${summary.profitMargin}%`} color={isProfit ? 'green' : 'red'} />
                    <StatCard label="Active Members" value={summary.activeMembers} color="blue" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-obsidian-800 border border-obsidian-600 rounded-lg p-4">
                        <h4 className="font-bold text-sm text-industrial-50 mb-3 uppercase tracking-widest border-l-2 border-green-500 pl-2">Revenue by Type</h4>
                        {Object.entries(summary.revenueByType || {}).map(([t, amt]) => (
                            <div key={t} className="flex justify-between py-2 text-sm border-b border-obsidian-700 last:border-0 hover:bg-obsidian-700/30 transition-colors">
                                <span className="text-industrial-300 font-mono text-xs uppercase tracking-widest pl-1">{t.replace(/_/g, ' ')}</span>
                                <span className="font-mono font-bold text-green-500 pr-1">{formatCurrency(amt as number)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="bg-obsidian-800 border border-obsidian-600 rounded-lg p-4">
                        <h4 className="font-bold text-sm text-industrial-50 mb-3 uppercase tracking-widest border-l-2 border-red-500 pl-2">Expenses by Category</h4>
                        {Object.entries(summary.expensesByCategory || {}).map(([cat, amt]) => (
                            <div key={cat} className="flex justify-between py-2 text-sm border-b border-obsidian-700 last:border-0 hover:bg-obsidian-700/30 transition-colors">
                                <span className="text-industrial-300 font-mono text-xs uppercase tracking-widest pl-1">{cat}</span>
                                <span className="font-mono font-bold text-red-500 pr-1">{formatCurrency(amt as number)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
    if (type === 'expiring') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard label={`Expiring in ${result.daysAhead} Days`} value={summary.expiringCount} color="yellow" />
            </div>
        );
    }
    return null;
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function Reports() {
    const { token } = useAuth();

    const now = Date.now();
    const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();

    const [reportType, setReportType] = useState<ReportType>('members');
    const [from, setFrom] = useState(toDateInputValue(startOfYear));
    const [to, setTo] = useState(toDateInputValue(now));
    const [days, setDays] = useState(7);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ReportResult | null>(null);

    const generateReport = async () => {
        setLoading(true);
        setResult(null);
        try {
            const params = new URLSearchParams({ type: reportType });
            if (reportType === 'expiring') {
                params.set('days', String(days));
            } else {
                params.set('from', String(fromDateInputValue(from)));
                params.set('to', String(fromDateInputValue(to) + 86399999));
            }

            const response = await fetch(`/api/reports/generate?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to generate report');
            }

            const data = await response.json();
            setResult(data);
            toast.success('Report generated');
        } catch (err: any) {
            toast.error(err.message || 'Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const columns = COLUMNS[reportType];
    const showDateRange = reportType !== 'expiring';
    const showDays = reportType === 'expiring';

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-industrial-50 mb-1">Reports</h2>
                <p className="text-industrial-400 text-[10px] uppercase font-bold tracking-widest mb-6">Generate reports on-demand. Reports are never generated automatically.</p>

                {/* Controls */}
                <div className="bg-obsidian-800 border border-obsidian-600 rounded-lg p-5 shadow-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        {/* Report Type */}
                        <div>
                            <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 border-l-2 border-electric-500 pl-2">Report Type</label>
                            <select
                                className="w-full bg-obsidian-900 border border-obsidian-600 rounded px-3 py-2 text-sm text-industrial-50 focus:outline-none focus:border-electric-500 transition-colors uppercase tracking-wider font-bold"
                                value={reportType}
                                onChange={e => { setReportType(e.target.value as ReportType); setResult(null); }}
                            >
                                <option value="members">Member List</option>
                                <option value="payments">Payment Report</option>
                                <option value="expenses">Expense Report</option>
                                <option value="summary">Financial Summary</option>
                                <option value="expiring">Expiring Memberships</option>
                            </select>
                        </div>

                        {/* Date range */}
                        {showDateRange && (
                            <>
                                <div>
                                    <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 border-l-2 border-electric-500 pl-2">From Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-obsidian-900 border border-obsidian-600 rounded px-3 py-2 text-sm text-industrial-50 focus:outline-none focus:border-electric-500 transition-colors font-mono [color-scheme:dark]"
                                        value={from}
                                        onChange={e => setFrom(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 border-l-2 border-electric-500 pl-2">To Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-obsidian-900 border border-obsidian-600 rounded px-3 py-2 text-sm text-industrial-50 focus:outline-none focus:border-electric-500 transition-colors font-mono [color-scheme:dark]"
                                        value={to}
                                        onChange={e => setTo(e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        {/* Days ahead (expiring only) */}
                        {showDays && (
                            <div>
                                <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 border-l-2 border-electric-500 pl-2">Days Ahead</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={365}
                                    className="w-full bg-obsidian-900 border border-obsidian-600 rounded px-3 py-2 text-sm text-industrial-50 focus:outline-none focus:border-electric-500 transition-colors font-mono"
                                    value={days}
                                    onChange={e => setDays(parseInt(e.target.value) || 7)}
                                />
                            </div>
                        )}

                        {/* Generate button */}
                        <div className="flex flex-row gap-2 justify-center">
                            <button
                                onClick={generateReport}
                                disabled={loading}
                                className="w-full bg-electric-500 hover:bg-electric-600 disabled:opacity-60 text-white font-bold text-[10px] uppercase tracking-widest py-2 px-4 rounded transition-colors flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(0,102,255,0.3)]"
                            >
                                {loading ? (
                                    <>
                                        <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                                        GENERATING...
                                    </>
                                ) : 'GENERATE'}
                            </button>
                            {result && (
                                <button
                                    onClick={() => printReport(result, columns)}
                                    className="w-full bg-obsidian-700 hover:bg-obsidian-600 hover:text-industrial-50 text-industrial-300 border border-obsidian-600 font-bold text-[10px] uppercase tracking-widest py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
                                >
                                    PRINT
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Results */}
            {result && (
                <div>
                    {/* Action bar */}
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-industrial-50 mb-1">{getReportTitle(result.type)}</h3>
                            <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest font-mono">
                                GENERATED {new Date(result.generatedAt).toLocaleString()}
                                {result.dateRange && ` · ${formatDate(result.dateRange.from)} – ${formatDate(result.dateRange.to)}`}
                                {result.daysAhead && ` · NEXT ${result.daysAhead} DAYS`}
                            </p>
                        </div>

                    </div>

                    {/* Summary cards */}
                    <SummaryCards result={result} />

                    {/* Data table */}
                    {result.type !== 'summary' && (
                        result.data.length === 0 ? (
                            <div className="text-center py-12 border border-obsidian-700 border-dashed rounded mt-4">
                                <p className="text-industrial-500 font-mono text-[10px] font-bold uppercase tracking-widest">[ SYSTEM: NO DATA FOUND FOR THIS PERIOD ]</p>
                            </div>
                        ) : (
                            <div className="bg-obsidian-800 border border-obsidian-600 rounded shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-obsidian-900 border-b border-obsidian-700">
                                                {columns.map(col => (
                                                    <th key={col.key} className="text-left font-bold text-[10px] text-industrial-400 uppercase tracking-widest px-4 py-3 whitespace-nowrap">
                                                        {col.label}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-obsidian-700/50">
                                            {result.data.map((row, i) => (
                                                <tr key={i} className="hover:bg-obsidian-700/30 transition-colors">
                                                    {columns.map(col => (
                                                        <td key={col.key} className="px-4 py-3 text-industrial-50 whitespace-nowrap">
                                                            {col.format ? col.format(row[col.key]) : (row[col.key] ?? '—')}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-obsidian-900 border-t border-obsidian-700">
                                                <td className="px-4 py-2 font-bold text-[10px] text-industrial-400 uppercase tracking-widest" colSpan={columns.length}>
                                                    [ {result.data.length} RECORD{result.data.length !== 1 ? 'S' : ''} EXPORTED ]
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        )
                    )}
                </div>
            )}

            {/* Empty state */}
            {!result && !loading && (
                <div className="text-center py-16 border border-obsidian-700 border-dashed rounded">
                    <p className="text-[10px] text-industrial-500 font-bold uppercase tracking-widest font-mono">[ SYSTEM: SELECT A TYPE TO GENERATE ]</p>
                </div>
            )}
        </div>
    );
}
