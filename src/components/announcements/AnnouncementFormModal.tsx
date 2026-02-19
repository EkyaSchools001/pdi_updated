import React, { useState } from 'react';
import {
    Plus,
    Pin
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { announcementService, Announcement } from '@/services/announcementService';
import { toast } from 'sonner';

interface AnnouncementFormModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (announcement: Announcement) => void;
    userRole: string;
}

export const AnnouncementFormModal: React.FC<AnnouncementFormModalProps> = ({
    isOpen,
    onOpenChange,
    onSuccess,
    userRole
}) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'Normal',
        targetRoles: [] as string[],
        status: 'Published',
        isPinned: false
    });

    const handleCreateAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.description) {
            toast.error('Title and description are required');
            return;
        }

        try {
            const newAnn = await announcementService.createAnnouncement({
                ...formData,
                priority: formData.priority as 'Normal' | 'High',
                status: formData.status as 'Draft' | 'Published' | 'Archived',
                targetRoles: JSON.stringify(formData.targetRoles)
            });

            if (onSuccess) onSuccess(newAnn);
            onOpenChange(false);
            setFormData({
                title: '',
                description: '',
                priority: 'Normal',
                targetRoles: [],
                status: 'Published',
                isPinned: false
            });
            toast.success('Announcement published successfully');
        } catch (error) {
            toast.error('Failed to publish announcement');
        }
    };

    const toggleRole = (role: string) => {
        setFormData(prev => ({
            ...prev,
            targetRoles: prev.targetRoles.includes(role)
                ? prev.targetRoles.filter(r => r !== role)
                : [...prev.targetRoles, role]
        }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                        <Plus className="w-6 h-6 text-primary" />
                        Create New Announcement
                    </DialogTitle>
                    <DialogDescription>
                        Fill in the details below to broadcast a new announcement to targeted users.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateAnnouncement} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="font-bold">Title</Label>
                        <Input
                            id="title"
                            placeholder="Enter a clear, descriptive title"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description" className="font-bold">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Write your announcement message here..."
                            className="min-h-[150px]"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="font-bold">Priority</Label>
                            <Select value={formData.priority} onValueChange={(val) => setFormData(prev => ({ ...prev, priority: val }))}>
                                <SelectTrigger className="capitalize">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Normal">Normal</SelectItem>
                                    <SelectItem value="High">High Priority</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">Status</Label>
                            <Select value={formData.status} onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}>
                                <SelectTrigger className="capitalize">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Published">Publish Now</SelectItem>
                                    <SelectItem value="Draft">Save as Draft</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {['ADMIN', 'SUPERADMIN', 'MANAGEMENT'].includes(userRole.toUpperCase()) && (
                        <div className="flex items-center space-x-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <Checkbox
                                id="isPinned"
                                checked={formData.isPinned}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPinned: !!checked }))}
                            />
                            <Label htmlFor="isPinned" className="text-sm font-bold text-amber-900 cursor-pointer flex items-center gap-2">
                                <Pin className="w-4 h-4" /> Pin to top of list
                            </Label>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label className="font-bold flex items-center gap-2">
                            Target Roles <Badge variant="outline" className="text-[10px] font-normal">Leave empty for All</Badge>
                        </Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-muted/30 rounded-lg border">
                            {['TEACHER', 'LEADER', 'ADMIN', 'MANAGEMENT', 'SUPERADMIN'].map((role) => (
                                <div key={role} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`role-${role}`}
                                        checked={formData.targetRoles.includes(role)}
                                        onCheckedChange={() => toggleRole(role)}
                                    />
                                    <Label
                                        htmlFor={`role-${role}`}
                                        className="text-xs font-medium cursor-pointer"
                                    >
                                        {role}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter className="pt-4 border-t">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" className="bg-primary hover:bg-primary/90 px-8">
                            {formData.status === 'Published' ? 'Post Announcement' : 'Save Draft'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
