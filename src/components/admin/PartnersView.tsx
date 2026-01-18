import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useAlertStore } from '../../store/alertStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Search,
    Plus,
    X,
    Save,
    Trash2,
    Instagram,
    Youtube,
    Edit2,
    ExternalLink,
    Video
} from 'lucide-react';

interface Partner {
    id: string;
    name: string;
    alias?: string; // Para identificarlo internamente
    status: 'active' | 'inactive';
    socials: {
        instagram?: string; // profile link or handle
        tiktok?: string;
        youtube?: string;
    };
    trackingCode?: string; // Código de promoción/rastreo
    notes?: string;
    createdAt?: any;
}

export default function PartnersView() {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

    // Form States
    const [formData, setFormData] = useState<Partial<Partner>>({
        name: '',
        alias: '',
        status: 'active',
        socials: { instagram: '', tiktok: '', youtube: '' },
        trackingCode: '',
        notes: ''
    });

    useEffect(() => {
        const q = query(collection(db, "partners"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            const data: Partner[] = [];
            snap.forEach(doc => {
                data.push({ id: doc.id, ...doc.data() } as Partner);
            });
            setPartners(data);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const handleSave = async () => {
        if (!formData.name) {
            useAlertStore.getState().showAlert("Error", "El nombre es obligatorio", "error");
            return;
        }

        try {
            if (editingPartner) {
                await updateDoc(doc(db, "partners", editingPartner.id), {
                    ...formData,
                    updatedAt: serverTimestamp()
                });
                useAlertStore.getState().showAlert("Éxito", "Asociado actualizado", "success");
            } else {
                await addDoc(collection(db, "partners"), {
                    ...formData,
                    createdAt: serverTimestamp()
                });
                useAlertStore.getState().showAlert("Éxito", "Nuevo asociado creado", "success");
            }
            closeModal();
        } catch (error) {
            console.error(error);
            useAlertStore.getState().showAlert("Error", "No se pudo guardar", "error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("¿Seguro que deseas eliminar este asociado?")) return;
        try {
            await deleteDoc(doc(db, "partners", id));
            useAlertStore.getState().showAlert("Eliminado", "Asociado eliminado correctamente", "success");
        } catch (error) {
            useAlertStore.getState().showAlert("Error", "No se pudo eliminar", "error");
        }
    };

    const openModal = (partner?: Partner) => {
        if (partner) {
            setEditingPartner(partner);
            setFormData(partner);
        } else {
            setEditingPartner(null);
            setFormData({
                name: '',
                alias: '',
                status: 'active',
                socials: { instagram: '', tiktok: '', youtube: '' },
                trackingCode: '',
                notes: ''
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingPartner(null);
    };

    const filteredPartners = partners.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.alias?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                    <h2 className="text-3xl font-heading text-[#D91A2A]">Gestión de Asociados</h2>
                    <p className="text-gray-600 font-bold">Administra influencers y colaboradores</p>
                </div>

                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar asociado..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-white border-2 border-white rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-[#F2A900] w-64 shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="bg-[#D91A2A] text-white px-4 py-2 rounded-xl font-bold shadow-md hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Nuevo
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="p-8 text-center text-gray-500 font-bold">Cargando asociados...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPartners.map(partner => (
                        <motion.div
                            key={partner.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white p-5 rounded-3xl shadow-sm border-2 border-gray-100 relative group overflow-hidden"
                        >
                            <div className={`absolute top-0 right-0 p-2 px-4 rounded-bl-2xl text-[10px] font-bold uppercase tracking-wider ${partner.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {partner.status === 'active' ? 'Activo' : 'Inactivo'}
                            </div>

                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-16 h-16 bg-[#FDF6E3] rounded-2xl flex items-center justify-center text-[#D91A2A] border-2 border-[#F2A900]">
                                    <Users size={32} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-heading text-lg text-[#3E2723] truncate">{partner.name}</h3>
                                    <p className="text-xs text-gray-400 font-bold">{partner.alias || 'Sin alias'}</p>
                                    <p className="text-xs text-[#D91A2A] font-medium mt-1">Ref: {partner.trackingCode || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Redes Sociales</p>
                                <div className="flex gap-2">
                                    {partner.socials?.instagram && (
                                        <a href={partner.socials.instagram} target="_blank" rel="noreferrer" className="p-2 bg-pink-50 rounded-lg text-pink-600 hover:bg-pink-100 transition-colors">
                                            <Instagram size={16} />
                                        </a>
                                    )}
                                    {partner.socials?.tiktok && (
                                        <a href={partner.socials.tiktok} target="_blank" rel="noreferrer" className="p-2 bg-black/5 rounded-lg text-black hover:bg-black/10 transition-colors">
                                            <span className="font-bold text-xs">Tik</span>
                                        </a>
                                    )}
                                    {partner.socials?.youtube && (
                                        <a href={partner.socials.youtube} target="_blank" rel="noreferrer" className="p-2 bg-red-50 rounded-lg text-red-600 hover:bg-red-100 transition-colors">
                                            <Youtube size={16} />
                                        </a>
                                    )}
                                    {!partner.socials?.instagram && !partner.socials?.tiktok && !partner.socials?.youtube && (
                                        <span className="text-xs text-gray-300 italic">No registradas</span>
                                    )}
                                </div>
                            </div>

                            {/* Stats Placeholder */}
                            <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                        <Video size={12} /> Videos Trackeados
                                    </span>
                                    <span className="text-xs font-bold text-[#D91A2A]">Próximamente</span>
                                </div>
                                <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-gray-300 w-0" />
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2 border-t border-gray-100">
                                <button
                                    onClick={() => openModal(partner)}
                                    className="flex-1 py-2 rounded-lg bg-gray-50 text-gray-600 font-bold text-xs hover:bg-[#F2A900] hover:text-[#3E2723] transition-colors flex items-center justify-center gap-2"
                                >
                                    <Edit2 size={14} /> Editar
                                </button>
                                <button
                                    onClick={() => handleDelete(partner.id)}
                                    className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal de Edición/Creación */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border-4 border-[#F2A900]"
                        >
                            <div className="bg-[#F2A900] p-4 flex justify-between items-center text-[#3E2723]">
                                <h3 className="font-heading text-xl">{editingPartner ? 'Editar Asociado' : 'Nuevo Asociado'}</h3>
                                <button onClick={closeModal}><X /></button>
                            </div>
                            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Nombre Completo</label>
                                        <input
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#D91A2A] outline-none font-bold"
                                            placeholder="Ej. María Pérez"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Alias / ID</label>
                                        <input
                                            value={formData.alias}
                                            onChange={e => setFormData({ ...formData, alias: e.target.value })}
                                            className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#D91A2A] outline-none font-bold"
                                            placeholder="Ej. MP2024"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Estado</label>
                                        <select
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                            className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#D91A2A] outline-none font-bold"
                                        >
                                            <option value="active">Activo</option>
                                            <option value="inactive">Inactivo</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Tracking Code</label>
                                        <input
                                            value={formData.trackingCode}
                                            onChange={e => setFormData({ ...formData, trackingCode: e.target.value })}
                                            className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#D91A2A] outline-none font-bold"
                                            placeholder="Código para cupones o refs"
                                        />
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-4">
                                    <h4 className="font-bold text-[#D91A2A] text-sm mb-3">Redes Sociales (Links)</h4>
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500" size={18} />
                                            <input
                                                value={formData.socials?.instagram}
                                                onChange={e => setFormData({ ...formData, socials: { ...formData.socials, instagram: e.target.value } })}
                                                className="w-full p-2 pl-10 bg-gray-50 rounded-lg text-sm"
                                                placeholder="Instagram URL"
                                            />
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs">Tik</span>
                                            <input
                                                value={formData.socials?.tiktok}
                                                onChange={e => setFormData({ ...formData, socials: { ...formData.socials, tiktok: e.target.value } })}
                                                className="w-full p-2 pl-10 bg-gray-50 rounded-lg text-sm"
                                                placeholder="TikTok URL"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 text-red-600" size={18} />
                                            <input
                                                value={formData.socials?.youtube}
                                                onChange={e => setFormData({ ...formData, socials: { ...formData.socials, youtube: e.target.value } })}
                                                className="w-full p-2 pl-10 bg-gray-50 rounded-lg text-sm"
                                                placeholder="YouTube URL"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Notas Internas</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#D91A2A] outline-none font-medium h-24 resize-none"
                                        placeholder="Detalles del acuerdo, contacto, etc..."
                                    />
                                </div>

                                <button
                                    onClick={handleSave}
                                    className="w-full py-3 bg-[#D91A2A] text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-all flex justify-center items-center gap-2"
                                >
                                    <Save size={20} />
                                    Guardar Asociado
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
