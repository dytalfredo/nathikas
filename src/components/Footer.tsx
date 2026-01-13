import { Facebook, Instagram, Twitter, MessageCircle } from 'lucide-react';
import resources from '../data/resources.json';

export default function Footer({ companyData }: { companyData: any }) {
    return (
        <footer className="bg-[#3E2723] text-[#FDF6E3] relative overflow-hidden">
            {/* Decorative Top Border */}
            <div className="h-4 w-full bg-[#D91A2A]" style={{ backgroundImage: 'linear-gradient(45deg, #F2A900 25%, transparent 25%, transparent 50%, #F2A900 50%, #F2A900 75%, transparent 75%, transparent)', backgroundSize: '20px 20px' }}></div>

            <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    {/* Brand */}
                    <div className="text-center md:text-left">
                        <img src={resources.logo} alt="Nathikas Logo" className="w-24 h-24 mx-auto md:mx-0 mb-4 object-contain filter brightness-100" />
                        <h3 className="text-2xl font-bold text-[#F2A900] font-heading mb-4">Nathikas</h3>
                        <p className="max-w-xs mx-auto md:mx-0 text-sm opacity-80">
                            Llevando el auténtico sabor del chamoy y las gomitas enchiladas a tu paladar. ¡Sabor que explota!
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="text-center md:text-left">
                        <h4 className="text-xl font-bold text-[#D91A2A] mb-6 font-heading">Explora</h4>
                        <ul className="space-y-3">
                            {['Inicio', 'Productos', 'Kits', 'Promociones', 'Contacto'].map((item) => (
                                <li key={item}>
                                    <a href="#" className="hover:text-[#F2A900] transition-colors">{item}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="text-center md:text-left">
                        <h4 className="text-xl font-bold text-[#D91A2A] mb-6 font-heading">Contáctanos</h4>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-center justify-center md:justify-start gap-2">
                                <MessageCircle size={16} className="text-[#F2A900]" />
                                +58 414-1234567
                            </li>
                            <li className="flex items-center justify-center md:justify-start gap-2">
                                <span>📧</span>
                                hola@nathikas.com
                            </li>
                            <li className="flex items-center justify-center md:justify-start gap-2">
                                <span>📍</span>
                                Caracas, Venezuela
                            </li>
                        </ul>
                    </div>

                    {/* Social */}
                    <div className="text-center md:text-left">
                        <h4 className="text-xl font-bold text-[#D91A2A] mb-6 font-heading">Síguenos</h4>
                        <div className="flex justify-center md:justify-start gap-4">
                            {[Facebook, Instagram, Twitter].map((Icon, i) => (
                                <a key={i} href="#" className="bg-[#5D4037] p-3 rounded-full hover:bg-[#D91A2A] transition-colors shadow-lg group">
                                    <Icon size={20} className="group-hover:text-white" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-[#5D4037] pt-8 text-center text-sm opacity-60 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p>&copy; {new Date().getFullYear()} Nathikas. Todos los derechos reservados.</p>
                    <p className="flex items-center gap-2">
                        Hecho con 🌶️ y ❤️ por Nathikas Team
                    </p>
                </div>
            </div>

            {/* Background Texture */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/black-scales.png")' }}></div>
        </footer>
    );
}
