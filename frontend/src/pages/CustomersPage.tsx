import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Customer, CustomerType, CustomerStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, UserPlus, Phone, Mail, Building, FileText, Calendar, Edit, MessageSquare, X } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const { user } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [newNote, setNewNote] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    businessName: '',
    gstNumber: '',
    customerType: 'Retail' as CustomerType,
    address: '',
    status: 'Lead' as CustomerStatus,
    followUpDate: '',
    notes: '',
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers', {
        params: { search, status: statusFilter, customerType: typeFilter },
      });
      setCustomers(res.data);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, statusFilter, typeFilter]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      mobile: '',
      email: '',
      businessName: '',
      gstNumber: '',
      customerType: 'Retail',
      address: '',
      status: 'Lead',
      followUpDate: '',
      notes: '',
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      mobile: c.mobile,
      email: c.email || '',
      businessName: c.businessName,
      gstNumber: c.gstNumber || '',
      customerType: c.customerType,
      address: c.address || '',
      status: c.status,
      followUpDate: c.followUpDate ? c.followUpDate.slice(0, 10) : '',
      notes: c.notes || '',
    });
    setShowAddModal(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, formData);
      } else {
        await api.post('/customers', formData);
      }
      setShowAddModal(false);
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save customer');
    }
  };

  const handleOpenDetail = async (id: string) => {
    try {
      const res = await api.get(`/customers/${id}`);
      setViewingCustomer(res.data);
    } catch (err) {
      console.error('Error fetching customer detail:', err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingCustomer || !newNote.trim()) return;
    setNoteLoading(true);
    try {
      await api.post(`/customers/${viewingCustomer.id}/notes`, { note: newNote });
      setNewNote('');
      // Refresh detail
      handleOpenDetail(viewingCustomer.id);
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add note');
    } finally {
      setNoteLoading(false);
    }
  };

  const canEdit = user?.role === 'ADMIN' || user?.role === 'SALES';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer CRM</h1>
          <p className="text-sm text-gray-500">Manage client accounts, follow-ups, and sales leads.</p>
        </div>
        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold text-sm shadow transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Customer</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, business, mobile, email..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Lead">Lead</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="Retail">Retail</option>
            <option value="Wholesale">Wholesale</option>
            <option value="Distributor">Distributor</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No matching customers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[11px] font-semibold tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Business & Contact</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">GST Number</th>
                  <th className="px-4 py-3">Follow-up</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleOpenDetail(c.id)}
                        className="font-bold text-gray-900 hover:text-indigo-600 text-left block"
                      >
                        {c.businessName}
                      </button>
                      <p className="text-xs text-gray-500">{c.name} • {c.mobile}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2.5 py-0.5 rounded font-medium">
                        {c.customerType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          c.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'Lead'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {c.gstNumber || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {c.followUpDate ? new Date(c.followUpDate).toLocaleDateString() : 'None'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenDetail(c.id)}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-xs font-semibold"
                      >
                        View
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-semibold"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Rahul Sharma"
                    className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="+919876543210"
                    className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="Apex Retail Store"
                    className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="rahul@apex.com"
                    className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Type</label>
                  <select
                    value={formData.customerType}
                    onChange={(e) => setFormData({ ...formData, customerType: e.target.value as CustomerType })}
                    className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Distributor">Distributor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as CustomerStatus })}
                    className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Lead">Lead</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Follow-up Date</label>
                  <input
                    type="date"
                    value={formData.followUpDate}
                    onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                    className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">GST Number (Optional)</label>
                <input
                  type="text"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                  placeholder="07AAAAA0000A1Z5"
                  className="w-full p-2 border rounded-lg font-mono outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Address</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Shop address or location details"
                  className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Requirements, pricing terms, call summary..."
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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal & Follow-ups */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-6">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  {viewingCustomer.customerType} • {viewingCustomer.status}
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-1">{viewingCustomer.businessName}</h2>
                <p className="text-xs text-gray-500">Contact: {viewingCustomer.name}</p>
              </div>
              <button onClick={() => setViewingCustomer(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div>
                <span className="font-semibold text-gray-500">Mobile:</span>
                <p className="font-semibold text-gray-900">{viewingCustomer.mobile}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-500">Email:</span>
                <p className="font-semibold text-gray-900">{viewingCustomer.email || 'N/A'}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-500">GST Number:</span>
                <p className="font-mono font-semibold text-gray-900">{viewingCustomer.gstNumber || 'N/A'}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-500">Follow-up Date:</span>
                <p className="font-semibold text-gray-900">
                  {viewingCustomer.followUpDate ? new Date(viewingCustomer.followUpDate).toLocaleDateString() : 'Not Scheduled'}
                </p>
              </div>
              <div className="col-span-2">
                <span className="font-semibold text-gray-500">Address:</span>
                <p className="text-gray-900 mt-0.5">{viewingCustomer.address || 'No address provided'}</p>
              </div>
            </div>

            {/* Follow-up Notes Timeline */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-gray-900 flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <span>Follow-up History & Notes ({viewingCustomer.followUps?.length || 0})</span>
              </h3>

              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a new follow-up call note..."
                  className="flex-1 p-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={noteLoading}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow shrink-0"
                >
                  Add Note
                </button>
              </form>

              <div className="max-h-48 overflow-y-auto space-y-2 border rounded-xl p-3 bg-gray-50">
                {viewingCustomer.followUps && viewingCustomer.followUps.length > 0 ? (
                  viewingCustomer.followUps.map((n) => (
                    <div key={n.id} className="bg-white p-3 rounded-lg border border-gray-200 text-xs">
                      <p className="text-gray-900">{n.note}</p>
                      <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1">
                        <span>By {n.createdBy}</span>
                        <span>{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 text-center py-2">No follow-up notes recorded yet.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setViewingCustomer(null)}
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
