import React, { useState, useRef } from 'react';
import { Product } from '../types';
import { UploadCloud, FileText, CheckCircle, Trash2, Play, Activity, AlertCircle } from 'lucide-react';
import { compareWithDatasheetsStream } from '../services/geminiService';

interface DatasheetComparisonPanelProps {
  product: Product;
  onClose?: () => void;
  isInline?: boolean;
}

interface UploadedFile {
  file: File;
  base64: string;
}

const DatasheetComparisonPanel: React.FC<DatasheetComparisonPanelProps> = ({ product, onClose, isInline }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resultContent, setResultContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files) {
      Array.from(e.target.files).forEach((file: File) => {
        // Validation: Check type
        const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
        const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx');
        
        if (!isPdf && !isDocx) {
          setError(`"${file.name}" desteklenmeyen bir format. Sadece PDF ve DOCX yükleyebilirsiniz.`);
          return;
        }

        // Validation: Check size
        if (file.size > 10 * 1024 * 1024) {
          setError(`"${file.name}" çok büyük (>10MB). Lütfen daha küçük bir dosya yükleyin.`);
          return;
        }

        const reader = new FileReader();
        reader.onload = (readEvent) => {
          const base64 = (readEvent.target?.result as string).split(',')[1];
          setFiles(prev => [...prev, { file, base64 }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setError(null);
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    setIsLoading(true);
    setError(null);
    setResultContent(""); // Start fresh

    try {
      const payload = files.map(f => ({ 
        name: f.file.name, 
        base64: f.base64,
        mimeType: f.file.type || (f.file.name.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf')
      }));
      
      const stream = compareWithDatasheetsStream(product, payload);
      
      for await (const chunk of stream) {
        setResultContent(prev => (prev || "") + chunk);
      }
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Analiz sırasında bir hata oluştu. Dosya içerikleri okunamadı.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`h-full flex flex-col ${isInline ? '' : 'p-6 bg-theme-bg'}`}>
      
      <div className="flex-grow overflow-y-auto custom-scrollbar p-6">
        
        {!resultContent && !isLoading && (
          <div className="space-y-8 animate-slide-up">
            {/* Upload Area */}
            <div 
              className="border-2 border-dashed border-theme-border rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-neon-purple/50 hover:bg-neon-purple/5 transition-all group"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                multiple 
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange}
              />
              <div className="w-12 h-12 bg-theme-surface rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6 text-neon-purple" />
              </div>
              <h4 className="text-md font-bold text-theme-text mb-1">Datasheet Dosyalarını Yükleyin</h4>
              <p className="text-theme-secondary text-xs text-center">PDF veya DOCX formatında teknik dokümanları buraya sürükleyin.</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-3 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-theme-muted uppercase tracking-wider">Yüklenecek Dosyalar</p>
                {files.map((f, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-theme-surface rounded-lg border border-theme-border animate-slide-up">
                    <div className="flex items-center overflow-hidden">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-xs text-theme-text truncate font-mono max-w-[150px]">{f.file.name}</span>
                      {f.file.name.endsWith('.docx') && (
                          <span className="ml-2 text-[9px] bg-blue-500/10 text-blue-500 px-1 py-0.5 rounded border border-blue-500/20">DOCX</span>
                      )}
                    </div>
                    <button 
                      onClick={() => removeFile(idx)}
                      className="p-1.5 text-theme-muted hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Action Button */}
            {files.length > 0 && (
              <button 
                onClick={handleAnalyze}
                className="w-full flex items-center justify-center px-6 py-3 bg-neon-purple text-white font-bold rounded-xl hover:bg-purple-600 hover:scale-[1.02] transition-all shadow-lg text-sm"
              >
                <Play className="w-4 h-4 mr-2 fill-current" />
                Kıyaslamayı Başlat ({files.length} Dosya)
              </button>
            )}
          </div>
        )}

        {/* Loading / Streaming State */}
        {(isLoading || resultContent) && (
          <div className="animate-fade-in">
             {isLoading && !resultContent && (
               <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="relative">
                    <div className="w-12 h-12 border-t-2 border-neon-purple rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-theme-text" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-theme-text animate-pulse">Analiz Başlıyor...</p>
               </div>
             )}
             
             {resultContent && (
               <div className="compliance-report-container font-light">
                  <style>{`
                    .compliance-report-container h3 {
                      font-size: 1.25rem;
                      font-weight: 700;
                      color: var(--text-primary);
                      margin-top: 2rem;
                      margin-bottom: 0.5rem;
                      padding-bottom: 0.5rem;
                      border-bottom: 1px solid var(--border-color);
                      display: flex;
                      align-items: center;
                    }
                    .compliance-report-container h3::before {
                      content: '';
                      display: inline-block;
                      width: 4px;
                      height: 18px;
                      background: var(--color-accent);
                      margin-right: 8px;
                      border-radius: 2px;
                    }
                    .compliance-report-container h2 {
                      font-size: 1.4rem;
                      color: var(--color-secondary);
                      margin-top: 2rem;
                      border: 1px solid var(--border-color);
                      padding: 1rem;
                      border-radius: 0.5rem;
                      background: var(--bg-input);
                    }
                    .compliance-report-container table {
                      width: 100%;
                      border-collapse: separate;
                      border-spacing: 0;
                      font-size: 0.75rem;
                      margin-bottom: 2rem;
                      border: 1px solid var(--border-color);
                      border-radius: 0.5rem;
                      overflow: hidden;
                      background: var(--bg-surface);
                    }
                    .compliance-report-container th {
                      background-color: var(--bg-input);
                      text-align: left;
                      padding: 0.75rem 1rem;
                      font-weight: 700;
                      color: var(--color-accent);
                      border-bottom: 1px solid var(--border-color);
                    }
                    .compliance-report-container td {
                      padding: 0.75rem 1rem;
                      border-bottom: 1px solid var(--border-color);
                      color: var(--text-primary);
                      vertical-align: top;
                    }
                  `}</style>
                  <div dangerouslySetInnerHTML={{ __html: resultContent }} />
                  {isLoading && <div className="h-4 w-4 bg-neon-purple rounded-full animate-ping mt-4"></div>}
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasheetComparisonPanel;