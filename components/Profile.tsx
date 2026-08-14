
import React, { useState } from 'react';
import { BusinessProfile, AppSettings } from '../types.ts';
import { User, Phone, FileText, MapPin, CheckCircle } from 'lucide-react';

interface ProfileProps {
  profile: BusinessProfile;
  settings?: AppSettings;
  onSave: (profile: BusinessProfile) => void;
}

const Profile: React.FC<ProfileProps> = ({ profile, settings, onSave }) => {
  const [formData, setFormData] = useState(profile);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const isDark = settings?.theme === 'Midnight';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  return (
    <div className={`rounded-2xl shadow-sm border p-8 max-w-4xl mx-auto transition-all ${
      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-100 text-gray-900'
    }`}>
      <div className={`flex items-center justify-between mb-8 pb-4 border-b ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl ${isDark ? 'bg-blue-950/60 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Profile</h2>
            <p className="text-xs text-gray-400">Configure business information and registration credentials.</p>
          </div>
        </div>
        {showSavedToast && (
          <div className="flex items-center px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md animate-in fade-in slide-in-from-top-2">
            <CheckCircle className="w-4 h-4 mr-1.5" /> Profile updated successfully!
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <h3 className={`text-lg font-bold mb-4 pb-2 border-b ${isDark ? 'text-white border-slate-800' : 'text-gray-800 border-gray-100'}`}>
            Business Information
          </h3>
          <p className="text-sm text-gray-400 mb-6">Edit the details about your establishment shown across bills and receipts.</p>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="mt-2 text-gray-400"><User className="w-5 h-5" /></div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Owner Name</label>
                <input 
                  value={formData.ownerName}
                  onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium transition-all ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`} 
                />
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="mt-2 text-gray-400"><Phone className="w-5 h-5" /></div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Owner Number</label>
                <input 
                  value={formData.ownerNumber}
                  onChange={e => setFormData({ ...formData, ownerNumber: e.target.value })}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium transition-all ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`} 
                />
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="mt-2 text-gray-400"><FileText className="w-5 h-5" /></div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">FSSAI License No.</label>
                <input 
                  value={formData.fssai}
                  onChange={e => setFormData({ ...formData, fssai: e.target.value })}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium transition-all ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`} 
                />
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="mt-2 text-gray-400"><MapPin className="w-5 h-5" /></div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Cafe Address</label>
                <textarea 
                  rows={3}
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium resize-none transition-all ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={`pt-6 border-t ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
          <button type="submit" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition-all active:scale-95 cursor-pointer">
            Save Details
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
