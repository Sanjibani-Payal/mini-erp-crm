import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Challan, Customer, Product, ChallanStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Search, FileText, CheckCircle2, XCircle, AlertCircle, Eye, Trash2, X, ShoppingCart } from 'lucide-react';

interface ChallanItemInput {
  productId: string;
  quantity: number;
}

export const ChallansPage: React.FC = () => {
  const { user } = useAuth();

  const [challans, setChallans] = useState<Challan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingChallan, setViewingChallan] = useState<Challan | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Form state for creating Challan
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [items, setItems] = useState<ChallanItemInput[]>([{ productId: '', quantity: 1 }]);
  const [createStatus, setCreateStatus] = useState<ChallanStatus>('Draft');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [chalRes, custRes, prodRes] = await Promise.all([
        api.get('/challans', { params: { status: statusFilter, search } }),
        api.get('/customers'),
        api.get('/products'),
      ]);
      setChallans(chalRes.data);
      setCustomers(custRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      console.error('Error fetching challan data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, search]);

  const handleOpenCreate = () => {
    setActionError(null);
    setSelectedCustomerId(customers.length > 0 ? customers[0].id : '');
    setItems([{ productId: products.length > 0 ? products[0].id : '', quantity: 1 }]);
    setCreateStatus('Draft');
    setShowCreateModal(true);
  };

  const handleAddItem = () => {
    const defaultProdId = products.length > 0 ? products[0].id : '';
    setItems([...items, { productId: defaultProdId, quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ChallanItemInput, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleCreateChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setSubmitting(true);

    try {
      await api.post('/challans', {
        customerId: selectedCustomerId,
        items,
        status: createStatus,
      });
      setShowCreateModal(false);
      fetchData();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to create sales challan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (challanId: string, targetStatus: 'Confirmed' | 'Cancelled') => {
    setActionError(null);
    try {
      await api.patch(`/challans/${challanId}/status`, { status: targetStatus });
      setViewingChallan(null);
      fetchData();
    } catch (err: any) {
      setActionError(err.response?.data?.message || `Failed to update challan to ${targetStatus}`);
    }
  };

  const canCreate = user?.role === 'ADMIN' || user?.role === 'SALES';

  // Calculate live preview totals for create form
  const productMap = new Map(products.map((p) => [p.id, p]));
  const liveTotalQuantity = items.reduce((acc, curr) => acc + (parseInt(curr.quantity as any, 10) || 0), 0);
  const liveTotalAmount = items.reduce((acc, curr) => {
    const p = productMap.get(curr.productId);
    const qty = parseInt(curr.quantity as any, 10) || 0;
    return acc + (p ? p.unitPrice * qty : 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Challans</h1>
          <p className="text-sm text-gray-500">Create wholesale dispatch orders and confirm stock deductions.</p>
        </div>
        {canCreate && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold text-sm shadow transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Generate New Challan</span>
          </button>
        )}
      </div>

      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-semibold">{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-red-500 hover:text-red-700 font-bold">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by challan number, customer name, business..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Challans Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading sales challans...</div>
        ) : challans.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No sales challans recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[11px] font-semibold tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Challan Number</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Total Qty</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created By</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {challans.map((ch) => (
                  <tr key={ch.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-600">{ch.challanNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{ch.customer?.businessName || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{ch.customer?.name}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{ch.totalQuantity} items</td>
                    <td className="px-4 py-3 font-bold text-gray-900">₹{ch.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded ${
                          ch.status === 'Confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ch.status === 'Draft'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {ch.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{ch.createdBy}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(ch.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => setViewingChallan(ch)}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-xs font-semibold"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Sales Challan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                <span>Create Sales Challan</span>
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChallan} className="space-y-4 text-sm">
              {/* Customer Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Select Customer Account *</label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.businessName} ({c.name} - {c.mobile})
                    </option>
                  ))}
                </select>
              </div>

              {/* Items Table Builder */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-gray-700">Add Products & Quantities</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-indigo-600 font-bold hover:underline flex items-center space-x-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ Add Product Line</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto border p-3 rounded-xl bg-gray-50">
                  {items.map((item, idx) => {
                    const selectedProd = productMap.get(item.productId);
                    const subtotal = selectedProd ? selectedProd.unitPrice * (item.quantity || 0) : 0;
                    return (
                      <div key={idx} className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <select
                            required
                            value={item.productId}
                            onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                            className="w-full p-1.5 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (SKU: {p.sku} | Stock: {p.currentStock} | Price: ₹{p.unitPrice})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                            placeholder="Qty"
                            className="w-full p-1.5 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-center font-bold"
                          />
                        </div>
                        <div className="w-28 text-right font-bold text-xs text-gray-800">
                          ₹{subtotal.toLocaleString('en-IN')}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1}
                          className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Summary Bar */}
              <div className="flex justify-between items-center p-3 bg-indigo-50/80 rounded-xl border border-indigo-100 text-xs">
                <div>
                  <span className="text-gray-600">Total Items: </span>
                  <span className="font-bold text-gray-900">{liveTotalQuantity} units</span>
                </div>
                <div>
                  <span className="text-gray-600">Calculated Total Amount: </span>
                  <span className="text-lg font-extrabold text-indigo-700">₹{liveTotalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Status Radio Choice */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Challan Execution Status</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 text-xs cursor-pointer font-semibold">
                    <input
                      type="radio"
                      name="status"
                      value="Draft"
                      checked={createStatus === 'Draft'}
                      onChange={() => setCreateStatus('Draft')}
                      className="text-indigo-600"
                    />
                    <span>Save as Draft (No immediate stock deduction)</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs cursor-pointer font-semibold text-emerald-700">
                    <input
                      type="radio"
                      name="status"
                      value="Confirmed"
                      checked={createStatus === 'Confirmed'}
                      onChange={() => setCreateStatus('Confirmed')}
                      className="text-emerald-600"
                    />
                    <span>Save as Confirmed (Deduct stock immediately)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow disabled:opacity-50"
                >
                  {submitting ? 'Generating...' : 'Create Sales Challan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingChallan && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    viewingChallan.status === 'Confirmed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : viewingChallan.status === 'Draft'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {viewingChallan.status}
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-1">{viewingChallan.challanNumber}</h2>
                <p className="text-xs text-gray-500">Created by {viewingChallan.createdBy} on {new Date(viewingChallan.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={() => setViewingChallan(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Snapshot */}
            <div className="bg-gray-50 p-3 rounded-xl border text-xs grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-500 font-semibold">Customer Business:</span>
                <p className="font-bold text-gray-900">{viewingChallan.customer?.businessName}</p>
              </div>
              <div>
                <span className="text-gray-500 font-semibold">Contact Person:</span>
                <p className="font-semibold text-gray-900">{viewingChallan.customer?.name} ({viewingChallan.customer?.mobile})</p>
              </div>
            </div>

            {/* Items Table (Snapshot data) */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Itemized Snapshot</h3>
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 text-gray-600 font-semibold">
                    <tr>
                      <th className="p-2.5">Item Name Snapshot</th>
                      <th className="p-2.5">SKU</th>
                      <th className="p-2.5">Unit Price</th>
                      <th className="p-2.5">Qty</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {viewingChallan.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="p-2.5 font-semibold text-gray-900">{item.productNameSnapshot}</td>
                        <td className="p-2.5 font-mono text-gray-600">{item.skuSnapshot}</td>
                        <td className="p-2.5">₹{item.unitPriceSnapshot.toLocaleString('en-IN')}</td>
                        <td className="p-2.5 font-bold">{item.quantity}</td>
                        <td className="p-2.5 text-right font-bold text-gray-900">₹{item.subtotal.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Footer */}
            <div className="flex justify-between items-center p-3 bg-gray-900 text-white rounded-xl text-xs">
              <span>Total Quantity: {viewingChallan.totalQuantity} items</span>
              <span className="text-base font-extrabold">Total Amount: ₹{viewingChallan.totalAmount.toLocaleString('en-IN')}</span>
            </div>

            {/* Action Buttons for Status Change */}
            <div className="flex justify-between items-center pt-2 border-t">
              <div className="space-x-2">
                {viewingChallan.status === 'Draft' && (user?.role === 'ADMIN' || user?.role === 'SALES' || user?.role === 'WAREHOUSE') && (
                  <button
                    onClick={() => handleUpdateStatus(viewingChallan.id, 'Confirmed')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow"
                  >
                    Confirm & Deduct Stock Now
                  </button>
                )}
                {viewingChallan.status !== 'Cancelled' && (user?.role === 'ADMIN' || user?.role === 'SALES') && (
                  <button
                    onClick={() => handleUpdateStatus(viewingChallan.id, 'Cancelled')}
                    className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-semibold"
                  >
                    Cancel Challan
                  </button>
                )}
              </div>
              <button
                onClick={() => setViewingChallan(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
