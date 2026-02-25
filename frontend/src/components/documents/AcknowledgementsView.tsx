import { useState, useEffect } from "react";
import {
    FileCheck,
    Eye,
    CheckCircle2,
    Download,
    ExternalLink,
    ChevronRight,
    Clock,
    ShieldCheck,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { documentService, DocumentAcknowledgement } from "@/services/documentService";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

export function AcknowledgementsView({ teacherId }: { teacherId: string }) {
    const [acknowledgements, setAcknowledgements] = useState<DocumentAcknowledgement[]>([]);
    const [selectedAck, setSelectedAck] = useState<DocumentAcknowledgement | null>(null);
    const [loading, setLoading] = useState(true);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [docContent, setDocContent] = useState<string | null>(null);

    useEffect(() => {
        if (teacherId) {
            fetchAcknowledgements();
        }
    }, [teacherId]);

    const fetchAcknowledgements = async () => {
        try {
            setLoading(true);
            const data = await documentService.getTeacherAcknowledgements(teacherId);
            setAcknowledgements(data);
        } catch (error) {
            console.error("Error fetching documents:", error);
            toast.error("Failed to load documents");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAck = async (ack: DocumentAcknowledgement) => {
        setSelectedAck(ack);
        if (ack.document) {
            try {
                // Use fileUrl instead of file_path
                const publicUrl = await documentService.getDocumentPublicUrl(ack.document.fileUrl);

                // Determine if we need an Office viewer based on extension
                const isWordDoc = ack.document.fileName.toLowerCase().endsWith('.doc') ||
                    ack.document.fileName.toLowerCase().endsWith('.docx');

                if (isWordDoc) {
                    try {
                        // For localhost/private files, external viewers won't work.
                        // We use mammoth to convert DOCX to HTML for preview
                        setPdfUrl(''); // clear PDF url
                        const response = await fetch(publicUrl);
                        const arrayBuffer = await response.arrayBuffer();
                        const mammoth = await import('mammoth');
                        const result = await mammoth.convertToHtml({ arrayBuffer });
                        setDocContent(result.value);
                    } catch (err) {
                        console.error("Error parsing Word document:", err);
                        setDocContent("<div class='p-8 text-center text-red-500'>Failed to load Word document preview. Please download the file instead.</div>");
                    }
                } else {
                    setDocContent(''); // clear text content
                    setPdfUrl(publicUrl);
                }

                if (ack.status === 'PENDING') {
                    await documentService.markAsViewed(ack.id);
                    // Update local state
                    setAcknowledgements(prev => prev.map(a =>
                        a.id === ack.id ? { ...a, status: 'VIEWED' as const, viewedAt: new Date().toISOString() } : a
                    ));
                }
            } catch (error) {
                console.error("Error getting PDF URL:", error);
                toast.error("Could not load document preview");
            }
        }
    };

    const handleAcknowledge = async () => {
        if (!selectedAck || !selectedAck.document) return;

        try {
            // Use document.hash if available, or a computed one
            await documentService.acknowledgeDocument(selectedAck.id, selectedAck.document.hash || 'manual-hash');
            toast.success("Document acknowledged successfully");

            // Update local state
            setAcknowledgements(prev => prev.map(a =>
                a.id === selectedAck.id ? {
                    ...a,
                    status: 'ACKNOWLEDGED' as const,
                    acknowledgedAt: new Date().toISOString(),
                    documentHash: selectedAck.document?.hash
                } : a
            ));

            // Update selected ack to show success
            setSelectedAck(prev => prev ? {
                ...prev,
                status: 'ACKNOWLEDGED' as const,
                acknowledgedAt: new Date().toISOString()
            } : null);

        } catch (error) {
            console.error("Error acknowledging document:", error);
            toast.error("Failed to acknowledge document");
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pending</Badge>;
            case 'VIEWED': return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">Viewed</Badge>;
            case 'ACKNOWLEDGED': return <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">Acknowledged</Badge>;
            case 'SIGNED': return <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-100">Signed</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Document Acknowledgements"
                subtitle="Review and sign important school documents and policies"
            />

            <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-250px)]">
                {/* Left: Document List */}
                <Card className="lg:col-span-4 flex flex-col overflow-hidden">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">My Documents</CardTitle>
                        <CardDescription>{acknowledgements.length} documents assigned to you</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden">
                        <ScrollArea className="h-full">
                            <div className="divide-y">
                                {acknowledgements.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">
                                        <FileCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        <p>No documents found</p>
                                    </div>
                                ) : (
                                    acknowledgements.map((ack) => (
                                        <button
                                            key={ack.id}
                                            onClick={() => handleSelectAck(ack)}
                                            className={cn(
                                                "w-full text-left p-4 transition-colors hover:bg-muted/50 flex items-center gap-4",
                                                selectedAck?.id === ack.id && "bg-muted border-l-4 border-primary"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                                ack.status === 'ACKNOWLEDGED' ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
                                            )}>
                                                <FileCheck className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{ack.document?.title}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {getStatusBadge(ack.status)}
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(ack.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                        </button>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Right: Document Preview & Actions */}
                <Card className="lg:col-span-8 flex flex-col overflow-hidden">
                    {!selectedAck ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                            <Eye className="w-16 h-16 mb-4 opacity-10" />
                            <h3 className="text-lg font-medium">Select a document to preview</h3>
                            <p className="max-w-xs mx-auto mt-2">
                                Choose a document from the list on the left to view its contents and provide acknowledgement.
                            </p>
                        </div>
                    ) : (
                        <>
                            <CardHeader className="flex flex-row items-center justify-between pb-3">
                                <div>
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        {selectedAck.document?.title}
                                        {selectedAck.status === 'ACKNOWLEDGED' && (
                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        )}
                                    </CardTitle>
                                    <CardDescription>
                                        Assigned on {new Date(selectedAck.createdAt).toLocaleDateString()}
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    {!docContent && pdfUrl && (
                                        <Button variant="outline" size="sm" onClick={() => window.open(pdfUrl, '_blank')}>
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            Open in New Tab
                                        </Button>
                                    )}
                                    {selectedAck.document?.fileUrl && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={async () => {
                                                const url = await documentService.getDocumentPublicUrl(selectedAck.document!.fileUrl);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = selectedAck.document!.title;
                                                document.body.appendChild(a);
                                                a.click();
                                                document.body.removeChild(a);
                                            }}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col gap-4 p-0 overflow-hidden">
                                <div className="flex-1 bg-muted relative rounded-md mx-6 border overflow-hidden">
                                    {docContent ? (
                                        <ScrollArea className="w-full h-full bg-white p-8">
                                            <div
                                                className="prose max-w-none docx-preview"
                                                dangerouslySetInnerHTML={{ __html: docContent }}
                                            />
                                        </ScrollArea>
                                    ) : pdfUrl ? (
                                        <iframe
                                            src={pdfUrl}
                                            className="w-full h-full border-none"
                                            title="Document Preview"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                                            <p>Loading document preview...</p>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 bg-background border-t">
                                    {selectedAck.status === 'ACKNOWLEDGED' ? (
                                        <div className="flex items-center gap-4 p-4 rounded-lg bg-green-50 border border-green-100">
                                            <ShieldCheck className="w-8 h-8 text-green-600" />
                                            <div>
                                                <div className="font-semibold text-green-900">Document Acknowledged</div>
                                                <div className="text-sm text-green-700">
                                                    Acknowledged on {selectedAck.acknowledgedAt ? new Date(selectedAck.acknowledgedAt).toLocaleString() : 'N/A'} from IP {selectedAck.ipAddress || 'unknown'}
                                                </div>
                                                <div className="text-[10px] text-green-600 font-mono mt-1 opacity-60">
                                                    Digital Hash: {selectedAck.documentHash}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-100 text-blue-800 text-sm">
                                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                                <p>
                                                    By clicking "Acknowledge", you confirm that you have read and understood the contents of this document.
                                                    Your IP address and a timestamp will be recorded for compliance purposes.
                                                </p>
                                            </div>
                                            <div className="flex justify-end gap-3">
                                                <Button variant="ghost" onClick={() => setSelectedAck(null)}>Cancel</Button>
                                                <Button
                                                    onClick={handleAcknowledge}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                                                >
                                                    <FileCheck className="w-4 h-4 mr-2" />
                                                    Acknowledge Document
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}
