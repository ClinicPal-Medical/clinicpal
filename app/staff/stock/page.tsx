'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Package, AlertTriangle, Clock, Download, Plus, Trash2, Edit3, X } from 'lucide-react';

export default function StockInventory() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === 'ADMIN';

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<any>(null);
  
  // Adjust Form
  const [quantityDelta, setQuantityDelta] = useState('');
  const [type, setType] = useState('RECEIVED');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const res = await fetch('/api/staff/stock');
    const data = await res.json();
    setItems(data);
    setLoading(false);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/staff/stock/${activeItem.id}/adjust`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quantityDelta: parseInt(quantityDelta),
        type,
        notes
      })
    });
    setIsAdjustOpen(false);
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item completely?')) return;
    await fetch(`/api/staff/stock/${id}`, { method: 'DELETE' });
    fetchItems();
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Category', 'Quantity', 'Reorder Threshold', 'Unit Cost', 'Status'];
    const csvContent = [
      headers.join(','),
      ...items.map(i => `"${i.name}","${i.category}",${i.quantity},${i.reorderThreshold},${i.unitCost},"${i.status}"`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinicpal-inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const totalItems = items.length;
  const lowCriticalCount = items.filter(i => i.status === 'LOW' || i.status === 'CRITICAL').length;
  const expiringCount = items.filter(i => i.status === 'EXPIRING').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            Inventory & Stock
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Manage supplies, monitor levels, and adjust counts.</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="inline-flex items-center px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors shadow-md text-sm"
        >
          <Download size={18} className="mr-2" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
           <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><Package size={24}/></div>
           <div><p className="text-sm font-bold text-slate-500">Total Unique Items</p><p className="text-2xl font-black text-slate-900">{totalItems}</p></div>
         </div>
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
           <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center text-red-600"><AlertTriangle size={24}/></div>
           <div><p className="text-sm font-bold text-slate-500">Low & Critical</p><p className="text-2xl font-black text-slate-900">{lowCriticalCount}</p></div>
         </div>
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
           <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600"><Clock size={24}/></div>
           <div><p className="text-sm font-bold text-slate-500">Expiring Soon</p><p className="text-2xl font-black text-slate-900">{expiringCount}</p></div>
         </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-sm pb-4">
                <th className="p-4 font-bold text-slate-600">Item</th>
                <th className="p-4 font-bold text-slate-600">Quantity</th>
                <th className="p-4 font-bold text-slate-600">Cost</th>
                <th className="p-4 font-bold text-slate-600">Status</th>
                <th className="p-4 font-bold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {loading ? (
                 <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-medium">Loading inventory...</td></tr>
               ) : items.map(i => (
                 <tr key={i.id} className="hover:bg-slate-50 transition-colors group">
                   <td className="p-4">
                     <p className="font-bold text-slate-800">{i.name}</p>
                     <p className="text-sm text-slate-500 font-medium mt-0.5">{i.category}</p>
                   </td>
                   <td className="p-4">
                     <p className="font-bold text-slate-900">{i.quantity}</p>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">TH: {i.reorderThreshold}</p>
                   </td>
                   <td className="p-4 font-bold text-slate-700">${parseFloat(i.unitCost).toFixed(2)}</td>
                   <td className="p-4">
                     <span className={`px-2 py-0.5 rounded flex items-center w-max align-middle text-[10px] font-black uppercase tracking-wider ${
                        i.status === 'OK' ? 'bg-emerald-100 text-emerald-700' :
                        i.status === 'LOW' ? 'bg-amber-100 text-amber-700' :
                        i.status === 'CRITICAL' ? 'bg-red-100 text-red-700 animate-pulse' :
                        'bg-orange-100 text-orange-700'
                     }`}>
                       {i.status}
                     </span>
                   </td>
                   <td className="p-4 text-right space-x-2">
                     <button 
                       onClick={() => { setActiveItem(i); setQuantityDelta(''); setType('RECEIVED'); setNotes(''); setIsAdjustOpen(true); }}
                       className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs rounded-lg transition-colors"
                     >
                       <Edit3 size={14} className="mr-1"/> Adjust
                     </button>
                     {isAdmin && (
                       <button onClick={() => handleDelete(i.id)} className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs rounded-lg transition-colors">
                         <Trash2 size={14} className="mr-1"/> Delete
                       </button>
                     )}
                   </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAdjustOpen && activeItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAdjustSubmit} className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Adjust Stock</h2>
            <p className="text-sm text-slate-500 mb-6">Updating levels for <span className="font-bold">{activeItem.name}</span>.</p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Transaction Type</label>
                <select 
                  value={type} onChange={e => setType(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-700 appearance-none"
                >
                  <option value="RECEIVED">Received Stock</option>
                  <option value="USED">Used / Consumed</option>
                  <option value="DISPOSED">Disposed / Expired</option>
                  <option value="ADJUSTED">Manual Adjustment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Quantity Delta</label>
                <input 
                  type="number" required placeholder="e.g. 50 or -10"
                  value={quantityDelta} onChange={e => setQuantityDelta(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-700"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Notes (optional)</label>
                <input 
                  type="text" placeholder="Reason for adjustment"
                  value={notes} onChange={e => setNotes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-700"
                />
              </div>
            </div>

            <div className="flex space-x-3 justify-end">
              <button 
                type="button" onClick={() => setIsAdjustOpen(false)}
                className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors text-sm"
              >
                Confirm
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
