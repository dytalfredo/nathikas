import { MessageCircle } from 'lucide-react';
import resources from '../data/resources.json';

const TikTok = ({ size = 24, className = "" }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className={className}
        style={{ fillRule: 'evenodd', clipRule: 'evenodd', strokeLinejoin: 'round', strokeMiterlimit: 2 }}
    >
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.65-1.7-1.32v8.22c.04 5.76-7.72 9.07-11.33 4.88-2.67-4.14-.14-9.3 4.38-9.56v4.32c-.93.18-1.57.94-1.56 1.88.02.82.72 1.49 1.54 1.48 1.58.12 1.94-2.07 1.8-3.04.14-5.63.14-11.26 0-16.89.39-.99.78-1.99 1.17-2.97z" fill="white" />
    </svg>
);

const Instagram = ({ size = 24, className = "" }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="url(#instagram-gradient)" strokeWidth="2" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" stroke="white" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="white" strokeWidth="2" />
        <defs>
            <linearGradient id="instagram-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#f09433" />
                <stop offset="25%" stopColor="#e6683c" />
                <stop offset="50%" stopColor="#dc2743" />
                <stop offset="75%" stopColor="#cc2366" />
                <stop offset="100%" stopColor="#bc1888" />
            </linearGradient>
        </defs>
    </svg>
);

export default function Footer({ companyData, contact, social }: { companyData: any, contact: any, social: any }) {
    return (
        <footer className="bg-[#3E2723] text-[#FDF6E3] relative overflow-hidden">
            {/* Decorative Top Border */}
            <div className="h-4 w-full bg-[#D91A2A]" style={{ backgroundImage: 'linear-gradient(45deg, #F2A900 25%, transparent 25%, transparent 50%, #F2A900 50%, #F2A900 75%, transparent 75%, transparent)', backgroundSize: '20px 20px' }}></div>

            <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {/* Brand */}
                    <div className="text-center md:text-left">
                        <img src={resources.logo} alt="Nathikas Logo" className="w-24 h-24 mx-auto md:mx-0 mb-4 object-contain filter brightness-100" />
                        <h3 className="text-2xl font-bold text-[#F2A900] font-heading mb-4">Nathikas</h3>
                        <p className="max-w-xs mx-auto md:mx-0 text-sm opacity-80">
                            Llevando el auténtico sabor del chamoy y las gomitas enchiladas a tu paladar. ¡Sabor que explota!
                        </p>
                    </div>



                    {/* Contact */}
                    <div className="text-center md:text-left">
                        <h4 className="text-xl font-bold text-[#D91A2A] mb-6 font-heading">Contáctanos</h4>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-center justify-center md:justify-start gap-2">
                                <MessageCircle size={16} className="text-[#F2A900]" />
                                {contact.phone}
                            </li>
                            <li className="flex items-center justify-center md:justify-start gap-2">
                                <span>📧</span>
                                {contact.email}
                            </li>
                            <li className="flex items-center justify-center md:justify-start gap-2">
                                <span>📍</span>
                                {contact.address}
                            </li>
                        </ul>
                    </div>

                    {/* Social */}
                    <div className="text-center md:text-left">
                        <h4 className="text-xl font-bold text-[#D91A2A] mb-6 font-heading">Síguenos</h4>
                        <div className="flex justify-center md:justify-start gap-4">
                            {[
                                { Icon: Instagram, url: social.instagram, label: "Síguenos en Instagram" },
                                { Icon: TikTok, url: social.tiktok, label: "Síguenos en TikTok" }
                            ].map(({ Icon, url, label }, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="bg-[#5D4037] p-3 rounded-full hover:bg-[#D91A2A] transition-colors shadow-lg group" aria-label={label}>
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
