import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Search, Plus, BookOpen, Clock, Users, MoreHorizontal, Filter, Edit, Trash2, Eye, FileText, User, Share2, Calendar, ShieldCheck, Download, ChevronRight
} from "lucide-react";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { courseService } from "@/services/courseService";
import { getSocket } from "@/lib/socket";


// Courses will be fetched from API or loaded from localStorage for downloadables
const initialCourses: any[] = [];

// Enrolled members will be fetched from API
const mockEnrolledMembers: Record<string, any[]> = {};

export function CourseManagementView() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<any[]>([]);
    const [pendingCourses, setPendingCourses] = useState<any[]>([]);

    // Unified course fetching
    const fetchCourses = async () => {
        try {
            const data = await courseService.getAllCourses();
            setCourses(data);
        } catch (error) {
            console.error("Failed to fetch courses", error);
            toast.error("Failed to load course catalogue");
        }
    };

    useEffect(() => {
        const socket = getSocket();
        socket.on('course:created', fetchCourses);
        socket.on('course:updated', fetchCourses);
        socket.on('course:deleted', fetchCourses);

        const fetchPending = async () => {
            try {
                const pending = await courseService.getAllCourses('PENDING_APPROVAL');
                setPendingCourses(pending);
            } catch (error) {
                console.error("Failed to fetch pending courses", error);
            }
        };

        fetchPending();
        fetchCourses();

        // Listen for internal updates if needed, though API is source of truth
        window.addEventListener('courses-updated', fetchCourses);
        return () => {
            window.removeEventListener('courses-updated', fetchCourses);
            socket.off('course:created', fetchCourses);
            socket.off('course:updated', fetchCourses);
            socket.off('course:deleted', fetchCourses);
        };
    }, []);

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [showEnrolledTable, setShowEnrolledTable] = useState(false);
    const [isDownloadableOpen, setIsDownloadableOpen] = useState(false);
    const [currentCourse, setCurrentCourse] = useState<any>(null);
    const [detailCourse, setDetailCourse] = useState<any>(null);
    const [newCourse, setNewCourse] = useState({ title: "", category: "Pedagogy", hours: "2", instructor: "TBD", status: "Active", url: "" });
    const [downloadableResource, setDownloadableResource] = useState({ title: "", type: "link", url: "", description: "" });

    const handleAddCourse = async () => {
        if (!newCourse.title) {
            toast.error("Please enter a course title");
            return;
        }
        try {
            const courseData = {
                title: newCourse.title,
                category: newCourse.category,
                hours: parseInt(newCourse.hours),
                instructor: newCourse.instructor || "TBD",
                status: (newCourse.status || "Draft") as any,
                url: newCourse.url
            };
            const createdCourse = await courseService.createCourse(courseData);
            setCourses([createdCourse, ...courses]);
            setIsAddOpen(false);
            setNewCourse({ title: "", category: "Pedagogy", hours: "2", instructor: "TBD", status: "Active", url: "" });
            toast.success("Course added successfully");
        } catch (error) {
            toast.error("Failed to add course");
        }
    };

    const handleEditCourse = async () => {
        if (!currentCourse?.title) {
            toast.error("Please enter a course title");
            return;
        }
        try {
            // Sanitize payload to only include updatable fields
            const updatePayload = {
                title: currentCourse.title,
                category: currentCourse.category,
                hours: Number(currentCourse.hours),
                instructor: currentCourse.instructor,
                status: currentCourse.status,
                description: currentCourse.description,
                url: currentCourse.url,
                isDownloadable: currentCourse.isDownloadable
            };

            const updatedCourse = await courseService.updateCourse(currentCourse.id, updatePayload);
            setCourses(courses.map(c => c.id === updatedCourse.id ? updatedCourse : c));
            setIsEditOpen(false);
            toast.success("Course updated successfully");
        } catch (error) {
            console.error("Failed to update course:", error);
            toast.error("Failed to update course");
        }
    };

    const handleDeleteCourse = async () => {
        if (!currentCourse) return;
        try {
            await courseService.deleteCourse(currentCourse.id);
            setCourses(courses.filter(c => c.id !== currentCourse.id));
            setIsDeleteOpen(false);
            toast.success("Course deleted successfully");
        } catch (error) {
            toast.error("Failed to delete course");
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await courseService.updateCourse(id, { status: newStatus as any });
            setCourses(courses.map(c => c.id === id ? { ...c, status: newStatus } : c));
            toast.success(`Status updated to ${newStatus}`);
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader
                title="Course Catalogue"
                subtitle="Manage professional development courses and workshops"
                actions={
                    <div className="flex gap-2">
                        <Button onClick={() => navigate("../festival")} variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5 text-primary">
                            <Calendar className="w-4 h-4" />
                            Learning Festival
                        </Button>
                        <Button variant="outline" className="gap-2" onClick={() => setIsDownloadableOpen(true)}>
                            <Download className="w-4 h-4" />
                            Downloadable Course
                        </Button>
                        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add New Course
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Course</DialogTitle>
                                    <DialogDescription>Create a new professional development course.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="title">Course Title</Label>
                                        <Input id="title" value={newCourse.title} onChange={e => setNewCourse({ ...newCourse, title: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="category">Category</Label>
                                            <Select value={newCourse.category} onValueChange={v => setNewCourse({ ...newCourse, category: v })}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Pedagogy">Pedagogy</SelectItem>
                                                    <SelectItem value="Technology">Technology</SelectItem>
                                                    <SelectItem value="Assessment">Assessment</SelectItem>
                                                    <SelectItem value="Culture">Culture</SelectItem>
                                                    <SelectItem value="Compliance">Compliance</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="hours">PD Hours</Label>
                                            <Input id="hours" type="number" value={newCourse.hours} onChange={e => setNewCourse({ ...newCourse, hours: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="instructor">Instructor</Label>
                                            <Input id="instructor" value={newCourse.instructor} onChange={e => setNewCourse({ ...newCourse, instructor: e.target.value })} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="status">Initial Status</Label>
                                            <Select value={newCourse.status} onValueChange={v => setNewCourse({ ...newCourse, status: v })}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Active">Active</SelectItem>
                                                    <SelectItem value="Draft">Draft</SelectItem>
                                                    <SelectItem value="Mandatory">Mandatory</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="course-url">Course Link / Video URL (Optional)</Label>
                                        <Input
                                            id="course-url"
                                            placeholder="https://..."
                                            value={newCourse.url}
                                            onChange={e => setNewCourse({ ...newCourse, url: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                    <Button onClick={handleAddCourse}>Add Course</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                }
            />

            {/* Downloadable Course Upload Dialog */}
            <Dialog open={isDownloadableOpen} onOpenChange={setIsDownloadableOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Upload Downloadable Course</DialogTitle>
                        <DialogDescription>Add a course link or video resource for teachers to access</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="resource-title">Course Title</Label>
                            <Input
                                id="resource-title"
                                placeholder="e.g., Advanced Classroom Management Techniques"
                                value={downloadableResource.title}
                                onChange={e => setDownloadableResource({ ...downloadableResource, title: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="resource-type">Resource Type</Label>
                            <Select value={downloadableResource.type} onValueChange={v => setDownloadableResource({ ...downloadableResource, type: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="link">Course Link</SelectItem>
                                    <SelectItem value="video">Video URL</SelectItem>
                                    <SelectItem value="document">Document URL</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="resource-url">
                                {downloadableResource.type === 'video' ? 'Video URL' : downloadableResource.type === 'document' ? 'Document URL' : 'Course Link'}
                            </Label>
                            <Input
                                id="resource-url"
                                type="url"
                                placeholder={downloadableResource.type === 'video' ? 'https://youtube.com/...' : 'https://...'}
                                value={downloadableResource.url}
                                onChange={e => setDownloadableResource({ ...downloadableResource, url: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="resource-description">Description</Label>
                            <Input
                                id="resource-description"
                                placeholder="Brief description of the course content"
                                value={downloadableResource.description}
                                onChange={e => setDownloadableResource({ ...downloadableResource, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDownloadableOpen(false)}>Cancel</Button>
                        <Button onClick={async () => {
                            if (!downloadableResource.title || !downloadableResource.url) {
                                toast.error("Please fill in all required fields");
                                return;
                            }

                            try {
                                await courseService.createCourse({
                                    title: downloadableResource.title,
                                    category: "Downloadable Course",
                                    hours: 0,
                                    instructor: "Admin",
                                    status: "Active",
                                    url: downloadableResource.url,
                                    description: downloadableResource.description,
                                    isDownloadable: true
                                });

                                toast.success("Resource uploaded safely to server!");
                                setDownloadableResource({ title: "", type: "link", url: "", description: "" });
                                setIsDownloadableOpen(false);
                                fetchCourses();
                            } catch (e) {
                                toast.error("Failed to upload resource to server");
                            }
                        }}>Upload Resource</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search courses..." className="pl-8" />
                </div>
                <Button variant="outline" size="icon">
                    <Filter className="w-4 h-4" />
                </Button>
            </div>

            {pendingCourses.length > 0 && (
                <Card className="border-orange-200 bg-orange-50 mb-6 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-orange-800 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5" />
                            Pending Course Approvals
                        </CardTitle>
                        <CardDescription className="text-orange-600">
                            The following courses have been proposed by School Leaders and require your approval.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {pendingCourses.map(course => (
                                <div key={course.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-orange-100 shadow-sm">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-foreground">{course.title}</h4>
                                            <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                                                {course.category}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-4">
                                            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {course.instructor}</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.hours}h</span>
                                        </div>
                                        {course.description && (
                                            <p className="text-xs text-muted-foreground mt-2 max-w-2xl whitespace-pre-wrap">
                                                {course.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                            onClick={async () => {
                                                if (confirm("Are you sure you want to reject this course proposal?")) {
                                                    try {
                                                        await courseService.deleteCourse(course.id);
                                                        setPendingCourses(prev => prev.filter(c => c.id !== course.id));
                                                        toast.success("Course proposal rejected.");
                                                    } catch (e) {
                                                        toast.error("Failed to reject course.");
                                                    }
                                                }
                                            }}
                                        >
                                            Reject
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            onClick={async () => {
                                                try {
                                                    await courseService.updateCourse(course.id, { status: "Active" });
                                                    setPendingCourses(prev => prev.filter(c => c.id !== course.id));
                                                    // Optionally refresh main list or add to it strictly if we are using real data fully
                                                    toast.success("Course approved and added to catalogue!");
                                                } catch (e) {
                                                    toast.error("Failed to approve course.");
                                                }
                                            }}
                                        >
                                            Approve
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="border-none shadow-md">
                <CardContent className="p-0 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Course Title</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>PD Hours</TableHead>
                                <TableHead>Instructor</TableHead>
                                <TableHead>Enrolled</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {courses.map((course) => (
                                <TableRow key={course.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 rounded bg-primary/10 text-primary">
                                                <BookOpen className="w-4 h-4" />
                                            </div>
                                            {course.title}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{course.category}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <Clock className="w-3 h-3" /> {course.hours}h
                                        </div>
                                    </TableCell>
                                    <TableCell>{course.instructor}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Users className="w-3 h-3 text-muted-foreground" /> {course.enrolled}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={course.status === 'Active' ? 'default' : course.status === 'Draft' ? 'secondary' : 'destructive'}
                                            className={course.status === 'Active' ? 'bg-green-600' : ''}
                                        >
                                            {course.status} {/* status: course.status as any, // Bypass strict literal check for API safety */}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => { setDetailCourse(course); setIsDetailOpen(true); }}>
                                                    <Eye className="w-4 h-4 mr-2" /> View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => { setCurrentCourse(course); setIsEditOpen(true); }}>
                                                    <Edit className="w-4 h-4 mr-2" /> Edit Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange(course.id, course.status === 'Active' ? 'Draft' : 'Active')}>
                                                    <ShieldCheck className="w-4 h-4 mr-2" /> Toggle Status
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => { setCurrentCourse(course); setIsDeleteOpen(true); }}>
                                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Course</DialogTitle>
                        <DialogDescription>Modify professional development course details.</DialogDescription>
                    </DialogHeader>
                    {currentCourse && (
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-title">Course Title</Label>
                                <Input id="edit-title" value={currentCourse.title} onChange={e => setCurrentCourse({ ...currentCourse, title: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-category">Category</Label>
                                    <Select value={currentCourse.category} onValueChange={v => setCurrentCourse({ ...currentCourse, category: v })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Pedagogy">Pedagogy</SelectItem>
                                            <SelectItem value="Technology">Technology</SelectItem>
                                            <SelectItem value="Assessment">Assessment</SelectItem>
                                            <SelectItem value="Culture">Culture</SelectItem>
                                            <SelectItem value="Compliance">Compliance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-hours">PD Hours</Label>
                                    <Input id="edit-hours" type="number" value={currentCourse.hours} onChange={e => setCurrentCourse({ ...currentCourse, hours: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-status">Status</Label>
                                <Select value={currentCourse.status} onValueChange={v => setCurrentCourse({ ...currentCourse, status: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Draft">Draft</SelectItem>
                                        <SelectItem value="Mandatory">Mandatory</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-url">Course Link / Video URL</Label>
                                <Input
                                    id="edit-url"
                                    value={currentCourse.url || ''}
                                    onChange={e => setCurrentCourse({ ...currentCourse, url: e.target.value })}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleEditCourse}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{currentCourse?.title}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteCourse}>Confirm Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Detail View Dialog */}
            {detailCourse && (
                <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                    <DialogContent className="max-w-4xl bg-background/95 backdrop-blur-xl border-none">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                <BookOpen className="w-6 h-6 text-primary" />
                                Course Details
                            </DialogTitle>
                            <DialogDescription>
                                Comprehensive overview of the professional development course
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 pt-4">
                            {/* Header Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-blue-50/80 text-xs font-medium mb-1">PD Hours</p>
                                                <p className="text-2xl font-bold">{detailCourse.hours}h</p>
                                            </div>
                                            <Clock className="w-8 h-8 text-blue-50/50" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-purple-50/80 text-xs font-medium mb-1">Enrolled</p>
                                                <p className="text-2xl font-bold">{detailCourse.enrolled}</p>
                                            </div>
                                            <Users className="w-8 h-8 text-purple-50/50" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className={`border-none shadow-lg text-white ${detailCourse.status === 'Active'
                                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                                    : detailCourse.status === 'Draft'
                                        ? 'bg-gradient-to-br from-gray-500 to-gray-600'
                                        : 'bg-gradient-to-br from-red-500 to-red-600'
                                    }`}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className={`text-xs font-medium mb-1 ${detailCourse.status === 'Active' ? 'text-emerald-50/80' :
                                                    detailCourse.status === 'Draft' ? 'text-gray-50/80' : 'text-red-50/80'
                                                    }`}>Status</p>
                                                <p className="text-xl font-bold">{detailCourse.status}</p>
                                            </div>
                                            <ShieldCheck className={`w-8 h-8 ${detailCourse.status === 'Active' ? 'text-emerald-50/50' :
                                                detailCourse.status === 'Draft' ? 'text-gray-50/50' : 'text-red-50/50'
                                                }`} />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Main Details */}
                            <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <FileText className="w-5 h-5 text-primary" />
                                        <h3 className="text-lg font-semibold">Course Information</h3>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Course Title</Label>
                                            <p className="text-lg font-semibold text-foreground">{detailCourse.title}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Category</Label>
                                            <div>
                                                <Badge className="text-sm py-1 px-3">{detailCourse.category}</Badge>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Instructor</Label>
                                            <p className="text-base font-medium flex items-center gap-2">
                                                <User className="w-4 h-4 text-muted-foreground" />
                                                {detailCourse.instructor}
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Enrolled</Label>
                                            <Button
                                                variant="ghost"
                                                className="h-auto p-0 font-medium flex items-center gap-2 hover:text-primary transition-colors"
                                                onClick={() => setShowEnrolledTable(!showEnrolledTable)}
                                            >
                                                <Users className="w-4 h-4 text-muted-foreground" />
                                                {detailCourse.enrolled} Teachers
                                                <ChevronRight className={`w-4 h-4 transition-transform ${showEnrolledTable ? 'rotate-90' : ''}`} />
                                            </Button>
                                        </div>

                                        {detailCourse.url && (
                                            <div className="space-y-2 col-span-2">
                                                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Course Link</Label>
                                                <div className="flex items-center gap-2">
                                                    <a
                                                        href={detailCourse.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary hover:underline flex items-center gap-1"
                                                    >
                                                        {detailCourse.url}
                                                        <Share2 className="w-3 h-3" />
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Enrolled Members Table */}
                            {showEnrolledTable && mockEnrolledMembers[detailCourse.id as keyof typeof mockEnrolledMembers] && (
                                <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-5 h-5 text-primary" />
                                                <h3 className="text-lg font-semibold">Enrolled Members</h3>
                                            </div>
                                            <Badge variant="outline">{mockEnrolledMembers[detailCourse.id as keyof typeof mockEnrolledMembers].length} Total</Badge>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead>Email</TableHead>
                                                        <TableHead>Department</TableHead>
                                                        <TableHead>Enrolled Date</TableHead>
                                                        <TableHead>Progress</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {mockEnrolledMembers[detailCourse.id as keyof typeof mockEnrolledMembers].map((member: any) => (
                                                        <TableRow key={member.id}>
                                                            <TableCell className="font-medium">{member.name}</TableCell>
                                                            <TableCell className="text-muted-foreground">{member.email}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline">{member.department}</Badge>
                                                            </TableCell>
                                                            <TableCell className="text-muted-foreground">{member.enrolledDate}</TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-primary transition-all"
                                                                            style={{ width: `${member.progress}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-sm font-medium">{member.progress}%</span>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        <DialogFooter className="flex justify-between items-center pt-4 border-t">
                            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                                Close
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="outline" className="gap-2" onClick={() => { setIsDetailOpen(false); setCurrentCourse(detailCourse); setIsEditOpen(true); }}>
                                    <Edit className="w-4 h-4" />
                                    Edit Course
                                </Button>
                                <Button className="gap-2">
                                    <Share2 className="w-4 h-4" />
                                    Share
                                </Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
