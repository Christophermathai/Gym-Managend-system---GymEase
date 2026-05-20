'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { DatabaseRestore } from './DatabaseRestore';

interface FeePlan {
    id: string;
    name: string;
    duration: number;
    monthly_fee: number;
    is_couple_package?: boolean;
}

interface ImportResult {
    success: number;
    failed: number;
    subscriptionsCreated: number;
    errors: string[];
}

export function BulkMemberImport() {
    const { token } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [feePlans, setFeePlans] = useState<FeePlan[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    const selectedPlan = feePlans.find(plan => plan.id === selectedPlanId);

    useEffect(() => {
        const fetchFeePlans = async () => {
            try {
                const res = await fetch('/api/fee-plans', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setFeePlans(data.filter((p: any) => p.is_active));
                }
            } catch { /* ignore */ }
        };
        if (token) fetchFeePlans();
    }, [token]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            const fileType = selectedFile.name.split('.').pop()?.toLowerCase();
            if (fileType === 'csv' || fileType === 'xlsx' || fileType === 'xls') {
                setFile(selectedFile);
                setResult(null);
            } else {
                toast.error('Please select a CSV or Excel file');
            }
        }
    };

    const parseCSV = (text: string): any[] => {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const members = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const member: any = {};

            headers.forEach((header, index) => {
                if (header.includes('name')) member.name = values[index];
                else if (header.includes('partner') && header.includes('phone')) member.partnerPhone = values[index];
                else if (header.includes('phone')) member.phone = values[index];
                else if (header.includes('email') && !header.includes('partner')) member.email = values[index];
                else if (header.includes('gender')) {
                    const gender = values[index].toLowerCase();
                    member.gender = ['male', 'female', 'other'].includes(gender) ? gender : 'other';
                }
                else if (header.includes('blood')) member.bloodGroup = values[index];
                else if (
                    header === 'payment date' ||
                    header === 'payment_date' ||
                    header === 'paymentdate' ||
                    header === 'last payment' ||
                    header === 'last_payment' ||
                    header === 'paid on' ||
                    header === 'paid date' ||
                    header === 'date of payment' ||
                    (header.includes('payment') && header.includes('date')) ||
                    (header.includes('paid') && header.includes('date'))
                ) {
                    const dateVal = values[index]?.trim();
                    if (dateVal) {
                        let parsed: Date | null = null;
                        if (dateVal.includes('/')) {
                            const parts = dateVal.split('/');
                            if (parts[0].length === 4) {
                                // YYYY/MM/DD
                                parsed = new Date(`${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`);
                            } else {
                                // DD/MM/YYYY
                                parsed = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
                            }
                        } else if (dateVal.includes('-')) {
                            const parts = dateVal.split('-');
                            if (parts[0].length === 4) {
                                // YYYY-MM-DD
                                parsed = new Date(dateVal);
                            } else {
                                // DD-MM-YYYY
                                parsed = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
                            }
                        }
                        if (parsed && !isNaN(parsed.getTime())) {
                            member.paymentDate = parsed.getTime();
                        }
                    }
                }
                else if (
                    header === 'admission date' ||
                    header === 'admission_date' ||
                    header === 'admissiondate' ||
                    header === 'date of admission' ||
                    (header.includes('admission') && header.includes('date'))
                ) {
                    const dateVal = values[index]?.trim();
                    if (dateVal) {
                        let parsed: Date | null = null;
                        if (dateVal.includes('/')) {
                            const parts = dateVal.split('/');
                            if (parts[0].length === 4) {
                                // YYYY/MM/DD
                                parsed = new Date(`${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`);
                            } else {
                                // DD/MM/YYYY
                                parsed = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
                            }
                        } else if (dateVal.includes('-')) {
                            const parts = dateVal.split('-');
                            if (parts[0].length === 4) {
                                // YYYY-MM-DD
                                parsed = new Date(dateVal);
                            } else {
                                // DD-MM-YYYY
                                parsed = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
                            }
                        }
                        if (parsed && !isNaN(parsed.getTime())) {
                            member.admissionDate = parsed.getTime();
                        }
                    }
                }
            });

            if (member.name && member.phone) {
                members.push(member);
            }
        }

        return members;
    };

    const handleImport = async () => {
        if (!file) {
            toast.error('Please select a file');
            return;
        }

        setImporting(true);

        try {
            const text = await file.text();
            const members = parseCSV(text);

            if (members.length === 0) {
                toast.error('No valid members found in file');
                setImporting(false);
                return;
            }

            const response = await fetch('/api/members/bulk-import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ members, feePlanId: selectedPlanId || null })
            });

            const data = await response.json();

            if (response.ok) {
                setResult(data);
                toast.success(`Successfully imported ${data.success} members`);
                if (data.failed > 0) {
                    toast.warning(`${data.failed} members failed to import`);
                }
            } else {
                toast.error(data.error || 'Import failed');
            }
        } catch (error) {
            console.error('Import error:', error);
            toast.error('Failed to import members');
        } finally {
            setImporting(false);
        }
    };

    const downloadTemplate = () => {
        const csv = 'Name,Phone Number,Email,Gender,Blood Group,Payment Date,Partner Phone\nJohn Doe,1234567890,john@example.com,male,O+,15/03/2026,9876543210\nJane Smith,9876543210,jane@example.com,female,A+,01/01/2026,1234567890';
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'member_import_template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-obsidian-800 border border-obsidian-600 rounded-lg shadow-2xl p-6 lg:p-8">

            {/* Header row — title left, import button right */}
            <div className="mb-8 border-b border-obsidian-700 pb-4 flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-industrial-50 uppercase tracking-wide flex items-center gap-3">
                        <svg className="w-6 h-6 text-electric-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Bulk Member Import
                    </h2>
                    <p className="text-industrial-400 mt-2 text-sm">Import multiple members at once from a CSV or Excel file.</p>
                </div>
                <button
                    onClick={handleImport}
                    disabled={!file || importing}
                    className="shrink-0 px-8 py-3 bg-electric-500 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-electric-600 transition-colors uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(0,102,255,0.2)] hover:shadow-[0_0_20px_rgba(0,102,255,0.4)]"
                >
                    {importing ? (
                        <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Importing...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            Import Members
                        </>
                    )}
                </button>
            </div>

            {/* 2-column grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                {/* Left column — upload controls */}
                <div className="space-y-6 bg-obsidian-900 p-6 border border-obsidian-700/50 rounded-lg">
                    <h3 className="text-[10px] font-bold text-electric-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1 h-3 bg-electric-500 rounded-sm inline-block"></span>
                        Upload Configuration
                    </h3>

                    {/* Fee Plan Selector */}
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest border-l-2 border-steelgold-500 pl-2">
                            Fee Plan <span className="text-industrial-500 normal-case font-normal">(optional)</span>
                        </label>
                        <select
                            value={selectedPlanId}
                            onChange={e => setSelectedPlanId(e.target.value)}
                            className="w-full p-3 bg-obsidian-800 border border-obsidian-600 rounded text-industrial-50 text-sm font-mono focus:border-electric-500 focus:ring-1 focus:ring-electric-500 outline-none"
                        >
                            <option value="">-- No Fee Plan (import members only) --</option>
                            {feePlans.map(plan => (
                                <option key={plan.id} value={plan.id}>
                                    {plan.name} — {plan.duration} months — ₹{plan.monthly_fee}/mo{plan.is_couple_package ? ' (couple)' : ''}
                                </option>
                            ))}
                        </select>
                        {selectedPlanId && (
                            <p className="text-xs text-steelgold-500 font-mono">
                                {selectedPlan?.is_couple_package
                                    ? 'Couple package: include Partner Phone column to link members.'
                                    : 'Members with a Payment Date will get a subscription + payment auto-created.'}
                            </p>
                        )}
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest border-l-2 border-electric-500 pl-2">
                            Select File
                        </label>
                        <input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-industrial-400 file:mr-4 file:py-2.5 file:px-4 file:rounded file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-wider file:bg-obsidian-700 file:text-electric-500 hover:file:bg-obsidian-600 cursor-pointer border border-dashed border-obsidian-600 rounded bg-obsidian-800/50 p-2"
                        />
                        {file && (
                            <p className="text-xs text-electric-500 font-mono">
                                Selected: <span className="text-industrial-50">{file.name}</span>
                            </p>
                        )}
                    </div>

                    {/* Download Template */}
                    <div>
                        <button
                            onClick={downloadTemplate}
                            className="px-4 py-2 bg-obsidian-800 text-industrial-50 border border-obsidian-600 rounded hover:border-electric-500 hover:text-electric-500 font-bold uppercase tracking-wider text-[10px] inline-flex items-center gap-2 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download CSV Template
                        </button>
                    </div>
                </div>

                {/* Right column — instructions + results */}
                <div className="space-y-6">

                    {/* Instructions */}
                    <div className="bg-obsidian-900 p-6 border border-obsidian-700/50 rounded-lg">
                        <h3 className="text-[10px] font-bold text-electric-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-1 h-3 bg-electric-500 rounded-sm inline-block"></span>
                            Instructions
                        </h3>
                        <ul className="space-y-2 text-xs text-industrial-300 font-mono leading-relaxed">
                            <li className="flex gap-2"><span className="text-electric-500 shrink-0">›</span>Upload a CSV or Excel file with member data</li>
                            <li className="flex gap-2"><span className="text-electric-500 shrink-0">›</span>First row must contain headers: Name, Phone Number, Email, Gender, Blood Group, Payment Date, Partner Phone</li>
                            <li className="flex gap-2"><span className="text-electric-500 shrink-0">›</span><strong className="text-industrial-50">Name</strong> and <strong className="text-industrial-50">Phone Number</strong> are required fields</li>
                            <li className="flex gap-2"><span className="text-electric-500 shrink-0">›</span>Gender must be: male, female, or other</li>
                            <li className="flex gap-2"><span className="text-electric-500 shrink-0">›</span>Payment Date format: DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD</li>
                            <li className="flex gap-2"><span className="text-electric-500 shrink-0">›</span>If a Fee Plan is selected and Payment Date is provided, subscription &amp; payment are created automatically</li>
                            <li className="flex gap-2"><span className="text-electric-500 shrink-0">›</span>For couple packages, include a Partner Phone column to link two members</li>
                        </ul>
                    </div>

                    {/* Import Results */}
                    {result && (
                        <div className="bg-obsidian-900 p-6 border border-obsidian-700/50 rounded-lg">
                            <h3 className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-1 h-3 bg-industrial-400 rounded-sm inline-block"></span>
                                Import Results
                            </h3>
                            <div className="space-y-3 text-xs font-mono">
                                <p className="text-green-500 flex items-center gap-2">
                                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                    Successfully imported: <span className="font-bold">{result.success}</span>
                                </p>
                                {result.subscriptionsCreated > 0 && (
                                    <p className="text-steelgold-500 flex items-center gap-2">
                                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Subscriptions &amp; payments created: <span className="font-bold">{result.subscriptionsCreated}</span>
                                    </p>
                                )}
                                {result.failed > 0 && (
                                    <p className="text-red-500 flex items-center gap-2">
                                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        Failed: <span className="font-bold">{result.failed}</span>
                                    </p>
                                )}
                                {result.errors.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-obsidian-700">
                                        <p className="font-bold text-industrial-400 uppercase tracking-widest mb-2 text-[10px]">Errors Log</p>
                                        <ul className="space-y-1 text-red-400">
                                            {result.errors.slice(0, 10).map((error, i) => (
                                                <li key={i} className="flex gap-2"><span className="shrink-0">›</span>{error}</li>
                                            ))}
                                            {result.errors.length > 10 && (
                                                <li className="text-industrial-500 pt-1">... and {result.errors.length - 10} more errors</li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Database Restore — full width below */}
            <div className="mt-8 pt-8 border-t border-obsidian-700">
                <div className="mb-6 flex items-center gap-3">
                    <div>
                        <h2 className="text-xl font-bold text-industrial-50 uppercase tracking-tight flex items-center gap-3">
                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                            </svg>
                            Database Restore
                        </h2>
                        <p className="text-industrial-400 text-sm mt-1">Restore your database from automatic backups in case of data loss or system failure.</p>
                    </div>
                </div>
                <DatabaseRestore />
            </div>
        </div>
    );
}
