import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
    FileText,
    Download,
    Eye,
    CheckCircle2,
    Clock,
    PenTool,
    AlertCircle,
    Search,
    Filter,
    Calendar,
    User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface Document {
    id: string;
    documentId: string;
    title: string;
    description: string;
    version: string;
    createdAt: string;
    createdBy: string;
    requiresSignature: boolean;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    status: "PENDING" | "VIEWED" | "ACKNOWLEDGED" | "SIGNED";
    viewedAt: string | null;
    acknowledgedAt: string | null;
    signedAt?: string | null;
}

export default function TeacherDocuments() {
    const { user } = useAuth();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [showSignDialog, setShowSignDialog] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [signature, setSignature] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const response = await fetch('/api/documents/my-acknowledgements', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const result = await response.json();
                if (result.status === 'success') {
                    // Map API acknowledgements to Document format
                    const mappedDocs = result.data.acknowledgements.map((ack: any) => ({
                        id: ack.id,
                        documentId: ack.documentId,
                        title: ack.document.title,
                        description: ack.document.description,
                        version: ack.document.version,
                        createdAt: ack.document.createdAt,
                        createdBy: ack.document.createdBy?.fullName || "Admin",
                        requiresSignature: ack.document.requiresSignature,
                        fileUrl: ack.document.fileUrl,
                        fileName: ack.document.fileName,
                        fileSize: ack.document.fileSize,
                        status: ack.status,
                        viewedAt: ack.viewedAt,
                        acknowledgedAt: ack.acknowledgedAt,
                        signedAt: ack.signedAt
                    }));
                    setDocuments(mappedDocs);
                }
            } catch (error) {
                console.error("Failed to fetch documents:", error);
            }
        };

        fetchDocuments();
    }, []);

    const canvasRef = useState<HTMLCanvasElement | null>(null);

    const getStatusBadge = (status: string) => {
        const config = {
            PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
            VIEWED: { label: "Viewed", className: "bg-blue-100 text-blue-800 border-blue-300" },
            ACKNOWLEDGED: { label: "Acknowledged", className: "bg-green-100 text-green-800 border-green-300" },
            SIGNED: { label: "Signed", className: "bg-purple-100 text-purple-800 border-purple-300" },
        };
        const { label, className } = config[status as keyof typeof config] || config.PENDING;
        return <Badge variant="outline" className={className}>{label}</Badge>;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "PENDING":
                return <Clock className="w-4 h-4 text-yellow-600" />;
            case "VIEWED":
                return <Eye className="w-4 h-4 text-blue-600" />;
            case "ACKNOWLEDGED":
                return <CheckCircle2 className="w-4 h-4 text-green-600" />;
            case "SIGNED":
                return <PenTool className="w-4 h-4 text-purple-600" />;
            default:
                return <AlertCircle className="w-4 h-4 text-gray-600" />;
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const handleViewDocument = (doc: Document) => {
        setSelectedDoc(doc);
        setShowViewDialog(true);

        // Update status to VIEWED if it's PENDING
        if (doc.status === "PENDING") {
            const updatedDocs = documents.map(d =>
                d.id === doc.id ? { ...d, status: "VIEWED" as const, viewedAt: new Date().toISOString() } : d
            );
            setDocuments(updatedDocs);
            toast.success("Document marked as viewed");
        }
    };

    const handleAcknowledge = () => {
        if (!selectedDoc) return;

        const updatedDocs = documents.map(d =>
            d.id === selectedDoc.id
                ? { ...d, status: "ACKNOWLEDGED" as const, acknowledgedAt: new Date().toISOString() }
                : d
        );
        setDocuments(updatedDocs);
        setShowViewDialog(false);
        toast.success("Document acknowledged successfully");
    };

    const handleSign = () => {
        if (!selectedDoc) return;
        setShowViewDialog(false);
        setShowSignDialog(true);
    };

    const handleSaveSignature = () => {
        if (!selectedDoc || !signature) {
            toast.error("Please provide a signature");
            return;
        }

        const updatedDocs = documents.map(d =>
            d.id === selectedDoc.id
                ? {
                    ...d,
                    status: "SIGNED" as const,
                    acknowledgedAt: d.acknowledgedAt || new Date().toISOString(),
                    signedAt: new Date().toISOString(),
                }
                : d
        );
        setDocuments(updatedDocs);
        setShowSignDialog(false);
        setSignature("");
        toast.success("Document signed successfully! Receipt generated.");
    };

    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === "all" || doc.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const stats = {
        total: documents.length,
        pending: documents.filter(d => d.status === "PENDING").length,
        acknowledged: documents.filter(d => d.status === "ACKNOWLEDGED" || d.status === "SIGNED").length,
        requiresAction: documents.filter(d => d.status === "PENDING" || (d.requiresSignature && d.status !== "SIGNED")).length,
    };

    return (
        <DashboardLayout role="teacher" userName={user?.fullName || "Teacher"}>
            <div className="space-y-6 animate-in fade-in duration-500">
                <PageHeader
                    title="Documents"
                    subtitle="View and acknowledge important documents and policies"
                />

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Documents</p>
                                    <p className="text-2xl font-bold">{stats.total}</p>
                                </div>
                                <FileText className="w-8 h-8 text-primary opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Pending Review</p>
                                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                                </div>
                                <Clock className="w-8 h-8 text-yellow-600 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Acknowledged</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.acknowledged}</p>
                                </div>
                                <CheckCircle2 className="w-8 h-8 text-green-600 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Requires Action</p>
                                    <p className="text-2xl font-bold text-red-600">{stats.requiresAction}</p>
                                </div>
                                <AlertCircle className="w-8 h-8 text-red-600 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filter */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search documents..."
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant={filterStatus === "all" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFilterStatus("all")}
                                >
                                    All
                                </Button>
                                <Button
                                    variant={filterStatus === "PENDING" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFilterStatus("PENDING")}
                                >
                                    Pending
                                </Button>
                                <Button
                                    variant={filterStatus === "ACKNOWLEDGED" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFilterStatus("ACKNOWLEDGED")}
                                >
                                    Acknowledged
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Documents List */}
                <div className="grid gap-4">
                    {filteredDocuments.map((doc) => (
                        <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="p-3 rounded-lg bg-primary/10">
                                            <FileText className="w-6 h-6 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-lg truncate">{doc.title}</h3>
                                                {getStatusBadge(doc.status)}
                                                {doc.requiresSignature && doc.status !== "SIGNED" && (
                                                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                                        <PenTool className="w-3 h-3 mr-1" />
                                                        Signature Required
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">{doc.description}</p>
                                            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(doc.createdAt)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {doc.createdBy}
                                                </span>
                                                <span>Version {doc.version}</span>
                                                <span>{formatFileSize(doc.fileSize)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleViewDocument(doc)}
                                            className="gap-2"
                                        >
                                            <Eye className="w-4 h-4" />
                                            View
                                        </Button>
                                        {doc.status === "SIGNED" && (
                                            <Button variant="outline" size="sm" className="gap-2">
                                                <Download className="w-4 h-4" />
                                                Receipt
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {filteredDocuments.length === 0 && (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No documents found</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* View Document Dialog */}
            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedDoc?.title}</DialogTitle>
                        <DialogDescription>{selectedDoc?.description}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="bg-muted/50 p-8 rounded-lg text-center">
                            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                            <p className="text-sm text-muted-foreground mb-2">Document Preview</p>
                            <p className="font-medium">{selectedDoc?.fileName}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                                {selectedDoc && formatFileSize(selectedDoc.fileSize)}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {getStatusIcon(selectedDoc?.status || "PENDING")}
                            <span>Status: {selectedDoc?.status}</span>
                        </div>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                            Close
                        </Button>
                        {selectedDoc?.status === "VIEWED" && (
                            <Button onClick={handleAcknowledge} className="gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                Acknowledge
                            </Button>
                        )}
                        {selectedDoc?.requiresSignature && selectedDoc?.status !== "SIGNED" && (
                            <Button onClick={handleSign} className="gap-2">
                                <PenTool className="w-4 h-4" />
                                Sign Document
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Sign Document Dialog */}
            <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sign Document</DialogTitle>
                        <DialogDescription>
                            Please provide your signature to acknowledge this document
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Type your full name as signature</Label>
                            <Input
                                placeholder="Enter your full name"
                                value={signature}
                                onChange={(e) => setSignature(e.target.value)}
                                className="mt-2"
                            />
                        </div>
                        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
                            <p className="font-medium mb-1">By signing this document, you confirm that:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>You have read and understood the document</li>
                                <li>You agree to comply with its contents</li>
                                <li>Your signature is legally binding</li>
                            </ul>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSignDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveSignature} disabled={!signature}>
                            Sign & Submit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
