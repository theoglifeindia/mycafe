
import React, { useState } from 'react';
import { Table, TableStatus, AppSettings } from '../types.ts';
import { Plus, Trash2, Edit2, Layout, Save, X, Layers, AlertCircle } from 'lucide-react';

interface TableSetupProps {
  tables: Table[];
  settings?: AppSettings;
  onUpdate: (tables: Table[]) => void;
  onDeleteTable: (id: string) => void;
}

const TableSetup: React.FC<TableSetupProps> = ({ tables, settings, onUpdate, onDeleteTable }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null);

  const isDark = settings?.theme === 'Midnight';
  const sections = Array.from(new Set(tables.map(t => t.section))) as string[];

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const section = formData.get('section') as string;

    const newTable: Table = {
      id: editingTable?.id || `table_${Date.now()}`,
      name,
      section: section || 'General',
      status: editingTable?.status || 'vacant'
    };

    let updatedTables: Table[];
    if (editingTable) {
      updatedTables = tables.map(t => t.id === editingTable.id ? newTable : t);
    } else {
      updatedTables = [...tables, newTable];
    }

    onUpdate(updatedTables);
    setIsModalOpen(false);
    setEditingTable(null);
  };

  const confirmDelete = () => {
    if (tableToDelete) {
      onDeleteTable(tableToDelete.id);
      setIsDeleteModalOpen(false);
      setTableToDelete(null);
    }
  };

  const handleDeleteClick = (table: Table) => {
    setTableToDelete(table);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className={`flex justify-between items-center p-6 rounded-2xl shadow-sm border transition-all ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-100 text-gray-900'
      }`}>
        <div>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Table & Floor Setup</h2>
          <p className="text-sm text-gray-400 mt-1">Configure your restaurant layout and seating areas.</p>
        </div>
        <button 
          onClick={() => { setEditingTable(null); setIsModalOpen(true); }}
          className="flex items-center px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition-all active:scale-95 text-sm cursor-pointer"
        >
          <Plus className="w-5 h-5 mr-2" /> Add Table
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map(section => (
          <div key={section} className={`rounded-2xl shadow-sm border overflow-hidden ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'
          }`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${
              isDark ? 'bg-slate-850 border-slate-800' : 'bg-gray-50 border-gray-100'
            }`}>
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-blue-500" />
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{section}</h3>
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                isDark ? 'bg-blue-950/60 text-blue-400' : 'bg-blue-100 text-blue-700'
              }`}>
                {tables.filter(t => t.section === section).length} Tables
              </span>
            </div>
            <div className="p-4 space-y-2">
              {tables.filter(t => t.section === section).map(table => (
                <div key={table.id} className={`flex items-center justify-between p-3 rounded-xl group border transition-all ${
                  isDark 
                    ? 'bg-slate-800/60 border-slate-750 hover:bg-slate-800 hover:border-slate-700' 
                    : 'bg-gray-50 border-transparent hover:bg-white hover:shadow-sm hover:border-gray-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 border rounded-lg flex items-center justify-center font-bold shadow-xs ${
                      isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200 text-gray-700'
                    }`}>
                      {table.name}
                    </div>
                    <div className="flex flex-col">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                        {table.status}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button 
                      onClick={() => { setEditingTable(table); setIsModalOpen(true); }}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        isDark ? 'text-slate-400 hover:text-blue-400 hover:bg-slate-700' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                      title="Edit Table"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(table)}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-700' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                      }`}
                      title="Delete Table"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {tables.length === 0 && (
          <div className={`col-span-full py-20 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-gray-200 text-gray-400'
          }`}>
            <Layout className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-bold">No tables configured yet.</p>
            <p className="text-sm">Start by adding your first table and floor section.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 border ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-100 text-gray-900'
          }`}>
            <div className={`p-6 border-b flex justify-between items-center ${
              isDark ? 'bg-slate-850 border-slate-800' : 'bg-gray-50 border-gray-100'
            }`}>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{editingTable ? 'Edit Table' : 'Add New Table'}</h3>
              <button onClick={() => setIsModalOpen(false)} className={`p-2 rounded-full transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-200 text-gray-500'
              }`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">TABLE NAME</label>
                <input 
                  name="name" 
                  defaultValue={editingTable?.name} 
                  required 
                  autoFocus
                  placeholder="e.g., T1, VIP-1" 
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold transition-all ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">FLOOR / SECTION</label>
                <input 
                  name="section" 
                  defaultValue={editingTable?.section} 
                  required 
                  placeholder="e.g., Ground Floor, Rooftop" 
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold transition-all ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`} 
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {sections.map(s => (
                    <button 
                      key={s} 
                      type="button"
                      onClick={(e) => {
                        const input = (e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement);
                        if (input) input.value = s;
                      }}
                      className={`text-[10px] font-bold px-2 py-1 rounded cursor-pointer ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-lg transition-all active:scale-95 flex items-center justify-center cursor-pointer">
                  <Save className="w-4 h-4 mr-2" />
                  {editingTable ? 'Update Configuration' : 'Save Table Setup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`rounded-2xl w-full max-sm overflow-hidden shadow-2xl p-8 animate-in fade-in zoom-in duration-200 border ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-100 text-gray-900'
          }`}>
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                isDark ? 'bg-rose-950/60 text-rose-400' : 'bg-red-50 text-red-600'
              }`}>
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Confirm Removal</h3>
              <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                Are you sure you want to remove table <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>"{tableToDelete?.name}"</span>? Any active session data for this table will be lost.
              </p>
              <div className="flex w-full gap-3">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className={`flex-1 py-3 border rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                    isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-md active:scale-95 cursor-pointer"
                >
                  Delete Table
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableSetup;
