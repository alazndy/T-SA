import React, { useRef, useState } from 'react';
import { FileUp, ScanLine, Layers, Repeat, Loader2, Sparkles, FileText, Save, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PremiumButton } from './ui/PremiumButton';

interface AnalysisOptions {
  pageRange: string;
  isIterative: boolean;
  iterationCount: number;
}

interface FileUploadProps {
  onFileSelect: (file: File, options: AnalysisOptions) => void;
  isLoading: boolean;
  progressMessage?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading, progressMessage }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageRange, setPageRange] = useState("");
  const [isIterative, setIsIterative] = useState(false);
  const [iterationCount, setIterationCount] = useState(3);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const validateAndProcessFile = (file: File) => {
    setError(null);
    const fileName = file.name.toLowerCase();
    const isPdf = file.type === 'application/pdf' || fileName.endsWith('.pdf');
    const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx');
    const isSart = fileName.endsWith('.sart');
    const isJson = file.type === 'application/json' || fileName.endsWith('.json');

    if (!isPdf && !isDocx && !isSart && !isJson) {
      setError("Desteklenmeyen dosya formatı. Lütfen PDF, DOCX veya .SART dosyası yükleyin.");
      return;
    }
    
    if (file.size > 25 * 1024 * 1024) {
      setError("Dosya boyutu çok yüksek (Max 25MB).");
      return;
    }
    
    onFileSelect(file, {
      pageRange,
      isIterative,
      iterationCount: isIterative ? iterationCount : 1
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) validateAndProcessFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) validateAndProcessFile(e.target.files[0]);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-8">
      
      {/* Dynamic Header for Options */}
      <AnimatePresence>
          {!isLoading && (
             <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full"
             >
                 <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <ScanLine className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Sayfa Aralığı (Örn: 1-5)" 
                      value={pageRange}
                      onChange={(e) => setPageRange(e.target.value)}
                      className="block w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/5 rounded-2xl text-sm font-medium focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/50"
                    />
                 </div>

                 <div className={cn(
                    "flex items-center justify-between px-5 rounded-2xl border transition-all",
                    isIterative ? "bg-primary/5 border-primary/30" : "bg-white/5 border-white/5"
                 )}>
                    <div className="flex items-center gap-3 cursor-pointer py-3" onClick={() => setIsIterative(!isIterative)}>
                       <Layers className={cn("w-4 h-4 transition-colors", isIterative ? "text-primary" : "text-muted-foreground")} />
                       <div className="flex flex-col">
                          <span className={cn("text-xs font-black uppercase tracking-widest", isIterative ? "text-primary" : "text-muted-foreground")}>Hassas Analiz</span>
                       </div>
                    </div>
                    
                    {isIterative && (
                       <div className="flex items-center bg-black/40 rounded-xl border border-white/5 overflow-hidden">
                          <button onClick={() => setIterationCount(Math.max(2, iterationCount-1))} className="w-8 h-8 flex items-center justify-center hover:bg-white/5 text-xs font-bold transition-colors">-</button>
                          <span className="px-2 text-[10px] font-black text-primary border-x border-white/5">{iterationCount}x</span>
                          <button onClick={() => setIterationCount(Math.min(5, iterationCount+1))} className="w-8 h-8 flex items-center justify-center hover:bg-white/5 text-xs font-bold transition-colors">+</button>
                       </div>
                    )}
                 </div>
             </motion.div>
          )}
      </AnimatePresence>

      {/* Main Upload Area */}
      <motion.div 
        whileHover={!isLoading ? { scale: 1.01 } : {}}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isLoading && inputRef.current?.click()}
        className={cn(
          "w-full relative group rounded-[2.5rem] border-2 border-dashed transition-all duration-500 cursor-pointer overflow-hidden p-16",
          dragActive 
            ? "bg-primary/5 border-primary shadow-[0_0_40px_rgba(249,115,22,0.1)]" 
            : "bg-white/5 border-white/10 hover:border-primary/30 hover:bg-white/[0.07]",
          isLoading && "pointer-events-none border-primary/20 bg-primary/[0.02]"
        )}
      >
        <input ref={inputRef} type="file" className="hidden" onChange={handleChange} disabled={isLoading} />

        <div className="flex flex-col items-center justify-center relative z-10">
          <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div 
                    key="loading"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center py-6"
                >
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse"></div>
                      <Loader2 className="w-16 h-16 text-primary animate-spin relative" />
                      {isIterative && (
                         <Repeat className="absolute -bottom-2 -right-2 w-6 h-6 text-indigo-400 animate-pulse" />
                      )}
                    </div>
                    <h3 className="text-xl font-black text-foreground tracking-tight italic uppercase">Döküman İşleniyor</h3>
                    <p className="text-xs font-bold text-muted-foreground mt-2 uppercase tracking-widest animate-pulse">
                       {progressMessage || "AI analiz motoru devrede..."}
                    </p>
                </motion.div>
              ) : (
                <motion.div 
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center"
                >
                    <div className={cn(
                        "p-6 rounded-3xl mb-6 transition-all duration-500",
                        dragActive ? "bg-primary text-white scale-110 rotate-12 shadow-2xl shadow-primary/40" : "bg-white/5 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                    )}>
                        <FileUp className="w-10 h-10" />
                    </div>
                    
                    <h3 className="text-2xl font-black text-foreground mb-3 tracking-tight">
                       Dokümanı Buraya Bırakın
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium max-w-xs mx-auto mb-8">
                       PDF, DOCX veya .SART dosyalarınızı sürükleyebilirsiniz.
                    </p>

                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                       <span className="flex items-center"><FileText className="w-3.5 h-3.5 mr-2 text-primary/50" /> PDF / DOCX</span>
                       <div className="w-1 h-1 rounded-full bg-white/10"></div>
                       <span className="flex items-center"><Save className="w-3.5 h-3.5 mr-2 text-primary/50" /> SART PROJECT</span>
                    </div>
                </motion.div>
              )}
          </AnimatePresence>
        </div>
        
        {/* Glow Effects */}
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/10 transition-colors"></div>
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors"></div>
      </motion.div>

      {error && (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center gap-4 text-red-500"
        >
          <div className="p-2 bg-red-500/10 rounded-lg">
            <AlertCircle className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wide">{error}</span>
        </motion.div>
      )}
    </div>
  );
};

export default FileUpload;