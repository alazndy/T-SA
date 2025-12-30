
import React from 'react';
import { 
  FileText, Activity, Settings, 
  Menu, X, Zap 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShellProps {
  children: React.ReactNode;
  activeTab: 'analysis' | 'modules' | 'settings';
  onTabChange: (tab: 'analysis' | 'modules' | 'settings') => void;
}

export function Shell({ children, activeTab, onTabChange }: ShellProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar - Desktop */}
      <motion.aside 
        initial={false}
        animate={{ width: isOpen ? 250 : 70 }}
        className="hidden md:flex flex-col border-r border-border/40 bg-card/30 backdrop-blur-xl"
      >
        <div className="h-16 flex items-center px-4 border-b border-border/40">
           <div className={cn("flex items-center gap-2", !isOpen && "justify-center")}>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                 <Zap className="w-5 h-5 text-primary" />
              </div>
              {isOpen && <span className="font-bold text-lg tracking-tight">T-SA</span>}
           </div>
        </div>

        <nav className="flex-1 p-2 space-y-1">
           <NavItem 
             icon={<FileText className="w-5 h-5" />} 
             label="Spec Analysis" 
             active={activeTab === 'analysis'} 
             collapsed={!isOpen}
             onClick={() => onTabChange('analysis')}
           />
           <NavItem 
             icon={<Activity className="w-5 h-5" />} 
             label="Ecosystem Bridge" 
             active={activeTab === 'modules'} 
             collapsed={!isOpen}
             onClick={() => onTabChange('modules')}
           />
        </nav>

        <div className="p-2 border-t border-border/40">
            <NavItem 
             icon={<Settings className="w-5 h-5" />} 
             label="Settings" 
             active={activeTab === 'settings'} 
             collapsed={!isOpen}
             onClick={() => onTabChange('settings')}
           />
           <button 
             onClick={() => setIsOpen(!isOpen)}
             className="w-full flex items-center justify-center p-2 text-muted-foreground hover:bg-muted rounded-md mt-2"
           >
              {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
           </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
         <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px] pointer-events-none" />
         <div className="p-6 relative z-10 w-full max-w-7xl mx-auto">
            {children}
         </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, collapsed, onClick }: any) {
    return (
        <button
          onClick={onClick}
          className={cn(
            "flex items-center gap-3 w-full p-2.5 rounded-lg transition-all",
            active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            collapsed && "justify-center"
          )}
        >
            {icon}
            {!collapsed && <span className="text-sm font-medium">{label}</span>}
        </button>
    );
}
