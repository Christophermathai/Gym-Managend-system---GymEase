'use client';

import { useState } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { DatabaseRestore } from './DatabaseRestore';

interface ImportResult {
    success: number;
    failed: number;
    errors: string[];
}

export function BulkMemberImport() {
    const { token } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);

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
                else if (header.includes('phone')) member.phone = values[index];
                else if (header.includes('email')) member.email = values[index];
                else if (header.includes('gender')) {
                    const gender = values[index].toLowerCase();
                    member.gender = ['male', 'female', 'other'].includes(gender) ? gender : 'other';
                }
                else if (header.includes('blood')) member.bloodGroup = values[index];
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
                body: JSON.stringify({ members })
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
        const csv = 'Name,Phone Number,Email,Gender,Blood Group\nJohn Doe,1234567890,john@example.com,male,O+\nJane Smith,9876543210,jane@example.com,female,A+';
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'member_import_template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-obsidian-800 border border-obsidian-600 rounded-lg shadow-2xl p-8">
                <h2 className="text-2xl font-bold text-industrial-50 mb-6 font-sans uppercase tracking-tight">Bulk Member Import</h2>

                {/* Instructions */}
                <div className="bg-electric-500/10 border border-electric-500/30 rounded-lg p-4 mb-6">
                    <h3 className="font-bold text-electric-500 mb-2 uppercase tracking-widest text-[10px]">Instructions</h3>
                    <ul className="list-square list-inside text-xs text-industrial-300 space-y-2 font-mono leading-relaxed">
                        <li>Upload a CSV or Excel file with member data</li>
                        <li>First row must contain headers: Name, Phone Number, Email, Gender, Blood Group</li>
                        <li>Name and Phone Number are required fields</li>
                        <li>Gender must be: male, female, or other (defaults to other if not specified)</li>
                        <li>Email and Blood Group are optional</li>
                    </ul>
                </div>

                {/* Download Template */}
                <div className="mb-6">
                    <button
                        onClick={downloadTemplate}
                        className="px-4 py-2 bg-obsidian-900 text-industrial-50 border border-obsidian-700 rounded hover:border-electric-500 font-bold uppercase tracking-wider text-[10px] inline-flex items-center gap-2 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        DOWNLOAD TEMPLATE
                    </button>
                </div>

                {/* File Upload */}
                <div className="mb-8">
                    <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-2 border-l-2 border-electric-500 pl-2">
                        Select File
                    </label>
                    <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-industrial-400 file:mr-4 file:py-2.5 file:px-4 file:rounded file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-wider file:bg-obsidian-900 file:text-electric-500 hover:file:bg-obsidian-700 cursor-pointer border border-dashed border-obsidian-600 rounded bg-obsidian-900/50 p-2"
                    />
                    {file && (
                        <p className="mt-3 text-xs text-electric-500 font-mono">
                            Selected: <span className="text-industrial-50">{file.name}</span>
                        </p>
                    )}
                </div>

                {/* Import Button */}
                <button
                    onClick={handleImport}
                    disabled={!file || importing}
                    className="w-full px-6 py-3 bg-electric-500 text-white rounded font-bold uppercase tracking-widest text-sm hover:bg-electric-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-electric-500/20"
                >
                    {importing ? 'IMPORTING...' : 'IMPORT MEMBERS'}
                </button>

                {/* Results */}
                {result && (
                    <div className="mt-8 p-6 bg-obsidian-900 border border-obsidian-700 rounded-lg">
                        <h3 className="font-bold text-industrial-50 uppercase tracking-wide text-sm mb-4 border-b border-obsidian-700 pb-2">Import Results</h3>
                        <div className="space-y-3 text-xs font-mono">
                            <p className="text-green-500 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                Successfully imported: {result.success}
                            </p>
                            {result.failed > 0 && (
                                <p className="text-red-500 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    Failed: {result.failed}
                                </p>
                            )}
                            {result.errors.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-obsidian-800">
                                    <p className="font-bold text-industrial-400 uppercase tracking-widest mb-2 text-[10px]">Errors Log</p>
                                    <ul className="list-square list-inside text-red-400 space-y-1">
                                        {result.errors.slice(0, 10).map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                        {result.errors.length > 10 && (
                                            <li className="text-obsidian-400 pt-2">... and {result.errors.length - 10} more errors</li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Database Restore Section */}
                <div className="mt-12 pt-8 border-t border-obsidian-700">
                    <h2 className="text-xl font-bold text-industrial-50 mb-2 uppercase tracking-tight">Database Restore</h2>
                    <p className="text-industrial-400 text-sm mb-6 max-w-2xl">Restore your database from automatic backups in case of data loss or system failure.</p>
                    <DatabaseRestore />
                </div>
            </div>
        </div>
    );
}
