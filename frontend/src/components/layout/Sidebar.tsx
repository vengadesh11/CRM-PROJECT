import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { NAV_PERMISSIONS } from '../../config/navPermissions';

const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center px-4 py-2.5 text-sm font-semibold transition-colors rounded-xl mb-1 group ${isActive
                ? 'bg-white/10 text-white shadow-[0_10px_30px_rgba(0,0,0,0.45)]'
                : 'text-muted hover:text-white hover:bg-white/5'
            }`
        }
    >
        <Icon className="w-5 h-5 mr-3 text-white/70" />
        {label}
    </NavLink>
);

const SectionLabel = ({ label }: { label: string }) => (
    <div className="px-4 mt-6 mb-2 text-[10px] font-bold text-white/40 uppercase tracking-[0.4em]">
        {label}
    </div>
);

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { hasPermission, user } = useAuth();
    const isSuperAdmin = user?.role?.toLowerCase().includes('super admin');
    const sections = Array.from(new Set(NAV_PERMISSIONS.map((item) => item.section)));

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />
            <div
                className={`w-64 h-screen surface-sidebar flex flex-col fixed left-0 top-0 z-50 transform transition-transform duration-200 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Logo Area */}
                <div className="p-6">
                    <h1 className="text-2xl font-black text-white tracking-tight">DocuFlow</h1>
                    <p className="text-xs text-white/60 font-semibold">Document Processing Suite</p>
                </div>

                {/* Role Badge */}
                <div className="px-6 mb-6">
                    <div className="px-3 py-1.5 border border-white/20 rounded-full text-center bg-white/5">
                        <span className="text-[10px] font-bold text-white/80 tracking-widest">SUPER_ADMIN</span>
                    </div>
                </div>

                {/* Navigation Scroll Area */}
                <nav className="flex-1 overflow-y-auto px-4">
                    {sections.map((section) => {
                        const items = NAV_PERMISSIONS.filter((item) => item.section === section && (isSuperAdmin || hasPermission(item.permissionId)));
                        if (items.length === 0) return null;
                        return (
                            <div key={section}>
                                <SectionLabel label={section} />
                                {items.map((item) => (
                                    <NavItem key={item.id} to={item.path} icon={item.icon} label={item.label} />
                                ))}
                            </div>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 text-[10px] text-white/40 font-medium tracking-tight">
                    &copy; 2025 DOCUFLOW CRM
                    <div className="mt-1 text-white/30">Document Processing Suite</div>
                </div>
            </div>
        </>
    );
}
