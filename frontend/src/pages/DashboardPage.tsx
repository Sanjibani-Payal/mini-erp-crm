import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Customer, Product, Challan } from '../types';
import { useAuth } from '../context/AuthContext';
import { Users, Package, FileText, AlertTriangle, TrendingUp, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, prodRes, chalRes] = await Promise.all([
          api.get('/customers'),
          api.get('/products'),
          api.get('/challans'),
        ]);
        setCustomers(custRes.data);
        setProducts(prodRes.data);
        setChallans(chalRes.data);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const lowStockProducts = products.filter((p) => p.currentStock <= p.minStockAlert);
  const totalRevenue = challans
    .filter((c) => c.status === 'Confirmed')
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}! 👋</h1>
          <p className="text-sm text-gray-500 mt-1">
            Logged in as <span className="font-semibold text-indigo-600 uppercase">{user?.role}</span>. Here is your operational overview.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {(user?.role === 'ADMIN' || user?.role === 'SALES') && (
            <Link
              to="/challans"
              className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Challan</span>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Customers</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{customers.length}</p>
            <p className="text-xs text-gray-400 mt-1">
              {customers.filter((c) => c.status === 'Active').length} Active Accounts
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Inventory SKUs</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{products.length}</p>
            <p className="text-xs text-gray-400 mt-1">
              Total stock units: {products.reduce((acc, p) => acc + p.currentStock, 0)}
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock Alerts</p>
            <p className={`text-2xl font-extrabold mt-1 ${lowStockProducts.length > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
              {lowStockProducts.length}
            </p>
            <p className="text-xs text-gray-400 mt-1">Items at or below alert limit</p>
          </div>
          <div className={`p-3 rounded-xl ${lowStockProducts.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Confirmed Revenue</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-gray-400 mt-1">{challans.length} Total Challans</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-amber-800 text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold">Low Stock Warning Attention Needed</h3>
            <p className="text-xs text-amber-700 mt-1">
              The following products require reordering: {lowStockProducts.map((p) => `${p.name} (${p.currentStock} left)`).join(', ')}
            </p>
          </div>
          <Link
            to="/products?lowStock=true"
            className="text-xs font-bold text-amber-900 underline hover:text-amber-700 whitespace-nowrap"
          >
            Manage Inventory &rarr;
          </Link>
        </div>
      )}

      {/* Recent Activity Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Customers */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center space-x-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Recent Customers</span>
            </h2>
            <Link to="/customers" className="text-xs font-semibold text-indigo-600 hover:underline">
              View All &rarr;
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {customers.slice(0, 4).map((c) => (
              <div key={c.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-semibold text-gray-900">{c.businessName}</p>
                  <p className="text-xs text-gray-500">{c.name} • {c.mobile}</p>
                </div>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  c.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Challans */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Recent Sales Challans</span>
            </h2>
            <Link to="/challans" className="text-xs font-semibold text-indigo-600 hover:underline">
              View All &rarr;
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {challans.slice(0, 4).map((ch) => (
              <div key={ch.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-mono font-semibold text-gray-900">{ch.challanNumber}</p>
                  <p className="text-xs text-gray-500">{ch.customer?.businessName || 'Customer'} • {ch.totalQuantity} items</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">₹{ch.totalAmount.toLocaleString('en-IN')}</p>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    ch.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {ch.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
