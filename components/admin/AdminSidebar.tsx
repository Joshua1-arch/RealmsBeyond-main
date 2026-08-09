'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiGrid, FiBox, FiShoppingCart, FiUsers, FiMessageSquare, FiSettings, FiLogOut, FiTrendingUp, FiTag, FiStar, FiEdit } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const navigation = [
    { name: 'Dashboard', href: '/admin', icon: FiGrid },
    { name: 'Orders', href: '/admin/orders', icon: FiShoppingCart },
    {
        name: 'Products',
        href: '/admin/products',
        icon: FiBox,
        children: [
            { name: 'All Products', href: '/admin/products' },
            { name: 'Add New', href: '/admin/products/create' },
            { name: 'Categories', href: '/admin/products/categories' },
            { name: 'Tags', href: '/admin/products/tags' },
        ]
    },
    { name: 'Customers', href: '/admin/customers', icon: FiUsers },
    { name: 'Analytics', href: '/admin/analytics', icon: FiTrendingUp },
    // { name: 'Marketing', href: '/admin/marketing', icon: FiTag },
    { name: 'Blog', href: '/admin/blog', icon: FiEdit },
    // { name: 'Reviews', href: '/admin/reviews', icon: FiStar },
    // { name: 'Messages', href: '/admin/contact', icon: FiMessageSquare },
    { name: 'Settings', href: '/admin/settings', icon: FiSettings },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const { signOut } = useAuth();
    const { settings } = useSiteSettings();

    return (
        <div className="flex flex-col w-full h-full bg-white border-r border-gray-200 overflow-y-auto shadow-lg">
            <div className="p-8 border-b border-gray-200">
                <Link href="/" className="flex items-center gap-4">
                    <img
                        src={settings?.logo_url || "/logo.png"}
                        alt={settings?.site_name || "Beyond Realms"}
                        className="h-10 w-auto drop-shadow-sm"
                    />
                    <div className="flex flex-col">
                        <span className="font-heading font-bold text-rare-primary text-lg tracking-wide leading-none">BEYOND</span>
                        <span className="font-heading text-gray-500 text-xs tracking-[0.2em] mt-1">REALMS</span>
                    </div>
                </Link>
            </div>

            <nav className="flex-1 px-6 py-8 space-y-2 overflow-y-auto">
                <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Menu</p>
                {navigation.map((item) => {
                    const isActive = pathname === item.href || (item.children && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <div key={item.name}>
                            <Link
                                href={item.href}
                                className={`group flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${isActive && !item.children
                                    // Active state: Light background, Primary color text
                                    ? 'bg-rare-primary/10 text-rare-primary shadow-lg shadow-rare-primary/5 translate-x-1'
                                    // Inactive state: Gray text, hover effect
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-rare-primary hover:shadow-sm'
                                    } ${isActive && item.children ? 'bg-gray-100 text-rare-primary shadow-sm' : ''}`}
                            >
                                <Icon className={`h-5 w-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                <span className="font-body tracking-wide">{item.name}</span>
                                {isActive && !item.children && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-rare-primary/60" />
                                )}
                            </Link>

                            {/* Submenu */}
                            {item.children && isActive && (
                                <div className="mt-1 ml-4 pl-4 border-l-2 border-gray-200 space-y-1">
                                    {item.children.map(child => {
                                        const isChildActive = pathname === child.href;
                                        return (
                                            <Link
                                                key={child.name}
                                                href={child.href}
                                                className={`block px-4 py-2 text-sm rounded-lg transition-colors ${isChildActive ? 'text-rare-primary font-bold bg-gray-100' : 'text-gray-500 hover:text-rare-primary hover:bg-gray-50'}`}
                                            >
                                                {child.name}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
                <button
                    onClick={signOut}
                    className="group flex items-center gap-3 px-4 py-3.5 w-full rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-300"
                >
                    <div className="p-2 rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors">
                        <FiLogOut className="h-4 w-4" />
                    </div>
                    <span className="font-body">Sign Out</span>
                </button>
            </div>
        </div>
    );
}