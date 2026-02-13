import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Eye, Clock, CheckCircle2, MoreHorizontal, Copy, Pencil, Archive, Trash2, Users, Star } from "lucide-react";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DynamicForm } from "@/components/DynamicForm";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export interface FormField {
    id: string;
    label: string;
    type: "text" | "textarea" | "select" | "radio" | "rating" | "date" | "time" | "file";
    required: boolean;
    options?: string[]; // For select, radio
}

import { initialTemplates } from "@/lib/template-utils";

export function FormTemplatesView() {
    const [templates, setTemplates] = useState<typeof initialTemplates>(() => {
        const saved = localStorage.getItem("form_templates");
        return saved ? JSON.parse(saved) : initialTemplates;
    });

    useEffect(() => {
        localStorage.setItem("form_templates", JSON.stringify(templates));
        // Broadcast change for other views (e.g., Dynamic Forms)
        window.dispatchEvent(new Event("form-templates-updated"));
    }, [templates]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ title: "", type: "Observation" as any, version: "1.0", targetRole: "Teacher", targetBlock: "All", fields: [] as FormField[] });
    const [editingTemplate, setEditingTemplate] = useState<typeof initialTemplates[0] | null>(null);
    const [templateToDelete, setTemplateToDelete] = useState<typeof initialTemplates[0] | null>(null);
    const [previewTemplate, setPreviewTemplate] = useState<typeof initialTemplates[0] | null>(null);

    const handleCreateTemplate = () => {
        if (!newTemplate.title) {
            toast.error("Please enter a template title");
            return;
        }
        const template = {
            id: templates.length + 1,
            ...newTemplate,
            status: "Draft",
            lastUpdated: "Just now",
            questions: newTemplate.fields.length
        };
        setTemplates([template, ...templates]);
        setIsCreateOpen(false);
        setNewTemplate({ title: "", type: "Observation", version: "1.0", targetRole: "Teacher", targetBlock: "All", fields: [] });
        toast.success("Template created successfully");
    };

    const addNewTemplateField = () => {
        const newField: FormField = {
            id: Math.random().toString(36).substr(2, 9),
            label: "Untitled Question",
            type: "text",
            required: false
        };
        setNewTemplate({
            ...newTemplate,
            fields: [...newTemplate.fields, newField]
        });
    };

    const removeNewTemplateField = (id: string) => {
        setNewTemplate({
            ...newTemplate,
            fields: newTemplate.fields.filter(f => f.id !== id)
        });
    };

    const updateNewTemplateField = (id: string, updates: Partial<FormField>) => {
        setNewTemplate({
            ...newTemplate,
            fields: newTemplate.fields.map(f => f.id === id ? { ...f, ...updates } : f)
        });
    };

    const duplicateNewTemplateField = (field: FormField) => {
        const duplicatedField: FormField = {
            ...field,
            id: Math.random().toString(36).substr(2, 9),
            label: `${field.label} (Copy)`
        };
        setNewTemplate({
            ...newTemplate,
            fields: [...newTemplate.fields, duplicatedField]
        });
    };

    const handleEditTemplate = () => {
        if (!editingTemplate || !editingTemplate.title) {
            toast.error("Please enter a template title");
            return;
        }
        setTemplates(templates.map(t => t.id === editingTemplate.id ? { ...editingTemplate, lastUpdated: "Just now", questions: editingTemplate.fields.length } : t));
        setIsEditOpen(false);
        setEditingTemplate(null);
        toast.success("Template updated successfully");
    };

    const addField = () => {
        if (!editingTemplate) return;
        const newField: FormField = {
            id: Math.random().toString(36).substr(2, 9),
            label: "Untitled Question",
            type: "text",
            required: false
        };
        setEditingTemplate({
            ...editingTemplate,
            fields: [...editingTemplate.fields, newField]
        });
    };

    const removeField = (id: string) => {
        if (!editingTemplate) return;
        setEditingTemplate({
            ...editingTemplate,
            fields: editingTemplate.fields.filter(f => f.id !== id)
        });
    };

    const updateField = (id: string, updates: Partial<FormField>) => {
        if (!editingTemplate) return;
        setEditingTemplate({
            ...editingTemplate,
            fields: editingTemplate.fields.map(f => f.id === id ? { ...f, ...updates } : f)
        });
    };

    const duplicateField = (field: FormField) => {
        if (!editingTemplate) return;
        const duplicatedField: FormField = {
            ...field,
            id: Math.random().toString(36).substr(2, 9),
            label: `${field.label} (Copy)`
        };
        setEditingTemplate({
            ...editingTemplate,
            fields: [...editingTemplate.fields, duplicatedField]
        });
    };

    const handleDeleteTemplate = () => {
        if (!templateToDelete) return;
        setTemplates(templates.filter(t => t.id !== templateToDelete.id));
        setIsDeleteOpen(false);
        setTemplateToDelete(null);
        toast.success("Template deleted successfully");
    };

    const onEdit = (template: typeof initialTemplates[0]) => {
        setEditingTemplate(template);
        setIsEditOpen(true);
    };

    const onDelete = (template: typeof initialTemplates[0]) => {
        setTemplateToDelete(template);
        setIsDeleteOpen(true);
    };

    const onPreview = (template: typeof initialTemplates[0]) => {
        setPreviewTemplate(template);
        setIsPreviewOpen(true);
    };

    const onDuplicate = (template: typeof initialTemplates[0]) => {
        const duplicatedTemplate = {
            ...template,
            id: Math.max(...templates.map(t => t.id), 0) + 1,
            title: `${template.title} (Copy)`,
            lastUpdated: "Just now",
            status: "Draft"
        };
        setTemplates([duplicatedTemplate, ...templates]);
        toast.success(`Duplicated ${template.title}`);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader
                title="Form Templates"
                subtitle="Design and manage evaluation forms and standard templates"
                actions={
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Template
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                            <DialogHeader className="px-6 py-4 border-b bg-muted/10 shrink-0">
                                <DialogTitle>Create New Template</DialogTitle>
                                <DialogDescription>Configure details and draft questions for your new form.</DialogDescription>
                            </DialogHeader>

                            <div className="flex-1 overflow-y-auto">
                                <Tabs defaultValue="settings" className="w-full">
                                    <div className="px-6 border-b bg-background sticky top-0 z-10">
                                        <TabsList className="w-full justify-start h-12 bg-transparent gap-6">
                                            <TabsTrigger value="settings" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0">1. Template Settings</TabsTrigger>
                                            <TabsTrigger value="fields" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0">2. Add Questions</TabsTrigger>
                                        </TabsList>
                                    </div>

                                    <TabsContent value="settings" className="p-6 space-y-6">
                                        <div className="grid gap-6">
                                            <div className="grid gap-2">
                                                <Label htmlFor="title">Template Title</Label>
                                                <Input id="title" placeholder="e.g., Annual Performance Review" value={newTemplate.title} onChange={e => setNewTemplate({ ...newTemplate, title: e.target.value })} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="type">Template Type</Label>
                                                    <Select value={newTemplate.type} onValueChange={v => setNewTemplate({ ...newTemplate, type: v as any })}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Observation">Observation</SelectItem>
                                                            <SelectItem value="Goal Setting">Goal Setting</SelectItem>
                                                            <SelectItem value="Reflection">Reflection</SelectItem>
                                                            <SelectItem value="Other">Other</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="version">Version Tag</Label>
                                                    <Input id="version" value={newTemplate.version} onChange={e => setNewTemplate({ ...newTemplate, version: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="targetRole">Target Role</Label>
                                                    <Select value={newTemplate.targetRole} onValueChange={v => setNewTemplate({ ...newTemplate, targetRole: v })}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Teacher">Teacher</SelectItem>
                                                            <SelectItem value="Leader">School Leader</SelectItem>
                                                            <SelectItem value="Both">Both</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="targetBlock">Target Block</Label>
                                                    <Select value={newTemplate.targetBlock} onValueChange={v => setNewTemplate({ ...newTemplate, targetBlock: v })}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="All">All Blocks</SelectItem>
                                                            <SelectItem value="Early Years">Early Years</SelectItem>
                                                            <SelectItem value="Primary">Primary</SelectItem>
                                                            <SelectItem value="Middle">Middle</SelectItem>
                                                            <SelectItem value="Senior">Senior</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="fields" className="p-6 space-y-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-lg">Question Builder</h3>
                                            <Button size="sm" onClick={addNewTemplateField} className="gap-2">
                                                <Plus className="w-4 h-4" /> Add Question
                                            </Button>
                                        </div>

                                        {newTemplate.fields.length === 0 && (
                                            <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/5">
                                                <FileText className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-3" />
                                                <p className="text-muted-foreground">You haven't added any questions yet. Start building your form now or save it as a draft and edit later.</p>
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            {newTemplate.fields.map((field, index) => (
                                                <Card key={field.id} className="relative group hover:border-primary/30 transition-shadow">
                                                    <CardContent className="p-5 space-y-4">
                                                        <div className="flex items-start gap-4">
                                                            <div className="flex flex-col gap-1 flex-1">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-[10px] font-bold text-muted-foreground/50 font-mono">Q{index + 1}</span>
                                                                    <Input
                                                                        className="flex-1 font-semibold text-base bg-transparent border-none p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/30"
                                                                        value={field.label}
                                                                        onChange={e => updateNewTemplateField(field.id, { label: e.target.value })}
                                                                        placeholder="Question Label"
                                                                    />
                                                                </div>
                                                                <div className="pl-7 pb-2 mt-1 border-b border-dashed">
                                                                    <p className="text-xs text-muted-foreground/40 italic">
                                                                        {field.type === 'text' && "Short answer text"}
                                                                        {field.type === 'textarea' && "Long answer text"}
                                                                        {field.type === 'select' && "User will select from dropdown"}
                                                                        {field.type === 'radio' && "User will pick one option"}
                                                                        {field.type === 'rating' && "1 to 5 star rating"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Select value={field.type} onValueChange={v => updateNewTemplateField(field.id, { type: v as any })}>
                                                                <SelectTrigger className="w-[160px] h-10 bg-muted/5 font-medium">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="text">Short Answer</SelectItem>
                                                                    <SelectItem value="textarea">Paragraph</SelectItem>
                                                                    <SelectItem value="select">Dropdown</SelectItem>
                                                                    <SelectItem value="radio">Multiple Choice</SelectItem>
                                                                    <SelectItem value="rating">Linear Scale (1-5)</SelectItem>
                                                                    <SelectItem value="file">File Upload</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        {(field.type === 'select' || field.type === 'radio') && (
                                                            <div className="pl-7 grid gap-2">
                                                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Options</Label>
                                                                <Input
                                                                    className="h-8 text-xs bg-muted/10"
                                                                    placeholder="Option 1, Option 2 (Comma separated)"
                                                                    value={field.options?.join(", ") || ""}
                                                                    onChange={e => updateNewTemplateField(field.id, { options: e.target.value.split(",").map(o => o.trim()) })}
                                                                />
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-between pt-2 border-t mt-2">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    id={`new-req-${field.id}`}
                                                                    checked={field.required}
                                                                    onChange={e => updateNewTemplateField(field.id, { required: e.target.checked })}
                                                                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                                                                />
                                                                <Label htmlFor={`new-req-${field.id}`} className="text-xs font-semibold cursor-pointer">Required</Label>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5" onClick={() => duplicateNewTemplateField(field)}>
                                                                    <Copy className="w-4 h-4" />
                                                                </Button>
                                                                <div className="w-px h-4 bg-muted mx-1" />
                                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5" onClick={() => removeNewTemplateField(field.id)}>
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>

                            <DialogFooter className="px-6 py-4 border-t bg-muted/5 shrink-0">
                                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateTemplate}>Create Template</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                }
            />

            <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">All Templates</TabsTrigger>
                    <TabsTrigger value="observation">Observations</TabsTrigger>
                    <TabsTrigger value="goals">Goals & Reflections</TabsTrigger>
                    <TabsTrigger value="pd">PD & Others</TabsTrigger>
                    <TabsTrigger value="drafts">Drafts</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(template => <TemplateCard key={template.id} template={template} onEdit={onEdit} onDelete={onDelete} onPreview={onPreview} onDuplicate={onDuplicate} />)}
                </TabsContent>
                <TabsContent value="observation" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.filter(t => t.type === 'Observation').map(template => <TemplateCard key={template.id} template={template} onEdit={onEdit} onDelete={onDelete} onPreview={onPreview} onDuplicate={onDuplicate} />)}
                </TabsContent>
                <TabsContent value="goals" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.filter(t => t.type === 'Goal Setting' || t.type === 'Reflection').map(template => <TemplateCard key={template.id} template={template} onEdit={onEdit} onDelete={onDelete} onPreview={onPreview} onDuplicate={onDuplicate} />)}
                </TabsContent>
                <TabsContent value="pd" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.filter(t => t.type === 'Other' || t.title.includes('MOOC')).map(template => <TemplateCard key={template.id} template={template} onEdit={onEdit} onDelete={onDelete} onPreview={onPreview} onDuplicate={onDuplicate} />)}
                </TabsContent>
                <TabsContent value="drafts" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.filter(t => t.status === 'Draft').map(template => <TemplateCard key={template.id} template={template} onEdit={onEdit} onDelete={onDelete} onPreview={onPreview} onDuplicate={onDuplicate} />)}
                </TabsContent>
            </Tabs>

            {/* Edit Dialog - Larger to accommodate Form Builder */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                    <DialogHeader className="px-6 py-4 border-b bg-muted/10 shrink-0">
                        <DialogTitle>Form Builder</DialogTitle>
                        <DialogDescription>Design the structure and fields for "{editingTemplate?.title}"</DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto">
                        <Tabs defaultValue="settings" className="w-full">
                            <div className="px-6 border-b bg-background sticky top-0 z-10">
                                <TabsList className="w-full justify-start h-12 bg-transparent gap-6">
                                    <TabsTrigger value="settings" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0">General Settings</TabsTrigger>
                                    <TabsTrigger value="fields" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0">Questions & Fields</TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="settings" className="p-6 space-y-6">
                                {editingTemplate && (
                                    <div className="grid gap-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-title">Template Title</Label>
                                            <Input id="edit-title" value={editingTemplate.title} onChange={e => setEditingTemplate({ ...editingTemplate, title: e.target.value })} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="edit-type">Template Type</Label>
                                                <Select value={editingTemplate.type} onValueChange={v => setEditingTemplate({ ...editingTemplate, type: v as any })}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Observation">Observation</SelectItem>
                                                        <SelectItem value="Goal Setting">Goal Setting</SelectItem>
                                                        <SelectItem value="Reflection">Reflection</SelectItem>
                                                        <SelectItem value="Other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="edit-version">Version Tag</Label>
                                                <Input id="edit-version" value={editingTemplate.version} onChange={e => setEditingTemplate({ ...editingTemplate, version: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="edit-targetRole">Assign to Role</Label>
                                                <Select value={editingTemplate.targetRole} onValueChange={v => setEditingTemplate({ ...editingTemplate, targetRole: v })}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Teacher">Teacher</SelectItem>
                                                        <SelectItem value="Leader">School Leader</SelectItem>
                                                        <SelectItem value="Both">Both</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="edit-targetBlock">Target Block</Label>
                                                <Select value={editingTemplate.targetBlock} onValueChange={v => setEditingTemplate({ ...editingTemplate, targetBlock: v })}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="All">All Blocks</SelectItem>
                                                        <SelectItem value="Early Years">Early Years</SelectItem>
                                                        <SelectItem value="Primary">Primary</SelectItem>
                                                        <SelectItem value="Middle">Middle</SelectItem>
                                                        <SelectItem value="Senior">Senior</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-status">Publication Status</Label>
                                            <Select value={editingTemplate.status} onValueChange={v => setEditingTemplate({ ...editingTemplate, status: v })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Active">Active (Visible to users)</SelectItem>
                                                    <SelectItem value="Draft">Draft (Internal only)</SelectItem>
                                                    <SelectItem value="Archived">Archived (Hidden)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="fields" className="p-6 space-y-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-lg">Form Fields</h3>
                                    <Button size="sm" onClick={addField} className="gap-2">
                                        <Plus className="w-4 h-4" /> Add Question
                                    </Button>
                                </div>

                                {editingTemplate?.fields.length === 0 && (
                                    <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/5">
                                        <FileText className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-3" />
                                        <p className="text-muted-foreground">No questions added yet. Click 'Add Question' to start building your form.</p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {editingTemplate?.fields.map((field, index) => (
                                        <Card key={field.id} className="relative group hover:border-primary/30 transition-shadow">
                                            <CardContent className="p-5 space-y-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="flex flex-col gap-1 flex-1">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-bold text-muted-foreground/50 font-mono">Q{index + 1}</span>
                                                            <Input
                                                                className="flex-1 font-semibold text-base bg-transparent border-none p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/30"
                                                                value={field.label}
                                                                onChange={e => updateField(field.id, { label: e.target.value })}
                                                                placeholder="Question Label"
                                                            />
                                                        </div>
                                                        <div className="pl-7 pb-2 mt-1 border-b border-dashed">
                                                            <p className="text-xs text-muted-foreground/40 italic">
                                                                {field.type === 'text' && "Short answer text"}
                                                                {field.type === 'textarea' && "Long answer text"}
                                                                {field.type === 'select' && "User will select from dropdown"}
                                                                {field.type === 'radio' && "User will pick one option"}
                                                                {field.type === 'rating' && "1 to 5 star rating"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Select value={field.type} onValueChange={v => updateField(field.id, { type: v as any })}>
                                                        <SelectTrigger className="w-[160px] h-10 bg-muted/5 font-medium">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="text">Short Answer</SelectItem>
                                                            <SelectItem value="textarea">Paragraph</SelectItem>
                                                            <SelectItem value="select">Dropdown</SelectItem>
                                                            <SelectItem value="radio">Multiple Choice</SelectItem>
                                                            <SelectItem value="rating">Linear Scale (1-5)</SelectItem>
                                                            <SelectItem value="file">File Upload</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {(field.type === 'select' || field.type === 'radio') && (
                                                    <div className="pl-7 grid gap-2">
                                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Options</Label>
                                                        <Input
                                                            className="h-8 text-xs bg-muted/10"
                                                            placeholder="Option 1, Option 2 (Comma separated)"
                                                            value={field.options?.join(", ") || ""}
                                                            onChange={e => updateField(field.id, { options: e.target.value.split(",").map(o => o.trim()).filter(o => o !== "") })}
                                                        />
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between pt-2 border-t mt-2">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            id={`req-${field.id}`}
                                                            checked={field.required}
                                                            onChange={e => updateField(field.id, { required: e.target.checked })}
                                                            className="w-4 h-4 accent-primary rounded cursor-pointer"
                                                        />
                                                        <Label htmlFor={`req-${field.id}`} className="text-xs font-semibold cursor-pointer">Required</Label>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5" onClick={() => duplicateField(field)}>
                                                            <Copy className="w-4 h-4" />
                                                        </Button>
                                                        <div className="w-px h-4 bg-muted mx-1" />
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5" onClick={() => removeField(field.id)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t bg-muted/5 shrink-0">
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Discard Changes</Button>
                        <Button onClick={handleEditTemplate}>Update Template</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
                    <DialogHeader className="px-8 py-6 border-b bg-primary/5 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Eye className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-bold">Template Preview</DialogTitle>
                                <DialogDescription className="font-medium">
                                    Previewing: <span className="text-primary font-bold">{previewTemplate?.title}</span>
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-8 bg-muted/10">
                        <div className="max-w-2xl mx-auto space-y-8">
                            <div className="bg-background rounded-3xl p-8 shadow-xl shadow-primary/5 border border-primary/10">
                                <div className="mb-8 p-4 rounded-xl bg-primary/5 border border-primary/10">
                                    <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Live Preview Mode</p>
                                    <p className="text-sm text-muted-foreground">This is how the form will appear to your staff. Interactive elements are functional for testing purposes.</p>
                                </div>
                                {previewTemplate && (
                                    <DynamicForm
                                        fields={previewTemplate.fields}
                                        onSubmit={(data) => {
                                            console.log("Preview form submitted:", data);
                                            toast.success("Form submitted successfully (Preview Mode)");
                                        }}
                                        submitLabel="Test Submit"
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="px-8 py-4 border-t bg-background shrink-0">
                        <Button className="font-bold px-8 h-11 rounded-xl" onClick={() => setIsPreviewOpen(false)}>Close Preview</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the
                            <span className="font-bold"> {templateToDelete?.title} </span>
                            template and remove it from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteTemplate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete Template
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
}

function TemplateCard({
    template,
    onEdit,
    onDelete,
    onPreview,
    onDuplicate
}: {
    template: any,
    onEdit: (t: any) => void,
    onDelete: (t: any) => void,
    onPreview: (t: any) => void,
    onDuplicate: (t: any) => void
}) {
    const handleAction = (action: string) => {
        if (action === "Edit") {
            onEdit(template);
        } else if (action === "Delete") {
            onDelete(template);
        } else if (action === "Duplicate") {
            onDuplicate(template);
        } else if (action === "Preview") {
            onPreview(template);
        }
    }

    return (
        <Card className="hover:shadow-md transition-shadow relative overflow-hidden">
            <CardHeader className="pb-3 border-b bg-muted/10">
                <div className="flex justify-between items-start">
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-background">{template.type}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{template.targetBlock}</Badge>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="-mr-2 -mt-2">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleAction("Preview")}><Eye className="w-4 h-4 mr-2" /> Preview</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction("Duplicate")}><Copy className="w-4 h-4 mr-2" /> Duplicate</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction("Edit")}><Pencil className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => handleAction("Delete")}><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <CardTitle className="text-base font-semibold leading-tight pt-3">{template.title}</CardTitle>
                <CardDescription className="text-[10px] flex items-center gap-2 mt-1">
                    <Users className="w-3 h-3" /> For {template.targetRole}s
                </CardDescription>
            </CardHeader>
            <CardContent className="py-4">
                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> {template.questions} Fields
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                        <Clock className="w-3.5 h-3.5" /> v{template.version}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="pt-0 justify-between items-center bg-muted/5 border-t py-3">
                <Badge
                    variant={template.status === "Active" ? "default" : "secondary"}
                    className={cn(
                        "text-[10px] px-2 py-0 h-5",
                        template.status === "Active" ? "bg-green-600 hover:bg-green-600" :
                            template.status === "Draft" ? "bg-amber-500 hover:bg-amber-500" :
                                "bg-slate-500 hover:bg-slate-500"
                    )}
                >
                    {template.status}
                </Badge>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">Updated {template.lastUpdated}</span>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2" onClick={() => handleAction("Edit")}>Edit</Button>
                </div>
            </CardFooter>
        </Card>
    )
}
