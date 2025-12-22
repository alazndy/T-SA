import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, FileText, Layers, Search, Download, Zap, Hexagon, CheckCircle } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: (dontShowAgain: boolean) => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const steps = [
    {
      icon: <Hexagon className="w-12 h-12 text-neon-orange" />,
      title: "T-SA'ya Hoşgeldiniz",
      desc: "Turhan Şartname Analizi (T-SA), karmaşık teknik şartnameleri saniyeler içinde analiz eden, ürünleri ayrıştıran ve piyasa araştırması yapan yapay zeka destekli bir asistandır.",
      color: "from-neon-orange to-red-500"
    },
    {
      icon: <Layers className="w-12 h-12 text-neon-blue" />,
      title: "Akıllı & İteratif Analiz",
      desc: "PDF veya DOCX dosyanızı yükleyin. Yeni 'Hassas Analiz' modu ile belgeyi yapay zekaya birden fazla kez okutarak (Konsensus Modu) en doğru ve hatasız sonuçları elde edin.",
      color: "from-neon-blue to-cyan-400"
    },
    {
      icon: <Search className="w-12 h-12 text-green-500" />,
      title: "Piyasa Araştırması & Kıyaslama",
      desc: "Şartnamedeki her ürün için tek tıkla global tedarikçileri, fiyatları ve stok durumlarını araştırın. Elinizdeki datasheet dosyalarını yükleyerek şartnameye uygunluk analizi yapın.",
      color: "from-green-500 to-emerald-400"
    },
    {
      icon: <Download className="w-12 h-12 text-purple-500" />,
      title: "Raporlama ve Dışa Aktarım",
      desc: "Analiz sonuçlarını, piyasa raporlarını ve uyumluluk matrislerini Excel, PDF veya Proje Dosyası (.sart) olarak indirin. Geçmiş çalışmalarınıza dilediğiniz zaman erişin.",
      color: "from-purple-500 to-indigo-500"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose(dontShowAgain);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose(dontShowAgain);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" />
      
      <div className="relative bg-theme-bg border border-theme-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up flex flex-col min-h-[500px]">
        {/* Background Gradients */}
        <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${steps[currentStep].color} transition-all duration-500`}></div>
        <div className={`absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br ${steps[currentStep].color} rounded-full blur-[80px] opacity-20 transition-all duration-500`}></div>
        
        {/* Close Button */}
        <button onClick={handleSkip} className="absolute top-4 right-4 p-2 text-theme-muted hover:text-theme-text z-10">
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="flex-grow flex flex-col items-center justify-center p-8 text-center space-y-6 relative z-0">
          <div className={`w-24 h-24 rounded-2xl bg-theme-surface border border-theme-border flex items-center justify-center shadow-xl mb-4 transition-transform duration-500 scale-100 ${currentStep % 2 === 0 ? 'rotate-3' : '-rotate-3'}`}>
             {steps[currentStep].icon}
          </div>
          
          <div className="space-y-3 animate-fade-in key={currentStep}">
            <h2 className="text-2xl font-bold text-theme-text tracking-tight">
              {steps[currentStep].title}
            </h2>
            <p className="text-theme-secondary text-sm leading-relaxed max-w-xs mx-auto">
              {steps[currentStep].desc}
            </p>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-6 bg-theme-surface/50 border-t border-theme-border">
          
          {/* Progress Indicators */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? `w-8 bg-gradient-to-r ${steps[currentStep].color}` : 'w-2 bg-theme-border'}`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button 
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`p-2 rounded-lg text-theme-secondary hover:bg-theme-input transition-colors ${currentStep === 0 ? 'opacity-0 pointer-events-none' : ''}`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
               {/* Checkbox for Last Step */}
               {currentStep === steps.length - 1 ? (
                 <button 
                   onClick={() => onClose(dontShowAgain)}
                   className={`flex items-center px-6 py-2.5 rounded-lg font-bold text-white shadow-lg bg-gradient-to-r ${steps[currentStep].color} hover:opacity-90 transition-all transform hover:scale-105`}
                 >
                   Başlayalım <Zap className="w-4 h-4 ml-2 fill-current" />
                 </button>
               ) : (
                 <button 
                   onClick={handleNext}
                   className="flex items-center px-6 py-2.5 bg-theme-text text-theme-bg font-bold rounded-lg hover:opacity-90 transition-all"
                 >
                   İlerle <ChevronRight className="w-4 h-4 ml-2" />
                 </button>
               )}
            </div>
          </div>
          
          <div className="mt-4 flex justify-center">
             <label className="flex items-center space-x-2 cursor-pointer group">
               <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${dontShowAgain ? 'bg-neon-blue border-neon-blue' : 'border-theme-muted group-hover:border-theme-text'}`}>
                  {dontShowAgain && <CheckCircle className="w-3 h-3 text-white" />}
               </div>
               <input 
                 type="checkbox" 
                 className="hidden" 
                 checked={dontShowAgain}
                 onChange={(e) => setDontShowAgain(e.target.checked)}
               />
               <span className="text-xs text-theme-muted group-hover:text-theme-secondary select-none">Bir daha gösterme</span>
             </label>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TutorialModal;