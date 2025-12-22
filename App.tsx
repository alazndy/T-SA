import React, { useState, useEffect } from 'react';
import { AnalysisResult, AppState, Product } from './types';
import FileUpload from './components/FileUpload';
import ResultView from './components/ResultView';
import TutorialModal from './components/TutorialModal';
import { analyzeTechnicalPdf, performIterativeAnalysis } from './services/geminiService';
import { saveAnalysis, getAllAnalyses, deleteAnalysis, migrateFromLocalStorage } from './services/dbService';
import { FileText, Hexagon, ShieldCheck, Clock, Trash2, ChevronRight, FileJson, Cpu, Sun, Moon, Eye, Zap } from 'lucide-react';

type Theme = 'light' | 'dark' | 'contrast';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [savedAnalyses, setSavedAnalyses] = useState<AnalysisResult[]>([]);
  const [progressMsg, setProgressMsg] = useState<string>("");
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Theme State
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app_theme');
      return (saved === 'light' || saved === 'dark' || saved === 'contrast') ? saved : 'dark';
    }
    return 'dark';
  });

  // Apply Theme
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'contrast');
    root.classList.add(theme);
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  // Load History from IDB & Check Tutorial
  useEffect(() => {
    const initApp = async () => {
      try {
        await migrateFromLocalStorage();
        const analyses = await getAllAnalyses();
        setSavedAnalyses(analyses);

        // Check Tutorial Preference
        const tutorialSeen = localStorage.getItem('tsa_tutorial_seen');
        if (tutorialSeen !== 'true') {
           setShowTutorial(true);
        }
      } catch (e) {
        console.error("Başlangıç verileri yüklenemedi", e);
      }
    };
    initApp();
  }, []);

  const handleCloseTutorial = (dontShowAgain: boolean) => {
     setShowTutorial(false);
     if (dontShowAgain) {
        localStorage.setItem('tsa_tutorial_seen', 'true');
     }
  };

  const handleFileSelect = async (file: File, options: { pageRange?: string, isIterative?: boolean, iterationCount?: number }) => {
    setAppState(AppState.ANALYZING);
    setErrorMessage(null);
    setProgressMsg("Dosya hazırlanıyor...");

    const fileName = file.name.toLowerCase();

    // SART veya JSON PROJE YÜKLEME (RESTORE)
    if (fileName.endsWith('.sart') || fileName.endsWith('.json') || file.type === 'application/json') {
       const reader = new FileReader();
       reader.onload = (e) => {
         try {
           const content = e.target?.result as string;
           if (!content) throw new Error("Dosya boş.");
           
           const json = JSON.parse(content);
           
           if (!json || typeof json !== 'object') {
             throw new Error("Geçersiz JSON yapısı.");
           }

           if (!json.products || !Array.isArray(json.products)) {
             throw new Error("Dosya içeriğinde 'products' listesi bulunamadı. Hatalı veya eski bir format olabilir.");
           }

           setAnalysisResult(json);
           setPdfUrl(null); 
           setAppState(AppState.SUCCESS);
         } catch (err: any) {
           console.error("Parse Error:", err);
           setErrorMessage(`Proje dosyası okunamadı: ${err.message || "Bilinmeyen hata"}`);
           setAppState(AppState.ERROR);
         }
       };
       reader.onerror = () => {
         setErrorMessage("Dosya okuma hatası.");
         setAppState(AppState.ERROR);
       };
       reader.readAsText(file);
       return;
    }

    const objectUrl = URL.createObjectURL(file);
    if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
      setPdfUrl(objectUrl);
    } else {
      setPdfUrl(null);
    }

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = (reader.result as string).split(',')[1];
        try {
          // Determine Mime Type explicitly
          const mimeType = file.type || (fileName.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf');

          let resultData;
          
          if (options.isIterative && options.iterationCount && options.iterationCount > 1) {
             // ITERATIVE MODE
             resultData = await performIterativeAnalysis(
               base64String, 
               mimeType, 
               options.iterationCount, 
               options.pageRange,
               (msg) => setProgressMsg(msg)
             );
          } else {
             // STANDARD MODE
             setProgressMsg("Yapay zeka analiz ediyor...");
             resultData = await analyzeTechnicalPdf(
               base64String, 
               mimeType,
               options.pageRange
             );
          }

          const result: AnalysisResult = {
            id: Date.now().toString(),
            version: 1,
            fileName: file.name,
            timestamp: new Date().toISOString(),
            products: resultData.products,
            summary: resultData.summary,
            generalProvisions: resultData.generalProvisions
          };
          setAnalysisResult(result);
          setAppState(AppState.SUCCESS);
        } catch (apiError: any) {
          console.error(apiError);
          let msg = `Döküman analiz edilemedi: ${apiError.message || "API Hatası"}`;
          
          if (apiError.message && (apiError.message.includes('Rpc failed') || apiError.message.includes('xhr error'))) {
            msg = "Bağlantı Hatası: Dosya boyutu çok büyük olabilir veya internet bağlantınızda kesinti yaşandı. Lütfen daha küçük bir dosya ile veya sayfa aralığı seçerek tekrar deneyin.";
          }
          
          setErrorMessage(msg);
          setAppState(AppState.ERROR);
        }
      };
      reader.onerror = () => {
        setErrorMessage("Dosya okunurken hata oluştu.");
        setAppState(AppState.ERROR);
      };
      reader.readAsDataURL(file);
    } catch (e) {
      setErrorMessage("Beklenmedik bir hata oluştu.");
      setAppState(AppState.ERROR);
    }
  };

  const handleSaveToHistory = async () => {
    if (!analysisResult) return;
    
    // Refresh history
    const existingIndex = savedAnalyses.findIndex(a => a.fileName === analysisResult.fileName);
    let resultToSave = { ...analysisResult };

    if (existingIndex > -1) {
        const prevVersion = savedAnalyses[existingIndex].version || 1;
        resultToSave.version = prevVersion + 1;
        resultToSave.timestamp = new Date().toISOString();
        resultToSave.id = savedAnalyses[existingIndex].id; // Keep same ID for update
    } else {
        resultToSave.version = 1;
        // ensure ID exists
        if (!resultToSave.id) resultToSave.id = Date.now().toString();
    }

    await saveAnalysis(resultToSave);
    const updated = await getAllAnalyses();
    setSavedAnalyses(updated);
    
    alert(`Analiz (v${resultToSave.version}) başarıyla veritabanına kaydedildi.`);
  };

  const handleDeleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(window.confirm("Bu analizi silmek istediğinizden emin misiniz?")) {
        await deleteAnalysis(id);
        const updated = await getAllAnalyses();
        setSavedAnalyses(updated);
    }
  };

  const handleLoadHistoryItem = (item: AnalysisResult) => {
    setAnalysisResult(item);
    setPdfUrl(null);
    setAppState(AppState.SUCCESS);
  };

  const handleReset = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setAppState(AppState.IDLE);
    setAnalysisResult(null);
    setErrorMessage(null);
    setProgressMsg("");
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-theme-text overflow-x-hidden bg-theme-bg">
      
      {/* Background Pattern */}
      <div className="fixed inset-0 z-[-1] opacity-[0.03] pointer-events-none" style={{
         backgroundImage: 'linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px)',
         backgroundSize: '32px 32px'
      }}></div>

      {/* Tutorial Modal */}
      <TutorialModal isOpen={showTutorial} onClose={handleCloseTutorial} />

      {/* Floating Header */}
      <header className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
        <div className="glass-panel rounded-full px-6 h-14 flex items-center justify-between w-full max-w-5xl shadow-lg border border-theme-border/50">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={handleReset}>
            <div className="bg-gradient-to-br from-neon-orange to-red-500 p-1.5 rounded-lg shadow-lg shadow-neon-orange/20">
              <Hexagon className="w-5 h-5 text-white fill-white/20" />
            </div>
            <h1 className="text-lg font-bold text-theme-text tracking-tight flex items-center">
              T-SA
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Theme Switcher */}
             <div className="flex items-center bg-theme-surface/50 rounded-full p-1 border border-theme-border/50">
               <button onClick={() => setTheme('light')} className={`p-1.5 rounded-full transition-all ${theme === 'light' ? 'bg-white text-black shadow-sm' : 'text-theme-muted hover:text-theme-text'}`}><Sun className="w-3.5 h-3.5" /></button>
               <button onClick={() => setTheme('dark')} className={`p-1.5 rounded-full transition-all ${theme === 'dark' ? 'bg-zinc-800 text-white shadow-sm' : 'text-theme-muted hover:text-theme-text'}`}><Moon className="w-3.5 h-3.5" /></button>
               <button onClick={() => setTheme('contrast')} className={`p-1.5 rounded-full transition-all ${theme === 'contrast' ? 'bg-black text-yellow-400' : 'text-theme-muted hover:text-theme-text'}`}><Eye className="w-3.5 h-3.5" /></button>
             </div>

             <div className="hidden md:flex items-center text-[10px] font-medium text-neon-blue bg-neon-blue/5 px-3 py-1 rounded-full border border-neon-blue/10">
               <ShieldCheck className="w-3 h-3 mr-1.5" />
               SECURE
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col pt-24 pb-10">
        <div className={`w-full mx-auto px-4 sm:px-6 transition-all duration-500 ${appState === AppState.SUCCESS ? 'max-w-[1920px] lg:h-[calc(100vh-120px)] h-auto' : 'max-w-4xl'}`}>
          
          {appState === AppState.IDLE && (
            <div className="flex flex-col items-center justify-center space-y-12 animate-slide-up mt-8">
              <div className="text-center max-w-2xl relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-theme-surface border border-theme-border text-[11px] font-mono text-theme-secondary mb-6 shadow-sm">
                  <Zap className="w-3 h-3 text-neon-orange" />
                  <span>T-SA v2.0 • Made by G.T</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-bold text-theme-text tracking-tight mb-6 text-balance">
                   Turhan Şartname Analizi <br/>
                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-orange to-red-500">Anında Analiz Edin</span>
                </h2>
                <p className="text-lg text-theme-secondary leading-relaxed font-light">
                  Karmaşık PDF ve DOCX dosyalarını saniyeler içinde yapılandırılmış verilere, ürün listelerine ve uyumluluk tablolarına dönüştürün.
                </p>
              </div>

              <div className="w-full relative z-10">
                <FileUpload onFileSelect={handleFileSelect} isLoading={false} />
              </div>

              {/* Saved Analyses Section */}
              {savedAnalyses.length > 0 && (
                <div className="w-full max-w-2xl animate-slide-up delay-100 mt-8">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-xs font-bold text-theme-muted uppercase tracking-widest flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-2" />
                      Son Çalışmalar
                    </h3>
                  </div>
                  <div className="grid gap-3">
                    {savedAnalyses.slice(0, 3).map((item) => (
                      <div 
                        key={item.id || item.timestamp} 
                        onClick={() => handleLoadHistoryItem(item)}
                        className="group bg-theme-card hover:bg-theme-surface border border-theme-border hover:border-neon-orange/30 rounded-lg p-3 flex items-center justify-between cursor-pointer transition-all shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-md bg-theme-surface border border-theme-border flex items-center justify-center text-neon-blue group-hover:text-neon-orange transition-colors">
                             <FileJson className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-theme-text">{item.fileName}</h4>
                                <span className="text-[10px] bg-theme-surface border border-theme-border px-1.5 rounded text-theme-muted">v{item.version || 1}</span>
                            </div>
                            <p className="text-xs text-theme-muted mt-0.5">
                              {new Date(item.timestamp).toLocaleDateString()} • {item.products.length} Kalem
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <button 
                             onClick={(e) => item.id && handleDeleteHistoryItem(item.id, e)}
                             className="p-2 text-theme-muted hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                           <ChevronRight className="w-4 h-4 text-theme-muted group-hover:text-theme-text" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl pt-16 border-t border-theme-border/50">
                 {[
                   { icon: FileText, title: "Akıllı Ayrıştırma", desc: "Tabloları ve listeleri otomatik tanır." },
                   { icon: Cpu, title: "Semantik Analiz", desc: "Teknik terimleri ve birimleri anlar." },
                   { icon: ShieldCheck, title: "Uyumluluk", desc: "Standartlara göre denetim yapar." }
                 ].map((feat, idx) => (
                   <div key={idx} className="flex flex-col items-center text-center group">
                      <div className="w-10 h-10 bg-theme-surface rounded-lg flex items-center justify-center mb-3 border border-theme-border shadow-sm group-hover:border-neon-orange/30 group-hover:text-neon-orange transition-colors">
                        <feat.icon className="w-5 h-5 text-theme-secondary group-hover:text-neon-orange" />
                      </div>
                      <h3 className="font-semibold text-theme-text text-sm">{feat.title}</h3>
                      <p className="text-xs text-theme-muted mt-1.5 max-w-[200px]">{feat.desc}</p>
                   </div>
                 ))}
              </div>
            </div>
          )}

          {appState === AppState.ANALYZING && (
             <div className="flex flex-col items-center justify-center py-32 animate-fade-in mt-10">
               <FileUpload onFileSelect={() => {}} isLoading={true} progressMessage={progressMsg} />
             </div>
          )}

          {appState === AppState.ERROR && (
             <div className="flex flex-col items-center justify-center py-20 animate-fade-in mt-10">
                <div className="glass-panel border border-red-500/20 rounded-2xl p-8 max-w-md text-center shadow-xl">
                   <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-5 text-red-500">
                      <ShieldCheck className="w-8 h-8" /> 
                   </div>
                   <h3 className="text-lg font-bold text-theme-text mb-2">İşlem Başarısız</h3>
                   <p className="text-theme-secondary text-sm mb-6 leading-relaxed">{errorMessage || "Bilinmeyen bir hata oluştu."}</p>
                   <button 
                     onClick={handleReset}
                     className="px-6 py-2.5 bg-theme-text text-theme-bg text-sm font-bold rounded-lg hover:opacity-90 transition-colors shadow-lg"
                   >
                     Tekrar Dene
                   </button>
                </div>
             </div>
          )}

          {appState === AppState.SUCCESS && analysisResult && (
            <ResultView 
              result={analysisResult} 
              onReset={handleReset} 
              onSave={handleSaveToHistory}
              pdfUrl={pdfUrl} 
            />
          )}

        </div>
      </main>
    </div>
  );
};

export default App;