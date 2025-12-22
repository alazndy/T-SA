import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle, Loader2, Sparkles, Save, ScanLine, FileUp, Layers, Repeat } from 'lucide-react';

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
  
  // Analysis Options State
  const [pageRange, setPageRange] = useState("");
  const [isIterative, setIsIterative] = useState(false);
  const [iterationCount, setIterationCount] = useState(3);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
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
    
    if (file.size > 20 * 1024 * 1024) {
      setError("Dosya boyutu çok yüksek (Max 20MB).");
      return;
    }
    
    // Pass options object
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-6">
      
      {/* Configuration Area */}
      {!isLoading && (
         <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Scope Input */}
             <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ScanLine className="h-4 w-4 text-theme-muted group-focus-within:text-neon-orange transition-colors" />
                </div>
                <input 
                  type="text" 
                  placeholder="Opsiyonel: Sayfa Aralığı (Örn: 1-10)" 
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-theme-surface border border-theme-border rounded-lg text-sm text-theme-text placeholder-theme-muted focus:outline-none focus:border-neon-orange focus:ring-1 focus:ring-neon-orange transition-all"
                />
             </div>

             {/* Iterative Toggle */}
             <div className={`flex items-center justify-between p-2 rounded-lg border transition-all ${isIterative ? 'bg-neon-blue/10 border-neon-blue' : 'bg-theme-surface border-theme-border'}`}>
                <div className="flex items-center gap-2 px-1 cursor-pointer" onClick={() => setIsIterative(!isIterative)}>
                   <Layers className={`w-4 h-4 ${isIterative ? 'text-neon-blue' : 'text-theme-muted'}`} />
                   <div className="flex flex-col">
                      <span className={`text-xs font-bold ${isIterative ? 'text-neon-blue' : 'text-theme-secondary'}`}>Hassas Analiz</span>
                      {isIterative && <span className="text-[9px] text-theme-muted hidden sm:inline">Çoklu doğrulama</span>}
                   </div>
                </div>
                
                {isIterative && (
                   <div className="flex items-center bg-theme-bg rounded border border-theme-border overflow-hidden">
                      <button onClick={() => setIterationCount(Math.max(2, iterationCount-1))} className="px-2 py-1 hover:bg-theme-input text-xs font-bold">-</button>
                      <span className="px-1 text-xs font-mono text-neon-blue">{iterationCount}x</span>
                      <button onClick={() => setIterationCount(Math.min(5, iterationCount+1))} className="px-2 py-1 hover:bg-theme-input text-xs font-bold">+</button>
                   </div>
                )}
             </div>
         </div>
      )}

      <div 
        className={`w-full relative group rounded-2xl border-2 border-dashed transition-all duration-300 ease-out p-10 text-center cursor-pointer overflow-hidden
          ${dragActive 
            ? "bg-theme-surface border-neon-orange" 
            : "bg-theme-card border-theme-border hover:border-theme-secondary/50 hover:bg-theme-surface"}
          ${isLoading ? "pointer-events-none opacity-80" : ""}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.sart,.json,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/json"
          onChange={handleChange}
          disabled={isLoading}
        />

        <div className="flex flex-col items-center justify-center relative z-10">
          {isLoading ? (
            <div className="py-8 flex flex-col items-center justify-center text-center w-full">
                <div className="relative mb-4">
                  <Loader2 className="w-12 h-12 text-neon-orange animate-spin" />
                  {isIterative && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                       <Repeat className="w-4 h-4 text-neon-blue animate-pulse" />
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-theme-text">Analiz Yapılıyor...</h3>
                <p className="text-sm text-theme-secondary mt-1 max-w-[250px]">
                   {progressMessage || "Belge işleniyor..."}
                </p>
                {isIterative && <span className="mt-2 px-2 py-1 bg-neon-blue/10 text-neon-blue text-[10px] rounded border border-neon-blue/20">Iteratif Mod Aktif</span>}
            </div>
          ) : (
            <>
                <div className={`p-4 rounded-full mb-4 transition-all duration-300 ${dragActive ? 'bg-neon-orange/10 text-neon-orange scale-110' : 'bg-theme-surface text-theme-muted group-hover:text-theme-text group-hover:bg-theme-input'}`}>
                  <FileUp className="w-8 h-8" />
                </div>
                
                <h3 className="text-lg font-bold text-theme-text mb-2">
                   Dosyayı sürükleyin veya seçin
                </h3>
                <p className="text-sm text-theme-secondary max-w-xs mx-auto mb-6">
                  Teknik Şartname (PDF, DOCX) veya daha önce kaydedilmiş proje dosyası (.SART)
                </p>

                <div className="flex items-center gap-3 text-xs font-medium text-theme-muted bg-theme-surface/50 p-2 rounded-lg border border-theme-border/50">
                   <span className="flex items-center"><FileText className="w-3 h-3 mr-1.5" /> PDF / DOCX</span>
                   <span className="w-px h-3 bg-theme-border"></span>
                   <span className="flex items-center"><Save className="w-3 h-3 mr-1.5" /> .SART Proje</span>
                </div>
            </>
          )}
        </div>
        
        {/* Decorative Gradient Blob */}
        {!isLoading && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-neon-blue/5 rounded-full blur-3xl -z-10 group-hover:bg-neon-blue/10 transition-colors"></div>}
      </div>

      {error && (
        <div className="w-full p-3 bg-red-500/5 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-600 animate-slide-up">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-xs font-medium">{error}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;