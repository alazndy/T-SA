import React, { useState, useEffect } from 'react';
import { MarketAnalysisResult, Product, MarketSearchPreferences } from '../types';
import { X, Globe, ExternalLink, Activity, Filter, MapPin, Target, FilePenLine, Play } from 'lucide-react';
import { performMarketSearchStream } from '../services/geminiService';

interface StreamingMarketAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product;
}

const MarketAnalysisModal: React.FC<StreamingMarketAnalysisModalProps> = ({ isOpen, onClose, product }) => {
  const [preferences, setPreferences] = useState<MarketSearchPreferences>({
    region: 'Global',
    priority: 'Balanced',
    additionalNotes: ''
  });
  
  // Initialize state with existing data if available
  const [isLoading, setIsLoading] = useState(false);
  const [streamedContent, setStreamedContent] = useState(product.marketAnalysis?.content || "");
  const [sources, setSources] = useState<{ title: string; uri: string }[]>(product.marketAnalysis?.sources || []);
  const [error, setError] = useState<string | null>(null);

  // Sync state with product prop when modal opens or product updates
  useEffect(() => {
    if (isOpen) {
      if (product.marketAnalysis && product.marketAnalysis.content) {
        setStreamedContent(product.marketAnalysis.content);
        setSources(product.marketAnalysis.sources || []);
      } else {
        // Only reset if completely empty to allow for manual new searches without closing modal
        // But if we are opening a fresh modal for a product without analysis, clear previous state
        if (!isLoading) {
           setStreamedContent("");
           setSources([]);
        }
      }
    }
  }, [isOpen, product, isLoading]);

  if (!isOpen) return null;

  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStreamedContent("");
    setSources([]);
    setError(null);

    try {
        const stream = performMarketSearchStream(product, preferences);
        for await (const chunk of stream) {
            setStreamedContent(prev => prev + chunk.text);
            if (chunk.groundingMetadata?.groundingChunks) {
                 const newSources = chunk.groundingMetadata.groundingChunks
                  .map((c: any) => c.web ? { title: c.web.title, uri: c.web.uri } : null)
                  .filter((s: any) => s);
                 // Dedupe logic simple
                 setSources(prev => {
                     const combined = [...prev, ...newSources];
                     return Array.from(new Map(combined.map(s => [s.uri, s])).values());
                 });
            }
        }
    } catch (err: any) {
        setError("Piyasa analizi sırasında hata oluştu: " + err.message);
    } finally {
        setIsLoading(false);
    }
  };

  const showForm = !isLoading && streamedContent.length === 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className={`relative bg-theme-bg border border-theme-border rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden animate-slide-up ${showForm ? 'max-w-2xl' : 'max-w-6xl max-h-[90vh]'}`}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-orange via-neon-purple to-neon-blue"></div>

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-theme-border bg-theme-surface">
          <div className="flex items-center gap-4">
             <div className="bg-neon-blue/10 p-2.5 rounded-xl border border-neon-blue/20">
                <Globe className="w-6 h-6 text-neon-blue" />
             </div>
             <div>
               <h3 className="text-xl font-bold text-theme-text tracking-tight">Piyasa Araştırması</h3>
               <p className="text-sm text-theme-secondary flex items-center">Hedef Ürün: <span className="text-neon-orange ml-2 font-mono truncate max-w-[200px]">{product.name}</span></p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-theme-input rounded-full transition-colors text-theme-muted hover:text-theme-text"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className={`flex-grow overflow-y-auto custom-scrollbar bg-theme-bg ${showForm ? 'p-0' : 'p-8'}`}>
          
          {/* SETUP FORM VIEW */}
          {showForm && !error && (
             <form onSubmit={handleStartAnalysis} className="p-8 space-y-6">
                <div className="bg-neon-blue/5 border border-neon-blue/10 rounded-lg p-4 mb-6">
                   <div className="flex items-start">
                     <Filter className="w-5 h-5 text-neon-blue mt-0.5 mr-3 flex-shrink-0" />
                     <p className="text-sm text-theme-secondary font-light">
                       Yapay zeka, şartnamedeki teknik özellikleri piyasa ürünleriyle karşılaştıracak.
                       Aşağıdaki filtreleri kullanarak aramayı daraltabilirsiniz.
                     </p>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-theme-muted flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-2" />
                        Tedarik Bölgesi
                      </label>
                      <select 
                        value={preferences.region}
                        onChange={(e) => setPreferences({...preferences, region: e.target.value})}
                        className="w-full bg-theme-input border border-theme-border rounded-lg px-4 py-3 text-theme-text focus:outline-none focus:border-neon-orange focus:ring-1 focus:ring-neon-orange transition-all"
                      >
                         <option value="Global">Global (Tüm Dünya)</option>
                         <option value="Türkiye">Türkiye (Yerli ve Distribütör)</option>
                         <option value="Avrupa">Avrupa Menşeli</option>
                         <option value="ABD">ABD Menşeli</option>
                         <option value="Asya">Asya / Uzakdoğu</option>
                      </select>
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-theme-muted flex items-center">
                        <Target className="w-3.5 h-3.5 mr-2" />
                        Arama Önceliği
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                         {[
                           { val: 'Balanced', label: 'Dengeli' },
                           { val: 'Price', label: 'En Ucuz' },
                           { val: 'Quality', label: 'En Kaliteli' },
                           { val: 'Speed', label: 'Hızlı Temin' }
                         ].map(opt => (
                           <button
                             type="button"
                             key={opt.val}
                             onClick={() => setPreferences({...preferences, priority: opt.val as any})}
                             className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${preferences.priority === opt.val 
                               ? 'bg-neon-orange text-black border-neon-orange' 
                               : 'bg-theme-surface text-theme-secondary border-theme-border hover:bg-theme-input'}`}
                           >
                             {opt.label}
                           </button>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-theme-muted flex items-center">
                        <FilePenLine className="w-3.5 h-3.5 mr-2" />
                        Ek Notlar / Anahtar Kelimeler
                      </label>
                      <textarea 
                        value={preferences.additionalNotes}
                        onChange={(e) => setPreferences({...preferences, additionalNotes: e.target.value})}
                        placeholder="Örn: 'Siemens veya Schneider marka tercih edilir', 'Ex-Proof özellik şart değil'..."
                        className="w-full bg-theme-input border border-theme-border rounded-lg px-4 py-3 text-theme-text focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all h-24 resize-none placeholder-theme-muted"
                      />
                   </div>
                </div>

                <div className="pt-4 flex justify-end">
                   <button 
                     type="submit"
                     className="flex items-center px-6 py-3 bg-theme-text text-theme-bg font-bold rounded-lg hover:opacity-80 hover:scale-105 transition-all shadow-lg"
                   >
                     <Play className="w-4 h-4 mr-2 fill-current" />
                     Analizi Başlat
                   </button>
                </div>
             </form>
          )}

          {/* LOADING STATE INITIAL */}
          {isLoading && streamedContent.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 space-y-8">
               <div className="relative w-24 h-24">
                  <div className="absolute inset-0 border-t-4 border-neon-orange rounded-full animate-spin"></div>
                  <div className="absolute inset-2 border-r-4 border-neon-blue rounded-full animate-spin reverse duration-75"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Activity className="w-8 h-8 text-theme-text animate-pulse" />
                  </div>
               </div>
               <div className="text-center">
                 <p className="text-theme-text text-lg font-medium tracking-wide">Piyasa Taranıyor</p>
                 <div className="flex items-center justify-center gap-2 mt-2 text-sm text-neon-blue animate-pulse">
                    <span>{preferences.region} Bölgesi</span>
                    <span>•</span>
                    <span>{preferences.priority === 'Price' ? 'Fiyat Odaklı' : preferences.priority === 'Quality' ? 'Kalite Odaklı' : 'Dengeli'}</span>
                 </div>
               </div>
            </div>
          )}

          {/* ERROR STATE */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center backdrop-blur-sm m-8">
              <p className="text-red-500 font-medium text-lg mb-4">{error}</p>
              <button onClick={() => onClose()} className="text-theme-text underline text-sm">Pencereyi Kapat</button>
            </div>
          )}

          {/* STREAMING RESULTS VIEW */}
          {(streamedContent.length > 0) && (
            <div className="space-y-10">
              {/* AI Report Content */}
              <div className="compliance-report-container font-light">
                <style>{`
                  .compliance-report-container h3 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin-top: 2.5rem;
                    margin-bottom: 0.5rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    align-items: center;
                  }
                  .compliance-report-container h3::before {
                    content: '';
                    display: inline-block;
                    width: 6px;
                    height: 24px;
                    background: var(--color-primary);
                    margin-right: 12px;
                    border-radius: 2px;
                  }
                  .compliance-report-container .price-tag {
                    display: inline-block;
                    background: rgba(0, 255, 127, 0.1);
                    border: 1px solid rgba(0, 255, 127, 0.3);
                    color: #00AA55;
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    margin-bottom: 1rem;
                    font-family: 'JetBrains Mono', monospace;
                  }
                  .dark .compliance-report-container .price-tag {
                     color: #00ff7f;
                  }
                  .compliance-report-container table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    font-size: 0.85rem;
                    margin-bottom: 2.5rem;
                    border: 1px solid var(--border-color);
                    border-radius: 0.75rem;
                    overflow: hidden;
                    background: var(--bg-surface);
                  }
                  .compliance-report-container th {
                    background-color: var(--bg-input);
                    text-align: left;
                    padding: 1rem 1.25rem;
                    font-weight: 700;
                    color: var(--color-secondary);
                    text-transform: uppercase;
                    border-bottom: 1px solid var(--border-color);
                    font-size: 0.75rem;
                  }
                  .compliance-report-container td {
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid var(--border-color);
                    color: var(--text-primary);
                    vertical-align: top;
                  }
                `}</style>
                <div 
                  dangerouslySetInnerHTML={{ __html: streamedContent }}
                />
                {isLoading && <span className="inline-block w-2 h-4 bg-neon-orange animate-pulse ml-1 align-middle"></span>}
              </div>

              {/* Source References */}
              {sources.length > 0 && (
                <div className="bg-theme-surface rounded-xl p-6 border border-theme-border mt-10">
                  <h4 className="text-xs font-bold text-theme-muted uppercase tracking-widest mb-4 flex items-center">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Doğrulanmış Kaynaklar
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sources.map((source, idx) => (
                      <a 
                        key={idx} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-start p-4 bg-theme-input rounded-lg border border-theme-border hover:border-neon-blue/30 transition-all group"
                      >
                        <div className="mt-1 mr-3 flex-shrink-0">
                           <img 
                             src={`https://www.google.com/s2/favicons?domain=${new URL(source.uri).hostname}&sz=32`} 
                             alt="favicon" 
                             className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-all"
                           />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-theme-text truncate group-hover:text-neon-blue transition-colors">
                            {source.title || "Harici Bağlantı"}
                          </p>
                          <p className="text-[10px] text-theme-muted truncate mt-1 font-mono">{new URL(source.uri).hostname}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-theme-border bg-theme-surface flex justify-between items-center">
           {!showForm && streamedContent.length > 0 && !isLoading && (
             <button 
                onClick={() => { setStreamedContent(""); setError(null); }}
                className="text-theme-muted text-xs hover:text-theme-text transition-colors underline"
             >
                Yeni Arama Yap
             </button>
           )}
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-theme-input border border-theme-border rounded-lg text-sm font-bold text-theme-text hover:bg-theme-surface transition-all uppercase tracking-wider ml-auto"
          >
            {streamedContent.length > 0 ? 'Raporu Kapat' : 'İptal'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketAnalysisModal;