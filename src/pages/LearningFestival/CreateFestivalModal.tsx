import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'sonner';
import { learningFestivalService } from '@/services/learningFestivalService';

interface CreateFestivalModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const ROLES = [
    { id: 'TEACHER', label: 'Teachers' },
    { id: 'SCHOOL_LEADER', label: 'School Leaders (HOS/Coordinators)' },
    { id: 'ADMIN', label: 'Admins' },
    { id: 'MANAGEMENT', label: 'Management' }
];

export function CreateFestivalModal({ isOpen, onOpenChange, onSuccess }: CreateFestivalModalProps) {
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        theme: '',
        description: '',
        location: '',
        duration: '',
        registrationStart: '',
        registrationEnd: '',
        startDate: '',
        endDate: '',
    });

    const [sharedWith, setSharedWith] = useState<string[]>(['TEACHER']); // default to teacher visibility
    const [documentsStr, setDocumentsStr] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleToggle = (roleId: string) => {
        setSharedWith(prev =>
            prev.includes(roleId)
                ? prev.filter(id => id !== roleId)
                : [...prev, roleId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.theme || !formData.startDate || !formData.endDate) {
            toast.error('Please fill in all required fields (Name, Theme, Festival Dates).');
            return;
        }

        setLoading(true);
        try {
            // Parse documents string into JSON array if provided
            let documentsPayload = [];
            if (documentsStr.trim()) {
                documentsPayload = documentsStr.split(',').map(d => d.trim()).filter(d => !!d);
            }

            const payload = {
                ...formData,
                documents: documentsPayload.length > 0 ? JSON.stringify(documentsPayload) : undefined,
                sharedWithRoles: JSON.stringify(sharedWith),
                // Handle optional dates mapping to ISO if valid
                registrationStart: formData.registrationStart ? new Date(formData.registrationStart).toISOString() : undefined,
                registrationEnd: formData.registrationEnd ? new Date(formData.registrationEnd).toISOString() : undefined,
                startDate: new Date(formData.startDate).toISOString(),
                endDate: new Date(formData.endDate).toISOString(),
                status: 'Upcoming' as const
            };

            await learningFestivalService.createFestival(payload);
            toast.success('Learning Festival created successfully!');
            onSuccess();
            onOpenChange(false);

            // Reset form
            setFormData({
                name: '', theme: '', description: '', location: '', duration: '',
                registrationStart: '', registrationEnd: '', startDate: '', endDate: ''
            });
            setSharedWith(['TEACHER']);
            setDocumentsStr('');

        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Failed to create festival.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Learning Festival</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Festival Name <span className="text-red-500">*</span></Label>
                            <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Winter Pedagogy Festival" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="theme">Theme <span className="text-red-500">*</span></Label>
                            <Input id="theme" name="theme" value={formData.theme} onChange={handleInputChange} placeholder="e.g. Innovation in Ed" required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Brief description of the festival objectives..." rows={3} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" name="location" value={formData.location} onChange={handleInputChange} placeholder="e.g. Main Campus Auditorium / Virtual" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="duration">Duration</Label>
                            <Input id="duration" name="duration" value={formData.duration} onChange={handleInputChange} placeholder="e.g. 2 Days, 4 Sessions" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-gray-50/50">
                        <div className="col-span-2"><h4 className="font-semibold text-sm text-gray-700">Registration Window</h4></div>
                        <div className="space-y-2">
                            <Label htmlFor="registrationStart">Registration Start</Label>
                            <Input type="datetime-local" id="registrationStart" name="registrationStart" value={formData.registrationStart} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="registrationEnd">Registration End (Deadline)</Label>
                            <Input type="datetime-local" id="registrationEnd" name="registrationEnd" value={formData.registrationEnd} onChange={handleInputChange} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-indigo-50/30 border-indigo-100">
                        <div className="col-span-2"><h4 className="font-semibold text-sm text-indigo-900">Actual Festival Dates <span className="text-red-500">*</span></h4></div>
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Festival Start Date <span className="text-red-500">*</span></Label>
                            <Input type="datetime-local" id="startDate" name="startDate" value={formData.startDate} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate">Festival End Date <span className="text-red-500">*</span></Label>
                            <Input type="datetime-local" id="endDate" name="endDate" value={formData.endDate} onChange={handleInputChange} required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="documents">Supporting Documents (URLs)</Label>
                        <Input
                            id="documents"
                            value={documentsStr}
                            onChange={(e) => setDocumentsStr(e.target.value)}
                            placeholder="Comma separated URLs (e.g. https://drive.link/doc1, https://drive.link/doc2)"
                        />
                        <p className="text-xs text-muted-foreground">Attach external drive links or schedule PDFs here.</p>
                    </div>

                    <div className="space-y-3">
                        <Label>Share Visibility (Who can see/apply?)</Label>
                        <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg bg-gray-50/50">
                            {ROLES.map(role => (
                                <div key={role.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`role-${role.id}`}
                                        checked={sharedWith.includes(role.id)}
                                        onCheckedChange={() => handleRoleToggle(role.id)}
                                    />
                                    <Label htmlFor={`role-${role.id}`} className="font-normal cursor-pointer text-sm">
                                        {role.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter className="mt-8">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
                            {loading ? 'Creating...' : 'Create Festival'}
                        </Button>
                    </DialogFooter>

                </form>
            </DialogContent>
        </Dialog>
    );
}
