interface CustomerListTileProps {
    customer: any;
    isActive: boolean;
    onClick: () => void;
}

export default function CustomerListTile({ customer, isActive, onClick }: CustomerListTileProps) {
    const name = customer.company_name || customer.display_name || 'Unnamed Customer';
    const email = customer.email || '';
    const mobile = customer.mobile || customer.work_phone || '';

    return (
        <div
            onClick={onClick}
            className={`cursor-pointer px-4 py-3 border-b border-white/10 transition-all relative ${isActive
                ? 'bg-primary-600/20 border-l-4 border-primary-500' // Active: Dark Primary + Border
                : 'hover:bg-white/5 border-l-4 border-transparent' // Hover: Subtle white overlay
                }`}
        >
            <div className={`text-sm font-bold ${isActive ? 'text-primary-400' : 'text-white'}`}>
                {name}
            </div>
            {(email || mobile) && (
                <div className="mt-1 space-y-0.5">
                    {email && <div className="text-xs text-gray-400 truncate">{email}</div>}
                    {mobile && <div className="text-xs text-gray-400">{mobile}</div>}
                </div>
            )}
        </div>
    );
}
