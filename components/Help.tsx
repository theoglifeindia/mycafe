import React, { useState } from 'react';
import { AppSettings, BusinessProfile } from '../types.ts';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  CheckCircle, 
  MessageSquare, 
  FileText, 
  Printer, 
  Utensils, 
  Settings as SettingsIcon,
  ShieldCheck,
  LifeBuoy
} from 'lucide-react';

interface HelpProps {
  settings: AppSettings;
  profile: BusinessProfile | null;
}

interface FAQItem {
  id: string;
  category: 'general' | 'orders' | 'tables' | 'printing' | 'reports';
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'general',
    question: 'How do I change my business name and invoice header?',
    answer: 'Go to Settings in the left sidebar. Under "Logo & Bill Branding", you can update your Business Name, upload a new logo, and toggle visibility options for logos and addresses on printed bills.'
  },
  {
    id: 'faq-2',
    category: 'orders',
    question: 'How do I place and manage dine-in orders?',
    answer: 'Navigate to "Dine In" tab, select an available table (green), choose menu items, and click "Save & Send Order" or "Settle & Print Bill" when customer pays.'
  },
  {
    id: 'faq-3',
    category: 'tables',
    question: 'How do I customize my floor plan and table count?',
    answer: 'Go to "Table Setup". You can add new tables, edit table numbers/capacity, change table shapes (round, square, rect), and drag them to match your physical restaurant layout.'
  },
  {
    id: 'faq-4',
    category: 'printing',
    question: 'How do thermal bill and kitchen ticket prints work?',
    answer: 'When settling an order or generating a reprint from Order History, the system opens a dedicated thermal receipt print layout. Make sure your browser has popup permissions allowed for thermal printing.'
  },
  {
    id: 'faq-5',
    category: 'reports',
    question: 'Can I export sales reports to Excel or CSV?',
    answer: 'Yes! Navigate to the "Reports" tab, select your date range, and click "Export CSV" to download detailed transaction data.'
  },
  {
    id: 'faq-6',
    category: 'general',
    question: 'Is my POS data saved automatically?',
    answer: 'All tables, orders, menu items, and settings are saved in real-time to your cloud database session.'
  }
];

const Help: React.FC<HelpProps> = ({ settings, profile }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFaq, setExpandedFaq] = useState<string | null>('faq-1');

  // Contact form state
  const [contactName, setContactName] = useState(profile?.ownerName || '');
  const [contactEmail, setContactEmail] = useState('help.mycafepos@gmail.com');
  const [subject, setSubject] = useState('General Support');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const bName = settings.businessName || settings.invoiceHeader || 'Cafe Rock Bottom';
  const isDark = settings.theme === 'Midnight';

  const categories = [
    { id: 'all', label: 'All FAQs', icon: HelpCircle },
    { id: 'general', label: 'General & Setup', icon: SettingsIcon },
    { id: 'orders', label: 'Order Placement', icon: Utensils },
    { id: 'tables', label: 'Table Management', icon: LifeBuoy },
    { id: 'printing', label: 'Printing & Receipts', icon: Printer },
    { id: 'reports', label: 'Reports & Export', icon: FileText },
  ];

  const filteredFaqs = FAQS.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setMessage('');
    }, 800);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className={`p-8 rounded-3xl border transition-all ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl'
      }`}>
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider mb-4">
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Support & Documentation Center</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">{bName} Help Desk</h1>
          <p className="text-sm opacity-90 mt-2 font-medium leading-relaxed">
            Find instant answers to common POS questions, learn how to configure your restaurant workflow, or send a message directly to technical support.
          </p>

          {/* Search bar */}
          <div className="mt-6 relative max-w-xl">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help topics, printing issues, table setup..."
              className="w-full pl-12 pr-4 py-3.5 bg-white text-gray-900 rounded-2xl text-sm font-medium shadow-lg outline-none focus:ring-4 focus:ring-blue-400/30 transition-all placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: FAQ Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-wider">Frequently Asked Questions</h2>
                  <p className="text-xs text-gray-400 font-bold">Quick solutions to common operational tasks</p>
                </div>
              </div>
              <span className="text-xs font-black px-3 py-1 bg-gray-100 rounded-full text-gray-600">
                {filteredFaqs.length} {filteredFaqs.length === 1 ? 'Topic' : 'Topics'}
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md'
                        : isDark 
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Accordion List */}
            <div className="space-y-3">
              {filteredFaqs.length === 0 ? (
                <div className="py-12 text-center text-gray-400 font-bold text-xs uppercase tracking-wider">
                  No matching help topics found.
                </div>
              ) : (
                filteredFaqs.map((faq) => {
                  const isOpen = expandedFaq === faq.id;
                  return (
                    <div 
                      key={faq.id}
                      className={`border rounded-2xl overflow-hidden transition-all ${
                        isOpen 
                          ? isDark ? 'border-blue-500/50 bg-slate-800/60' : 'border-blue-200 bg-blue-50/30' 
                          : isDark ? 'border-slate-800 bg-slate-850 hover:border-slate-700' : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
                      }`}
                    >
                      <button
                        onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                        className={`w-full px-5 py-4 text-left flex items-center justify-between font-bold text-sm cursor-pointer ${
                          isDark ? 'text-slate-100' : 'text-gray-800'
                        }`}
                      >
                        <span className={isOpen ? (isDark ? 'text-blue-400' : 'text-blue-600') : ''}>{faq.question}</span>
                        {isOpen ? <ChevronUp className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                      </button>
                      {isOpen && (
                        <div className={`px-5 pb-5 pt-1 text-xs leading-relaxed font-medium border-t ${
                          isDark ? 'border-slate-700/60 text-slate-300' : 'border-gray-100/50 text-gray-600'
                        }`}>
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Contact Form & Info */}
        <div className="space-y-6">
          {/* Quick Contact Card */}
          <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-100 shadow-sm text-gray-900'}`}>
            <div className="flex items-center space-x-3 mb-6">
              <div className={`p-2.5 rounded-2xl ${isDark ? 'bg-indigo-950/60 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`text-lg font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>Contact Technical Support</h2>
                <p className="text-xs text-gray-400 font-bold">Have an inquiry or bug report?</p>
              </div>
            </div>

            {submitted ? (
              <div className={`p-6 rounded-2xl text-center space-y-3 border ${
                isDark ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-300' : 'bg-emerald-50 border-emerald-100 text-emerald-900'
              }`}>
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                <h3 className="text-sm font-black uppercase">Message Sent Successfully!</h3>
                <p className="text-xs font-medium leading-relaxed opacity-90">
                  Thank you for reaching out. Our support team will review your inquiry and get back to you shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-2 text-xs font-black uppercase tracking-wider underline cursor-pointer hover:opacity-80"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitContact} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Enter your name"
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                    Support Email (Fixed)
                  </label>
                  <input
                    type="email"
                    required
                    readOnly
                    value="help.mycafepos@gmail.com"
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold outline-none cursor-not-allowed ${
                      isDark ? 'bg-slate-850 border-slate-700 text-slate-300' : 'bg-gray-100 border-gray-200 text-gray-700'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                    Subject / Topic
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value="General Support" className={isDark ? 'bg-slate-800' : ''}>General Support</option>
                    <option value="Printer & Thermal Receipt Issue" className={isDark ? 'bg-slate-800' : ''}>Printer & Thermal Receipt Issue</option>
                    <option value="Menu or Billing Query" className={isDark ? 'bg-slate-800' : ''}>Menu or Billing Query</option>
                    <option value="Feature Request" className={isDark ? 'bg-slate-800' : ''}>Feature Request</option>
                    <option value="Bug Report" className={isDark ? 'bg-slate-800' : ''}>Bug Report</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                    How can we help?
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your question or issue in detail..."
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Sending Message...' : 'Submit Support Ticket'}</span>
                </button>
              </form>
            )}
          </div>

          {/* System Info Box */}
          <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-gray-50 border-gray-200/60 text-gray-900'}`}>
            <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-gray-400 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>System & Environment</span>
            </div>
            <div className="space-y-2 text-xs font-medium">
              <div className={`flex justify-between border-b pb-1.5 ${isDark ? 'border-slate-800 text-slate-300' : 'border-gray-200/50 text-gray-600'}`}>
                <span className="text-gray-400">POS Version</span>
                <span className="font-bold">v2.5.0 Pro</span>
              </div>
              <div className={`flex justify-between border-b pb-1.5 ${isDark ? 'border-slate-800 text-slate-300' : 'border-gray-200/50 text-gray-600'}`}>
                <span className="text-gray-400">Business Unit</span>
                <span className="font-bold">{bName}</span>
              </div>
              <div className={`flex justify-between border-b pb-1.5 ${isDark ? 'border-slate-800 text-slate-300' : 'border-gray-200/50 text-gray-600'}`}>
                <span className="text-gray-400">Database Status</span>
                <span className="font-bold text-emerald-500">Online & Synced</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
