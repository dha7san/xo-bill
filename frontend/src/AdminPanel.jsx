import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Pencil, Trash2, Save, Image, ChevronRight, 
  Settings, Layout, Coffee, Tag, AlertCircle 
} from 'lucide-react';
import useMenuStore from './store/menuStore';

export default function AdminPanel({ onClose }) {
  const { 
    categories, menuItems, fetchMenu, 
    addCategory, editCategory, removeCategory,
    addItem, editItem, removeItem,
    isLoading 
  } = useMenuStore();

  const [activeTab, setActiveTab] = useState('categories'); // 'categories' | 'items'
  const [editingItem, setEditingItem] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // CATEGORY FORM STATE
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catColor, setCatColor] = useState('#3b82f6');

  // ITEM FORM STATE
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemDesc, setItemDesc] = useState('');

  const resetForms = () => {
    setEditingItem(null);
    setEditingCategory(null);
    setCatName('');
    setCatDesc('');
    setCatColor('#3b82f6');
    setItemName('');
    setItemPrice('');
    setItemCategory('');
    setItemDesc('');
    setIsFormOpen(false);
  };

  const handleEditCategory = (cat) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatDesc(cat.description || '');
    setCatColor(cat.imageColorOrUrl || '#3b82f6');
    setIsFormOpen(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemPrice(item.basePrice);
    setItemCategory(item.category?._id || item.category || '');
    setItemDesc(item.description || '');
    setIsFormOpen(true);
  };

  const onSaveCategory = async () => {
    if (!catName) return alert('Name is required');
    try {
      if (editingCategory) {
        await editCategory(editingCategory._id, { name: catName, description: catDesc, imageColorOrUrl: catColor });
      } else {
        await addCategory({ name: catName, description: catDesc, imageColorOrUrl: catColor });
      }
      resetForms();
    } catch (err) {
      alert(err.message);
    }
  };

  const onSaveItem = async () => {
    if (!itemName || !itemPrice || !itemCategory) return alert('Please fill required fields');
    try {
      const data = { 
        name: itemName, 
        basePrice: parseFloat(itemPrice), 
        category: itemCategory, 
        description: itemDesc 
      };
      if (editingItem) {
        await editItem(editingItem._id, data);
      } else {
        await addItem(data);
      }
      resetForms();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease]">
      <div className="relative bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-500 border border-sky-500/20">
              <Settings size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Admin Panel</h2>
              <p className="text-sm text-neutral-500 font-medium">Manage your restaurant menu items and categories</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex px-8 border-b border-neutral-800 bg-neutral-900/40 shrink-0">
          {[
            { id: 'categories', label: 'Categories', icon: Layout },
            { id: 'items', label: 'Menu Items', icon: Coffee }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); resetForms(); }}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative ${
                activeTab === tab.id ? 'text-sky-400' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-500 rounded-t-full" />}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Main List */}
          <div className="flex-1 overflow-y-auto p-8 thin-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                {activeTab === 'categories' ? <Tag size={18} /> : <Coffee size={18} />}
                {activeTab === 'categories' ? 'All Categories' : 'All Menu Items'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-bold text-sm transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)]"
              >
                <Plus size={18} /> Add {activeTab === 'categories' ? 'Category' : 'Item'}
              </button>
            </div>

            {isLoading ? (
               <div className="flex items-center justify-center h-64 text-neutral-500 animate-pulse">
                  Loading data...
               </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {activeTab === 'categories' ? (
                  categories.map(cat => (
                    <div key={cat._id} className="flex items-center justify-between p-4 bg-neutral-900/60 border border-neutral-800 rounded-2xl hover:border-neutral-700 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-black" style={{ backgroundColor: cat.imageColorOrUrl || '#3b82f6' }}>
                          {cat.name[0]}
                        </div>
                        <div>
                          <div className="font-bold text-white">{cat.name}</div>
                          <div className="text-xs text-neutral-500">{cat.description || 'No description'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => handleEditCategory(cat)} className="p-2 text-neutral-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-all"><Pencil size={18} /></button>
                        <button onClick={() => removeCategory(cat._id)} className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))
                ) : (
                  menuItems.map(item => (
                    <div key={item._id} className="flex items-center justify-between p-4 bg-neutral-900/60 border border-neutral-800 rounded-2xl hover:border-neutral-700 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-neutral-800 border border-neutral-700 rounded-xl flex items-center justify-center text-sky-500"><Coffee size={20} /></div>
                        <div>
                          <div className="font-bold text-white">{item.name}</div>
                          <div className="text-xs text-neutral-500">{item.category?.name || 'Uncategorized'} • ₹{item.basePrice}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => handleEditItem(item)} className="p-2 text-neutral-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-all"><Pencil size={18} /></button>
                        <button onClick={() => removeItem(item._id)} className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))
                )}
                
                {(activeTab === 'categories' ? categories.length : menuItems.length) === 0 && (
                   <div className="flex flex-col items-center justify-center py-12 text-neutral-600 border-2 border-dashed border-neutral-800 rounded-3xl">
                      <AlertCircle size={40} strokeWidth={1} className="mb-2" />
                      <p className="font-medium">No {activeTab} found</p>
                   </div>
                )}
              </div>
            )}
          </div>

          {/* Side Form Panel */}
          {isFormOpen && (
            <div className="w-[380px] border-l border-neutral-800 bg-neutral-900/20 p-8 overflow-y-auto animate-[fadeIn_0.3s_ease]">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-lg font-black text-white">
                  {editingCategory || editingItem ? 'Edit ' : 'New '} 
                  {activeTab === 'categories' ? 'Category' : 'Menu Item'}
                </h4>
                <button onClick={resetForms} className="text-neutral-500 hover:text-white"><X size={20} /></button>
              </div>

              <div className="space-y-6">
                {activeTab === 'categories' ? (
                  <>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-neutral-500 uppercase tracking-tighter">Category Name</label>
                       <input 
                        value={catName} onChange={e => setCatName(e.target.value)}
                        placeholder="e.g. Pizza, Burgers" 
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none focus:border-sky-500 transition-all font-medium"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-neutral-500 uppercase tracking-tighter">Description</label>
                       <textarea 
                        value={catDesc} onChange={e => setCatDesc(e.target.value)}
                        placeholder="Short description..." 
                        rows={3}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none focus:border-sky-500 transition-all font-medium resize-none"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-neutral-500 uppercase tracking-tighter">Brand Color</label>
                       <div className="flex gap-3">
                          <input type="color" value={catColor} onChange={e => setCatColor(e.target.value)} className="w-12 h-12 rounded-lg bg-neutral-950 border border-neutral-800 p-1 cursor-pointer" />
                          <input value={catColor} onChange={e => setCatColor(e.target.value)} className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none font-mono text-sm" />
                       </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-neutral-500 uppercase tracking-tighter">Item Name</label>
                       <input 
                        value={itemName} onChange={e => setItemName(e.target.value)}
                        placeholder="e.g. Margherita 12 inch" 
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none focus:border-sky-500 transition-all font-medium"
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-tighter">Price (₹)</label>
                        <input 
                          type="number" value={itemPrice} onChange={e => setItemPrice(e.target.value)}
                          placeholder="299" 
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none focus:border-sky-500 transition-all font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-tighter">Category</label>
                        <select 
                          value={itemCategory} onChange={e => setItemCategory(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-3 text-white outline-none focus:border-sky-500 transition-all font-medium appearance-none"
                        >
                          <option value="">Select...</option>
                          {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-neutral-500 uppercase tracking-tighter">Description</label>
                       <textarea 
                        value={itemDesc} onChange={e => setItemDesc(e.target.value)}
                        placeholder="Key ingredients or details..." 
                        rows={3}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none focus:border-sky-500 transition-all font-medium resize-none"
                       />
                    </div>
                  </>
                )}

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={resetForms}
                    className="flex-1 py-3 border border-neutral-800 text-neutral-400 font-bold rounded-2xl hover:bg-neutral-900 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={activeTab === 'categories' ? onSaveCategory : onSaveItem}
                    className="flex-1 py-3 bg-sky-500 text-white font-black rounded-2xl hover:bg-sky-400 transition-all shadow-[0_4px_15px_rgba(14,165,233,0.3)] flex items-center justify-center gap-2"
                  >
                    <Save size={18} /> Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
