import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
    Download,
    Trash2,
    Edit,
    Send,
    AlertCircle,
    Filter,
    Search,
    Plus,
    FileCheck,
    TrendingUp,
    BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

// Mock data for documents
const mockDocuments = [
    {
        id: "1",
        title: "Code of Conduct 2025",
        description: "Updated code of conduct for all teaching staff",
        version: "2.0",
        createdAt: "2025-01-15",
        createdBy: "Admin User",
        requiresSignature: true,
        fileName: "code-of-conduct-2025.pdf",
        fileSize: 245000,
        assignedTo: 45,
        acknowledged: 32,
        pending: 13,
        status: "Active",
    },
    {
        id: "2",
        title: "Safety Guidelines",
        description: "Classroom and campus safety procedures",
        version: "1.5",
        createdAt: "2025-01-10",
        createdBy: "Admin User",
        requiresSignature: false,
        fileName: "safety-guidelines.pdf",
        fileSize: 180000,
        assignedTo: 45,
        acknowledged: 45,
        pending: 0,
        status: "Active",
    },
    {
        id: "3",
        title: "Data Privacy Policy",
        description: "Student data handling and privacy guidelines",
        version: "1.0",
        createdAt: "2024-12-20",
        createdBy: "Admin User",
        requiresSignature: true,
        fileName: "data-privacy-policy.pdf",
        fileSize: 320000,
        assignedTo: 45,
        acknowledged: 43,
        pending: 2,
        status: "Active",
    },
    {
        id: "4",
        title: "Professional Development Guidelines",
        description: "PD requirements and tracking procedures",
        version: "1.0",
        createdAt: "2025-02-01",
        createdBy: "Admin User",
        requiresSignature: false,
        fileName: "pd-guidelines.pdf",
        fileSize: 156000,
        assignedTo: 45,
        acknowledged: 28,
        pending: 17,
        status: "Active",
    },
];

// Mock teachers data organized by school
const mockTeachers = [
    { id: "1", name: "Teacher One", email: "teacher1.btmlayout@pdi.com", department: "Mathematics", school: "Ekya ITPL" },
    { id: "2", name: "Teacher Two", email: "teacher2.jpnagar@pdi.com", department: "Science", school: "Ekya ITPL" },
    { id: "3", name: "Teacher Three", email: "teacher3.itpl@pdi.com", department: "English", school: "Ekya ITPL" },
    { id: "4", name: "Bharath", email: "bharath.superadmin@pdi.com", department: "History", school: "Ekya JP Nagar" },
    { id: "5", name: "Staff Member 1", email: "staff1@pdi.com", department: "Arts", school: "Ekya JP Nagar" },
    { id: "6", name: "Staff Member 2", email: "staff2@pdi.com", department: "Mathematics", school: "Ekya JP Nagar" },
    { id: "7", name: "Staff Member 3", email: "staff3@pdi.com", department: "Science", school: "Ekya Byrathi" },
    { id: "8", name: "Staff Member 4", email: "staff4@pdi.com", department: "English", school: "Ekya Byrathi" },
    { id: "9", name: "Staff Member 5", email: "staff5@pdi.com", department: "History", school: "Ekya Byrathi" },
    { id: "10", name: "Staff Member 6", email: "staff6@pdi.com", department: "Physical Education", school: "Ekya Neeladri" },
    { id: "11", name: "Staff Member 7", email: "staff7@pdi.com", department: "Arts", school: "Ekya Neeladri" },
    { id: "12", name: "Staff Member 8", email: "staff8@pdi.com", department: "Mathematics", school: "Ekya Neeladri" },
];

// Group teachers by school
const teachersBySchool = mockTeachers.reduce((acc, teacher) => {
    if (!acc[teacher.school]) {
        acc[teacher.school] = [];
    }
    acc[teacher.school].push(teacher);
    return acc;
}, {} as Record<string, typeof mockTeachers>);

const schools = Object.keys(teachersBySchool).sort();

// Mock acknowledgement tracking
const mockAcknowledgements = [
    {
        id: "1",
        documentTitle: "Code of Conduct 2025",
        teacherName: "Teacher One",
        status: "ACKNOWLEDGED",
        viewedAt: "2025-01-16T10:30:00",
        acknowledgedAt: "2025-01-16T10:35:00",
        ipAddress: "192.168.1.100",
    },
    {
        id: "2",
        documentTitle: "Code of Conduct 2025",
        teacherName: "Teacher Two",
        status: "PENDING",
        viewedAt: null,
        acknowledgedAt: null,
        ipAddress: null,
    },
    {
        id: "3",
        documentTitle: "Safety Guidelines",
        teacherName: "Teacher Three",
        status: "SIGNED",
        viewedAt: "2025-01-11T09:15:00",
        acknowledgedAt: "2025-01-11T09:20:00",
        ipAddress: "192.168.1.101",
    },
];

export default function AdminDocumentManagement() {
    const [documents, setDocuments] = useState(mockDocuments);
    const [selectedDocument, setSelectedDocument] = useState<typeof mockDocuments[0] | null>(null);
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [showAssignDialog, setShowAssignDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState("documents");
    const [selectedSchool, setSelectedSchool] = useState<string>("");

    // New document form state
    const [newDocument, setNewDocument] = useState({
        title: "",
        description: "",
        version: "1.0",
        requiresSignature: false,
        file: null as File | null,
        assignedTeachers: [] as string[],
    });

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

    const handleUploadDocument = () => {
        if (!newDocument.title || !newDocument.file) {
            toast.error("Please provide title and file");
            return;
        }

        const doc = {
            id: String(documents.length + 1),
            title: newDocument.title,
            description: newDocument.description,
            version: newDocument.version,
            createdAt: new Date().toISOString().split('T')[0],
            createdBy: "Admin User",
            requiresSignature: newDocument.requiresSignature,
            fileName: newDocument.file.name,
            fileSize: newDocument.file.size,
            assignedTo: 0,
            acknowledged: 0,
            pending: 0,
            status: "Draft",
        };

        setDocuments([...documents, doc]);
        setShowUploadDialog(false);
        setNewDocument({
            title: "",
            description: "",
            version: "1.0",
            requiresSignature: false,
            file: null,
            assignedTeachers: [],
        });
        setSelectedSchool("");
        toast.success("Document uploaded successfully!");
    };

    const handleAssignDocument = () => {
        if (!selectedDocument || selectedTeachers.length === 0) {
            toast.error("Please select teachers");
            return;
        }

        const updatedDocs = documents.map(doc =>
            doc.id === selectedDocument.id
                ? {
                    ...doc,
                    assignedTo: selectedTeachers.length,
                    pending: selectedTeachers.length,
                    status: "Active",
                }
                : doc
        );

        setDocuments(updatedDocs);
        setShowAssignDialog(false);
        setSelectedTeachers([]);
        toast.success(`Document assigned to ${selectedTeachers.length} teachers`);
    };

    const handleDeleteDocument = (id: string) => {
        setDocuments(documents.filter(doc => doc.id !== id));
        toast.success("Document deleted successfully");
    };

    const toggleTeacherSelection = (teacherId: string) => {
        setSelectedTeachers(prev =>
            prev.includes(teacherId)
                ? prev.filter(id => id !== teacherId)
                : [...prev, teacherId]
        );
    };

    const filteredDocuments = documents.filter(doc =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        totalDocuments: documents.length,
        activeDocuments: documents.filter(d => d.status === "Active").length,
        totalAssignments: documents.reduce((sum, doc) => sum + doc.assignedTo, 0),
        pendingAcknowledgements: documents.reduce((sum, doc) => sum + doc.pending, 0),
        completionRate: documents.reduce((sum, doc) => sum + doc.assignedTo, 0) > 0
            ? Math.round((documents.reduce((sum, doc) => sum + doc.acknowledged, 0) / documents.reduce((sum, doc) => sum + doc.assignedTo, 0)) * 100)
            : 0,
    };

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
                                    {filteredDocuments.map((doc) => {
                                        const progress = doc.assignedTo > 0 ? (doc.acknowledged / doc.assignedTo) * 100 : 0;
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
                                                        <span className="font-medium">{doc.assignedTo}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-muted-foreground">
                                                                {doc.acknowledged}/{doc.assignedTo}
                                                            </span>
                                                            <span className="font-medium">{Math.round(progress)}%</span>
                                                        </div>
                                                        <Progress value={progress} className="h-2" />
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={doc.status === "Active" ? "default" : "secondary"}
                                                        className={doc.status === "Active" ? "bg-green-600" : ""}
                                                    >
                                                        {doc.status}
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
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
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
                                    {mockAcknowledgements.map((ack) => (
                                        <TableRow key={ack.id}>
                                            <TableCell className="font-medium">{ack.teacherName}</TableCell>
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
                                        const progress = doc.assignedTo > 0 ? (doc.acknowledged / doc.assignedTo) * 100 : 0;
                                        return (
                                            <div key={doc.id} className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="font-medium">{doc.title}</span>
                                                    <span className="text-muted-foreground">
                                                        {doc.acknowledged}/{doc.assignedTo}
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
                                            {documents.reduce((sum, doc) => sum + doc.acknowledged, 0)}
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
                                <Label htmlFor="school">Select School</Label>
                                <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                                    <SelectTrigger id="school">
                                        <SelectValue placeholder="Choose a school..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Schools</SelectItem>
                                        {schools.map((school) => (
                                            <SelectItem key={school} value={school}>
                                                {school} ({teachersBySchool[school].length} teachers)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedSchool && (
                                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto bg-muted/20">
                                    <div className="space-y-2">
                                        {(selectedSchool === "all" ? mockTeachers : teachersBySchool[selectedSchool] || []).map((teacher) => (
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
                                                    <div className="font-medium text-sm">{teacher.name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {teacher.school} • {teacher.department}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedSchool && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const teachersToSelect = selectedSchool === "all"
                                                ? mockTeachers
                                                : teachersBySchool[selectedSchool] || [];
                                            setNewDocument({
                                                ...newDocument,
                                                assignedTeachers: teachersToSelect.map(t => t.id)
                                            });
                                        }}
                                    >
                                        Select All
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setNewDocument({
                                                ...newDocument,
                                                assignedTeachers: []
                                            });
                                        }}
                                    >
                                        Clear All
                                    </Button>
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
                        <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                            <div className="space-y-2">
                                {mockTeachers.map((teacher) => (
                                    <div
                                        key={teacher.id}
                                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer"
                                        onClick={() => toggleTeacherSelection(teacher.id)}
                                    >
                                        <Checkbox
                                            checked={selectedTeachers.includes(teacher.id)}
                                            onCheckedChange={() => toggleTeacherSelection(teacher.id)}
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium">{teacher.name}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {teacher.school} • {teacher.department}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <span className="text-sm font-medium">Selected Teachers:</span>
                            <Badge variant="secondary">{selectedTeachers.length}</Badge>
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
