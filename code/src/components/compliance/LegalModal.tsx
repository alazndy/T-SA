import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, FileText, ScrollText } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: string;
}

const PrivacyText = `
## Privacy Policy
**Last Updated: January 3, 2026**

### Introduction
Welcome to T-SA. We respect your privacy and are committed to protecting your personal data.

### Data Collection
We collect minimal data necessary for the functionality of the tool:
- **Analysis Data**: Documents you upload are processed by AI.
- **Local Storage**: Data is stored locally on your device.

### Analysis & AI
T-SA uses AI models to analyze your documents. No data is used to train these models without your consent.

### Contact
privacy@t-ecosystem.com
`;

const KVKKText = `
## KVKK Aydınlatma Metni
**Veri Sorumlusu:** T-Ecosystem

T-SA uygulamasını kullanarak, aşağıdaki hususları kabul etmiş sayılırsınız:

1. **Veri İşleme**: Yüklediğiniz dokümanlar analiz amacıyla işlenir.
2. **Yapay Zeka**: Analiz süreçlerinde Google Gemini gibi altyapılar kullanılabilir.
3. **Saklama**: Analiz sonuçları tarayıcınızda (yerel) saklanır.
`;

const TermsText = `
## Terms of Service

1. **License**: T-SA is provided "as is". 
2. **Accuracy**: AI analysis may contain errors. Always verify technical specifications manually.
3. **Usage**: Do not use T-SA for illegal purposes.
`;

export function LegalModal({ isOpen, onClose, defaultTab = 'privacy' }: LegalModalProps) {
  const [activeTab, setActiveTab] = React.useState(defaultTab);

  React.useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab, isOpen]);

  const getContent = () => {
    switch(activeTab) {
        case 'privacy': return PrivacyText;
        case 'kvkk': return KVKKText;
        case 'terms': return TermsText;
        default: return PrivacyText;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
           <motion.div 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             exit={{ opacity: 0 }}
             onClick={onClose}
             className="fixed inset-0 bg-black/50 backdrop-blur-sm z-9999" 
           />
           <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-zinc-950 border border-zinc-800 w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col h-[70vh]"
              >
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-zinc-800 p-4 bg-zinc-900/50">
                      <h2 className="text-xl font-semibold flex items-center gap-2 text-zinc-100">
                          <Shield className="text-emerald-500" />
                          Legal & Compliance
                      </h2>
                      <button 
                        onClick={onClose}
                        title="Close"
                        className="rounded-full p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                      >
                          <X size={20} />
                      </button>
                  </div>
                  
                  {/* Body */}
                  <div className="flex flex-1 overflow-hidden">
                      {/* Sidebar */}
                      <div className="w-48 flex flex-col gap-2 border-r border-zinc-800 p-4 bg-zinc-900/30">
                          <button 
                              onClick={() => setActiveTab('privacy')}
                              className={cn("text-left px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2", activeTab === 'privacy' ? "bg-emerald-500/10 text-emerald-500" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200")}
                          >
                              <Shield size={16} /> Privacy Policy
                          </button>
                          <button 
                              onClick={() => setActiveTab('kvkk')}
                              className={cn("text-left px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2", activeTab === 'kvkk' ? "bg-emerald-500/10 text-emerald-500" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200")}
                          >
                              <FileText size={16} /> KVKK Text
                          </button>
                          <button 
                              onClick={() => setActiveTab('terms')}
                              className={cn("text-left px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2", activeTab === 'terms' ? "bg-emerald-500/10 text-emerald-500" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200")}
                          >
                              <ScrollText size={16} /> Terms of Use
                          </button>
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-6 overflow-y-auto text-zinc-300">
                          <article className="prose prose-invert prose-sm max-w-none">
                              {getContent().split('\n').map((line, i) => {
                                  if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-4 mb-2 text-zinc-100">{line.replace('## ', '')}</h2>;
                                  if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mt-3 mb-1 text-zinc-200">{line.replace('### ', '')}</h3>;
                                  if (line.startsWith('**') && line.endsWith('**')) return <strong key={i} className="text-white">{line.replace(/\*\*/g, '')}</strong>;
                                  if (line.startsWith('- ')) return <div key={i} className="ml-4 flex items-start text-zinc-400"><span className="mr-2 text-emerald-500 shrink-0">•</span><span>{line.replace('- ', '')}</span></div>;
                                  if (line.trim().match(/^\d+\./)) return <div key={i} className="mb-2 font-medium text-white">{line}</div>;
                                  if (line.trim() === '') return <br key={i} />;
                                  return <p key={i} className="mb-2 text-zinc-400">{line}</p>;
                              })}
                          </article>
                      </div>
                  </div>
              </motion.div>
           </div>
        </>
      )}
    </AnimatePresence>
  );
}
