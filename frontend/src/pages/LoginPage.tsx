import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { ShieldCheck, ArrowRight, AlertCircle, KeyRound, Mail } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRoleSelect = async (role: UserRole) => {
    setError(null);
    setLoading(true);
    try {
      await quickLogin(role);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to login as ${role}`);
    } finally {
      setLoading(false);
    }
  };

  const rolesList: { role: UserRole; title: string; email: string; desc: string; color: string }[] = [
    {
      role: 'ADMIN',
      title: 'Administrator',
      email: 'admin@company.com',
      desc: 'Full access to CRM, Products, Stock & Sales',
      color: 'border-purple-200 hover:border-purple-500 bg-purple-50/40 text-purple-900',
    },
    {
      role: 'SALES',
      title: 'Sales Team',
      email: 'sales@company.com',
      desc: 'Manage Customers & Generate Sales Challans',
      color: 'border-blue-200 hover:border-blue-500 bg-blue-50/40 text-blue-900',
    },
    {
      role: 'WAREHOUSE',
      title: 'Warehouse Manager',
      email: 'warehouse@company.com',
      desc: 'Manage Products, Stock Intake & Stock Logs',
      color: 'border-amber-200 hover:border-amber-500 bg-amber-50/40 text-amber-900',
    },
    {
      role: 'ACCOUNTS',
      title: 'Accounts Team',
      email: 'accounts@company.com',
      desc: 'View Customers, Challans & Financial Records',
      color: 'border-emerald-200 hover:border-emerald-500 bg-emerald-50/40 text-emerald-900',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left Column: Quick Role Login Cards for Reviewer */}
        <div className="text-white space-y-6">
          <div>
            <div className="inline-flex items-center space-x-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-4 h-4" /> Operations Portal Demo
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Mini ERP + CRM Portal</h1>
            <p className="mt-2 text-sm text-gray-300 leading-relaxed">
              Select any role below for 1-click test login, or sign in manually with your registered credentials.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {rolesList.map((item) => (
              <button
                key={item.role}
                onClick={() => handleQuickRoleSelect(item.role)}
                disabled={loading}
                className={`p-3.5 rounded-xl border text-left transition-all duration-200 flex items-center justify-between group ${item.color}`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm">{item.title}</span>
                    <span className="text-[10px] uppercase bg-white/80 px-2 py-0.5 rounded font-mono font-semibold text-gray-800">
                      {item.role}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">{item.desc}</p>
                  <p className="text-[11px] font-mono text-gray-500 mt-1">login: {item.email}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Standard Login Form */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Sign In to Account</h2>
          <p className="text-xs text-gray-500 mb-6">Default password for all test roles: <code className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold text-indigo-600">Password123!</code></p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-md transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
