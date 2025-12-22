import React, { useState } from 'react';
import { Product } from '../types';
import { Mail, Copy, Check, X, Loader2, Globe } from 'lucide-react';
import { generateRFQEmail } from '../services/geminiService';

interface RFQModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

const RFQModal: React.FC<RFQModalProps> = ({ isOpen, onClose, product }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ subject: string, body: string } | null>(null);
  const [language, setLanguage] = useState("Türkçe");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    try {
        const data = await generateRFQEmail(product, language);
        setResult(data);
    } catch (e) {
        alert("E-posta oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
        setLoading(false);
    }
  };

  const handleCopy = () => {
    if(!result) return;
    const fullText = `Konu: ${result.subject}\n\n${result.body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-theme-bg border border-theme-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-theme-border bg-theme-surface">
             <div className="flex items-center gap-2">
                 <div className="p-2 bg-neon-blue/10 rounded-lg text-neon-blue">
                    <Mail className="w-5 h-5" />
                 </div>
                 <h3 className="font-bold text-theme-text">Teklif İsteme (RFQ) Taslağı</h3>
             </div>
             <button onClick={onClose} className="p-1 text-theme-muted hover:text-theme-text"><X className="w-5 h-5"/></button>
        </div>

        {/* Body */}
        <div className="p-6">
            {!result ? (
                <div className="flex flex-col gap-4">
                    <div className="bg-theme-surface p-4 rounded-lg border border-theme-border text-sm text-theme-secondary">
                        <strong>"{product.name}"</strong> için teknik detayları içeren profesyonel bir satınalma e-postası oluşturulacak.
                    </div>
                    
                    <div className="flex items-center gap-2">
                       <Globe className="w-4 h-4 text-theme-muted" />
                       <label className="text-xs font-bold text-theme-muted uppercase">Dil Seçimi:</label>
                       <select 
                         value={language} 
                         onChange={(e) => setLanguage(e.target.value)}
                         className="bg-theme-input border border-theme-border rounded px-2 py-1 text-sm outline-none"
                       >
                          <option value="Türkçe">Türkçe</option>
                          <option value="İngilizce">İngilizce (English)</option>
                          <option value="Almanca">Almanca (Deutsch)</option>
                       </select>
                    </div>

                    <button 
                      onClick={handleGenerate}
                      disabled={loading}
                      className="w-full py-3 bg-neon-blue text-white font-bold rounded-lg flex items-center justify-center hover:opacity-90 transition-all"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Taslağı Oluştur"}
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-theme-muted uppercase">Konu</label>
                        <div className="p-3 bg-theme-input border border-theme-border rounded-lg text-sm font-medium text-theme-text select-text">
                            {result.subject}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-theme-muted uppercase">Mesaj</label>
                        <div className="p-3 bg-theme-input border border-theme-border rounded-lg text-sm text-theme-text h-64 overflow-y-auto whitespace-pre-wrap select-text custom-scrollbar">
                            {result.body}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setResult(null)} className="flex-1 py-2 border border-theme-border rounded-lg text-theme-secondary text-sm font-medium hover:bg-theme-surface">
                            Geri Dön
                        </button>
                        <button onClick={handleCopy} className="flex-[2] py-2 bg-theme-text text-theme-bg rounded-lg text-sm font-bold flex items-center justify-center hover:opacity-90">
                            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                            {copied ? "Kopyalandı" : "Panoya Kopyala"}
                        </button>
                    </div>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default RFQModal;