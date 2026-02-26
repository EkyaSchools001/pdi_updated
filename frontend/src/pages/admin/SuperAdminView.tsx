
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Shield, FileText, Workflow, Save, AlertCircle, Database, Layout, Smartphone, Key, Trash2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import api from "@/lib/api";
import { defaultAccessMatrix } from "@/contexts/PermissionContext";

interface PermissionSetting {
    moduleId: string;
    moduleName: string;
    roles: {
        SUPERADMIN: boolean;
        ADMIN: boolean;
        LEADER: boolean;
        MANAGEMENT: boolean;
        TEACHER: boolean;
    };
}

interface FormFlowConfig {
    id: string;
    formName: string;
    senderRole: string;
    targetDashboard: string;
    targetLocation: string;
    subjectType?: string;
    specificSubjects?: string;
    targetSchool?: string;
}


// Aligned with FormTemplate names + Attendance Submission (used by AttendanceForm)
const defaultFormFlows: FormFlowConfig[] = [
    { id: '1', formName: 'Walkthrough Observation', senderRole: 'LEADER', targetDashboard: 'Teacher Dashboard', targetLocation: 'Growth Reports', targetSchool: 'ALL', subjectType: 'ALL', specificSubjects: '' },
    { id: '2', formName: 'Professional Goal', senderRole: 'TEACHER', targetDashboard: 'Leader Dashboard', targetLocation: 'Pending Approvals', targetSchool: 'ALL', subjectType: 'ALL', specificSubjects: '' },
    { id: '3', formName: 'MOOC Evidence', senderRole: 'TEACHER', targetDashboard: 'Admin Dashboard', targetLocation: 'Course Reviews', targetSchool: 'ALL', subjectType: 'ALL', specificSubjects: '' },
    { id: '4', formName: 'Teacher Reflection', senderRole: 'TEACHER', targetDashboard: 'Teacher Dashboard', targetLocation: 'My Portfolio', targetSchool: 'ALL', subjectType: 'ALL', specificSubjects: '' },
    { id: '5', formName: 'Attendance Submission', senderRole: 'TEACHER', targetDashboard: 'Admin Dashboard', targetLocation: 'Attendance Register', targetSchool: 'ALL', subjectType: 'ALL', specificSubjects: '' },
];

const FORM_NAME_OPTIONS = [
    'Walkthrough Observation', 'Teacher Reflection', 'MOOC Evidence', 'Professional Goal',
    'Attendance Submission', 'Annual Goal Setting', 'MOOC Submission', 'Self-Reflection'
];

const coreSubjects = ["Mathematics", "Science", "English", "Social Science", "Physics", "Chemistry", "Biology"];
const nonCoreSubjects = ["Physical Education", "Computer Science", "Art", "Music", "Hindi", "Kannada", "Value Education"];


export function SuperAdminView() {
    const parseStructure = (structure: any) => {
        if (!structure) return [];
        if (typeof structure === 'string') {
            try {
                return JSON.parse(structure) || [];
            } catch (e) {
                return [];
            }
        }
        if (Array.isArray(structure)) return structure;
        return [];
    };

    const [isLoading, setIsLoading] = useState(true);
    const [accessMatrix, setAccessMatrix] = useState<PermissionSetting[]>(defaultAccessMatrix);
    const [formFlows, setFormFlows] = useState<FormFlowConfig[]>(defaultFormFlows);
    const [formTemplates, setFormTemplates] = useState<{ name: string; type: string }[]>([]);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const response = await api.get('/settings/access_matrix_config');
                if (response.data.status === 'success' && response.data.data.setting) {
                    const valueData = response.data.data.setting.value;
                    const value = typeof valueData === 'string' ? JSON.parse(valueData) : valueData;
                    if (value && value.accessMatrix) {
                        const mergedMatrix = defaultAccessMatrix.map(defaultItem => {
                            const loadedItem = value.accessMatrix.find((item: any) => item.moduleId === defaultItem.moduleId);
                            if (loadedItem) {
                                return {
                                    ...defaultItem,
                                    ...loadedItem,
                                    roles: {
                                        SUPERADMIN: loadedItem.roles?.SUPERADMIN ?? defaultItem.roles.SUPERADMIN,
                                        ADMIN: loadedItem.roles?.ADMIN ?? defaultItem.roles.ADMIN,
                                        LEADER: loadedItem.roles?.LEADER ?? defaultItem.roles.LEADER,
                                        MANAGEMENT: loadedItem.roles?.MANAGEMENT ?? defaultItem.roles.MANAGEMENT,
                                        TEACHER: loadedItem.roles?.TEACHER ?? defaultItem.roles.TEACHER,
                                    }
                                };
                            }
                            return defaultItem;
                        });
                        setAccessMatrix(mergedMatrix);
                    }
                    if (value.formFlows) setFormFlows(value.formFlows);
                }
            } catch (e) {
                console.error("Failed to load access matrix settings", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadSettings();
    }, []);

    useEffect(() => {
        const loadTemplates = async () => {
            try {
                const response = await api.get('/templates');
                if (response.data?.status === 'success' && response.data?.data?.templates) {
                    const templatesData = response.data.data.templates.map((t: any) => ({
                        name: t.name,
                        type: t.type || '',
                        structure: t.structure || []
                    }));
                    setFormTemplates(templatesData);
                }
            } catch (e) {
                console.error("Failed to load form templates", e);
            }
        };
        loadTemplates();
    }, []);

    const handleSave = async () => {
        console.log('[SUPERADMIN] Attempting to save configurations...', { accessMatrix, formFlows });
        try {
            const payload = {
                key: "access_matrix_config",
                value: { accessMatrix, formFlows }
            };
            const response = await api.post('/settings/upsert', payload);
            console.log('[SUPERADMIN] Save successful:', response.data);
            toast.success("SuperAdmin configurations saved successfully");
        } catch (e) {
            console.error('[SUPERADMIN] Save failed:', e);
            toast.error("Failed to save configurations");
        }
    };

    const togglePermission = (moduleId: string, role: string) => {
        const roleKey = role as keyof PermissionSetting['roles'];
        setAccessMatrix(prev => prev.map(item =>
            item.moduleId === moduleId
                ? { ...item, roles: { ...item.roles, [roleKey]: !(item.roles[roleKey]) } }
                : item
        ));
    };

    const updateFormFlow = (id: string, field: keyof FormFlowConfig, value: string) => {
        setFormFlows(prev => prev.map(flow =>
            flow.id === id ? { ...flow, [field]: value } : flow
        ));
    };

    const addFormFlow = () => {
        const firstTemplate = formTemplates[0]?.name || FORM_NAME_OPTIONS[0] || 'New Form';
        const newFlow: FormFlowConfig = {
            id: Date.now().toString(),
            formName: firstTemplate,
            senderRole: 'TEACHER',
            targetDashboard: 'Leader Dashboard',
            targetLocation: 'Reports',
            targetSchool: 'ALL',
            subjectType: 'ALL',
            specificSubjects: ''
        };
        setFormFlows([...formFlows, newFlow]);
    };

    const removeFormFlow = (id: string) => {
        setFormFlows(formFlows.filter(f => f.id !== id));
    };

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading SuperAdmin console...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader
                title="SuperAdmin Console"
                subtitle="High-level system governance, role permissions, and global form routing"
                actions={
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success text-xs font-medium border border-success/20 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-success"></span>
                            Live Sync Active
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button className="bg-primary hover:bg-primary/90 shadow-lg px-6 h-11">
                                    <Save className="w-4 h-4 mr-2" />
                                    Submit & Apply Configurations
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2 text-primary">
                                        <AlertCircle className="w-5 h-5" /> Execute Ecosystem Build?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription asChild>
                                        <div className="space-y-3 mt-2 text-slate-600">
                                            <p>You are initiating a global system configuration change that will impact user sessions across the platform in real-time.</p>
                                            <div className="bg-slate-50 p-3 rounded-md text-sm border border-slate-200">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span>Access Matrices updated:</span>
                                                    <strong className="text-blue-600">{accessMatrix.length}</strong>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span>Workflows modified:</span>
                                                    <strong className="text-blue-600">{formFlows.length}</strong>
                                                </div>
                                            </div>
                                            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded relative before:absolute before:inset-0 before:border-l-4 before:border-amber-500 before:rounded-l overflow-hidden">
                                                If you proceed, this payload will immediately dispatch over WebSockets to all connected clients and force a silent background re-render of their visible UI metrics.
                                                <br /><strong>This action is irreversible and recorded in the permanent audit ledger.</strong>
                                            </p>
                                        </div>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="mt-4">
                                    <AlertDialogCancel>Abort Mission</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleSave} className="bg-primary text-white hover:bg-primary/90">
                                        Proceed & Broadcast Sync
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary" /> System Security
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold italic text-primary">High Priority</div>
                        <p className="text-xs text-muted-foreground mt-1">Manage global role access levels</p>
                    </CardContent>
                </Card>
                <Card className="bg-amber-500/5 border-amber-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Workflow className="w-4 h-4 text-amber-600" /> Workflow Engine
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{formFlows.length} Active Flows</div>
                        <p className="text-xs text-muted-foreground mt-1">Rerouting form data across dashboards</p>
                    </CardContent>
                </Card>
                <Card className="bg-blue-500/5 border-blue-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Database className="w-4 h-4 text-blue-600" /> Platform Mapping
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">Unified</div>
                        <p className="text-xs text-muted-foreground mt-1">Cross-campus synchronization active</p>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            <div>
                                <CardTitle>Global Access Matrix</CardTitle>
                                <CardDescription>Define which user roles can access specific modules across the platform.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b bg-muted/30">
                                        <th className="p-3 text-left font-medium text-sm">Module Name</th>
                                        <th className="p-3 text-center font-medium text-sm">SuperAdmin</th>
                                        <th className="p-3 text-center font-medium text-sm">Admin</th>
                                        <th className="p-3 text-center font-medium text-sm">Leader</th>
                                        <th className="p-3 text-center font-medium text-sm">Management</th>
                                        <th className="p-3 text-center font-medium text-sm">Teacher</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {accessMatrix.map((module) => (
                                        <tr key={module.moduleId} className="hover:bg-muted/10 transition-colors">
                                            <td className="p-3">
                                                <div className="font-medium text-sm">{module.moduleName}</div>
                                                <div className="text-[10px] text-muted-foreground">{module.moduleId}</div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <Switch
                                                    checked={module.roles.SUPERADMIN}
                                                    onCheckedChange={() => togglePermission(module.moduleId, 'SUPERADMIN')}
                                                    disabled={module.moduleId === 'settings' || module.moduleId === 'access'}
                                                />
                                            </td>
                                            <td className="p-3 text-center">
                                                <Switch
                                                    checked={module.roles.ADMIN}
                                                    onCheckedChange={() => togglePermission(module.moduleId, 'ADMIN')}
                                                />
                                            </td>
                                            <td className="p-3 text-center">
                                                <Switch
                                                    checked={module.roles.LEADER}
                                                    onCheckedChange={() => togglePermission(module.moduleId, 'LEADER')}
                                                />
                                            </td>
                                            <td className="p-3 text-center">
                                                <Switch
                                                    checked={module.roles.MANAGEMENT}
                                                    onCheckedChange={() => togglePermission(module.moduleId, 'MANAGEMENT')}
                                                />
                                            </td>
                                            <td className="p-3 text-center">
                                                <Switch
                                                    checked={module.roles.TEACHER}
                                                    onCheckedChange={() => togglePermission(module.moduleId, 'TEACHER')}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Workflow className="w-5 h-5 text-amber-600" />
                            <div>
                                <CardTitle>Advanced Form Workflows</CardTitle>
                                <CardDescription>Configure how forms move between roles and where responses are displayed.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-6">
                            {formFlows.map((flow) => (
                                <div key={flow.id} className="p-4 border rounded-xl bg-card hover:shadow-md transition-all group">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2 flex-1 max-w-md">
                                            <FileText className="w-4 h-4 shrink-0 text-primary" />
                                            <Select
                                                value={flow.formName}
                                                onValueChange={(v) => updateFormFlow(flow.id, 'formName', v)}
                                            >
                                                <SelectTrigger className="h-9 font-semibold text-primary border-primary/20">
                                                    <SelectValue placeholder="Select form" />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[400px]">
                                                    {Object.entries(
                                                        [...formTemplates, ...FORM_NAME_OPTIONS.map(name => ({ name, type: 'OTHER' }))]
                                                            .reduce((acc, t) => {
                                                                const type = t.type || 'OTHER';
                                                                if (!acc[type]) acc[type] = [];
                                                                if (!acc[type].find(existing => existing.name === t.name)) {
                                                                    acc[type].push(t);
                                                                }
                                                                return acc;
                                                            }, {} as Record<string, { name: string; type: string }[]>)
                                                    ).map(([type, groupTemplates], groupIdx, arr) => (
                                                        <SelectGroup key={type}>
                                                            <SelectLabel className="text-blue-600 font-bold bg-blue-50/50 py-1 px-3 mb-1 rounded-sm text-xs uppercase tracking-wider">
                                                                {type} ({groupTemplates.length})
                                                            </SelectLabel>
                                                            {groupTemplates.sort((a, b) => a.name.localeCompare(b.name)).map(t => {
                                                                const fields = parseStructure((t as any).structure);
                                                                return (
                                                                    <HoverCard key={t.name} openDelay={200}>
                                                                        <HoverCardTrigger asChild>
                                                                            <SelectItem value={t.name} className="pl-4 pr-10 cursor-pointer relative data-[highlighted]:bg-primary/5">
                                                                                <span className="flex-1 text-left block w-full pr-6 truncate">{t.name}</span>
                                                                                <Info className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                                            </SelectItem>
                                                                        </HoverCardTrigger>
                                                                        <HoverCardContent side="right" align="start" sideOffset={10} className="w-[320px] max-w-[90vw] z-[100] max-h-[350px] overflow-y-auto pointer-events-none shadow-2xl border-slate-200 bg-white/95 backdrop-blur-sm">
                                                                            <h4 className="font-semibold text-sm mb-3 pb-2 border-b text-slate-800 border-slate-200 flex items-center justify-between">
                                                                                <span>{t.name} Fields</span>
                                                                                <Badge variant="outline" className="text-[10px] bg-slate-50">{fields.length} item{fields.length !== 1 && 's'}</Badge>
                                                                            </h4>
                                                                            <ul className="text-xs text-slate-600 space-y-2.5">
                                                                                {fields.map((f: any, idx: number) => (
                                                                                    <li key={f.id || idx} className="flex gap-2 leading-tight items-start bg-slate-50/50 p-1.5 rounded-md border border-slate-100">
                                                                                        <span className="text-red-500 w-[8px] shrink-0 font-bold mt-0.5">{f.required ? '*' : ''}</span>
                                                                                        <span className="font-semibold text-slate-700 shrink-0 min-w-[65px] uppercase text-[10px] tracking-wider bg-slate-200/50 px-1 py-0.5 rounded text-center mt-0.5">{(f.type === 'header' ? 'Header' : f.type)}</span>
                                                                                        <span className="break-words mt-0.5">{f.label || f.id || 'Unnamed field'}</span>
                                                                                    </li>
                                                                                ))}
                                                                                {fields.length === 0 && <li className="text-slate-400 italic text-center py-4 bg-slate-50 rounded-md">No fields defined for this template.</li>}
                                                                            </ul>
                                                                        </HoverCardContent>
                                                                    </HoverCard>
                                                                );
                                                            })}
                                                            {groupIdx < arr.length - 1 && <SelectSeparator className="my-2" />}
                                                        </SelectGroup>
                                                    ))}
                                                </SelectContent>

                                            </Select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Flow ID: {flow.id}</Badge>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => removeFormFlow(flow.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-4 gap-4 mt-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase text-muted-foreground">Subject Type</Label>
                                            <Select
                                                value={flow.subjectType || 'ALL'}
                                                onValueChange={(v) => updateFormFlow(flow.id, 'subjectType', v)}
                                            >
                                                <SelectTrigger className="h-9">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ALL">Any / All</SelectItem>
                                                    <SelectItem value="CORE">Core Subjects</SelectItem>
                                                    <SelectItem value="NON_CORE">Non-Core Subjects</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase text-muted-foreground">Specific Subjects</Label>
                                            <Select
                                                value={flow.specificSubjects || 'NONE'}
                                                onValueChange={(v) => updateFormFlow(flow.id, 'specificSubjects', v === 'NONE' ? '' : v)}
                                            >
                                                <SelectTrigger className="h-9">
                                                    <SelectValue placeholder="Any Subject" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="NONE">Any / Not Specified</SelectItem>
                                                    <SelectItem disabled value="label-core" className="font-bold text-gray-800 bg-gray-50">--- Core Subjects ---</SelectItem>
                                                    {coreSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                    <SelectItem disabled value="label-noncore" className="font-bold text-gray-800 bg-gray-50 mt-2">--- Non-Core Subjects ---</SelectItem>
                                                    {nonCoreSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label className="text-xs uppercase text-muted-foreground">Target School</Label>
                                            <Select
                                                value={flow.targetSchool || 'ALL'}
                                                onValueChange={(v) => updateFormFlow(flow.id, 'targetSchool', v)}
                                            >
                                                <SelectTrigger className="h-9">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {["ALL", "Ekya ITPL", "Ekya BTM", "Ekya JP Nagar", "Ekya Byrathi", "Ekya NICE Road", "CMR NPS", "CMR NPUC"].map(s => (
                                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-4 gap-4 mt-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase text-muted-foreground">Sent By</Label>
                                            <Select
                                                value={flow.senderRole}
                                                onValueChange={(v) => updateFormFlow(flow.id, 'senderRole', v)}
                                            >
                                                <SelectTrigger className="h-9">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="SUPERADMIN">SuperAdmin</SelectItem>
                                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                                    <SelectItem value="LEADER">Leader</SelectItem>
                                                    <SelectItem value="MANAGEMENT">Management</SelectItem>
                                                    <SelectItem value="TEACHER">Teacher</SelectItem>
                                                    <SelectItem value="CORE_TEACHER">Core Teacher</SelectItem>
                                                    <SelectItem value="NON_CORE_TEACHER">Non-Core Teacher</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase text-muted-foreground">Redirect To Dashboard</Label>
                                            <Select
                                                value={flow.targetDashboard}
                                                onValueChange={(v) => updateFormFlow(flow.id, 'targetDashboard', v)}
                                            >
                                                <SelectTrigger className="h-9">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Admin Dashboard">Admin Dashboard</SelectItem>
                                                    <SelectItem value="Leader Dashboard">Leader Dashboard</SelectItem>
                                                    <SelectItem value="Teacher Dashboard">Teacher Dashboard</SelectItem>
                                                    <SelectItem value="Management Dashboard">Management Dashboard</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label className="text-xs uppercase text-muted-foreground">Response Display Location</Label>
                                            <Input
                                                className="h-9"
                                                value={flow.targetLocation}
                                                onChange={(e) => updateFormFlow(flow.id, 'targetLocation', e.target.value)}
                                                placeholder="e.g. Activity Log > Reviews"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
                                        <Workflow className="w-3.5 h-3.5" />
                                        <span>
                                            <strong>Logic:</strong> When a <strong>{flow.senderRole}</strong>
                                            {flow.targetSchool && flow.targetSchool !== 'ALL' && ` at ${flow.targetSchool}`} submits <strong>{flow.formName}</strong>
                                            {flow.subjectType && flow.subjectType !== 'ALL' && ` (for ${flow.subjectType} ${flow.specificSubjects ? `: ${flow.specificSubjects}` : ''})`},
                                            the response will be visible in the <strong>{flow.targetDashboard}</strong> under <strong>{flow.targetLocation}</strong>.
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button variant="outline" className="w-full border-dashed" onClick={addFormFlow}>
                            + Add New Form Flow
                        </Button>
                    </CardContent>
                </Card>

                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex gap-4 items-start">
                    <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-destructive">Crucial System Override</h4>
                        <p className="text-sm text-muted-foreground">
                            Changes made in the SuperAdmin console bypass standard administration rules.
                            Careless modifications to the Access Matrix can lock out entire groups of users.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SuperAdminView;
