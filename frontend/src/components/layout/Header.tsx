import { useAuth } from '../../contexts/AuthContext';
import { MagnifyingGlassIcon, BellIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
    title: string;
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
}

export default function Header({ title, isSidebarOpen, onToggleSidebar }: HeaderProps) {
    const { user, signOut } = useAuth();
    const userEmail = user?.email || 'admin@docuflow.in';
    const userName = user?.fullName || 'User';
    const userRole = user?.role || 'None';

    const userInitial = (user?.fullName || userEmail).charAt(0).toUpperCase();

    return (
        <header className="h-16 surface-header flex items-center justify-between px-6 sticky top-0 z-40 backdrop-blur-lg">
            <div className="flex items-center gap-3">
                <button
                    onClick={onToggleSidebar}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/70"
                    aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                    type="button"
                >
                    {isSidebarOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
                </button>
                <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-4 w-4 text-white/60" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search documents, customers, or transactions..."
                        className="bg-white/5 border border-white/10 text-white text-sm rounded-2xl focus:ring-white focus:border-white block w-80 pl-10 pr-10 py-2"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-white/60 text-xs border border-white/10 rounded px-2 py-0.5">⌘K</span>
                    </div>
                </div>

                <button className="relative p-2 rounded-full bg-white/5 border border-white/10">
                    <BellIcon className="h-6 w-6 text-white/75" />
                    <span className="absolute top-1 right-1 h-2 w-2 bg-white rounded-full animate-pulse border border-transparent"></span>
                </button>

                <div className="h-8 w-px bg-white/10 mx-1"></div>

                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold tracking-wider text-white border border-white/20">
                        {userInitial}
                    </div>
                    <div className="hidden md:block">
                        <div className="text-sm font-semibold text-white">{userName}</div>
                        <div className="text-xs text-white/60">{userRole}</div>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="p-1 rounded-full bg-white/5 border border-white/10"
                        title="Sign Out"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
}
