'use client';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel = 'CONFIRM',
    cancelLabel = 'CANCEL',
    variant = 'danger',
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const iconColors = {
        danger: 'bg-red-500/10 text-red-500 border-red-500/20',
        warning: 'bg-steelgold-500/10 text-steelgold-500 border-steelgold-500/20',
        info: 'bg-electric-500/10 text-electric-500 border-electric-500/20',
    };

    const confirmColors = {
        danger: 'bg-red-600 hover:bg-red-700 shadow-red-600/20',
        warning: 'bg-steelgold-600 hover:bg-steelgold-700 shadow-steelgold-600/20',
        info: 'bg-electric-500 hover:bg-electric-600 shadow-electric-500/20',
    };

    const icons = {
        danger: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
        warning: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
        info: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    };

    return (
        <div className="fixed inset-0 bg-obsidian-900/80 flex items-center justify-center z-[60] backdrop-blur-sm p-4">
            <div className="bg-obsidian-800 border border-obsidian-600 rounded-lg shadow-2xl p-8 max-w-sm w-full text-center animate-in fade-in zoom-in-95 duration-200">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border ${iconColors[variant]}`}>
                    {icons[variant]}
                </div>
                <h3 className="text-xl font-bold text-industrial-50 uppercase tracking-wider mb-2">{title}</h3>
                <p className="text-industrial-400 text-sm mb-8 leading-relaxed">{message}</p>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2.5 bg-obsidian-700 text-industrial-300 border border-obsidian-600 rounded text-xs font-bold uppercase tracking-widest hover:text-industrial-50 transition-colors"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2.5 text-white rounded text-xs font-bold uppercase tracking-widest transition-shadow shadow-lg ${confirmColors[variant]}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
