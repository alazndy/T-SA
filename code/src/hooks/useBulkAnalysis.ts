
import { useState, useRef, useEffect } from 'react';
import { Product, MarketSearchPreferences } from '../types';
import { performMarketSearchStream } from '../services/geminiService';

interface UseBulkAnalysisProps {
    products: Product[];
    onProductUpdate: (product: Product) => void;
}

export function useBulkAnalysis({ products, onProductUpdate }: UseBulkAnalysisProps) {
    const [isBulkAnalyzing, setIsBulkAnalyzing] = useState(false);
    const [bulkQueue, setBulkQueue] = useState<Product[]>([]);
    const [bulkIndex, setBulkIndex] = useState(0);
    const [waitingForNext, setWaitingForNext] = useState(false);
    const [currentAnalyzingId, setCurrentAnalyzingId] = useState<string | null>(null);
    const [autoAdvance, setAutoAdvance] = useState(false);
    
    // Refs for async loop control
    const stopBulkRef = useRef(false);
    const autoAdvanceRef = useRef(autoAdvance);

    useEffect(() => {
        autoAdvanceRef.current = autoAdvance;
    }, [autoAdvance]);

    const startBulkSession = (filteredProducts: Product[]) => {
        setIsBulkAnalyzing(true);
        setBulkQueue(filteredProducts);
        setBulkIndex(0);
        setWaitingForNext(false);
        stopBulkRef.current = false;
        processBulkItem(0, filteredProducts);
    };

    const stopBulkSession = () => {
        stopBulkRef.current = true;
        setIsBulkAnalyzing(false);
        setCurrentAnalyzingId(null);
        setWaitingForNext(false);
    };

    const processBulkItem = async (index: number, queue: Product[], prefs: MarketSearchPreferences = { region: 'Global', priority: 'Balanced' }) => {
        if (stopBulkRef.current) {
            setIsBulkAnalyzing(false);
            return;
        }

        if (index >= queue.length) {
            setIsBulkAnalyzing(false);
            alert("Toplu analiz tamamlandı.");
            return;
        }

        const prod = queue[index];
        setBulkIndex(index);

        if (prod.marketAnalysis) {
            // Already analyzed, skip
            processBulkItem(index + 1, queue, prefs);
            return;
        }

        setCurrentAnalyzingId(prod.id);

        try {
            const stream = performMarketSearchStream(prod, prefs);
            let content = "";
            let sources: any[] = [];

            for await (const chunk of stream) {
                if (stopBulkRef.current) break;
                content += chunk.text;
                if (chunk.groundingMetadata?.groundingChunks) {
                    sources = [...sources, ...chunk.groundingMetadata.groundingChunks.map((c: any) => c.web ? { title: c.web.title, uri: c.web.uri } : null).filter((s: any) => s)];
                }
            }

            const uniqueSources = Array.from(new Map(sources.map((s: any) => [s.uri, s])).values());

            if (!stopBulkRef.current) {
                const newProd = { ...prod, marketAnalysis: { content, sources: uniqueSources as any[] } };
                
                // Update Parent
                onProductUpdate(newProd);

                // Update Local Queue
                const newQueue = [...queue];
                newQueue[index] = newProd;
                setBulkQueue(newQueue);
                
                setCurrentAnalyzingId(null);

                if (autoAdvanceRef.current) {
                    setTimeout(() => {
                        if (!stopBulkRef.current) {
                            processBulkItem(index + 1, newQueue, prefs);
                        }
                    }, 1500);
                } else {
                    setWaitingForNext(true);
                }
            } else {
                setCurrentAnalyzingId(null);
            }

        } catch (e) {
            console.error(`Error analyzing ${prod.name}`, e);
            setCurrentAnalyzingId(null);
            setWaitingForNext(true); // Pause on error
        }
    };

    const handleNextStep = (prefs: MarketSearchPreferences) => {
        setWaitingForNext(false);
        processBulkItem(bulkIndex + 1, bulkQueue, prefs);
    };

    return {
        isBulkAnalyzing,
        bulkQueue,
        bulkIndex,
        waitingForNext,
        currentAnalyzingId,
        autoAdvance,
        setAutoAdvance,
        startBulkSession,
        stopBulkSession,
        handleNextStep
    };
}
