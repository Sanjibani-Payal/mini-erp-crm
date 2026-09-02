import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { LogOut, UserCheck, Shield } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, quickLogin } = useAuth();

  const getRoleBadgeColor = (role?: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'SALES':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'WAREHOUSE':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'ACCOUNTS':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
            ERP
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Nexus ERP & CRM</h1>
            <p className="text-xs text-gray-500 hidden sm:block">Wholesale Operations Portal</p>
          </div>
        </div>

        {/* Right Section: Role Quick Switcher & User Profile */}
        <div className="flex items-center space-x-4">
          {/* Quick Role Switcher Bar */}
          <div className="hidden lg:flex items-center space-x-1 bg-gray-50 p-1 rounded-lg border border-gray-200 text-xs">
            <span className="text-gray-500 font-medium px-2 flex items-center">
              <Shield className="w-3.5 h-3.5 mr-1" /> Quick Switch:
            </span>
            {(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => quickLogin(r)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  user?.role === r
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
                title={`Switch active session to ${r}`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* User Badge */}
          {user && (
            <div className="flex items-center space-x-3 border-l pl-4 border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 leading-none">{user.name}</p>
                <span
                  className={`inline-block mt-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getRoleBadgeColor(
                    user.role
                  )}`}
                >
                  {user.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
