import React, { useState, useEffect } from 'react';
import { AnalysisResult, AppState } from './types';
import FileUpload from './components/FileUpload';
import ResultView from './components/ResultView';
import TutorialModal from './components/TutorialModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { analyzeTechnicalPdf, performIterativeAnalysis } from './services/geminiService';
import { saveAnalysis, getAllAnalyses, deleteAnalysis, migrateFromLocalStorage } from './services/dbService';
import { 
  FileText, Hexagon, ShieldCheck, Clock, Trash2, 
  ChevronRight, FileJson, Cpu, Sun, Moon, Eye, Zap,
  LayoutGrid, History, Settings, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PremiumButton } from './components/ui/PremiumButton';
import { cn } from './lib/utils';

type Theme = 'light' | 'dark' | 'contrast';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [savedAnalyses, setSavedAnalyses] = useState<AnalysisResult[]>([]);
  const [progressMsg, setProgressMsg] = useState<string>("");
  const [showTutorial, setShowTutorial] = useState(false);
  const [integrationContext, setIntegrationContext] = useState<{ projectId: string; source: string } | null>(null);
  
  // Welcome screen state
  const [showWelcome, setShowWelcome] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tsa_welcome_dismissed') !== 'true';
    }
    return true;
  });

  const handleCloseWelcome = () => {
    localStorage.setItem('tsa_welcome_dismissed', 'true');
    setShowWelcome(false);
  };
  
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app_theme');
      return (saved === 'light' || saved === 'dark' || saved === 'contrast') ? saved : 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'contrast');
    root.classList.add(theme);
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  useEffect(() => {
    const initApp = async () => {
      try {
        await migrateFromLocalStorage();
        const analyses = await getAllAnalyses();
        setSavedAnalyses(analyses);
        const tutorialSeen = localStorage.getItem('tsa_tutorial_seen');
        if (tutorialSeen !== 'true') setShowTutorial(true);

        // UPH Integration Check
        const params = new URLSearchParams(window.location.search);
        const integrate = params.get('integrate');
        const fileUrl = params.get('fileUrl');
        const fileName = params.get('fileName');
        const projectId = params.get('projectId');

        if (integrate === 'tsa' && fileUrl && projectId) {
          setIntegrationContext({ projectId, source: 'uph' });
          setAppState(AppState.ANALYZING);
          setProgressMsg("Entegrasyon verileri yükleniyor...");
          
          try {
            const response = await fetch(fileUrl);
            const blob = await response.blob();
            const file = new File([blob], fileName || 'integrated_file.pdf', { type: blob.type });
            
            // Auto-trigger analysis
            setTimeout(() => {
                handleFileSelect(file, { isIterative: false });
            }, 500);
          } catch (fetchErr) {
            console.error("Entegrasyon dosyası yüklenemedi", fetchErr);
            setErrorMessage("Entegrasyon dosyası yüklenemedi.");
            setAppState(AppState.ERROR);
          }
        }
      } catch (e) {
        console.error("Başlangıç verileri yüklenemedi", e);
      }
    };
    initApp();
  }, []);

  const handleCloseTutorial = (dontShowAgain: boolean) => {
     setShowTutorial(false);
     if (dontShowAgain) localStorage.setItem('tsa_tutorial_seen', 'true');
  };

  const handleFileSelect = async (file: File, options: { pageRange?: string, isIterative?: boolean, iterationCount?: number }) => {
    setAppState(AppState.ANALYZING);
    setErrorMessage(null);
    setProgressMsg("Dosya hazırlanıyor...");

    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.sart') || fileName.endsWith('.json') || file.type === 'application/json') {
       const reader = new FileReader();
       reader.onload = (e) => {
         try {
           const content = e.target?.result as string;
           const json = JSON.parse(content);
           if (!json.products || !Array.isArray(json.products)) throw new Error("Gecersiz format");
           setAnalysisResult(json);
           setPdfUrl(null); 
           setAppState(AppState.SUCCESS);
         } catch (err: any) {
           setErrorMessage(`Proje dosyası okunamadı`);
           setAppState(AppState.ERROR);
         }
       };
       reader.readAsText(file);
       return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPdfUrl(file.type === 'application/pdf' ? objectUrl : null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const mimeType = file.type || 'application/pdf';

        try {
          let resultData;
          if (options.isIterative && options.iterationCount && options.iterationCount > 1) {
             resultData = await performIterativeAnalysis(base64String, mimeType, options.iterationCount, options.pageRange, (msg) => setProgressMsg(msg));
          } else {
             setProgressMsg("Yapay zeka analiz ediyor...");
             resultData = await analyzeTechnicalPdf(base64String, mimeType, options.pageRange);
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
          setErrorMessage(`Döküman analiz edilemedi: ${apiError.message}`);
          setAppState(AppState.ERROR);
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      setAppState(AppState.ERROR);
    }
  };

  const handleSaveToHistory = async () => {
    if (!analysisResult) return;
    const existingIndex = savedAnalyses.findIndex(a => a.fileName === analysisResult.fileName);
    let resultToSave = { ...analysisResult };
    if (existingIndex > -1) {
        resultToSave.version = (savedAnalyses[existingIndex].version || 1) + 1;
        resultToSave.id = savedAnalyses[existingIndex].id;
    } else {
        resultToSave.version = 1;
        if (!resultToSave.id) resultToSave.id = Date.now().toString();
    }
    await saveAnalysis(resultToSave);
    const updated = await getAllAnalyses();
    setSavedAnalyses(updated);
  };

  const handleDeleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(window.confirm("Bu analizi silmek istediğinizden emin misiniz?")) {
        await deleteAnalysis(id);
        const updated = await getAllAnalyses();
        setSavedAnalyses(updated);
    }
  };

  const handleReset = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setAppState(AppState.IDLE);
    setAnalysisResult(null);
    setErrorMessage(null);
  };

  const handleSaveToUPH = () => {
    if (!analysisResult || !integrationContext) return;
    
    // Simulate sending back to UPH
    // In a real app, we would upload the report to storage and send the URL
    // Here we use postMessage if window.opener exists, or redirect with a mock result
    const data = {
      type: 'tsa_result',
      projectId: integrationContext.projectId,
      result: analysisResult,
      timestamp: new Date().toISOString()
    };

    if (window.opener) {
      window.opener.postMessage(data, '*');
      alert("Analiz raporu UPH'a başarıyla gönderildi!");
    } else {
      // Fallback: Deep link back to UPH if possible (mocked)
      const uphUrl = `http://localhost:3001/projects/${integrationContext.projectId}?integrated_result=tsa&data=${encodeURIComponent(JSON.stringify(analysisResult))}`;
      window.location.href = uphUrl;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-foreground bg-background selection:bg-primary/30 selection:text-white">
      
      {showWelcome && (
        <WelcomeScreen 
          onNewChat={handleCloseWelcome}
          onAnalyzeDocument={handleCloseWelcome}
          onSettings={handleCloseWelcome}
          onClose={handleCloseWelcome}
        />
      )}
      
      <TutorialModal isOpen={showTutorial} onClose={handleCloseTutorial} />

      {/* Premium Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4">
        <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-panel rounded-2xl px-6 h-16 flex items-center justify-between w-full max-w-6xl shadow-2xl border-white/5"
        >
          <div className="flex items-center space-x-4 cursor-pointer group" onClick={handleReset}>
            <div className="bg-gradient-to-br from-primary to-red-600 p-2 rounded-xl shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <Hexagon className="w-5 h-5 text-white fill-white/10" />
            </div>
            <div>
                <h1 className="text-xl font-extrabold tracking-tighter flex items-center bg-gradient-to-r from-primary to-red-500 bg-clip-text text-transparent">
                T-SA
                </h1>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Smart Assistant</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="hidden md:flex items-center gap-1.5 text-[10px] font-black text-primary bg-primary/5 px-3 py-1.5 rounded-full border border-primary/20">
               <ShieldCheck className="w-3.5 h-3.5" />
               SECURE ECOSYSTEM
             </div>

             <div className="flex items-center gap-2 border-l border-white/10 pl-6">
                <PremiumButton variant="glass" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </PremiumButton>
             </div>
          </div>
        </motion.div>
      </nav>

      {/* Main Container */}
      <main className="flex-grow flex flex-col pt-32 pb-12">
        <div className={cn(
            "w-full mx-auto px-4 transition-all duration-700",
            appState === AppState.SUCCESS ? "max-w-[1920px]" : "max-w-5xl"
        )}>
          
          <AnimatePresence mode="wait">
            {appState === AppState.IDLE && (
                <motion.div 
                    key="idle"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex flex-col items-center space-y-12"
                >
                    <div className="text-center max-w-3xl">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-black text-primary mb-8 shadow-sm"
                        >
                            <Zap className="w-3.5 h-3.5 fill-primary/20" />
                            <span className="tracking-widest uppercase">T-Ecosystem Technical Intelligence</span>
                        </motion.div>
                        
                        <h2 className="text-5xl md:text-7xl font-black text-foreground tracking-tight mb-8 leading-[0.9]">
                            Teknik Dokümanları <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-red-500 italic">Akıllı Ayrıştırın</span>
                        </h2>
                        <p className="text-lg text-muted-foreground leading-relaxed font-medium max-w-2xl mx-auto">
                            Karmaşık şartname dosyalarını saniyeler içinde yapılandırılmış verilere dönüştürün. Ürün listeleri, uyumluluk tabloları ve teknik özetler artık parmaklarınızın ucunda.
                        </p>
                    </div>

                    <div className="w-full max-w-2xl">
                        <FileUpload onFileSelect={handleFileSelect} isLoading={false} />
                    </div>

                    {/* Quick Access/History Grid */}
                    {savedAnalyses.length > 0 && (
                        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                             {savedAnalyses.slice(0, 3).map((item, idx) => (
                                <motion.div 
                                    key={item.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * idx }}
                                    onClick={() => setAnalysisResult(item) || setAppState(AppState.SUCCESS)}
                                    className="glass-card p-5 cursor-pointer group hover:border-primary/50 relative overflow-hidden"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="bg-primary/5 p-2.5 rounded-xl border border-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
                                            <FileJson className="w-5 h-5" />
                                        </div>
                                        <button 
                                            onClick={(e) => handleDeleteHistoryItem(item.id!, e)}
                                            className="p-2 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <h4 className="font-bold text-foreground truncate mb-1 pr-8">{item.fileName}</h4>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                        {new Date(item.timestamp).toLocaleDateString()} • {item.products.length} KALEM
                                    </p>
                                    <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                                        <ChevronRight className="w-5 h-5 text-primary" />
                                    </div>
                                </motion.div>
                             ))}
                        </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl pt-16 border-t border-white/5">
                        {[
                            { icon: FileText, label: "PDF & DOCX Analizi" },
                            { icon: Cpu, label: "AI Güdümlü OCR" },
                            { icon: ShieldCheck, label: "Standart Denetimi" },
                            { icon: LayoutGrid, label: "Excel Dışa Aktar" }
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center gap-3 group">
                                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 group-hover:border-primary/30 group-hover:bg-primary/5 transition-all">
                                    <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {appState === AppState.ANALYZING && (
                <motion.div 
                    key="analyzing"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="flex flex-col items-center justify-center py-20"
                >
                    <FileUpload onFileSelect={() => {}} isLoading={true} progressMessage={progressMsg} />
                </motion.div>
            )}

            {appState === AppState.SUCCESS && analysisResult && (
                <motion.div 
                    key="success"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full"
                >
                    <ResultView 
                      result={analysisResult} 
                      onReset={handleReset} 
                      onSave={handleSaveToHistory}
                      pdfUrl={pdfUrl} 
                      onSaveToUPH={handleSaveToUPH}
                    />
                </motion.div>
            )}

            {appState === AppState.ERROR && (
                <motion.div 
                    key="error"
                    initial={{ opacity: 0, rotateX: -20 }}
                    animate={{ opacity: 1, rotateX: 0 }}
                    className="flex flex-col items-center justify-center py-20"
                >
                    <div className="glass-panel border-red-500/20 rounded-3xl p-10 max-w-md text-center shadow-2xl">
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 border border-red-500/20 shadow-inner">
                            <ShieldCheck className="w-10 h-10" /> 
                        </div>
                        <h3 className="text-2xl font-black text-foreground mb-4">Bir Hata Oluştu</h3>
                        <p className="text-muted-foreground text-sm mb-8 leading-relaxed font-medium">{errorMessage || "Beklenmedik bir hata ile karşılaşıldı."}</p>
                        <PremiumButton variant="primary" className="w-full" onClick={handleReset}>
                            Yeniden Başlat
                        </PremiumButton>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>

      {/* Footer Branding */}
      <footer className="mt-auto py-8 px-4 flex justify-center">
         <div className="flex items-center gap-2 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-default">
            <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground">POWERED BY</span>
            <div className="flex items-center gap-1 font-black text-foreground">
                <span className="text-primary">T</span>-ECOSYSTEM
            </div>
         </div>
      </footer>
    </div>
  );
};

export default App;