import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Product, StockMovement } from '../types';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, PackagePlus, AlertTriangle, ArrowUpRight, ArrowDownRight, History, X, Edit, RefreshCw } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'movements'>('products');

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingStockProduct, setAdjustingStockProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Electronics',
    unitPrice: 0,
    currentStock: 0,
    minStockAlert: 5,
    location: '',
  });

  // Stock Adjust State
  const [adjustForm, setAdjustForm] = useState({
    quantityChanged: 1,
    movementType: 'IN' as 'IN' | 'OUT',
    reason: '',
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products', {
        params: { search, category: categoryFilter, lowStockOnly: lowStockOnly.toString() },
      });
      setProducts(res.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async () => {
    try {
      const res = await api.get('/products/stock-movements');
      setMovements(res.data);
    } catch (err) {
      console.error('Error fetching stock movements:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    if (activeTab === 'movements') {
      fetchMovements();
    }
  }, [search, categoryFilter, lowStockOnly, activeTab]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      category: 'Electronics',
      unitPrice: 0,
      currentStock: 10,
      minStockAlert: 5,
      location: 'Rack A-01',
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitPrice: p.unitPrice,
      currentStock: p.currentStock,
      minStockAlert: p.minStockAlert,
      location: p.location || '',
    });
    setShowAddModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      setShowAddModal(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleOpenAdjustStock = (p: Product) => {
    setAdjustingStockProduct(p);
    setAdjustForm({ quantityChanged: 1, movementType: 'IN', reason: 'Stock intake' });
  };

  const handleSaveStockAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingStockProduct) return;
    try {
      await api.post(`/products/${adjustingStockProduct.id}/adjust-stock`, adjustForm);
      setAdjustingStockProduct(null);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to adjust stock');
    }
  };

  const canManage = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE';
  const categories = Array.from(new Set(products.map((p) => p.category)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products & Inventory</h1>
          <p className="text-sm text-gray-500">Track stock levels, SKUs, pricing, and movement logs.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-200 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'products' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Inventory List
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'movements' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Stock Movement Log
            </button>
          </div>
          {canManage && activeTab === 'products' && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold text-sm shadow transition-colors"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'products' ? (
        <>
          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product name, SKU, or category..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <label className="flex items-center space-x-2 text-xs font-semibold text-gray-700 cursor-pointer whitespace-nowrap bg-gray-50 border p-2 rounded-lg">
                <input
                  type="checkbox"
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Low Stock Only</span>
              </label>
            </div>
          </div>

          {/* Products Grid / Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-500">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No products found matching filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-[11px] font-semibold tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">Product Info</th>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Unit Price</th>
                      <th className="px-4 py-3">Current Stock</th>
                      <th className="px-4 py-3">Warehouse Location</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map((p) => {
                      const isLowStock = p.currentStock <= p.minStockAlert;
                      return (
                        <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            {p.name}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.sku}</td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            <span className="bg-gray-100 px-2 py-0.5 rounded">{p.category}</span>
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-900">
                            ₹{p.unitPrice.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <span className={`font-extrabold text-sm ${isLowStock ? 'text-amber-600' : 'text-gray-900'}`}>
                                {p.currentStock}
                              </span>
                              {isLowStock && (
                                <span className="inline-flex items-center text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                                  <AlertTriangle className="w-3 h-3 mr-0.5" /> Low Stock
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{p.location || 'Unassigned'}</td>
                          <td className="px-4 py-3 text-right space-x-2">
                            {canManage && (
                              <>
                                <button
                                  onClick={() => handleOpenAdjustStock(p)}
                                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-xs font-semibold"
                                  title="Add or remove stock"
                                >
                                  Adjust Stock
                                </button>
                                <button
                                  onClick={() => handleOpenEdit(p)}
                                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-semibold"
                                >
                                  Edit
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Stock Movement Log Tab */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-4 space-y-4">
          <h2 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
            <History className="w-4 h-4 text-indigo-600" />
            <span>Audit Trail: Stock Movement History</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[11px] font-semibold tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Product SKU & Name</th>
                  <th className="px-4 py-3">Movement Type</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                      {new Date(m.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 text-xs">{m.product?.name || 'Product'}</p>
                      <p className="text-[10px] font-mono text-gray-500">{m.product?.sku}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                          m.movementType === 'IN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {m.movementType === 'IN' ? (
                          <ArrowDownRight className="w-3 h-3 mr-1 text-emerald-600" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3 mr-1 text-red-600" />
                        )}
                        Stock {m.movementType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900">
                      {m.movementType === 'IN' ? `+${m.quantityChanged}` : `-${m.quantityChanged}`}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{m.reason}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{m.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Inventory Product'}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Wireless Mouse"
                  className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">SKU / Code *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingProduct}
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="SKU-LOG-01"
                    className="w-full p-2 border rounded-lg font-mono outline-none focus:ring-2 focus:ring-indigo-500 uppercase disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Electronics"
                    className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Unit Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Current Stock *</label>
                  <input
                    type="number"
                    required
                    disabled={!!editingProduct}
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Alert Limit *</label>
                  <input
                    type="number"
                    required
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: parseInt(e.target.value, 10) || 5 })}
                    className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Warehouse Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Rack B-04"
                  className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustingStockProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Adjust Stock Level</h2>
                <p className="text-xs text-gray-500">{adjustingStockProduct.name} (SKU: {adjustingStockProduct.sku})</p>
              </div>
              <button onClick={() => setAdjustingStockProduct(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStockAdjust} className="space-y-3 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg border text-xs">
                <p>Current In-Stock Quantity: <span className="font-bold text-indigo-600">{adjustingStockProduct.currentStock} units</span></p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Movement Type</label>
                  <select
                    value={adjustForm.movementType}
                    onChange={(e) => setAdjustForm({ ...adjustForm, movementType: e.target.value as 'IN' | 'OUT' })}
                    className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="IN">Stock IN (+)</option>
                    <option value="OUT">Stock OUT (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={adjustForm.quantityChanged}
                    onChange={(e) => setAdjustForm({ ...adjustForm, quantityChanged: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Adjustment *</label>
                <input
                  type="text"
                  required
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  placeholder="New delivery arrival, damaged goods, physical count audit..."
                  className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setAdjustingStockProduct(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shadow"
                >
                  Submit Stock Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
