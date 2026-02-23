import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Search, Plus, MoreVertical, Shield, Mail, Pencil, Trash2, UserCheck, UserX, Users
} from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { StatCard } from "@/components/StatCard";
import api from "@/lib/api";


interface User {
    id: string;
    fullName: string;
    email: string;
    role: string;
    campusId: string | null;
    department: string | null;
    status: string;
    lastActive: string | null;
}

// Initial users will be fetched from API
const initialUsers: User[] = [];

export function UserManagementView() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = useState(false);
    const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
    const [newUser, setNewUser] = useState({ fullName: "", email: "", password: "", role: "TEACHER", campusId: "" });
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState("all");
    const [campusFilter, setCampusFilter] = useState("all");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/users');

            console.log("User fetch response:", response.data);

            if (response.data.status === "success") {
                console.log("Setting users:", response.data.data.users);
                setUsers(response.data.data.users);
            } else {
                console.warn("User fetch returned status:", response.data.status);
            }
        } catch (error: any) {
            console.error("Error fetching users:", error);
            if (error.response) {
                console.error("Error response data:", error.response.data);
                console.error("Error response status:", error.response.status);
            }
            toast.error("Failed to load users: " + (error.response?.data?.message || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    const uniqueCampuses = Array.from(new Set(users.map(user => user.campusId).filter(Boolean)));

    const teacherCount = users.filter(u => u.role === "TEACHER").length;
    const leaderCount = users.filter(u => u.role === "LEADER" || u.role === "SCHOOL_LEADER").length;

    const filteredUsers = users.filter(user => {
        // Exclude Superadmin and Management roles from view
        if (user.role === 'SUPERADMIN' || user.role === 'MANAGEMENT') return false;

        const matchesSearch = user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.role.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesTab = true;
        if (activeTab === "leader") matchesTab = user.role === "LEADER" || user.role === "SCHOOL_LEADER";
        if (activeTab === "teacher") matchesTab = user.role === "TEACHER";

        let matchesCampus = true;
        if (campusFilter !== "all") matchesCampus = user.campusId === campusFilter;

        return matchesSearch && matchesTab && matchesCampus;
    });

    const [actionLoading, setActionLoading] = useState(false);

    const handleAddUser = async () => {
        if (!newUser.fullName || !newUser.email || !newUser.campusId) {
            toast.error("Please fill in all fields");
            return;
        }
        setActionLoading(true);
        try {
            const response = await api.post('/users', newUser);
            if (response.data?.status === "success") {
                toast.success("User added successfully");
                setIsAddDialogOpen(false);
                setNewUser({ fullName: "", email: "", password: "", role: "TEACHER", campusId: "" });
                await fetchUsers();
            } else {
                toast.error("Failed to add user");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to add user");
        } finally {
            setActionLoading(false);
        }
    };

    const handleEditUser = async () => {
        if (!editingUser) return;
        setActionLoading(true);
        try {
            const response = await api.patch(`/users/${editingUser.id}`, {
                fullName: editingUser.fullName,
                role: editingUser.role,
                campusId: editingUser.campusId,
            });
            if (response.data?.status === "success") {
                toast.success("User updated successfully");
                setIsEditDialogOpen(false);
                setEditingUser(null);
                await fetchUsers();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update user");
        } finally {
            setActionLoading(false);
        }
    };

    const handleChangeRole = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        try {
            const response = await api.patch(`/users/${selectedUser.id}`, { role: selectedUser.role });
            if (response.data?.status === "success") {
                toast.success(`Role updated to ${selectedUser.role} for ${selectedUser.fullName}`);
                setIsChangeRoleDialogOpen(false);
                setSelectedUser(null);
                await fetchUsers();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update role");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeactivate = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        const newStatus = selectedUser.status === "Active" ? "Inactive" : "Active";
        try {
            const response = await api.patch(`/users/${selectedUser.id}`, { status: newStatus });
            if (response.data?.status === "success") {
                toast.success(`User ${newStatus === "Active" ? "activated" : "deactivated"} successfully`);
                setIsDeactivateDialogOpen(false);
                setSelectedUser(null);
                await fetchUsers();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update status");
        } finally {
            setActionLoading(false);
        }
    };

    const handleAction = (action: string, user: User) => {
        if (action === "Edit Details") {
            setEditingUser(user);
            setIsEditDialogOpen(true);
        } else if (action === "Change Role") {
            setSelectedUser(user);
            setIsChangeRoleDialogOpen(true);
        } else if (action === "Deactivate" || action === "Activate") {
            setSelectedUser(user);
            setIsDeactivateDialogOpen(true);
        } else if (action === "View Profile") {
            navigate(`/admin/profile/${user.id}`);
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader
                title="User Management"
                subtitle="Manage user accounts, roles, and access permissions"
                actions={
                    <>
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add New User
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New User</DialogTitle>
                                    <DialogDescription>Create a new account for a staff member.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input id="name" value={newUser.fullName} onChange={e => setNewUser({ ...newUser, fullName: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input id="email" type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input id="password" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder="Enter initial password" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="role">Role</Label>
                                            <Select value={newUser.role} onValueChange={v => setNewUser({ ...newUser, role: v })}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="TEACHER">Teacher</SelectItem>
                                                    <SelectItem value="SCHOOL_LEADER">School Leader</SelectItem>
                                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="campus">Campus</Label>
                                            <Select value={newUser.campusId} onValueChange={v => setNewUser({ ...newUser, campusId: v })}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select campus" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Main Campus">Main Campus</SelectItem>
                                                    <SelectItem value="North Campus">North Campus</SelectItem>
                                                    <SelectItem value="South Campus">South Campus</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={actionLoading}>Cancel</Button>
                                    <Button onClick={handleAddUser} disabled={actionLoading}>{actionLoading ? "Creating..." : "Create User"}</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit User</DialogTitle>
                                    <DialogDescription>Update account details for staff member.</DialogDescription>
                                </DialogHeader>
                                {editingUser && (
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-name">Full Name</Label>
                                            <Input id="edit-name" value={editingUser.fullName} onChange={e => setEditingUser({ ...editingUser, fullName: e.target.value })} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-email">Email Address</Label>
                                            <Input id="edit-email" type="email" value={editingUser.email} disabled />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="edit-role">Role</Label>
                                                <Select value={editingUser.role} onValueChange={v => setEditingUser({ ...editingUser, role: v })}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select role" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="TEACHER">Teacher</SelectItem>
                                                        <SelectItem value="SCHOOL_LEADER">School Leader</SelectItem>
                                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="edit-campus">Campus</Label>
                                                <Select value={editingUser.campusId || ""} onValueChange={v => setEditingUser({ ...editingUser, campusId: v })}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select campus" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Main Campus">Main Campus</SelectItem>
                                                        <SelectItem value="North Campus">North Campus</SelectItem>
                                                        <SelectItem value="South Campus">South Campus</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={actionLoading}>Cancel</Button>
                                    <Button onClick={handleEditUser} disabled={actionLoading}>{actionLoading ? "Saving..." : "Save Changes"}</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Change Role Dialog */}
                        <Dialog open={isChangeRoleDialogOpen} onOpenChange={setIsChangeRoleDialogOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Change User Role</DialogTitle>
                                    <DialogDescription>Update the role for this user account.</DialogDescription>
                                </DialogHeader>
                                {selectedUser && (
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label>User</Label>
                                            <div className="flex flex-col gap-1 p-3 bg-muted rounded-md">
                                                <span className="font-medium">{selectedUser.fullName}</span>
                                                <span className="text-sm text-muted-foreground">{selectedUser.email}</span>
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="change-role">New Role</Label>
                                            <Select value={selectedUser.role} onValueChange={v => setSelectedUser({ ...selectedUser, role: v })}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="TEACHER">Teacher</SelectItem>
                                                    <SelectItem value="SCHOOL_LEADER">School Leader</SelectItem>
                                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsChangeRoleDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={handleChangeRole}>Update Role</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Deactivate/Activate Confirmation Dialog */}
                        <Dialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        {selectedUser?.status === "Active" ? "Deactivate User" : "Activate User"}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {selectedUser?.status === "Active"
                                            ? "This user will no longer be able to access the system. You can reactivate them later."
                                            : "This user will regain access to the system."}
                                    </DialogDescription>
                                </DialogHeader>
                                {selectedUser && (
                                    <div className="grid gap-4 py-4">
                                        <div className="flex flex-col gap-1 p-3 bg-muted rounded-md">
                                            <span className="font-medium">{selectedUser.fullName}</span>
                                            <span className="text-sm text-muted-foreground">{selectedUser.email}</span>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Badge variant="outline" className="w-fit">
                                                    <Shield className="w-3 h-3 mr-1" />
                                                    {selectedUser.role}
                                                </Badge>
                                                <Badge variant={selectedUser.status === "Active" ? "default" : "secondary"} className={selectedUser.status === "Active" ? "bg-green-600 font-normal" : "font-normal"}>
                                                    {selectedUser.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsDeactivateDialogOpen(false)}>Cancel</Button>
                                    <Button
                                        variant={selectedUser?.status === "Active" ? "destructive" : "default"}
                                        onClick={handleDeactivate}
                                    >
                                        {selectedUser?.status === "Active" ? "Deactivate User" : "Activate User"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </>
                }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                    title="Total Teachers"
                    value={teacherCount}
                    subtitle="Active staff"
                    icon={Users}
                    onClick={() => { }}
                />
                <StatCard
                    title="Total Leaders"
                    value={leaderCount}
                    subtitle="School leadership"
                    icon={Shield}
                    onClick={() => { }}
                />
                <StatCard
                    title="Active Campuses"
                    value={uniqueCampuses.length}
                    subtitle="Current coverage"
                    icon={Search}
                    onClick={() => { }}
                />
                <StatCard
                    title="System Health"
                    value="Optimal"
                    subtitle="Platform status"
                    icon={Search}
                    onClick={() => { }}
                />
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full md:w-[400px]">
                    <TabsList>
                        <TabsTrigger value="all">All Users</TabsTrigger>
                        <TabsTrigger value="leader">Leaders</TabsTrigger>
                        <TabsTrigger value="teacher">Teachers</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Select value={campusFilter} onValueChange={setCampusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Campuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Campuses</SelectItem>
                            {uniqueCampuses.map(campus => (
                                <SelectItem key={campus} value={campus}>{campus}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <Card className="border-none shadow-md">
                <CardContent className="p-0">
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Campus</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Active</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{user.fullName}</span>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Mail className="w-3 h-3" /> {user.email}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="flex w-fit items-center gap-1">
                                                <Shield className="w-3 h-3" />
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{user.campusId || "N/A"}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.status === "Active" ? "default" : "secondary"} className={user.status === "Active" ? "bg-green-600 hover:bg-green-700 font-normal" : "font-normal"}>
                                                {user.status === "Active" ? <UserCheck className="w-3 h-3 mr-1" /> : <UserX className="w-3 h-3 mr-1" />}
                                                {user.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{user.lastActive || "Never"}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    {user.role === "TEACHER" && (
                                                        <DropdownMenuItem onClick={() => handleAction("View Profile", user)}>
                                                            <Users className="w-4 h-4 mr-2" /> View Performance Profile
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem onClick={() => handleAction("Edit Details", user)}>
                                                        <Pencil className="w-4 h-4 mr-2" /> Edit Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleAction("Change Role", user)}>
                                                        <Shield className="w-4 h-4 mr-2" /> Change Role
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className={user.status === "Active" ? "text-red-600 focus:text-red-600" : "text-green-600 focus:text-green-600"}
                                                        onClick={() => handleAction(user.status === "Active" ? "Deactivate" : "Activate", user)}
                                                    >
                                                        {user.status === "Active" ? (
                                                            <>
                                                                <UserX className="w-4 h-4 mr-2" /> Deactivate
                                                            </>
                                                        ) : (
                                                            <>
                                                                <UserCheck className="w-4 h-4 mr-2" /> Activate
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
