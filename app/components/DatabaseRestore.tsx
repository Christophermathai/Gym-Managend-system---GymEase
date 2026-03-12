'use client';

import { useState } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface Backup {
    name: string;
    path: string;
    size: number;
    modified: number;
}

export function DatabaseRestore() {
    const { token } = useAuth();
    const [backups, setBackups] = useState<Backup[]>([]);
    const [loading, setLoading] = useState(false);
    const [restoring, setRestoring] = useState(false);

    const fetchBackups = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/database/restore', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setBackups(data.backups || []);
        } catch (error) {
            console.error('Error fetching backups:', error);
            toast.error('Failed to load backups');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (backupPath: string) => {
        if (!confirm('Are you sure you want to restore this backup? The current database will be backed up first. You will need to restart the application after restore.')) {
            return;
        }

        try {
            setRestoring(true);
            const response = await fetch('/api/database/restore', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ backupPath })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Database restored! Please restart the application.');
            } else {
                toast.error(data.error || 'Restore failed');
            }
        } catch (error) {
            console.error('Error restoring backup:', error);
            toast.error('Failed to restore backup');
        } finally {
            setRestoring(false);
        }
    };

    return (
        <div className="bg-obsidian-800 border border-obsidian-600 rounded-lg p-6">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-red-500 uppercase tracking-widest text-sm mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>
                    Warning
                </h3>
                <ul className="list-square list-inside text-xs text-red-400/80 space-y-1 font-mono tracking-wide">
                    <li>Restoring a backup will replace your current database</li>
                    <li>Your current database will be backed up before restore</li>
                    <li>You must restart the application after restore</li>
                    <li>Only owners can restore the database</li>
                </ul>
            </div>

            <button
                onClick={fetchBackups}
                disabled={loading}
                className="px-4 py-2 bg-obsidian-700 text-industrial-50 border border-obsidian-600 rounded hover:border-electric-500 hover:text-electric-500 font-bold tracking-wider text-xs uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
            >
                {loading ? 'LOADING...' : 'LOAD AVAILABLE BACKUPS'}
            </button>

            {backups.length > 0 && (
                <div className="space-y-3">
                    <h3 className="font-bold text-industrial-400 uppercase tracking-widest text-xs mb-3 border-b border-obsidian-700 pb-2">Available Backups</h3>
                    <div className="grid gap-3">
                        {backups.map((backup, index) => (
                            <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-obsidian-900 border border-obsidian-700 rounded-lg group hover:border-electric-500 transition-colors">
                                <div className="mb-3 sm:mb-0">
                                    <p className="font-bold text-industrial-50 font-mono">{backup.name}</p>
                                    <p className="text-xs text-obsidian-400 font-mono mt-1">
                                        {new Date(backup.modified).toLocaleString()} <span className="mx-2 text-obsidian-600">|</span> {(backup.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleRestore(backup.path)}
                                    disabled={restoring}
                                    className="w-full sm:w-auto px-6 py-2 bg-red-500/10 text-red-500 border border-red-500/30 rounded font-bold tracking-widest text-xs uppercase hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {restoring ? 'RESTORING...' : 'RESTORE'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {backups.length === 0 && !loading && (
                <div className="p-6 text-center border border-dashed border-obsidian-700 rounded-lg">
                    <p className="text-industrial-400 font-mono text-xs uppercase tracking-widest">[ NO BACKUPS FOUND ]</p>
                    <p className="text-obsidian-400 text-[10px] mt-2 font-mono">Backups are created automatically every 30 minutes.</p>
                </div>
            )}
        </div>
    );
}
