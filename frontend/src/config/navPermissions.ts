import React from 'react';
import {
    ChartBarIcon,
    BuildingOfficeIcon,
    ShieldCheckIcon,
    UsersIcon,
    UserGroupIcon,
    CurrencyDollarIcon,
    Cog6ToothIcon
} from '@heroicons/react/24/outline';

export type NavPermissionItem = {
    id: string;
    label: string;
    path: string;
    section: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    permissionId: string;
};

export const NAV_PERMISSIONS: NavPermissionItem[] = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard', section: 'Administration', icon: ChartBarIcon, permissionId: 'dashboard.view' },
    { id: 'departments', label: 'Departments', path: '/departments', section: 'Administration', icon: BuildingOfficeIcon, permissionId: 'departments.view' },
    { id: 'roles', label: 'Roles & Permissions', path: '/roles', section: 'Administration', icon: ShieldCheckIcon, permissionId: 'roles.view' },
    { id: 'users', label: 'User Management', path: '/users', section: 'Administration', icon: UsersIcon, permissionId: 'users.view' },
    { id: 'customers', label: 'Customers', path: '/customers', section: 'Administration', icon: UserGroupIcon, permissionId: 'customers.view' },
    { id: 'leads', label: 'Leads', path: '/leads', section: 'Sales', icon: UsersIcon, permissionId: 'leads.view' },
    { id: 'deals', label: 'Deals', path: '/deals', section: 'Sales', icon: CurrencyDollarIcon, permissionId: 'deals.view' },
    { id: 'settings', label: 'Settings', path: '/settings', section: 'Administration', icon: Cog6ToothIcon, permissionId: 'settings.view' }
];
