import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { assessmentService } from "@/services/assessmentService";
import { userService, User } from "@/services/userService";
import { toast } from "sonner";
import { X, Users, School, Shield, User as UserIcon, Loader2 } from 'lucide-react';

interface AssessmentAssignmentModalProps {
    assessmentId: string;
    assessmentTitle: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type AssignType = 'ROLE' | 'CAMPUS' | 'USER';

const CAMPUSES = [
    "CMR NPS", "EITPL", "EBYR", "EJPN", "EBTM", "ENICE", "ENAVA",
    "PU BTM", "PU BYR", "PU HRBR", "PU ITPL", "PU NICE", "HO"
];

const ROLES = [
    { label: "Teachers", value: "TEACHER" },
    { label: "School Leaders", value: "SCHOOL_LEADER" },
    { label: "Admins", value: "ADMIN" }
];

export const AssessmentAssignmentModal: React.FC<AssessmentAssignmentModalProps> = ({
    assessmentId,
    assessmentTitle,
    isOpen,
    onClose,
    onSuccess
}) => {
    const [assignTo, setAssignTo] = useState<AssignType>('ROLE');
    const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && assignTo === 'USER' && users.length === 0) {
            loadUsers();
        }
    }, [isOpen, assignTo]);

    const loadUsers = async () => {
        setIsLoadingUsers(true);
        try {
            const data = await userService.getAllUsers();
            setUsers(data);
        } catch (error) {
            toast.error("Failed to load users");
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const toggleTarget = (targetId: string) => {
        setSelectedTargets(prev =>
            prev.includes(targetId)
                ? prev.filter(id => id !== targetId)
                : [...prev, targetId]
        );
    };

    const handleAssign = async () => {
        if (selectedTargets.length === 0) {
            return toast.error("Please select at least one target");
        }

        setIsSubmitting(true);
        try {
            await assessmentService.assignAssessment(assessmentId, selectedTargets, assignTo);
            toast.success(`Assessment assigned successfully!`);
            onSuccess();
        } catch (error) {
            toast.error("Failed to assign assessment");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary" />
                        Assign Assessment
                    </DialogTitle>
                    <DialogDescription>
                        Assign <span className="font-semibold text-zinc-900">"{assessmentTitle}"</span> to specific groups or users.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label>Assign To Type</Label>
                        <Select value={assignTo} onValueChange={(val: AssignType) => {
                            setAssignTo(val);
                            setSelectedTargets([]);
                        }}>
                            <SelectTrigger className="rounded-xl h-11">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ROLE">Specific Roles</SelectItem>
                                <SelectItem value="CAMPUS">Specific Campuses</SelectItem>
                                <SelectItem value="USER">Specific Individual Users</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <Label className="flex justify-between items-center">
                            <span>Select Targets</span>
                            <span className="text-xs text-zinc-500 font-normal">{selectedTargets.length} selected</span>
                        </Label>

                        <ScrollArea className="h-[250px] w-full rounded-xl border p-4 bg-zinc-50/50">
                            {assignTo === 'ROLE' && (
                                <div className="space-y-3">
                                    {ROLES.map(role => (
                                        <div key={role.value} className="flex items-center space-x-3 p-2 hover:bg-white rounded-lg transition-colors cursor-pointer" onClick={() => toggleTarget(role.value)}>
                                            <Checkbox id={`role-${role.value}`} checked={selectedTargets.includes(role.value)} />
                                            <label className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2">
                                                <Shield className="w-4 h-4 text-zinc-400" />
                                                {role.label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {assignTo === 'CAMPUS' && (
                                <div className="space-y-3">
                                    {CAMPUSES.map(campus => (
                                        <div key={campus} className="flex items-center space-x-3 p-2 hover:bg-white rounded-lg transition-colors cursor-pointer" onClick={() => toggleTarget(campus)}>
                                            <Checkbox id={`campus-${campus}`} checked={selectedTargets.includes(campus)} />
                                            <label className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2">
                                                <School className="w-4 h-4 text-zinc-400" />
                                                {campus}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {assignTo === 'USER' && (
                                <div className="space-y-3">
                                    {isLoadingUsers ? (
                                        <div className="flex items-center justify-center h-full py-10">
                                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                        </div>
                                    ) : (
                                        users.map(user => (
                                            <div key={user.id} className="flex items-center space-x-3 p-2 hover:bg-white rounded-lg transition-colors cursor-pointer" onClick={() => toggleTarget(user.id)}>
                                                <Checkbox id={`user-${user.id}`} checked={selectedTargets.includes(user.id)} />
                                                <div className="flex flex-col">
                                                    <label className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2">
                                                        <UserIcon className="w-4 h-4 text-zinc-400" />
                                                        {user.fullName}
                                                    </label>
                                                    <span className="text-[10px] text-zinc-500 ml-6">{user.email} • {user.role}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    {selectedTargets.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {selectedTargets.map(target => (
                                <Badge key={target} variant="secondary" className="gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary border-none">
                                    {assignTo === 'USER' ? users.find(u => u.id === target)?.fullName : target}
                                    <X className="w-3 h-3 cursor-pointer" onClick={() => toggleTarget(target)} />
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handleAssign} disabled={isSubmitting || selectedTargets.length === 0} className="px-8 rounded-xl">
                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Confirm Assignment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
