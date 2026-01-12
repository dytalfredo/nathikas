
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Option {
    value: string;
    label: string;
    description?: string; // For address/extra info
    group?: string; // For grouping (like Agencies by State)
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    searchable?: boolean;
    error?: string;
}

export function CustomSelect({
    value,
    onChange,
    options,
    placeholder = "Seleccionar...",
    label,
    disabled = false,
    searchable = false,
    error
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    // Filter options based on search
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (opt.description && opt.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Group options if they have groups
    const groupedOptions = filteredOptions.reduce((acc, opt) => {
        const group = opt.group || 'default';
        if (!acc[group]) acc[group] = [];
        acc[group].push(opt);
        return acc;
    }, {} as Record<string, Option[]>);

    const hasGroups = Object.keys(groupedOptions).length > 1 || (Object.keys(groupedOptions).length === 1 && Object.keys(groupedOptions)[0] !== 'default');

    return (
        <div className={`relative ${disabled ? 'opacity-60 pointer-events-none' : ''}`} ref={containerRef}>
            {label && <label className="block text-[#3E2723] font-bold mb-2 ml-1">{label}</label>}

            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full px-4 py-3 rounded-xl border-2 bg-white flex items-center justify-between cursor-pointer transition-all ${error ? 'border-red-500' :
                        isOpen ? 'border-[#F2A900] ring-2 ring-[#F2A900]/20' : 'border-[#F2A900]/30 hover:border-[#F2A900]'
                    }`}
            >
                <span className={`block truncate ${!selectedOption ? 'text-gray-400' : 'text-[#3E2723] font-medium'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    size={20}
                    className={`text-[#F2A900] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border-2 border-[#F2A900]/20 overflow-hidden max-h-80 flex flex-col"
                    >
                        {searchable && (
                            <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2 sticky top-0">
                                <Search size={16} className="text-gray-400" />
                                <input
                                    type="text"
                                    className="w-full bg-transparent outline-none text-sm text-[#3E2723] placeholder:text-gray-400"
                                    placeholder="Buscar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        )}

                        <div className="overflow-y-auto overflow-x-hidden flex-1 p-2 custom-scrollbar">
                            {Object.entries(groupedOptions).map(([group, groupOptions]) => (
                                <div key={group}>
                                    {hasGroups && group !== 'default' && (
                                        <div className="px-3 py-2 text-xs font-bold text-[#F2A900] uppercase tracking-wider bg-yellow-50/50 rounded-lg mb-1">
                                            {group}
                                        </div>
                                    )}
                                    {groupOptions.map((option) => (
                                        <div
                                            key={option.value}
                                            onClick={() => {
                                                onChange(option.value);
                                                setIsOpen(false);
                                                setSearchTerm('');
                                            }}
                                            className={`px-3 py-2.5 rounded-lg cursor-pointer transition-colors flex items-center justify-between group ${value === option.value ? 'bg-[#F2A900]/10 text-[#D91A2A]' : 'hover:bg-gray-50 text-[#3E2723]'
                                                }`}
                                        >
                                            <div className="flex flex-col">
                                                <span className={`font-medium ${value === option.value ? 'font-bold' : ''}`}>
                                                    {option.label}
                                                </span>
                                                {option.description && (
                                                    <span className="text-xs text-gray-400 group-hover:text-gray-500">
                                                        {option.description}
                                                    </span>
                                                )}
                                            </div>
                                            {value === option.value && <Check size={16} className="text-[#D91A2A]" />}
                                        </div>
                                    ))}
                                </div>
                            ))}
                            {filteredOptions.length === 0 && (
                                <div className="p-4 text-center text-gray-400 text-sm">
                                    No se encontraron resultados
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
