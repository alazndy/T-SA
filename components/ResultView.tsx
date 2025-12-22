import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AnalysisResult, Product, MarketSearchPreferences } from '../types';
import ProductCard from './ProductCard';
import DatasheetComparisonPanel from './DatasheetComparisonModal';
import { Download, Save, List, UploadCloud, Search, Filter, ShieldAlert, Layers, ChevronLeft, Briefcase, Play, Loader2, FileText, X, Globe, MapPin, Target, Square, ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import { performMarketSearchStream } from '../services/geminiService';
import { generateReportZip } from '../services/exportService';

interface ResultViewProps {
  result: AnalysisResult;
  onReset: () => void;
  onSave: () => void;
  pdfUrl: string | null;
}

const ResultView: React.FC<ResultViewProps> = ({ result, onReset, onSave, pdfUrl }) => {
  const [localResult, setLocalResult] = useState<AnalysisResult>(result);
  const [activeTab, setActiveTab] = useState<'products' | 'general'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRegexMode, setIsRegexMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [showWithStandardsOnly, setShowWithStandardsOnly] = useState(false);
  const [comparingProduct, setComparingProduct] = useState<Product | null>(null);
  
  // Bulk Analysis State
  const [isBulkAnalyzing, setIsBulkAnalyzing] = useState(false);
  const [bulkQueue, setBulkQueue] = useState<Product[]>([]);
  const [bulkIndex, setBulkIndex] = useState(0);
  const [waitingForNext, setWaitingForNext] = useState(false);
  const [currentAnalyzingId, setCurrentAnalyzingId] = useState<string | null>(null);
  const [showBulkConfig, setShowBulkConfig] = useState(false);
  
  // Auto Advance State
  const [autoAdvance, setAutoAdvance] = useState(false);
  const autoAdvanceRef = useRef(false);

  // Sync ref with state to access latest value inside async loops
  useEffect(() => {
    autoAdvanceRef.current = autoAdvance;
  }, [autoAdvance]);
  
  // Use ref to handle stop signal immediately without closure issues
  const stopBulkRef = useRef(false);

  const [bulkPrefs, setBulkPrefs] = useState<MarketSearchPreferences>({
      region: 'Global',
      priority: 'Balanced',
      additionalNotes: ''
  });

  const categories = useMemo(() => {
    const cats = new Set(localResult.products.map(p => p.category));
    return ['Tümü', ...Array.from(cats).sort()];
  }, [localResult.products]);

  const filteredProducts = useMemo(() => {
    return localResult.products.filter(product => {
      const searchLower = searchTerm.toLowerCase();
      let regex: RegExp | null = null;
      if (isRegexMode && searchTerm) {
        try { regex = new RegExp(searchTerm, 'i'); } catch (e) { return false; }
      }

      const checkMatch = (text?: string | null) => {
        if (!text) return false;
        if (regex) return regex.test(text);
        return text.toLowerCase().includes(searchLower);
      };

      const hasMatchingSpec = product.specifications.some(spec => 
        checkMatch(spec.sourceReference) || checkMatch(spec.parameter) || checkMatch(spec.value)
      );

      return (
        (checkMatch(product.name) || checkMatch(product.partNumber) || hasMatchingSpec) &&
        (selectedCategory === 'Tümü' || product.category === selectedCategory) &&
        (!showCriticalOnly || product.specifications.some(s => s.criticality === 'Essential')) &&
        (!showWithStandardsOnly || product.complianceStandards.length > 0)
      );
    });
  }, [localResult.products, searchTerm, isRegexMode, selectedCategory, showCriticalOnly, showWithStandardsOnly]);

  const handleProductUpdate = (updatedProduct: Product) => {
      const updatedProducts = localResult.products.map(p => 
          p.id === updatedProduct.id ? updatedProduct : p
      );
      setLocalResult({ ...localResult, products: updatedProducts });
      // Also update the queue item reference if we are in bulk mode to keep sync
      if (isBulkAnalyzing) {
          const qIndex = bulkQueue.findIndex(p => p.id === updatedProduct.id);
          if (qIndex > -1) {
              const newQueue = [...bulkQueue];
              newQueue[qIndex] = updatedProduct;
              setBulkQueue(newQueue);
          }
      }
      onSave(); 
  };

  const handleSaveWrapper = () => {
      onSave(); 
  };

  // --- BULK ANALYSIS LOGIC START ---

  const handleStartBulkSession = () => {
    setShowBulkConfig(false);
    setIsBulkAnalyzing(true);
    setBulkQueue(filteredProducts); // Snapshot the current list
    setBulkIndex(0);
    setWaitingForNext(false);
    stopBulkRef.current = false;
    
    // Start processing the first item
    processBulkItem(0, filteredProducts);
  };

  const processBulkItem = async (index: number, queue: Product[]) => {
    if (stopBulkRef.current) {
        setIsBulkAnalyzing(false);
        return;
    }

    if (index >= queue.length) {
        setIsBulkAnalyzing(false);
        alert("Toplu analiz tamamlandı.");
        return;
    }

    const prod = queue[index];
    setBulkIndex(index);

    // If already analyzed, skip automatically to the next one
    if (prod.marketAnalysis) {
        processBulkItem(index + 1, queue);
        return;
    }

    // Start Analysis for this item
    setCurrentAnalyzingId(prod.id);
    
    try {
        const stream = performMarketSearchStream(prod, bulkPrefs);
        let content = "";
        let sources: any[] = [];
        
        for await (const chunk of stream) {
            if (stopBulkRef.current) break;
            content += chunk.text;
            if (chunk.groundingMetadata?.groundingChunks) {
                  sources = [...sources, ...chunk.groundingMetadata.groundingChunks.map((c:any) => c.web ? { title: c.web.title, uri: c.web.uri } : null).filter((s:any) => s)];
            }
        }
        
        const uniqueSources = Array.from(new Map(sources.map((s:any) => [s.uri, s])).values());
        
        if (!stopBulkRef.current) {
            // Update product
            const newProd = { ...prod, marketAnalysis: { content, sources: uniqueSources as any[] } };
            
            // Update Local State
            setLocalResult(prev => ({
                ...prev,
                products: prev.products.map(p => p.id === newProd.id ? newProd : p)
            }));
            
            // Update Queue Reference
            const newQueue = [...queue];
            newQueue[index] = newProd;
            setBulkQueue(newQueue);

            setCurrentAnalyzingId(null);

            // AUTO ADVANCE LOGIC
            if (autoAdvanceRef.current) {
                // Wait briefly for UX (so user sees success state) then move on
                setTimeout(() => {
                    if (!stopBulkRef.current) {
                        processBulkItem(index + 1, newQueue);
                    }
                }, 1500);
            } else {
                // Wait for user confirmation
                setWaitingForNext(true);
            }
        } else {
            setCurrentAnalyzingId(null);
        }

    } catch (e) { 
        console.error(`Error analyzing ${prod.name}`, e); 
        // Even on error, we pause so user can see it failed (or we could skip)
        // Let's pause to allow retry or skip
        setCurrentAnalyzingId(null);
        setWaitingForNext(true);
    }
  };

  const handleNextBulkStep = () => {
      setWaitingForNext(false);
      processBulkItem(bulkIndex + 1, bulkQueue);
  };

  const handleStopBulk = () => {
      stopBulkRef.current = true;
      setIsBulkAnalyzing(false);
      setCurrentAnalyzingId(null);
      setWaitingForNext(false);
  };

  // --- BULK ANALYSIS LOGIC END ---

  const handleDownloadZIP = async () => {
    try { await generateReportZip(localResult); } catch (e) { alert("Rapor hatası."); }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full animate-slide-up relative">
      
      {/* BULK CONFIGURATION MODAL */}
      {showBulkConfig && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm rounded-xl">
           <div className="bg-theme-bg border border-theme-border shadow-2xl rounded-2xl w-full max-w-md overflow-hidden animate-slide-up">
              <div className="p-4 border-b border-theme-border bg-theme-surface flex justify-between items-center">
                 <h3 className="font-bold text-theme-text flex items-center">
                    <Globe className="w-5 h-5 mr-2 text-neon-blue" />
                    Toplu Pazar Analizi
                 </h3>
                 <button onClick={() => setShowBulkConfig(false)} className="text-theme-muted hover:text-theme-text"><X className="w-5 h-5"/></button>
              </div>
              <div className="p-6 space-y-4">
                 <div className="bg-neon-blue/5 border border-neon-blue/10 rounded-lg p-3 text-xs text-theme-secondary">
                    Listelenen <strong>{filteredProducts.length}</strong> adet ürün için sırayla tedarikçi ve fiyat araştırması yapılacaktır.
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-theme-muted flex items-center"><MapPin className="w-3.5 h-3.5 mr-2"/> Hedef Bölge</label>
                    <select 
                      value={bulkPrefs.region}
                      onChange={(e) => setBulkPrefs({...bulkPrefs, region: e.target.value})}
                      className="w-full bg-theme-input border border-theme-border rounded-lg p-2.5 text-sm outline-none focus:border-neon-blue"
                    >
                       <option value="Global">Global</option>
                       <option value="Türkiye">Türkiye</option>
                       <option value="Avrupa">Avrupa</option>
                       <option value="ABD">ABD</option>
                    </select>
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-theme-muted flex items-center"><Target className="w-3.5 h-3.5 mr-2"/> Öncelik</label>
                    <div className="grid grid-cols-2 gap-2">
                       {['Balanced', 'Price', 'Quality', 'Speed'].map(p => (
                          <button 
                             key={p}
                             onClick={() => setBulkPrefs({...bulkPrefs, priority: p as any})}
                             className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${bulkPrefs.priority === p ? 'bg-neon-blue text-white border-neon-blue' : 'bg-theme-surface border-theme-border text-theme-secondary'}`}
                          >
                             {p === 'Balanced' ? 'Dengeli' : p === 'Price' ? 'En Ucuz' : p === 'Quality' ? 'Kalite' : 'Hız'}
                          </button>
                       ))}
                    </div>
                 </div>
              </div>
              <div className="p-4 bg-theme-surface border-t border-theme-border flex justify-end">
                 <button 
                   onClick={handleStartBulkSession}
                   className="flex items-center px-4 py-2 bg-theme-text text-theme-bg font-bold rounded-lg hover:opacity-90"
                 >
                    <Play className="w-4 h-4 mr-2" /> Analizi Başlat
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* LEFT COLUMN: PDF Viewer */}
      <div className="w-full lg:w-[45%] h-[500px] lg:h-full flex flex-col glass-panel rounded-xl overflow-hidden shadow-lg border border-theme-border bg-theme-panel">
         <div className="px-4 py-3 border-b border-theme-border bg-theme-surface/50 flex justify-between items-center">
            <span className="text-xs font-bold text-theme-secondary flex items-center uppercase tracking-wider">
               <FileText className="w-3.5 h-3.5 mr-2" /> Kaynak Dosya
            </span>
            <span className="text-xs font-mono text-theme-muted truncate max-w-[150px]">{result.fileName}</span>
         </div>
         <div className="flex-grow bg-zinc-100 dark:bg-zinc-900 relative">
           {pdfUrl ? (
             <object data={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`} type="application/pdf" className="w-full h-full">
               <div className="flex items-center justify-center h-full text-theme-muted text-sm">Önizleme yüklenemedi.</div>
             </object>
           ) : (
             <div className="flex items-center justify-center h-full flex-col text-theme-muted">
               <UploadCloud className="w-12 h-12 mb-3 opacity-20" />
               <span className="text-xs">Önizleme mevcut değil</span>
             </div>
           )}
         </div>
      </div>

      {/* RIGHT COLUMN: Results */}
      <div className="w-full lg:w-[55%] flex flex-col lg:h-full">
        
        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
             <div className="flex bg-theme-surface p-1 rounded-lg border border-theme-border">
                <button 
                  onClick={() => setActiveTab('products')} 
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'products' ? 'bg-theme-card text-theme-text shadow-sm' : 'text-theme-muted hover:text-theme-secondary'}`}
                >
                  Ürün Listesi ({localResult.products.length})
                </button>
                <button 
                  onClick={() => setActiveTab('general')} 
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'general' ? 'bg-theme-card text-theme-text shadow-sm' : 'text-theme-muted hover:text-theme-secondary'}`}
                >
                  Genel Şartlar
                </button>
             </div>
             
             <div className="flex gap-2">
                <button onClick={handleDownloadZIP} className="p-2 text-theme-text bg-theme-card border border-theme-border rounded-lg hover:bg-theme-surface" title="İndir"><Download className="w-4 h-4" /></button>
                <button onClick={handleSaveWrapper} className="p-2 text-theme-text bg-theme-card border border-theme-border rounded-lg hover:bg-theme-surface" title="Kaydet"><Save className="w-4 h-4" /></button>
             </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow lg:overflow-hidden flex flex-col glass-panel rounded-xl border border-theme-border bg-theme-panel/50 relative">
            
            {comparingProduct && (
               <div className="absolute inset-0 z-20 bg-theme-bg flex flex-col animate-fade-in">
                  <div className="flex items-center justify-between p-4 border-b border-theme-border bg-theme-surface">
                     <div className="flex items-center gap-3">
                        <button onClick={() => setComparingProduct(null)} className="p-1 hover:bg-theme-input rounded"><ChevronLeft className="w-5 h-5"/></button>
                        <span className="font-bold text-sm">Datasheet Kıyaslama: {comparingProduct.name}</span>
                     </div>
                  </div>
                  <DatasheetComparisonPanel product={comparingProduct} isInline={true} />
               </div>
            )}

            {activeTab === 'general' ? (
                <div className="p-6 overflow-y-auto custom-scrollbar h-full">
                   {localResult.generalProvisions ? (
                      <div className="space-y-6 max-w-2xl mx-auto">
                          <div className="p-4 bg-theme-card border border-theme-border rounded-lg">
                             <h4 className="text-xs font-bold text-theme-muted uppercase mb-2">Yönetici Özeti</h4>
                             <p className="text-sm text-theme-text leading-relaxed">{localResult.summary}</p>
                          </div>
                          <div className="grid gap-4">
                             {Object.entries(localResult.generalProvisions).map(([key, val]) => {
                                if(key === 'certificationRequirements') return null;
                                return (
                                   <div key={key} className="p-4 bg-theme-surface rounded-lg border border-theme-border/50">
                                      <h5 className="text-xs font-bold text-theme-secondary uppercase mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</h5>
                                      <p className="text-sm text-theme-text">{val as string}</p>
                                   </div>
                                )
                             })}
                          </div>
                      </div>
                   ) : <div className="text-center p-10 text-theme-muted">Genel şart bulunamadı.</div>}
                </div>
            ) : (
                <div className="flex flex-col h-full">
                   {/* Search Bar / Bulk Control Bar */}
                   <div className="p-4 border-b border-theme-border space-y-3 bg-theme-surface/30">
                      {isBulkAnalyzing ? (
                         // BULK MODE ACTIVE UI
                         <div className="flex items-center justify-between bg-neon-blue/5 border border-neon-blue/20 rounded-lg p-2 pl-4">
                            <div className="flex items-center gap-3">
                               <div className="flex flex-col">
                                  <span className="text-xs font-bold text-neon-blue uppercase tracking-wider flex items-center">
                                     <Layers className="w-3.5 h-3.5 mr-1.5" />
                                     Toplu Mod ({bulkIndex + 1}/{bulkQueue.length})
                                  </span>
                                  <span className="text-sm font-medium text-theme-text truncate max-w-[200px]">
                                     {bulkQueue[bulkIndex]?.name}
                                  </span>
                               </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                               {/* Auto Advance Toggle */}
                               <div className="flex items-center gap-2 border-r border-neon-blue/20 pr-4">
                                  <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setAutoAdvance(!autoAdvance)}>
                                      <Zap className={`w-3.5 h-3.5 ${autoAdvance ? 'text-green-500 fill-green-500' : 'text-theme-muted'}`} />
                                      <span className={`text-[10px] font-bold ${autoAdvance ? 'text-green-500' : 'text-theme-muted'}`}>OTOMATİK</span>
                                  </div>
                                  <button
                                    onClick={() => setAutoAdvance(!autoAdvance)}
                                    className={`w-8 h-4 rounded-full transition-colors relative flex items-center ${autoAdvance ? 'bg-green-500' : 'bg-theme-border'}`}
                                  >
                                    <div className={`absolute w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200 ${autoAdvance ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                  </button>
                               </div>

                               {waitingForNext ? (
                                  <button 
                                    onClick={handleNextBulkStep}
                                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg flex items-center shadow-lg transition-all animate-pulse"
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Sonrakine Geç
                                    <ArrowRight className="w-3.5 h-3.5 ml-2" />
                                  </button>
                               ) : (
                                  <div className="px-4 py-2 text-xs font-medium text-neon-blue flex items-center bg-neon-blue/10 rounded-lg">
                                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                                    Analiz Ediliyor...
                                  </div>
                               )}
                               
                               <button 
                                 onClick={handleStopBulk}
                                 className="p-2 text-theme-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                 title="Durdur"
                               >
                                  <Square className="w-4 h-4 fill-current" />
                               </button>
                            </div>
                         </div>
                      ) : (
                          // STANDARD SEARCH UI
                          <>
                             <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-theme-muted" />
                                <input 
                                  type="text" 
                                  placeholder="Ürün veya teknik özellik ara..." 
                                  className="w-full pl-9 pr-8 py-2 bg-theme-input border border-theme-border rounded-lg text-sm focus:ring-1 focus:ring-neon-orange outline-none transition-all"
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-theme-muted hover:text-theme-text"><X className="w-4 h-4"/></button>}
                             </div>
                             
                             <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar items-center">
                                <select className="bg-theme-input border border-theme-border text-xs rounded px-2 py-1.5 outline-none" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                                   {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <button onClick={() => setShowCriticalOnly(!showCriticalOnly)} className={`px-3 py-1.5 rounded text-xs border font-medium ${showCriticalOnly ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-theme-input border-theme-border text-theme-secondary'}`}>Kritik</button>
                                
                                <button 
                                    onClick={() => setShowBulkConfig(true)} 
                                    className="ml-auto px-4 py-1.5 rounded-lg text-xs font-bold flex items-center shadow-sm bg-neon-blue text-white hover:bg-blue-600 transition-colors"
                                >
                                    <Globe className="w-3 h-3 mr-2"/>
                                    Toplu Tedarikçi Ara
                                </button>
                             </div>
                          </>
                      )}
                   </div>

                   {/* List */}
                   <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-3 bg-zinc-50/50 dark:bg-black/20">
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map(p => (
                           <div key={p.id} className={`transition-all duration-300 ${isBulkAnalyzing && currentAnalyzingId === p.id ? 'scale-[1.02] z-10' : ''} ${isBulkAnalyzing && p.id !== currentAnalyzingId && p.id !== bulkQueue[bulkIndex]?.id ? 'opacity-50 blur-[1px]' : ''}`}>
                             <ProductCard 
                               product={p} 
                               highlightTerm={searchTerm} 
                               isRegexMode={isRegexMode} 
                               onCompare={setComparingProduct} 
                               isAnalyzing={currentAnalyzingId === p.id}
                               onUpdate={handleProductUpdate}
                             />
                           </div>
                        ))
                      ) : (
                        <div className="text-center py-20 text-theme-muted">
                           <Filter className="w-10 h-10 mx-auto mb-3 opacity-20" />
                           <p>Sonuç bulunamadı.</p>
                        </div>
                      )}
                   </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ResultView;