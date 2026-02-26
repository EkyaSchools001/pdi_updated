import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Workflow as WorkflowIcon, ArrowRight, Save, LayoutTemplate } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface FormTemplate {
    id: string;
    name: string;
}

export interface FormWorkflow {
    id: string;
    formTemplateId: string;
    subjectType: string;
    sentByRole: string;
    redirectTo: string;
    displayLocation: string;
    logicDescription: string;
    isActive: boolean;
    specificSubjects?: string;
    targetSchool?: string;
    isNew?: boolean;
}

export function FormWorkflowsConfig() {
    const [workflows, setWorkflows] = useState<FormWorkflow[]>([]);
    const [templates, setTemplates] = useState<FormTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const roles = ["Teacher", "Core Teacher", "Non-Core Teacher", "Leader", "Admin", "SuperAdmin"];
    const dashboards = ["Teacher Dashboard", "Leader Dashboard", "Admin Dashboard", "Growth Dashboard"];
    const locations = ["Growth Reports", "Pending Approvals", "Course Reviews", "My Portfolio"];
    const schools = ["ALL", "Ekya ITPL", "Ekya BTM", "Ekya JP Nagar", "Ekya Byrathi", "Ekya NICE Road", "CMR NPS", "CMR NPUC"];

    const coreSubjects = ["Mathematics", "Science", "English", "Social Science", "Physics", "Chemistry", "Biology"];
    const nonCoreSubjects = ["Physical Education", "Computer Science", "Art", "Music", "Hindi", "Kannada", "Value Education"];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [workflowsRes, templatesRes] = await Promise.all([
                api.get('/form-workflows'),
                api.get('/templates')
            ]);
            setWorkflows(workflowsRes.data);
            setTemplates(templatesRes.data);
        } catch (error) {
            console.error("Error fetching workflows configuration", error);
            toast({
                title: "Error",
                description: "Failed to load workflow data.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddFlow = () => {
        const newWorkflow: FormWorkflow = {
            id: `temp-${Date.now()}`,
            formTemplateId: templates[0]?.id || "",
            subjectType: "ALL",
            sentByRole: "Teacher",
            redirectTo: "Leader Dashboard",
            displayLocation: "Pending Approvals",
            logicDescription: "",
            isActive: true,
            specificSubjects: "",
            targetSchool: "ALL",
            isNew: true,
        };
        updateLogicDescription(newWorkflow);
        setWorkflows([...workflows, newWorkflow]);
    };

    const handleChange = (id: string, field: keyof FormWorkflow, value: any) => {
        setWorkflows(prev => prev.map(w => {
            if (w.id === id) {
                const updated = { ...w, [field]: value };
                updateLogicDescription(updated);
                return updated;
            }
            return w;
        }));
    };

    const updateLogicDescription = (workflow: FormWorkflow) => {
        const templateName = templates.find(t => t.id === workflow.formTemplateId)?.name || 'Unknown Form';
        let subText = workflow.subjectType !== 'ALL' ? ` (for ${workflow.subjectType.replace('_', '-')} subjects${workflow.specificSubjects ? `: ${workflow.specificSubjects}` : ''})` : '';
        if (workflow.subjectType === 'ALL' && workflow.specificSubjects) {
            subText = ` (Subjects: ${workflow.specificSubjects})`;
        }
        let schoolText = workflow.targetSchool && workflow.targetSchool !== 'ALL' ? ` at ${workflow.targetSchool}` : '';

        workflow.logicDescription = `When a ${workflow.sentByRole.toUpperCase()}${schoolText} submits ${templateName}${subText}, the response will be visible in the ${workflow.redirectTo} under ${workflow.displayLocation}.`;
    };

    const handleDelete = async (id: string) => {
        const workflow = workflows.find(w => w.id === id);
        if (workflow?.isNew) {
            setWorkflows(prev => prev.filter(w => w.id !== id));
            return;
        }

        try {
            await api.delete(`/form-workflows/${id}`);
            setWorkflows(prev => prev.filter(w => w.id !== id));
            toast({ title: "Success", description: "Flow deleted successfully." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete flow.", variant: "destructive" });
        }
    };

    const handleSaveFlow = async (id: string) => {
        const workflow = workflows.find(w => w.id === id);
        if (!workflow) return;

        try {
            if (workflow.isNew) {
                const { id: _, isNew, ...data } = workflow;
                const res = await api.post('/form-workflows', data);
                setWorkflows(prev => prev.map(w => w.id === id ? res.data : w));
                toast({ title: "Success", description: "New form flow mapped successfully." });
            } else {
                const { isNew, ...data } = workflow;
                const res = await api.put(`/form-workflows/${id}`, data);
                setWorkflows(prev => prev.map(w => w.id === id ? res.data : w));
                toast({ title: "Success", description: "Form flow mapping updated." });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to save workflow.", variant: "destructive" });
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <Card className="border-green-600 border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                        <WorkflowIcon className="w-5 h-5" />
                        Advanced Form Workflows
                    </CardTitle>
                    <CardDescription>
                        Configure how forms move between roles and where responses are displayed based on mapping.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 bg-slate-50/50 p-6 rounded-b-lg">
                    {workflows.map((flow, index) => (
                        <Card key={flow.id} className="border-green-300 shadow-sm relative overflow-hidden bg-white">
                            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                            <CardContent className="p-4 space-y-4">

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="bg-green-50 p-2 rounded-md border border-green-200 w-1/3">
                                            <div className="flex items-center gap-2 text-sm text-green-700 font-medium mb-1">
                                                <LayoutTemplate className="w-4 h-4" /> Form Template
                                            </div>
                                            <Select
                                                value={flow.formTemplateId}
                                                onValueChange={(val) => handleChange(flow.id, 'formTemplateId', val)}
                                            >
                                                <SelectTrigger className="bg-white border-green-300">
                                                    <SelectValue placeholder="Select a template" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {templates.map(t => (
                                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex-1 flex gap-4">
                                            <div className="w-40">
                                                <label className="text-xs font-semibold text-gray-500 uppercase">Subject Type</label>
                                                <Select value={flow.subjectType} onValueChange={(val) => handleChange(flow.id, 'subjectType', val)}>
                                                    <SelectTrigger className="bg-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="ALL">Any / All</SelectItem>
                                                        <SelectItem value="CORE">Core Subjects</SelectItem>
                                                        <SelectItem value="NON_CORE">Non-Core Subjects</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs font-semibold text-gray-500 uppercase">Specific Subjects</label>
                                                <Select value={flow.specificSubjects || 'NONE'} onValueChange={(val) => handleChange(flow.id, 'specificSubjects', val === 'NONE' ? '' : val)}>
                                                    <SelectTrigger className="bg-white">
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
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 ml-4">
                                        <span className="text-sm text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded">
                                            Flow ID: {index + 1}
                                        </span>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(flow.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-50 hover:text-blue-600" onClick={() => handleSaveFlow(flow.id)}>
                                            <Save className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex items-end gap-3 pt-2">
                                    <div className="w-32">
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Target School</label>
                                        <Select value={flow.targetSchool || 'ALL'} onValueChange={(val) => handleChange(flow.id, 'targetSchool', val)}>
                                            <SelectTrigger className="bg-[#f4f2e8] border-[#dfd4a0]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {schools.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="w-32">
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Sent By</label>
                                        <Select value={flow.sentByRole} onValueChange={(val) => handleChange(flow.id, 'sentByRole', val)}>
                                            <SelectTrigger className="bg-[#f4f2e8] border-[#dfd4a0]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <ArrowRight className="text-gray-400 mb-2 w-5 h-5" />

                                    <div className="flex-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Redirect To Dashboard</label>
                                        <Select value={flow.redirectTo} onValueChange={(val) => handleChange(flow.id, 'redirectTo', val)}>
                                            <SelectTrigger className="bg-[#f4f2e8] border-[#dfd4a0]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {dashboards.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <ArrowRight className="text-gray-400 mb-2 w-5 h-5" />

                                    <div className="flex-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Response Display Location</label>
                                        <Select value={flow.displayLocation} onValueChange={(val) => handleChange(flow.id, 'displayLocation', val)}>
                                            <SelectTrigger className="bg-[#f4f2e8] border-[#dfd4a0]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="mt-4 bg-[#fbfaf6] border border-[#eee8d3] p-3 rounded-md flex items-start gap-2 text-sm text-gray-600">
                                    <WorkflowIcon className="w-4 h-4 mt-0.5 text-gray-400" />
                                    <p>
                                        <span className="font-semibold text-gray-700">Logic:</span> {flow.logicDescription}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <Button
                        variant="outline"
                        onClick={handleAddFlow}
                        className="w-full border-dashed border-2 border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800 bg-[#fbf9eb]"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add New Form Flow
                    </Button>

                </CardContent>
            </Card>
        </div>
    );
}
