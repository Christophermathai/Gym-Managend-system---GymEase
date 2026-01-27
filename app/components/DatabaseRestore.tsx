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
        <div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Warning:</h3>
                <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                    <li>Restoring a backup will replace your current database</li>
                    <li>Your current database will be backed up before restore</li>
                    <li>You must restart the application after restore</li>
                    <li>Only owners can restore the database</li>
                </ul>
            </div>

            <button
                onClick={fetchBackups}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-300 mb-4"
            >
                {loading ? 'Loading...' : 'Load Available Backups'}
            </button>

            {backups.length > 0 && (
                <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900 mb-2">Available Backups:</h3>
                    {backups.map((backup, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">{backup.name}</p>
                                <p className="text-sm text-gray-600">
                                    {new Date(backup.modified).toLocaleString()} • {(backup.size / 1024).toFixed(2)} KB
                                </p>
                            </div>
                            <button
                                onClick={() => handleRestore(backup.path)}
                                disabled={restoring}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-300 text-sm"
                            >
                                {restoring ? 'Restoring...' : 'Restore'}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {backups.length === 0 && !loading && (
                <p className="text-gray-500 text-sm">No backups found. Backups are created automatically every 30 minutes.</p>
            )}
        </div>
    );
}
