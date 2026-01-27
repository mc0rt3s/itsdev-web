'use client';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'warning' | 'info';
    onCancelCallback?: () => void;
}

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    onConfirm,
    onCancel,
    type = 'info',
    onCancelCallback
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const buttonStyles = {
        danger: 'bg-red-500 hover:bg-red-600 text-white',
        warning: 'bg-amber-500 hover:bg-amber-600 text-white',
        info: 'bg-cyan-500 hover:bg-cyan-600 text-white',
    };

    const iconStyles = {
        danger: 'text-red-400',
        warning: 'text-amber-400',
        info: 'text-cyan-400',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
                <div className="flex items-start gap-4">
                    <div className={`shrink-0 ${iconStyles[type]}`}>
                        {type === 'danger' && (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        )}
                        {type === 'warning' && (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        )}
                        {type === 'info' && (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                        <p className="text-slate-300 text-sm">{message}</p>
                    </div>
                </div>
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={() => {
                            onCancel();
                            if (onCancelCallback) onCancelCallback();
                        }}
                        className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2.5 font-medium rounded-xl transition-colors ${buttonStyles[type]}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
