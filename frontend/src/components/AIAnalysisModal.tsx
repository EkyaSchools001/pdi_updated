import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, Sparkles, CheckCircle, RefreshCcw, AlertTriangle } from "lucide-react";
import { getGroqAnalysis } from "@/lib/groq";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AIAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: unknown;
    type: 'teacher' | 'observation' | 'admin';
    title?: string;
}

export function AIAnalysisModal({ isOpen, onClose, data, type, title }: AIAnalysisModalProps) {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const performAnalysis = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getGroqAnalysis(data, type);
            setAnalysis(result);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "An error occurred during analysis.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && !analysis && !loading) {
            performAnalysis();
        }
    }, [isOpen]);

    const formatContent = (text: string) => {
        return text.split('\n').map((line, i) => {
            if (line.startsWith('#')) return null; // We use our own header
            if (line.trim() === '') return <br key={i} />;
            return <p key={i} className="mb-2 text-sm leading-relaxed">{line}</p>;
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                <div className="p-6 bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 text-white relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Brain className="w-32 h-32" />
                    </div>
                    <DialogHeader className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                <Sparkles className="w-5 h-5 text-amber-300" />
                            </div>
                        </div>
                        <DialogTitle className="text-2xl font-black tracking-tight">{title || "AI Smart Analysis"}</DialogTitle>
                        <DialogDescription className="text-blue-100 font-medium">
                            Generating data-driven educational insights...
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <ScrollArea className="flex-1 p-6 bg-background">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4 py-20 text-center">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                <Brain className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                            </div>
                            <div>
                                <p className="font-bold text-lg">Synthesizing Report Data</p>
                                <p className="text-sm text-muted-foreground italic">Consulting instructional patterns...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center space-y-4 bg-destructive/5 rounded-2xl border border-destructive/10 mt-4">
                            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-destructive" />
                            </div>
                            <div>
                                <h3 className="font-bold text-destructive">Analysis Failed</h3>
                                <p className="text-sm text-muted-foreground mt-1">{error}</p>
                            </div>
                            <Button onClick={performAnalysis} variant="outline" className="gap-2">
                                <RefreshCcw className="w-4 h-4" /> Try Again
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                                {analysis && formatContent(analysis)}
                            </div>

                        </div>
                    )}
                </ScrollArea>

                <div className="p-4 bg-muted/20 border-t flex justify-end">
                    <Button onClick={onClose} variant="secondary" className="font-bold px-8">Close Analysis</Button>
                </div>
            </DialogContent >
        </Dialog >
    );
}

// Internal Badge for local use
function Badge({ children, className, variant = "default" }: { children: React.ReactNode, className?: string, variant?: "default" | "outline" }) {
    const variants = {
        default: "bg-primary text-primary-foreground",
        outline: "border border-input bg-background"
    }
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
}
