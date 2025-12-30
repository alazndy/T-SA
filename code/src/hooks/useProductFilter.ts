
import { useMemo, useState } from 'react';
import { Product, AnalysisResult } from '../../types';

interface UseProductFilterProps {
    products: Product[];
}

export function useProductFilter({ products }: UseProductFilterProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isRegexMode, setIsRegexMode] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('Tümü');
    const [showCriticalOnly, setShowCriticalOnly] = useState(false);
    const [showWithStandardsOnly, setShowWithStandardsOnly] = useState(false);

    const categories = useMemo(() => {
        const cats = new Set(products.map(p => p.category));
        return ['Tümü', ...Array.from(cats).sort()];
    }, [products]);

    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const searchLower = searchTerm.toLowerCase();
            let regex: RegExp | null = null;
            if (isRegexMode && searchTerm) {
                try { regex = new RegExp(searchTerm, 'i'); } catch (e) { return false; }
            }

            const checkMatch = (text?: string | null) => {
                if (!text) return false;
                if (regex) return regex.test(text);
                return text.toLowerCase().includes(searchLower);
            };

            const hasMatchingSpec = product.specifications.some(spec =>
                checkMatch(spec.sourceReference) || checkMatch(spec.parameter) || checkMatch(spec.value)
            );

            return (
                (checkMatch(product.name) || checkMatch(product.partNumber) || hasMatchingSpec) &&
                (selectedCategory === 'Tümü' || product.category === selectedCategory) &&
                (!showCriticalOnly || product.specifications.some(s => s.criticality === 'Essential')) &&
                (!showWithStandardsOnly || product.complianceStandards.length > 0)
            );
        });
    }, [products, searchTerm, isRegexMode, selectedCategory, showCriticalOnly, showWithStandardsOnly]);

    return {
        searchTerm, setSearchTerm,
        isRegexMode, setIsRegexMode,
        selectedCategory, setSelectedCategory,
        showCriticalOnly, setShowCriticalOnly,
        showWithStandardsOnly, setShowWithStandardsOnly,
        categories,
        filteredProducts
    };
}
