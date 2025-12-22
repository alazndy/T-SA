import React, { useState, useMemo } from 'react';
import { Product, SpecificationItem } from '../types';
import { ChevronDown, CheckCircle, Box, Layers, Hash, Calculator, Tag, BookOpen, Search, Sparkles, FileText, ArrowUpRight, Loader2, Edit2, Save, X, AlertTriangle, Mail } from 'lucide-react';
import MarketAnalysisModal from './MarketAnalysisModal';
import RFQModal from './RFQModal';

interface ProductCardProps {
  product: Product;
  highlightTerm?: string;
  isRegexMode?: boolean;
  onCompare?: (product: Product) => void;
  isAnalyzing?: boolean;
  onUpdate?: (updatedProduct: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, highlightTerm, isRegexMode, onCompare, isAnalyzing, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMarketModal, setShowMarketModal] = useState(false);
  const [showRFQModal, setShowRFQModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Local state for editing
  const [editData, setEditData] = useState<Product>(product);

  const isMatch = (text?: string | null) => {
    if (!highlightTerm || !text) return false;
    if (isRegexMode) {
      try { return new RegExp(highlightTerm, 'i').test(text); } catch (e) { return false; }
    }
    return text.toLowerCase().includes(highlightTerm.toLowerCase());
  };

  const matchingSpecsCount = useMemo(() => {
    if (!highlightTerm) return 0;
    if (!isRegexMode && highlightTerm.length < 2) return 0;
    return product.specifications.filter(s => 
      isMatch(s.sourceReference) || isMatch(s.parameter) || isMatch(s.value)
    ).length;
  }, [product.specifications, highlightTerm, isRegexMode]);

  const groupedSpecs = useMemo(() => {
    // When editing, use editData, otherwise use props
    const currentSpecs = isEditing ? editData.specifications : product.specifications;
    const groups: Record<string, SpecificationItem[]> = {};
    currentSpecs.forEach(spec => {
      const g = spec.group || 'Genel';
      if (!groups[g]) groups[g] = [];
      groups[g].push(spec);
    });
    return groups;
  }, [product.specifications, editData.specifications, isEditing]);

  const groupNames = Object.keys(groupedSpecs).sort();
  const totalSpecs = product.specifications.length;
  const hasAnalysis = !!product.marketAnalysis;

  // Confidence Score Logic
  const score = product.confidenceScore || 100;
  const isLowConfidence = score < 70;

  const handleSaveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdate) {
        onUpdate(editData);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditData(product);
    setIsEditing(false);
  };

  const handleSpecChange = (groupName: string, specIndex: number, field: keyof SpecificationItem, value: string) => {
    const newSpecs = [...editData.specifications];
    // Find the correct index in the flat array based on group and group index
    let count = 0;
    const flatIndex = newSpecs.findIndex(s => {
       if ((s.group || 'Genel') === groupName) {
           if (count === specIndex) return true;
           count++;
       }
       return false;
    });

    if (flatIndex !== -1) {
       newSpecs[flatIndex] = { ...newSpecs[flatIndex], [field]: value };
       setEditData({ ...editData, specifications: newSpecs });
    }
  };

  return (
    <>
      <div className={`glass-card rounded-lg overflow-hidden transition-all duration-200 bg-theme-card border-theme-border hover:shadow-md 
        ${matchingSpecsCount > 0 ? 'ring-1 ring-neon-orange/50' : ''} 
        ${isAnalyzing ? 'border-neon-orange/50 ring-1 ring-neon-orange shadow-lg scale-[1.01]' : ''}
        ${isEditing ? 'ring-2 ring-blue-500 border-blue-500' : ''}
      `}>
        
        {/* Header Section */}
        <div 
          className="p-4 cursor-pointer flex flex-col sm:flex-row gap-4 relative"
          onClick={() => !isEditing && setIsExpanded(!isExpanded)}
        >
          {/* Icon Column */}
          <div className="hidden sm:block">
            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-colors relative
                ${isAnalyzing ? 'bg-neon-orange/10 border-neon-orange text-neon-orange animate-pulse' : 
                  hasAnalysis ? 'bg-green-500/10 border-green-500/30 text-green-500' : 
                  'bg-theme-surface border-theme-border text-theme-secondary'}
            `}>
               {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                hasAnalysis ? <CheckCircle className="w-5 h-5" /> : <Box className="w-5 h-5" />}
               
               {/* Confidence Badge */}
               {isLowConfidence && !isAnalyzing && (
                 <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center shadow-sm" title={`Düşük Güven Skoru: %${score}`}>
                    <span className="text-[10px] font-bold text-black">!</span>
                 </div>
               )}
            </div>
          </div>

          {/* Main Info */}
          <div className="flex-grow min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
               <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-theme-surface border border-theme-border text-theme-secondary">
                 {product.category}
               </span>
               {/* Part Number Editing */}
               {isEditing ? (
                 <input 
                   className="px-2 py-0.5 rounded-md text-[10px] font-mono border border-blue-500 bg-white text-black w-24"
                   value={editData.partNumber || ''}
                   onChange={(e) => setEditData({...editData, partNumber: e.target.value})}
                   placeholder="Parça No"
                   onClick={(e) => e.stopPropagation()}
                 />
               ) : (
                   product.partNumber && (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono border flex items-center ${isMatch(product.partNumber) ? 'bg-neon-orange/10 text-neon-orange border-neon-orange/20' : 'bg-theme-surface text-theme-muted border-theme-border'}`}>
                        <Hash className="w-3 h-3 mr-1 opacity-50" />
                        {product.partNumber}
                      </span>
                   )
               )}

               {hasAnalysis && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-500/10 text-green-600 border border-green-500/20 flex items-center">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Piyasa Raporu
                  </span>
               )}
               {isLowConfidence && (
                   <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    %{(product.confidenceScore || 0)} Güven
                  </span>
               )}
            </div>

            {/* Name Editing */}
            {isEditing ? (
                <input 
                  className="w-full text-base font-bold text-black border border-blue-500 rounded p-1 mb-1"
                  value={editData.name}
                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                  onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <h3 className={`text-base font-bold truncate pr-8 ${isMatch(product.name) ? 'text-neon-orange' : 'text-theme-text'}`}>
                  {product.name}
                </h3>
            )}
            
            <div className="mt-1 flex items-center gap-4 text-xs text-theme-secondary">
               {isEditing ? (
                   <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                       <input 
                         className="w-16 border border-blue-500 rounded px-1 py-0.5 text-black"
                         value={editData.quantity || ''}
                         onChange={e => setEditData({...editData, quantity: e.target.value})}
                         placeholder="Miktar"
                       />
                       <span>Adet</span>
                   </div>
               ) : (
                   product.quantity && <span>{product.quantity} Adet</span>
               )}
               <span className="w-1 h-1 rounded-full bg-theme-border"></span>
               <span>{totalSpecs} Özellik</span>
               {product.complianceStandards.length > 0 && (
                 <>
                   <span className="w-1 h-1 rounded-full bg-theme-border"></span>
                   <span className="text-emerald-600 dark:text-emerald-400">{product.complianceStandards.length} Standart</span>
                 </>
               )}
            </div>
          </div>

          {/* Action Buttons (Top Right) */}
          <div className="absolute top-4 right-4 flex gap-2">
              {isEditing ? (
                  <>
                    <button onClick={handleSaveEdit} className="p-1 text-green-500 hover:bg-green-500/10 rounded" title="Kaydet">
                        <Save className="w-5 h-5" />
                    </button>
                    <button onClick={handleCancelEdit} className="p-1 text-red-500 hover:bg-red-500/10 rounded" title="İptal">
                        <X className="w-5 h-5" />
                    </button>
                  </>
              ) : (
                  <>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); setIsExpanded(true); }} 
                        className="p-1 text-theme-muted hover:text-blue-500 hover:bg-blue-500/10 rounded transition-colors"
                        title="Düzenle"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <div className={`text-theme-muted transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                         <ChevronDown className="w-5 h-5" />
                    </div>
                  </>
              )}
          </div>
        </div>

        {/* Action Bar */}
        {isExpanded && !isEditing && (
           <div className="px-4 pb-4 flex gap-2 border-b border-theme-border/50">
              <button
                  onClick={(e) => { e.stopPropagation(); onCompare && onCompare(product); }}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-theme-surface border border-theme-border hover:border-theme-secondary hover:text-theme-text text-theme-secondary rounded-md text-xs font-medium transition-colors"
              >
                  <FileText className="w-3.5 h-3.5 mr-2" />
                  Kıyasla
              </button>
              <button
                  onClick={(e) => { e.stopPropagation(); setShowRFQModal(true); }}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-theme-surface border border-theme-border hover:border-purple-500 hover:text-purple-500 text-theme-secondary rounded-md text-xs font-medium transition-colors"
              >
                  <Mail className="w-3.5 h-3.5 mr-2" />
                  Teklif İste
              </button>
              <button
                  onClick={(e) => { e.stopPropagation(); setShowMarketModal(true); }}
                  disabled={isAnalyzing}
                  className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-xs font-bold transition-colors ${hasAnalysis ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-theme-text text-theme-bg hover:opacity-90'}`}
              >
                  {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Search className="w-3.5 h-3.5 mr-2" />}
                  {hasAnalysis ? 'Raporu İncele' : 'Piyasa Ara'}
              </button>
           </div>
        )}

        {/* Detailed Specs */}
        {isExpanded && (
          <div className="bg-theme-surface/30 p-4 space-y-6 animate-slide-up">
             {/* Description Editing */}
             {isEditing ? (
                 <textarea 
                    className="w-full text-sm text-black p-2 border border-blue-500 rounded-md h-24"
                    value={editData.description}
                    onChange={(e) => setEditData({...editData, description: e.target.value})}
                 />
             ) : (
                 <div className="text-sm text-theme-secondary leading-relaxed p-3 bg-theme-surface rounded-md border border-theme-border">
                    {product.description}
                 </div>
             )}

             {/* Specs Grid */}
             {groupNames.map(group => (
               <div key={group}>
                 <h4 className="text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-2 flex items-center">
                   <Tag className="w-3 h-3 mr-1.5 opacity-50" />
                   {group}
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-theme-border border border-theme-border rounded-lg overflow-hidden">
                   {groupedSpecs[group].map((spec, idx) => {
                     const isHighlighted = isMatch(spec.parameter) || isMatch(spec.value) || isMatch(spec.sourceReference);
                     return (
                       <div key={idx} className={`bg-theme-card p-2.5 flex justify-between items-start gap-3 ${isHighlighted ? 'bg-neon-orange/5' : ''}`}>
                          <div className="min-w-0 flex-grow">
                             {isEditing ? (
                                 <input 
                                     className="w-full text-xs font-medium border border-blue-300 rounded px-1 mb-1 text-black"
                                     value={spec.parameter}
                                     onChange={(e) => handleSpecChange(group, idx, 'parameter', e.target.value)}
                                 />
                             ) : (
                                 <div className={`text-xs font-medium ${isHighlighted ? 'text-neon-orange' : 'text-theme-secondary'}`}>
                                   {spec.parameter}
                                 </div>
                             )}
                             
                             {spec.sourceReference && !isEditing && (
                               <div className="text-[9px] text-theme-muted font-mono mt-0.5 opacity-70">
                                 {spec.sourceReference}
                               </div>
                             )}
                          </div>
                          <div className="text-right min-w-[80px]">
                             {isEditing ? (
                                 <div className="flex flex-col gap-1">
                                     <input 
                                         className="w-full text-xs font-semibold border border-blue-300 rounded px-1 text-black text-right"
                                         value={spec.value}
                                         onChange={(e) => handleSpecChange(group, idx, 'value', e.target.value)}
                                     />
                                     <input 
                                         className="w-full text-[10px] border border-blue-300 rounded px-1 text-black text-right"
                                         value={spec.unit || ''}
                                         onChange={(e) => handleSpecChange(group, idx, 'unit', e.target.value)}
                                         placeholder="Birim"
                                     />
                                 </div>
                             ) : (
                                 <>
                                     <div className={`text-xs font-semibold ${isHighlighted ? 'text-theme-text' : 'text-theme-text'}`}>
                                       {spec.value} <span className="text-theme-muted font-normal">{spec.unit}</span>
                                     </div>
                                     {spec.criticality === 'Essential' && (
                                       <span className="text-[9px] text-red-500 font-bold block mt-0.5">KRİTİK</span>
                                     )}
                                 </>
                             )}
                          </div>
                       </div>
                     )
                   })}
                 </div>
               </div>
             ))}
             
             {/* Standards */}
             {product.complianceStandards.length > 0 && (
                <div>
                   <h4 className="text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-2">Standartlar</h4>
                   <div className="flex flex-wrap gap-2">
                      {product.complianceStandards.map((std, i) => (
                         <span key={i} className="inline-flex items-center px-2 py-1 rounded bg-theme-surface border border-theme-border text-xs text-theme-secondary">
                            <CheckCircle className="w-3 h-3 mr-1.5 text-emerald-500" />
                            {std}
                         </span>
                      ))}
                   </div>
                </div>
             )}
          </div>
        )}
      </div>

      <MarketAnalysisModal 
        isOpen={showMarketModal}
        onClose={() => setShowMarketModal(false)}
        product={product}
      />
      <RFQModal 
        isOpen={showRFQModal}
        onClose={() => setShowRFQModal(false)}
        product={product}
      />
    </>
  );
};

export default ProductCard;