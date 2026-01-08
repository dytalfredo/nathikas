import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useAlertStore } from '../../store/alertStore';

export default function CustomAlert() {
    const { isOpen, title, message, type, hideAlert, onConfirm } = useAlertStore();

    const icons = {
        success: <CheckCircle2 className="text-green-500" size={40} />,
        error: <AlertCircle className="text-[#D91A2A]" size={40} />,
        warning: <AlertTriangle className="text-[#F2A900]" size={40} />,
        info: <Info className="text-blue-500" size={40} />,
    };

    const colors = {
        success: 'border-green-500',
        error: 'border-[#D91A2A]',
        warning: 'border-[#F2A900]',
        info: 'border-blue-500',
    };

    const handleConfirm = () => {
        hideAlert();
        if (onConfirm) onConfirm();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={hideAlert}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Alert Modal */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className={`relative w-full max-w-sm bg-[#FDF6E3] rounded-[2rem] shadow-2xl overflow-hidden border-4 ${colors[type]} p-8 flex flex-col items-center text-center`}
                    >
                        <div className="mb-4">
                            {icons[type]}
                        </div>

                        <h3 className="text-2xl font-heading text-[#3E2723] mb-2">{title}</h3>
                        <p className="text-gray-600 font-bold text-sm mb-8 leading-relaxed">
                            {message}
                        </p>

                        <button
                            onClick={handleConfirm}
                            className={`w-full py-4 rounded-2xl font-heading text-xl shadow-lg transition-transform active:scale-95 ${type === 'error' ? 'bg-[#D91A2A] text-white' :
                                    type === 'warning' ? 'bg-[#F2A900] text-[#3E2723]' :
                                        'bg-[#3E2723] text-white'
                                }`}
                        >
                            ENTENDIDO
                        </button>

                        <button
                            onClick={hideAlert}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
