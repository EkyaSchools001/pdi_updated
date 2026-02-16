import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
    FileText,
    Upload,
    Users,
    CheckCircle2,
    Clock,
    Eye,
    PenTool,
    Trash2,
    Send,
    Search,
    TrendingUp,
    BarChart3,
    Download,
    Edit,
    AlertCircle,
    Filter,
    Plus,
    FileCheck,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { documentService, Document } from "@/services/documentService";
import { userService, User } from "@/services/userService";

export default function AdminDocumentManagement() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [showAssignDialog, setShowAssignDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [teachers, setTeachers] = useState<User[]>([]);
    const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState("documents");
    const [selectedSchool, setSelectedSchool] = useState<string>("");
    const [teacherSearchQuery, setTeacherSearchQuery] = useState("");

    // New document form state
    const [newDocument, setNewDocument] = useState({
        title: "",
        description: "",
        version: "1.0",
        requiresSignature: false,
        file: null as File | null,
        assignedTeachers: [] as string[],
    });

    const [uploadTeacherSearchQuery, setUploadTeacherSearchQuery] = useState("");

    useEffect(() => {
        fetchDocuments();
        fetchTeachers();
    }, []);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const docs = await documentService.getAllDocuments();
            setDocuments(docs);
        } catch (error) {
            console.error("Error fetching documents:", error);
            toast.error("Failed to load documents");
        } finally {
            setLoading(false);
        }
    };

    const fetchTeachers = async () => {
        try {
            const data = await userService.getTeachers();
            setTeachers(data);
        } catch (error) {
            console.error("Error fetching teachers:", error);
            toast.error("Failed to load teachers");
        }
    };

    const formatFileSize = (bytes: number) => {
        if (!bytes) return "0 B";
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

    const getStatusBadge = (status: string) => {
        const config = {
            PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock },
            VIEWED: { label: "Viewed", className: "bg-blue-100 text-blue-800 border-blue-300", icon: Eye },
            ACKNOWLEDGED: { label: "Acknowledged", className: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle2 },
            SIGNED: { label: "Signed", className: "bg-purple-100 text-purple-800 border-purple-300", icon: PenTool },
        };
        const { label, className, icon: Icon } = config[status as keyof typeof config] || config.PENDING;
        return (
            <Badge variant="outline" className={className}>
                <Icon className="w-3 h-3 mr-1" />
                {label}
            </Badge>
        );
    };

    const handleUploadDocument = async () => {
        if (!newDocument.title || !newDocument.file) {
            toast.error("Please provide title and file");
            return;
        }

        try {
            console.log("[DOC-UPLOAD] Starting upload process for:", newDocument.title);
            const uploadedDoc = await documentService.uploadDocument({
                title: newDocument.title,
                description: newDocument.description,
                version: newDocument.version,
                requiresSignature: newDocument.requiresSignature,
                file: newDocument.file
            });

            console.log("[DOC-UPLOAD] Metadata created successfully:", uploadedDoc.id);

            // If teachers were selected during upload, assign them now
            if (newDocument.assignedTeachers.length > 0) {
                console.log("[DOC-UPLOAD] Assigning to", newDocument.assignedTeachers.length, "teachers");
                await documentService.assignDocument(uploadedDoc.id, newDocument.assignedTeachers);
            }

            toast.success("Document uploaded successfully!");
            setShowUploadDialog(false);
            setNewDocument({
                title: "",
                description: "",
                version: "1.0",
                requiresSignature: false,
                file: null,
                assignedTeachers: [],
            });
            setUploadTeacherSearchQuery(""); // Clear search
            fetchDocuments(); // Refresh list
        } catch (error: any) {
            console.error("[DOC-UPLOAD] Failure point:", error.config?.url || "unknown", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to upload document";
            toast.error(errorMessage);
        }
    };

    const handleAssignDocument = async () => {
        if (!selectedDocument || selectedTeachers.length === 0) {
            toast.error("Please select teachers");
            return;
        }

        try {
            await documentService.assignDocument(selectedDocument.id, selectedTeachers);
            toast.success(`Document assigned to ${selectedTeachers.length} teachers`);
            setShowAssignDialog(false);
            setSelectedTeachers([]);
            fetchDocuments(); // Refresh stats
        } catch (error) {
            console.error("Error assigning document:", error);
            toast.error("Failed to assign document");
        }
    };

    const handleDeleteDocument = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this document?")) {
            try {
                await documentService.deleteDocument(id);
                toast.success("Document deleted successfully");
                fetchDocuments();
            } catch (error) {
                console.error("Error deleting document:", error);
                toast.error("Failed to delete document");
            }
        }
    };

    const toggleTeacherSelection = (teacherId: string) => {
        setSelectedTeachers(prev =>
            prev.includes(teacherId)
                ? prev.filter(id => id !== teacherId)
                : [...prev, teacherId]
        );
    };

    // Group teachers by campus/school logic
    const teachersByGroup = teachers.reduce((acc, teacher) => {
        const group = teacher.campusId || teacher.department || 'General';
        if (!acc[group]) {
            acc[group] = [];
        }
        acc[group].push(teacher);
        return acc;
    }, {} as Record<string, User[]>);

    const schools = Object.keys(teachersByGroup).sort();

    const filteredDocuments = documents.filter(doc =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const stats = {
        totalDocuments: documents.length,
        activeDocuments: documents.filter(d => d.status === "Active").length,
        totalAssignments: documents.reduce((sum, doc) => sum + (doc.assignedTo || 0), 0),
        pendingAcknowledgements: documents.reduce((sum, doc) => sum + (doc.pending || 0), 0),
        completionRate: documents.reduce((sum, doc) => sum + (doc.assignedTo || 0), 0) > 0
            ? Math.round((documents.reduce((sum, doc) => sum + (doc.acknowledged || 0), 0) / documents.reduce((sum, doc) => sum + (doc.assignedTo || 0), 0)) * 100)
            : 0,
    };

    // Derive tracking data from documents acknowledgements if available
    const allAcknowledgements = documents.flatMap(doc =>
        (doc as any).acknowledgements ? (doc as any).acknowledgements.map((ack: any) => ({
            ...ack,
            documentTitle: doc.title
        })) : []
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader
                title="Document Management"
                subtitle="Upload, assign, and track document acknowledgements"
                actions={
                    <Button onClick={() => setShowUploadDialog(true)} className="gap-2">
                        <Upload className="w-4 h-4" />
                        Upload Document
                    </Button>
                }
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Documents</p>
                                <p className="text-2xl font-bold">{stats.totalDocuments}</p>
                            </div>
                            <FileText className="w-8 h-8 text-primary opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Active</p>
                                <p className="text-2xl font-bold text-green-600">{stats.activeDocuments}</p>
                            </div>
                            <CheckCircle2 className="w-8 h-8 text-green-600 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Assignments</p>
                                <p className="text-2xl font-bold">{stats.totalAssignments}</p>
                            </div>
                            <Users className="w-8 h-8 text-blue-600 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Pending</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.pendingAcknowledgements}</p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-600 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Completion Rate</p>
                                <p className="text-2xl font-bold text-purple-600">{stats.completionRate}%</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-purple-600 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="tracking">Tracking</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-4">
                    {/* Search */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search documents..."
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Documents List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>All Documents</CardTitle>
                            <CardDescription>Manage and track all uploaded documents</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-4">Loading documents...</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Document</TableHead>
                                            <TableHead>Version</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead>Assigned</TableHead>
                                            <TableHead>Progress</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredDocuments.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                                                    No documents found. Upload one to get started.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredDocuments.map((doc) => {
                                                const assigned = doc.assignedTo || 0;
                                                const acknowledged = doc.acknowledged || 0;
                                                const progress = assigned > 0 ? (acknowledged / assigned) * 100 : 0;

                                                return (
                                                    <TableRow key={doc.id}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 rounded-lg bg-primary/10">
                                                                    <FileText className="w-4 h-4 text-primary" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium">{doc.title}</div>
                                                                    <div className="text-sm text-muted-foreground">
                                                                        {doc.fileName} • {formatFileSize(doc.fileSize)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">v{doc.version}</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {formatDate(doc.createdAt)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Users className="w-4 h-4 text-muted-foreground" />
                                                                <span className="font-medium">{assigned}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="space-y-1">
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span className="text-muted-foreground">
                                                                        {acknowledged}/{assigned}
                                                                    </span>
                                                                    <span className="font-medium">{Math.round(progress)}%</span>
                                                                </div>
                                                                <Progress value={progress} className="h-2" />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant="default"
                                                                className="bg-green-600"
                                                            >
                                                                Active
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setSelectedDocument(doc);
                                                                        setShowAssignDialog(true);
                                                                    }}
                                                                >
                                                                    <Send className="w-4 h-4 mr-1" />
                                                                    Assign
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleDeleteDocument(doc.id)}
                                                                >
                                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tracking Tab */}
                <TabsContent value="tracking" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Acknowledgement Tracking</CardTitle>
                            <CardDescription>Monitor teacher acknowledgements in real-time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {allAcknowledgements.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No acknowledgements tracked yet.
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Teacher</TableHead>
                                            <TableHead>Document</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Viewed At</TableHead>
                                            <TableHead>Acknowledged At</TableHead>
                                            <TableHead>IP Address</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {allAcknowledgements.map((ack) => (
                                            <TableRow key={ack.id}>
                                                <TableCell className="font-medium">{ack.teacher?.fullName || 'N/A'}</TableCell>
                                                <TableCell>{ack.documentTitle}</TableCell>
                                                <TableCell>{getStatusBadge(ack.status)}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {ack.viewedAt ? new Date(ack.viewedAt).toLocaleString() : "-"}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {ack.acknowledgedAt ? new Date(ack.acknowledgedAt).toLocaleString() : "-"}
                                                </TableCell>
                                                <TableCell className="text-sm font-mono">
                                                    {ack.ipAddress || "-"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Completion Overview</CardTitle>
                                <CardDescription>Document acknowledgement rates</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {documents.map((doc) => {
                                        const assigned = doc.assignedTo || 0;
                                        const acknowledged = doc.acknowledged || 0;
                                        const progress = assigned > 0 ? (acknowledged / assigned) * 100 : 0;
                                        return (
                                            <div key={doc.id} className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="font-medium">{doc.title}</span>
                                                    <span className="text-muted-foreground">
                                                        {acknowledged}/{assigned}
                                                    </span>
                                                </div>
                                                <Progress value={progress} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Status Distribution</CardTitle>
                                <CardDescription>Current acknowledgement status</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-5 h-5 text-yellow-600" />
                                            <span className="font-medium">Pending</span>
                                        </div>
                                        <span className="text-2xl font-bold text-yellow-600">
                                            {stats.pendingAcknowledgements}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                                            <span className="font-medium">Acknowledged</span>
                                        </div>
                                        <span className="text-2xl font-bold text-green-600">
                                            {documents.reduce((sum, doc) => sum + (doc.acknowledged || 0), 0)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 border border-blue-200">
                                        <div className="flex items-center gap-3">
                                            <BarChart3 className="w-5 h-5 text-blue-600" />
                                            <span className="font-medium">Completion Rate</span>
                                        </div>
                                        <span className="text-2xl font-bold text-blue-600">
                                            {stats.completionRate}%
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Upload Document Dialog */}
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Upload New Document</DialogTitle>
                        <DialogDescription>
                            Upload a document to assign to teachers for acknowledgement
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Document Title *</Label>
                            <Input
                                id="title"
                                placeholder="e.g., Code of Conduct 2025"
                                value={newDocument.title}
                                onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Brief description of the document..."
                                value={newDocument.description}
                                onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="version">Version</Label>
                                <Input
                                    id="version"
                                    placeholder="1.0"
                                    value={newDocument.version}
                                    onChange={(e) => setNewDocument({ ...newDocument, version: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Signature Required</Label>
                                <div className="flex items-center space-x-2 h-10">
                                    <Checkbox
                                        id="signature"
                                        checked={newDocument.requiresSignature}
                                        onCheckedChange={(checked) =>
                                            setNewDocument({ ...newDocument, requiresSignature: checked as boolean })
                                        }
                                    />
                                    <label htmlFor="signature" className="text-sm cursor-pointer">
                                        Require digital signature
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="file">Upload File *</Label>
                            <Input
                                id="file"
                                type="file"
                                accept=".pdf"
                                onChange={(e) => setNewDocument({ ...newDocument, file: e.target.files?.[0] || null })}
                            />
                            <p className="text-xs text-muted-foreground">PDF files only, max 10MB</p>
                        </div>

                        {/* School Selection and Teacher Assignment */}
                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex items-center justify-between">
                                <Label>Assign to Teachers (Optional)</Label>
                                <Badge variant="secondary">{newDocument.assignedTeachers.length} selected</Badge>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="school">Select Group/School</Label>
                                <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                                    <SelectTrigger id="school">
                                        <SelectValue placeholder="Choose a group..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Groups</SelectItem>
                                        {schools.map((school) => (
                                            <SelectItem key={school} value={school}>
                                                {school} ({teachersByGroup[school].length} teachers)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedSchool && (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search teacher by name or email..."
                                            className="pl-8 h-9"
                                            value={uploadTeacherSearchQuery}
                                            onChange={(e) => setUploadTeacherSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <div className="border rounded-lg p-4 max-h-64 overflow-y-auto bg-muted/20">
                                        <div className="space-y-2">
                                            {(selectedSchool === "all" ? teachers : teachersByGroup[selectedSchool] || [])
                                                .filter(teacher =>
                                                    teacher.fullName.toLowerCase().includes(uploadTeacherSearchQuery.toLowerCase()) ||
                                                    teacher.email.toLowerCase().includes(uploadTeacherSearchQuery.toLowerCase())
                                                )
                                                .map((teacher) => (
                                                    <div
                                                        key={teacher.id}
                                                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-background cursor-pointer transition-colors"
                                                        onClick={() => {
                                                            const isSelected = newDocument.assignedTeachers.includes(teacher.id);
                                                            setNewDocument({
                                                                ...newDocument,
                                                                assignedTeachers: isSelected
                                                                    ? newDocument.assignedTeachers.filter(id => id !== teacher.id)
                                                                    : [...newDocument.assignedTeachers, teacher.id]
                                                            });
                                                        }}
                                                    >
                                                        <Checkbox
                                                            checked={newDocument.assignedTeachers.includes(teacher.id)}
                                                            onCheckedChange={() => {
                                                                const isSelected = newDocument.assignedTeachers.includes(teacher.id);
                                                                setNewDocument({
                                                                    ...newDocument,
                                                                    assignedTeachers: isSelected
                                                                        ? newDocument.assignedTeachers.filter(id => id !== teacher.id)
                                                                        : [...newDocument.assignedTeachers, teacher.id]
                                                                });
                                                            }}
                                                        />
                                                        <div className="flex-1">
                                                            <div className="font-medium text-sm">{teacher.fullName}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {teacher.email} • {teacher.campusId || 'N/A'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const teachersToSelect = selectedSchool === "all"
                                                    ? teachers
                                                    : teachersByGroup[selectedSchool] || [];
                                                setNewDocument({
                                                    ...newDocument,
                                                    assignedTeachers: [...new Set([...newDocument.assignedTeachers, ...teachersToSelect.map(t => t.id)])]
                                                });
                                            }}
                                        >
                                            Select All in Group
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const teachersToRemove = selectedSchool === "all"
                                                    ? teachers
                                                    : teachersByGroup[selectedSchool] || [];
                                                const idsToRemove = new Set(teachersToRemove.map(t => t.id));
                                                setNewDocument({
                                                    ...newDocument,
                                                    assignedTeachers: newDocument.assignedTeachers.filter(id => !idsToRemove.has(id))
                                                });
                                            }}
                                        >
                                            Clear Group
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUploadDocument}>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Document
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign Document Dialog */}
            <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Assign Document to Teachers</DialogTitle>
                        <DialogDescription>
                            Select teachers to assign "{selectedDocument?.title}"
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="school">Filter by Group/School</Label>
                            <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                                <SelectTrigger id="school">
                                    <SelectValue placeholder="All Teachers" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Groups</SelectItem>
                                    {schools.map((school) => (
                                        <SelectItem key={school} value={school}>
                                            {school} ({teachersByGroup[school].length} teachers)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search teacher by name..."
                                className="pl-8"
                                value={teacherSearchQuery}
                                onChange={(e) => setTeacherSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="border rounded-lg p-4 max-h-64 overflow-y-auto bg-muted/20">
                            <div className="space-y-2">
                                {(selectedSchool && selectedSchool !== "all" ? teachersByGroup[selectedSchool] : teachers)
                                    .filter(t =>
                                        t.fullName.toLowerCase().includes(teacherSearchQuery.toLowerCase()) ||
                                        t.email.toLowerCase().includes(teacherSearchQuery.toLowerCase())
                                    )
                                    .map((teacher) => (
                                        <div
                                            key={teacher.id}
                                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-background cursor-pointer transition-colors"
                                            onClick={() => toggleTeacherSelection(teacher.id)}
                                        >
                                            <Checkbox
                                                checked={selectedTeachers.includes(teacher.id)}
                                                onCheckedChange={() => toggleTeacherSelection(teacher.id)}
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{teacher.fullName}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {teacher.email} • {teacher.department || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                {(selectedSchool && selectedSchool !== "all" ? teachersByGroup[selectedSchool] : teachers)
                                    .filter(t =>
                                        t.fullName.toLowerCase().includes(teacherSearchQuery.toLowerCase()) ||
                                        t.email.toLowerCase().includes(teacherSearchQuery.toLowerCase())
                                    ).length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No teachers found matching "{teacherSearchQuery}"
                                        </div>
                                    )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>{selectedTeachers.length} teachers selected</span>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setSelectedTeachers([])}>Clear</Button>
                                <Button variant="ghost" size="sm" onClick={() => {
                                    const ts = (selectedSchool && selectedSchool !== "all" ? teachersByGroup[selectedSchool] : teachers)
                                        .filter(t => t.fullName.toLowerCase().includes(teacherSearchQuery.toLowerCase()));
                                    setSelectedTeachers([...new Set([...selectedTeachers, ...ts.map(t => t.id)])]);
                                }}>Select All Visible</Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAssignDocument} disabled={selectedTeachers.length === 0}>
                            <Send className="w-4 h-4 mr-2" />
                            Assign to {selectedTeachers.length} Teacher{selectedTeachers.length !== 1 ? 's' : ''}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
