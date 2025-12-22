import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  FileText, 
  Clock, 
  Settings, 
  X, 
  ChevronRight,
  Brain,
  Sparkles,
  Zap,
  Search,
  BarChart3,
  FileSearch,
  Bot
} from 'lucide-react';

interface RecentChat {
  id: string;
  title: string;
  date: string;
  preview?: string;
}

interface WelcomeScreenProps {
  onNewChat: () => void;
  onAnalyzeDocument: () => void;
  onOpenRecent?: (chat: RecentChat) => void;
  onSettings?: () => void;
  onClose: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
  onNewChat, 
  onAnalyzeDocument, 
  onOpenRecent,
  onSettings,
  onClose 
}) => {
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const savedRecents = localStorage.getItem('tsa_recent_chats');
    if (savedRecents) {
      setRecentChats(JSON.parse(savedRecents));
    } else {
      // Mock data for demonstration
      setRecentChats([
        { id: '1', title: 'Proje Analizi - UPH', date: '2024-01-15', preview: 'Sprint planlaması hakkında...' },
        { id: '2', title: 'DXF Çizim Kontrolü', date: '2024-01-12', preview: 'Ölçü hatası tespit edildi...' },
        { id: '3', title: 'Stok Optimizasyonu', date: '2024-01-10', preview: 'ENV-I verileri analiz edildi...' },
      ]);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-zinc-950/95 backdrop-blur-xl flex items-center justify-center p-4"
      >
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-cyan-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute top-[40%] right-[10%] w-[40%] h-[40%] bg-violet-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[80px]" />
        </div>

        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-5xl w-full h-[600px] bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl flex relative overflow-hidden"
        >
          {/* Close Button */}
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors z-50 hover:bg-white/5 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Left Side: Brand & Actions */}
          <div className="w-[40%] bg-black/30 p-10 flex flex-col justify-between border-r border-white/5">
            <div>
              {/* Brand */}
              <div className="mb-10">
                <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 via-blue-400 to-violet-500 mb-2">
                  T-SA
                </h1>
                <p className="text-zinc-400 font-medium">Technical Smart Assistant</p>
                <p className="text-xs text-zinc-600 mt-1">T-Ecosystem v1.0</p>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <button 
                  onClick={onNewChat}
                  className="w-full h-14 flex items-center justify-start pl-6 text-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-0 rounded-2xl shadow-lg shadow-cyan-500/20 group transition-all"
                >
                  <MessageSquare className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                  Yeni Sohbet Başlat
                </button>

                <button 
                  onClick={onAnalyzeDocument}
                  className="w-full h-12 flex items-center justify-start pl-6 text-base hover:bg-white/10 text-zinc-200 rounded-xl group transition-all"
                >
                  <FileSearch className="w-5 h-5 mr-3 text-violet-400 group-hover:scale-110 transition-transform" />
                  Döküman Analizi (DXF/PDF)
                </button>

                <button 
                  onClick={onNewChat}
                  className="w-full h-12 flex items-center justify-start pl-6 text-base hover:bg-white/10 text-zinc-200 rounded-xl group transition-all"
                >
                  <BarChart3 className="w-5 h-5 mr-3 text-emerald-400 group-hover:scale-110 transition-transform" />
                  Proje Durumu Sorgula
                </button>

                <button 
                  onClick={onNewChat}
                  className="w-full h-12 flex items-center justify-start pl-6 text-base hover:bg-white/10 text-zinc-200 rounded-xl group transition-all"
                >
                  <Search className="w-5 h-5 mr-3 text-amber-400 group-hover:scale-110 transition-transform" />
                  Bilgi Tabanı Ara
                </button>
              </div>

              {/* AI Features */}
              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-zinc-400">Agentic AI</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span className="text-xs text-zinc-400">Gemini Pro</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-zinc-400">Gerçek Zamanlı</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-zinc-400">Otomatik Görev</span>
                </div>
              </div>
            </div>

            {/* Bottom Links */}
            <div className="flex gap-4 pt-6 border-t border-white/5">
              <button onClick={onSettings} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-medium">
                <Settings className="w-4 h-4" /> Ayarlar
              </button>
            </div>
          </div>

          {/* Right Side: Recent Chats */}
          <div className="flex-1 bg-zinc-900/50 p-10 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-zinc-200 flex items-center gap-2">
                <Clock className="w-5 h-5 text-zinc-500" />
                Son Konuşmalar
              </h2>
              <button className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
                Tümünü Gör
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar -mr-4 pr-4">
              {recentChats.length > 0 ? (
                <div className="space-y-3">
                  {recentChats.map((chat, idx) => (
                    <motion.div 
                      key={chat.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => onOpenRecent?.(chat)}
                      className="group p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MessageSquare className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-zinc-200 text-base truncate group-hover:text-white transition-colors">
                          {chat.title}
                        </h3>
                        <p className="text-xs text-zinc-500 mt-0.5 truncate">
                          {chat.preview || chat.date}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                  <MessageSquare className="w-16 h-16 mb-4 stroke-1 opacity-30" />
                  <p className="text-sm">Henüz konuşma başlatmadınız</p>
                  <p className="text-xs mt-1 text-zinc-600">Asistanla sohbet başlatmak için sol taraftaki butonu kullanın</p>
                </div>
              )}
            </div>

            {/* Ecosystem Integration Info */}
            <div className="mt-6 pt-6 border-t border-white/5">
              <p className="text-xs text-zinc-500 mb-3">Bağlı Sistemler</p>
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium">
                  UPH Bağlı
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                  ENV-I Bağlı
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium">
                  Weave Bağlı
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
