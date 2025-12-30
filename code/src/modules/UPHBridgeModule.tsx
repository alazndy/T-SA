
import React, { useState } from 'react';
import { AnalysisResult, Requirement } from '../types';
import { Briefcase, CheckCircle2, ArrowRight, Share2, Copy, FileJson, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
// PremiumButton might not exist or be imported correctly if I don't check, but it was used in App.tsx earlier so I assume it exists or I can use standard buttons. 
// Standard button usage is safer if I'm not 100% sure, but I saw PremiumButton in App.tsx replacement content in Step 1436.
// Wait, in Step 1436 replacement content for App.tsx showed: 
// - import { PremiumButton } from './components/ui/PremiumButton'; -> This line was REMOVED in the diff?
// Let's re-read the diff in Step 1436.
// Ah, the diff shows: 
// - import { PremiumButton } from './components/ui/PremiumButton';
// + import { Shell } from './components/Shell';
// It seems PremiumButton was removed from imports? Or maybe it was just shifted.
// Actually, looking at the code in Step 1436 replacement content:
// <PremiumButton variant="glass" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
// It IS used in the App.tsx replacement content (lines 249, 396).
// BUT, the import might have been lost or I should verify if it exists.
// To be safe and avoid errors, I will use standard HTML buttons with tailwind classes which usually works without dependencies.
// Or I can add a verified reusable button component if needed.
// I'll stick to standard tailwind classes for now to reduce dependency risk in this new module.

interface UPHBridgeProps {
  analysisResults: AnalysisResult[];
}

export function UPHBridgeModule({ analysisResults }: UPHBridgeProps) {
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>("");
  const [selectedReqs, setSelectedReqs] = useState<Set<string>>(new Set());
  const [projectId, setProjectId] = useState("PROJ-2024-001");
  const [isExporting, setIsExporting] = useState(false);
  
  const selectedAnalysis = analysisResults.find(a => a.id === selectedAnalysisId);

  const handleToggleReq = (reqId: string) => {
    const next = new Set(selectedReqs);
    if (next.has(reqId)) next.delete(reqId);
    else next.add(reqId);
    setSelectedReqs(next);
  };

  const handleSelectAll = () => {
     if (!selectedAnalysis?.requirements) return;
     if (selectedReqs.size === selectedAnalysis.requirements.length) {
         setSelectedReqs(new Set());
     } else {
         const all = new Set(selectedAnalysis.requirements.map(r => r.reqId));
         setSelectedReqs(all);
     }
  };

  const handleExport = async (method: 'clipboard' | 'json') => {
      if (!selectedAnalysis) return;
      
      setIsExporting(true);
      
      // Filter Requirements
      const reqsToExport = (selectedAnalysis.requirements || []).filter(r => selectedReqs.has(r.reqId));
      
      // Map to UPH Task Format (Mock)
      const uphTasks = reqsToExport.map(req => ({
          type: 'task',
          title: `[${req.category}] ${req.reqId}`,
          description: `${req.description}\n\nRef: ${req.sourceReference}`,
          status: 'todo',
          priority: req.criticality === 'Mandatory' ? 'high' : req.criticality === 'Desirable' ? 'medium' : 'low',
          tags: ['Sartname', req.category]
      }));

      const payload = {
          source: 'T-SA',
          projectId: projectId,
          timestamp: new Date().toISOString(),
          tasks: uphTasks
      };

      await new Promise(r => setTimeout(r, 800)); // Simulate processing

      if (method === 'clipboard') {
          await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
          alert("UPH Görev formatı panoya kopyalandı! UPH'da 'İçe Aktar' diyerek yapıştırabilirsiniz.");
      } else {
          const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `UPH-Export-${selectedAnalysis.fileName}.json`;
          a.click();
      }
      
      setIsExporting(false);
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 p-6 animate-in fade-in">
        
        {/* LEFT: Selection Panel */}
        <div className="w-full md:w-1/3 flex flex-col gap-6">
            <div className="glass-panel p-6 rounded-xl space-y-4">
                <div className="flex items-center gap-3 text-primary mb-2">
                    <Briefcase className="w-6 h-6" />
                    <h2 className="text-xl font-bold tracking-tight">UPH Bridge</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                    Analiz edilen gereksinimleri <strong>Universal Project Hub</strong> (UPH) görevlerine dönüştürün.
                </p>
                
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Analiz Kaynağı</label>
                    <select 
                        className="w-full bg-secondary/50 border border-border rounded-lg p-2.5 text-sm"
                        value={selectedAnalysisId}
                        onChange={(e) => {
                            setSelectedAnalysisId(e.target.value);
                            setSelectedReqs(new Set());
                        }}
                    >
                        <option value="">Analiz Seçiniz...</option>
                        {analysisResults.map(r => (
                            <option key={r.id} value={r.id}>{r.fileName} ({new Date(r.timestamp).toLocaleDateString()})</option>
                        ))}
                    </select>
                </div>

                {selectedAnalysis && (
                   <div className="space-y-2 pt-4 border-t border-border">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Hedef Proje ID</label>
                        <input 
                            type="text" 
                            className="w-full bg-secondary/50 border border-border rounded-lg p-2.5 text-sm font-mono"
                            value={projectId}
                            onChange={(e) => setProjectId(e.target.value)}
                        />
                   </div>
                )}
            </div>

            {selectedAnalysis && (
                 <div className="glass-panel p-6 rounded-xl space-y-4 flex-1">
                     <h3 className="font-bold text-lg">Dışa Aktarma</h3>
                     <div className="grid grid-cols-1 gap-3">
                         <button 
                            onClick={() => handleExport('clipboard')}
                            disabled={selectedReqs.size === 0 || isExporting}
                            className="flex items-center justify-center gap-2 p-3 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-all disabled:opacity-50"
                         >
                            {isExporting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Copy className="w-4 h-4" />}
                            <span className="font-bold text-sm">Panoya Kopyala</span>
                         </button>
                         <button 
                            onClick={() => handleExport('json')}
                            disabled={selectedReqs.size === 0 || isExporting}
                            className="flex items-center justify-center gap-2 p-3 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-all disabled:opacity-50"
                         >
                            <FileJson className="w-4 h-4" />
                            <span className="font-bold text-sm">JSON İndir</span>
                         </button>
                     </div>
                     <p className="text-xs text-center text-muted-foreground mt-4">
                        {selectedReqs.size} adet gereksinim seçildi.
                     </p>
                 </div>
            )}
        </div>

        {/* RIGHT: Requirement Selection List */}
        <div className="w-full md:w-2/3 glass-panel rounded-xl overflow-hidden flex flex-col">
             {selectedAnalysis ? (
                 <>
                    <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between">
                        <h4 className="font-bold text-sm">Gereksinim Listesi</h4>
                        <button 
                           onClick={handleSelectAll}
                           className="text-xs font-bold text-primary hover:underline"
                        >
                           {selectedReqs.size === (selectedAnalysis.requirements?.length || 0) ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                        {selectedAnalysis.requirements && selectedAnalysis.requirements.length > 0 ? (
                             <div className="divide-y divide-border/50">
                                 {selectedAnalysis.requirements.map(req => {
                                     const isSelected = selectedReqs.has(req.reqId);
                                     return (
                                         <div 
                                            key={req.reqId} 
                                            onClick={() => handleToggleReq(req.reqId)}
                                            className={cn(
                                                "p-4 flex items-start gap-3 cursor-pointer transition-colors hover:bg-secondary/40",
                                                isSelected && "bg-primary/5"
                                            )}
                                         >
                                             <div className={cn(
                                                 "w-5 h-5 rounded border flex items-center justify-center mt-0.5 flex-shrink-0 transition-all",
                                                 isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"
                                             )}>
                                                 {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                             </div>
                                             <div className="flex-1 space-y-1">
                                                 <div className="flex items-center justify-between">
                                                     <div className="flex items-center gap-2">
                                                         <span className="font-mono text-xs font-bold text-muted-foreground">{req.reqId}</span>
                                                         <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{req.category}</span>
                                                     </div>
                                                     <span className={cn(
                                                         "text-[10px] uppercase font-bold",
                                                         req.criticality === 'Mandatory' ? "text-red-500" : "text-muted-foreground"
                                                     )}>{req.criticality}</span>
                                                 </div>
                                                 <p className="text-sm leading-relaxed text-foreground">{req.description}</p>
                                                 <p className="text-xs text-muted-foreground">Ref: {req.sourceReference}</p>
                                             </div>
                                         </div>
                                     );
                                 })}
                             </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                <p>Bu analizde gereksinim bulunamadı.</p>
                            </div>
                        )}
                    </div>
                 </>
             ) : (
                 <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                     <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                         <Briefcase className="w-8 h-8 opacity-20" />
                     </div>
                     <p>Lütfen soldan bir analiz seçiniz.</p>
                 </div>
             )}
        </div>
    </div>
  );
}
