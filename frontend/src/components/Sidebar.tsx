import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Package, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
    },
    {
      name: 'Customer CRM',
      path: '/customers',
      icon: Users,
      roles: ['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE'],
    },
    {
      name: 'Products & Stock',
      path: '/products',
      icon: Package,
      roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
    },
    {
      name: 'Sales Challans',
      path: '/challans',
      icon: FileText,
      roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Main Navigation
        </div>
        {navItems
          .filter((item) => !user?.role || item.roles.includes(user.role))
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
      </div>

      {/* Role Banner Footnote */}
      <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 text-xs text-indigo-900">
        <p className="font-semibold mb-1">Active Role: {user?.role}</p>
        <p className="text-indigo-600 text-[11px]">
          {user?.role === 'ADMIN' && 'Full system access enabled.'}
          {user?.role === 'SALES' && 'CRM & Challan creation enabled.'}
          {user?.role === 'WAREHOUSE' && 'Stock adjustments & movement logging.'}
          {user?.role === 'ACCOUNTS' && 'Read-only financial operations.'}
        </p>
      </div>
    </aside>
  );
};
