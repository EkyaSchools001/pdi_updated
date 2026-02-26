
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
    Settings, Bell, Lock, Globe, Mail, Save, Server, Shield, Key, Smartphone, Layout, Database, School, CheckCircle2, AlertCircle, Workflow, Play, Edit, RotateCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { toast } from "sonner";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { FormWorkflowsConfig } from "./FormWorkflowsConfig";

// --- Interfaces ---

interface SecuritySettings {
    minPasswordLength: number;
    requireSpecialChars: boolean;
    twoFactorEnabled: boolean;
    sessionTimeout: string;
}

interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    lastEdited: string;
}

interface IntegrationSettings {
    id: string;
    name: string;
    description: string;
    icon: any; // Lucide icon component
    status: 'active' | 'inactive' | 'error';
    connectedAt?: string;
    colorClass: string;
}

interface WorkflowConfig {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'inactive';
    webhookUrl: string;
    lastRun?: string;
    lastStatus?: 'success' | 'failed';
    schedule: string;
}


interface PlatformSettings {
    schoolName: string;
    domain: string;
    maintenanceMode: boolean;
    notifications: {
        newUser: boolean;
        observationCompleted: boolean;
        weeklyDigest: boolean;
    };
    security: SecuritySettings;
    emailTemplates: EmailTemplate[];
    integrations: IntegrationSettings[];
    automation: {
        n8nBaseUrl: string;
        apiKey: string;
        workflows: WorkflowConfig[];
    };
}

// --- Default Data ---

const defaultEmailTemplates: EmailTemplate[] = [
    {
        id: 'welcome',
        name: 'Welcome Email',
        subject: 'Welcome to School Growth Hub!',
        body: `Dear {{name}},

Welcome to the School Growth Hub! We are excited to have you on board.

Your account has been successfully created. You can now log in and start tracking your professional growth.

Best regards,
Attributes Team`,
        lastEdited: '2 days ago'
    },
    {
        id: 'reset-password',
        name: 'Reset Password',
        subject: 'Reset Your Password',
        body: `Hello {{name}},

We received a request to reset your password. Click the link below to verify your identity and set a new password.

[Reset Link]

If you didn't ask for this, you can ignore this email.

Best,
Attributes Team`,
        lastEdited: '1 week ago'
    },
    {
        id: 'observation-completed',
        name: 'Observation Completed',
        subject: 'New Observation Report Available',
        body: `Hi {{name}},

A new observation report has been finalized for your recent class.

Log in to the dashboard to view the feedback and growth recommendations.

Keep up the great work!`,
        lastEdited: '3 days ago'
    },
    {
        id: 'weekly-digest',
        name: 'Weekly Digest',
        subject: 'Your Weekly Growth Summary',
        body: `Updates for the week:

- 2 New courses completed
- 1 Observation recorded
- Effectiveness rating: 8.5/10

See full details on your dashboard.`,
        lastEdited: '5 days ago'
    }
];

const defaultWorkflows: WorkflowConfig[] = [
    {
        id: 'user-sync',
        name: 'HR User Sync',
        description: 'Syncs new employee data from Darwinbox/CSV to the Users database.',
        status: 'active',
        webhookUrl: 'https://n8n.schoolhub.edu/webhook/user-sync',
        schedule: 'Daily 8:00 AM',
        lastRun: '2 hours ago',
        lastStatus: 'success'
    },
    {
        id: 'obs-feedback',
        name: 'Observation Feedback Loop',
        description: 'Sends instant Slack/Email notifications when an observation is submitted.',
        status: 'active',
        webhookUrl: 'https://n8n.schoolhub.edu/webhook/obs-feedback',
        schedule: 'Real-time (Webhook)',
        lastRun: '10 mins ago',
        lastStatus: 'success'
    },
    {
        id: 'weekly-report',
        name: 'Weekly Leadership Report',
        description: 'Generates and emails PDF stats summary to school leaders.',
        status: 'active',
        webhookUrl: 'https://n8n.schoolhub.edu/webhook/weekly-report',
        schedule: 'Mon 8:00 AM',
        lastRun: 'Yesterday',
        lastStatus: 'success'
    },
    {
        id: 'training-reminders',
        name: 'Training Reminders',
        description: 'Sends reminder emails to training attendees 24 hours before event.',
        status: 'inactive',
        webhookUrl: 'https://n8n.schoolhub.edu/webhook/training-reminders',
        schedule: 'Daily 9:00 AM',
        lastRun: 'Never',
        lastStatus: undefined
    },
    {
        id: 'doc-expiry',
        name: 'Document Expiry Alert',
        description: 'Checks for expiring certifications and notifies users.',
        status: 'active',
        webhookUrl: 'https://n8n.schoolhub.edu/webhook/doc-expiry',
        schedule: 'Daily 1:00 AM',
        lastRun: '12 hours ago',
        lastStatus: 'success'
    }
];


const defaultSettings: PlatformSettings = {
    schoolName: "Springfield High School",
    domain: "school.edu",
    maintenanceMode: false,
    notifications: {
        newUser: true,
        observationCompleted: true,
        weeklyDigest: false,
    },
    security: {
        minPasswordLength: 8,
        requireSpecialChars: true,
        twoFactorEnabled: false,
        sessionTimeout: "30",
    },
    emailTemplates: defaultEmailTemplates,
    integrations: [] as any,
    automation: {
        n8nBaseUrl: 'https://n8n.schoolhub.edu',
        apiKey: '',
        workflows: defaultWorkflows
    }
};

export function SystemSettingsView() {
    // --- State ---
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'SUPERADMIN';
    const [isLoading, setIsLoading] = useState(true);
    const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('welcome');
    const [runningWorkflowId, setRunningWorkflowId] = useState<string | null>(null);

    // Derived state for integration UI (since we can't store icons in localStorage JSON)
    // We maintain the status in `settings.integrations`, but render using this map
    const [integrationStatuses, setIntegrationStatuses] = useState<Record<string, 'active' | 'inactive'>>({
        'google': 'active',
        'microsoft': 'inactive',
        'sis': 'active',
        'canvas': 'inactive'
    });

    // --- Effects ---

    useEffect(() => {
        // Fetch settings from API
        const loadSettings = async () => {
            try {
                // Fetch all settings. The backend returns an array of { key, value }
                // We need to map them back to our `PlatformSettings` structure.
                const response = await api.get('/settings');

                if (response.data.status === 'success') {
                    const fetchedSettings = response.data.data.settings;

                    // Start with defaults
                    let newSettings = { ...defaultSettings };
                    let newIntegrationStatuses = { ...integrationStatuses };

                    // Process each setting
                    fetchedSettings.forEach((setting: any) => {
                        try {
                            const value = JSON.parse(setting.value);

                            if (setting.key === 'platform_settings') {
                                // If we stored the whole object (legacy/simple)
                                newSettings = { ...newSettings, ...value };
                                // Ensure automation object exists if loaded from older config
                                if (!newSettings.automation) {
                                    newSettings.automation = defaultSettings.automation;
                                }
                            } else if (setting.key === 'integration_statuses') {
                                newIntegrationStatuses = value;
                            } else {
                                // If we start storing keys individually later
                                // (newSettings as any)[setting.key] = value;
                            }
                        } catch (e) {
                            console.error(`Failed to parse setting ${setting.key}`, e);
                        }
                    });

                    // Handle legacy "platform_settings" key if it exists in the fetched list
                    // If your backend `getAllSettings` returns the rows, we iterate them.

                    // However, we might want to standardize on storing the whole object in one key for now 
                    // to match the previous localStorage structure and minimize refactoring.
                    // Let's see if we can find a key "platform_settings" in the array.
                    const mainSettings = fetchedSettings.find((s: any) => s.key === "platform_settings");
                    if (mainSettings) {
                        try {
                            const parsed = JSON.parse(mainSettings.value);
                            newSettings = { ...newSettings, ...parsed };
                            if (parsed._integrationStatuses) {
                                newIntegrationStatuses = parsed._integrationStatuses;
                            }
                            if (!newSettings.automation) {
                                newSettings.automation = defaultSettings.automation;
                            }
                        } catch (e) { }
                    }

                    setSettings(newSettings);
                    setIntegrationStatuses(newIntegrationStatuses);
                }
            } catch (e) {
                console.error("Failed to load settings", e);
                toast.error("Failed to load system settings");
            } finally {
                setIsLoading(false);
            }
        };
        loadSettings();
    }, []);

    // --- Handlers ---

    const handleSave = async () => {
        try {
            const toSave = {
                ...settings,
                _integrationStatuses: integrationStatuses // Hack to persist local UI state
            };

            // We use the 'upsert' endpoint which expects { key, value }
            const payload = {
                key: "platform_settings",
                value: toSave // Backend stringifies it? No, controller says `value: JSON.stringify(value)` so we pass object.
            };

            await api.post('/settings/upsert', payload);

            toast.success("Settings saved successfully", {
                description: "All changes have been applied to the database."
            });
        } catch (e) {
            console.error(e);
            toast.error("Failed to save settings");
        }
    }

    const updateSecurity = (field: keyof SecuritySettings, value: any) => {
        setSettings(prev => ({
            ...prev,
            security: { ...prev.security, [field]: value }
        }));
    };

    const updateEmailTemplate = (field: 'subject' | 'body', value: string) => {
        setSettings(prev => ({
            ...prev,
            emailTemplates: prev.emailTemplates.map(t =>
                t.id === selectedTemplateId ? { ...t, [field]: value } : t
            )
        }));
    };

    const toggleIntegration = (id: string) => {
        setIntegrationStatuses(prev => ({
            ...prev,
            [id]: prev[id] === 'active' ? 'inactive' : 'active'
        }));

        const status = integrationStatuses[id] === 'active' ? 'Disconnected' : 'Connected';
        toast.info(`${id === 'google' ? 'Google Workspace' : id.toUpperCase()} ${status}`);
    };

    // --- Automation Handlers ---

    const updateAutomationConfig = (field: keyof PlatformSettings['automation'], value: any) => {
        setSettings(prev => ({
            ...prev,
            automation: { ...prev.automation, [field]: value }
        }));
    };

    const toggleWorkflow = (id: string) => {
        const workflows = settings.automation.workflows.map(wf =>
            wf.id === id ? { ...wf, status: wf.status === 'active' ? 'inactive' : 'active' as const } : wf
        );
        updateAutomationConfig('workflows', workflows);
        toast.info("Workflow status updated");
    };

    const runWorkflow = async (id: string) => {
        setRunningWorkflowId(id);
        const workflow = settings.automation.workflows.find(w => w.id === id);

        // Simulate API call to n8n
        // In real impl: await axios.post(workflow.webhookUrl)
        setTimeout(() => {
            setRunningWorkflowId(null);

            // Update last run time mock
            const workflows = settings.automation.workflows.map(wf =>
                wf.id === id ? { ...wf, lastRun: 'Just now', lastStatus: 'success' as const } : wf
            );
            updateAutomationConfig('workflows', workflows);

            toast.success(`Workflow "${workflow?.name}" trigger submitted!`, {
                description: "The execution has started in n8n."
            });
        }, 2000);
    };

    const selectedTemplate = settings.emailTemplates.find(t => t.id === selectedTemplateId) || settings.emailTemplates[0];

    if (isLoading) return <div>Loading settings...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader
                title="Platform Settings"
                subtitle="Configure system preferences, notifications, and security"
                actions={
                    <Button onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                    </Button>
                }
            />

            <Tabs defaultValue="general" className="gap-6 flex flex-col md:flex-row">
                <TabsList className="bg-transparent flex-col h-auto items-start gap-1 p-0 w-full md:w-64">
                    <TabsTrigger value="general" className="w-full justify-start gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                        <Settings className="w-4 h-4" /> General
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="w-full justify-start gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                        <Bell className="w-4 h-4" /> Notifications
                    </TabsTrigger>
                    <TabsTrigger value="security" className="w-full justify-start gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                        <Lock className="w-4 h-4" /> Security & Access
                    </TabsTrigger>
                    <TabsTrigger value="email" className="w-full justify-start gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                        <Mail className="w-4 h-4" /> Email Templates
                    </TabsTrigger>
                    <TabsTrigger value="integrations" className="w-full justify-start gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                        <Globe className="w-4 h-4" /> Integrations
                    </TabsTrigger>
                    <TabsTrigger value="workflows" className="w-full justify-start gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                        <Workflow className="w-4 h-4" /> Workflows (n8n)
                    </TabsTrigger>
                    <TabsTrigger value="form-workflows" className="w-full justify-start gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                        <Layout className="w-4 h-4" /> Form Mapping
                    </TabsTrigger>
                </TabsList>

                <div className="flex-1">
                    {/* General Tab */}
                    <TabsContent value="general" className="m-0 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>General Configuration</CardTitle>
                                <CardDescription>Basic system information and display settings.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="schoolName">School Name</Label>
                                    <Input
                                        id="schoolName"
                                        value={settings.schoolName}
                                        onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="domain">Primary Domain</Label>
                                    <Input
                                        id="domain"
                                        value={settings.domain}
                                        onChange={(e) => setSettings({ ...settings, domain: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Maintenance Mode</Label>
                                        <p className="text-sm text-muted-foreground">Temporarily disable access for all users except admins.</p>
                                    </div>
                                    <Switch
                                        checked={settings.maintenanceMode}
                                        onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Notifications Tab */}
                    <TabsContent value="notifications" className="m-0">
                        <Card>
                            <CardHeader>
                                <CardTitle>Notification Preferences</CardTitle>
                                <CardDescription>Manage how and when system emails are sent.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>New User Registration</Label>
                                        <p className="text-sm text-muted-foreground">Notify admins when a new user registers.</p>
                                    </div>
                                    <Switch
                                        checked={settings.notifications.newUser}
                                        onCheckedChange={(c) => setSettings({ ...settings, notifications: { ...settings.notifications, newUser: c } })}
                                    />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Observation Completed</Label>
                                        <p className="text-sm text-muted-foreground">Notify teachers when an observation report is finalized.</p>
                                    </div>
                                    <Switch
                                        checked={settings.notifications.observationCompleted}
                                        onCheckedChange={(c) => setSettings({ ...settings, notifications: { ...settings.notifications, observationCompleted: c } })}
                                    />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Weekly Digest</Label>
                                        <p className="text-sm text-muted-foreground">Send weekly summary of platform activity to leaders.</p>
                                    </div>
                                    <Switch
                                        checked={settings.notifications.weeklyDigest}
                                        onCheckedChange={(c) => setSettings({ ...settings, notifications: { ...settings.notifications, weeklyDigest: c } })}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Security Tab */}
                    <TabsContent value="security" className="m-0 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Security Configuration</CardTitle>
                                <CardDescription>Manage access control and authentication settings.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="font-medium flex items-center gap-2">
                                        <Key className="w-4 h-4" /> Password Policy
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Minimum Password Length</Label>
                                            <Input
                                                type="number"
                                                value={settings.security.minPasswordLength}
                                                onChange={(e) => updateSecurity('minPasswordLength', parseInt(e.target.value) || 8)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between border p-3 rounded-lg">
                                            <div className="space-y-0.5">
                                                <Label>Require Special Characters</Label>
                                                <p className="text-xs text-muted-foreground">Force users to include symbols.</p>
                                            </div>
                                            <Switch
                                                checked={settings.security.requireSpecialChars}
                                                onCheckedChange={(c) => updateSecurity('requireSpecialChars', c)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <h3 className="font-medium flex items-center gap-2">
                                        <Shield className="w-4 h-4" /> Access Control
                                    </h3>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Two-Factor Authentication (2FA)</Label>
                                            <p className="text-sm text-muted-foreground">Require 2FA for all admin accounts.</p>
                                        </div>
                                        <Switch
                                            checked={settings.security.twoFactorEnabled}
                                            onCheckedChange={(c) => updateSecurity('twoFactorEnabled', c)}
                                        />
                                    </div>
                                    <div className="grid gap-2 max-w-md">
                                        <Label>Session Timeout</Label>
                                        <Select
                                            value={settings.security.sessionTimeout}
                                            onValueChange={(v) => updateSecurity('sessionTimeout', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select timeout" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="15">15 Minutes</SelectItem>
                                                <SelectItem value="30">30 Minutes</SelectItem>
                                                <SelectItem value="60">1 Hour</SelectItem>
                                                <SelectItem value="240">4 Hours</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">Automatically log users out after inactivity.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Email Templates Tab */}
                    <TabsContent value="email" className="m-0 space-y-6">
                        <div className="grid md:grid-cols-12 gap-6">
                            <Card className="md:col-span-4">
                                <CardHeader>
                                    <CardTitle>Templates</CardTitle>
                                    <CardDescription>Select a template to edit.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="flex flex-col">
                                        {settings.emailTemplates.map((template) => (
                                            <button
                                                key={template.id}
                                                onClick={() => setSelectedTemplateId(template.id)}
                                                className={cn(
                                                    "text-left p-4 hover:bg-muted transition-colors border-b last:border-0",
                                                    selectedTemplateId === template.id ? "bg-primary/5 border-l-4 border-l-primary" : ""
                                                )}
                                            >
                                                <div className="font-medium">{template.name}</div>
                                                <div className="text-xs text-muted-foreground mt-1">Last edited: {template.lastEdited}</div>
                                            </button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="md:col-span-8">
                                <CardHeader>
                                    <CardTitle>Edit Template: {selectedTemplate.name}</CardTitle>
                                    <CardDescription>Customize the content of the selected email.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label>Subject Line</Label>
                                        <Input
                                            value={selectedTemplate.subject}
                                            onChange={(e) => updateEmailTemplate('subject', e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Body Content</Label>
                                        <Textarea
                                            className="min-h-[300px] font-mono text-sm"
                                            value={selectedTemplate.body}
                                            onChange={(e) => updateEmailTemplate('body', e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">Available variables: {'{{name}}'}, {'{{email}}'}, {'{{school}}'}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Integrations Tab */}
                    <TabsContent value="integrations" className="m-0 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Connected Services</CardTitle>
                                <CardDescription>Manage third-party integrations and data sync.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6">
                                {/* Google Workspace */}
                                <div className="flex items-start justify-between p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow">
                                    <div className="flex gap-4">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                            <Globe className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-lg">Google Workspace</h4>
                                            <p className="text-sm text-muted-foreground mb-2">Sync users and enable SSO login.</p>
                                            <div className="flex gap-2">
                                                {integrationStatuses['google'] === 'active' ? (
                                                    <>
                                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                                                        <Badge variant="outline">SSO Enabled</Badge>
                                                    </>
                                                ) : (
                                                    <Badge variant="secondary">Not Connected</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant={integrationStatuses['google'] === 'active' ? "outline" : "default"}
                                        onClick={() => toggleIntegration('google')}
                                    >
                                        {integrationStatuses['google'] === 'active' ? "Configure" : "Connect"}
                                    </Button>
                                </div>

                                {/* Microsoft 365 */}
                                <div className="flex items-start justify-between p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow">
                                    <div className="flex gap-4">
                                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                                            <Layout className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-lg">Microsoft 365</h4>
                                            <p className="text-sm text-muted-foreground mb-2">Calendar sync and Outlook integration.</p>
                                            <div className="flex gap-2">
                                                {integrationStatuses['microsoft'] === 'active' ? (
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Not Connected</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant={integrationStatuses['microsoft'] === 'active' ? "destructive" : "default"}
                                        onClick={() => toggleIntegration('microsoft')}
                                    >
                                        {integrationStatuses['microsoft'] === 'active' ? "Disconnect" : "Connect"}
                                    </Button>
                                </div>

                                <Separator />

                                {/* SIS */}
                                <div className="flex items-start justify-between p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow">
                                    <div className="flex gap-4">
                                        <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                                            <Database className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-lg">SIS Integration</h4>
                                            <p className="text-sm text-muted-foreground mb-2">Automated student and staff roster sync.</p>
                                            <div className="flex gap-2">
                                                {integrationStatuses['sis'] === 'active' ? (
                                                    <Badge variant="outline">Last sync: 2 hours ago</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Not Connected</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant={integrationStatuses['sis'] === 'active' ? "outline" : "default"}
                                        onClick={() => toggleIntegration('sis')}
                                    >
                                        {integrationStatuses['sis'] === 'active' ? "Sync Now" : "Connect"}
                                    </Button>
                                </div>

                                {/* Canvas LMS */}
                                <div className="flex items-start justify-between p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow">
                                    <div className="flex gap-4">
                                        <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                                            <School className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-lg">Canvas LMS</h4>
                                            <p className="text-sm text-muted-foreground mb-2">Import course completion data.</p>
                                            <div className="flex gap-2">
                                                {integrationStatuses['canvas'] === 'active' ? (
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Not Connected</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant={integrationStatuses['canvas'] === 'active' ? "destructive" : "default"}
                                        onClick={() => toggleIntegration('canvas')}
                                    >
                                        {integrationStatuses['canvas'] === 'active' ? "Disconnect" : "Connect"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Automation (n8n) Tab */}
                    <TabsContent value="workflows" className="m-0 space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Automation Workflows (n8n)</CardTitle>
                                        <CardDescription>Manage automated backend processes and integrations.</CardDescription>
                                    </div>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex gap-2 items-center px-3 py-1">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        Service Online
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Global Config */}
                                <div className="p-4 bg-muted/40 rounded-lg border space-y-4">
                                    <h3 className="font-medium text-sm text-foreground flex items-center gap-2">
                                        <Server className="w-4 h-4" /> Server Configuration
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>n8n Base URL</Label>
                                            <Input
                                                value={settings.automation.n8nBaseUrl}
                                                onChange={(e) => updateAutomationConfig('n8nBaseUrl', e.target.value)}
                                                placeholder="https://n8n.yourdomain.com"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>API Key</Label>
                                            <Input
                                                type="password"
                                                value={settings.automation.apiKey}
                                                onChange={(e) => updateAutomationConfig('apiKey', e.target.value)}
                                                placeholder="••••••••••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-4">
                                    {settings.automation.workflows.map((workflow) => (
                                        <div
                                            key={workflow.id}
                                            className={cn(
                                                "flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg transition-all",
                                                workflow.status === 'active' ? "bg-card shadow-sm" : "bg-muted/30 opacity-80"
                                            )}
                                        >
                                            <div className="flex gap-4 mb-4 sm:mb-0">
                                                <div className={cn(
                                                    "p-2 rounded-lg mt-1",
                                                    workflow.status === 'active' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                                )}>
                                                    <Workflow className="w-5 h-5" />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold">{workflow.name}</h4>
                                                        {workflow.status === 'active' ? (
                                                            <Badge variant="default" className="text-[10px] h-5 px-1.5">Active</Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">Inactive</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{workflow.description}</p>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                                                        <span className="flex items-center gap-1">
                                                            <RotateCw className="w-3 h-3" /> {workflow.schedule}
                                                        </span>
                                                        {workflow.lastRun && (
                                                            <span className="flex items-center gap-1">
                                                                <span className={cn(
                                                                    "w-1.5 h-1.5 rounded-full",
                                                                    workflow.lastStatus === 'success' ? "bg-green-500" : "bg-red-500"
                                                                )} />
                                                                Last run: {workflow.lastRun}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                                <Switch
                                                    checked={workflow.status === 'active'}
                                                    onCheckedChange={() => toggleWorkflow(workflow.id)}
                                                />
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={workflow.status === 'inactive' || runningWorkflowId === workflow.id}
                                                    onClick={() => runWorkflow(workflow.id)}
                                                    className="w-full sm:w-auto"
                                                >
                                                    {runningWorkflowId === workflow.id ? (
                                                        <>
                                                            <RotateCw className="w-3 h-3 mr-2 animate-spin" /> Running...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Play className="w-3 h-3 mr-2" /> Run Now
                                                        </>
                                                    )}
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                                    <Settings className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Form Workflows Tab */}
                    <TabsContent value="form-workflows" className="m-0 space-y-6">
                        <FormWorkflowsConfig />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
