import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { assessmentService, Assessment } from "@/services/assessmentService";
import { PageHeader } from "../layout/PageHeader";
import { Plus, Users, FileText, BarChart3, Settings, Search, MoreVertical } from 'lucide-react';
import { AssessmentBuilder } from './AssessmentBuilder';
import { AssessmentAnalyticsView } from './AssessmentAnalyticsView';
import { EnhancedAnalyticsView } from './EnhancedAnalyticsView';
import { AssessmentAssignmentModal } from './AssessmentAssignmentModal';
import { toast } from "sonner";
import { useAuth } from '@/hooks/useAuth';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

interface AssessmentManagementDashboardProps {
    hideHeader?: boolean;
}

export const AssessmentManagementDashboard: React.FC<AssessmentManagementDashboardProps> = ({ hideHeader = false }) => {
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [loading, setLoading] = useState(true);
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const { user } = useAuth();
    const [selectedAssessmentForEdit, setSelectedAssessmentForEdit] = useState<Assessment | null>(null);
    const [selectedAssessmentForAssign, setSelectedAssessmentForAssign] = useState<Assessment | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [assessmentToDelete, setAssessmentToDelete] = useState<Assessment | null>(null);

    useEffect(() => {
        fetchAssessments();
    }, []);

    const fetchAssessments = async () => {
        try {
            const [assessmentsData, analyticsRes] = await Promise.all([
                assessmentService.getAllAssessments(),
                assessmentService.getAnalytics()
            ]);
            setAssessments(assessmentsData || []);
            setAnalyticsData(analyticsRes);
        } catch (error) {
            console.error("Error fetching assessment data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!assessmentToDelete) return;

        try {
            await assessmentService.deleteAssessment(assessmentToDelete.id);
            toast.success("Assessment template deleted successfully");
            setAssessmentToDelete(null);
            fetchAssessments();
        } catch (error) {
            console.error("Error deleting assessment:", error);
            toast.error("Failed to delete assessment template");
        }
    };

    const handleCreateSuccess = () => {
        setIsBuilderOpen(false);
        setSelectedAssessmentForEdit(null);
        fetchAssessments();
    };

    const handleAssignSuccess = () => {
        setSelectedAssessmentForAssign(null);
        fetchAssessments();
    };

    const filteredAssessments = assessments.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const canManageAssessments = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'SCHOOL_LEADER' || user?.role === 'LEADER';

    return (
        <div className="space-y-6">
            {!hideHeader && (
                <PageHeader
                    title="Assessments Management"
                    subtitle="Design and deploy professional competency checks"
                    actions={
                        canManageAssessments && (
                            <Button onClick={() => setIsBuilderOpen(true)} className="gap-2">
                                <Plus className="w-4 h-4" /> Create Assessment
                            </Button>
                        )
                    }
                />
            )}

            <Tabs defaultValue="templates" className="w-full">
                <TabsList className="grid grid-cols-3 w-full max-w-md bg-zinc-100 rounded-xl p-1">
                    <TabsTrigger value="templates" className="rounded-lg gap-2"><FileText className="w-4 h-4" /> Templates</TabsTrigger>
                    <TabsTrigger value="assignments" className="rounded-lg gap-2"><Users className="w-4 h-4" /> Assignments</TabsTrigger>
                    <TabsTrigger value="analytics" className="rounded-lg gap-2"><BarChart3 className="w-4 h-4" /> Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="templates" className="mt-6 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <Input
                                placeholder="Search templates..."
                                className="pl-10 h-12 rounded-xl border-zinc-200"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {canManageAssessments && (
                            <Button
                                onClick={() => {
                                    setSelectedAssessmentForEdit(null);
                                    setIsBuilderOpen(true);
                                }}
                                className="h-12 px-6 gap-2 rounded-xl shadow-lg shadow-primary/20"
                            >
                                <Plus className="w-5 h-5" />
                                Create New Template
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAssessments.map(assessment => (
                            <Card key={assessment.id} className="border-none shadow-lg hover:shadow-xl transition-all">
                                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg font-bold">{assessment.title}</CardTitle>
                                        <div className="flex gap-2">
                                            <Badge variant="outline">{assessment.type}</Badge>
                                            {assessment.isTimed && <Badge variant="secondary"><Settings className="w-3 h-3 mr-1" /> Timed</Badge>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {canManageAssessments && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => {
                                                        setSelectedAssessmentForEdit(assessment);
                                                        setIsBuilderOpen(true);
                                                    }}>
                                                        Edit Template
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-500 focus:text-red-500 focus:bg-red-50"
                                                        onClick={() => setAssessmentToDelete(assessment)}
                                                    >
                                                        Delete Template
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-zinc-500">
                                                        Archive Template
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-zinc-500 line-clamp-2 mb-4">
                                        {assessment.description || 'No description provided.'}
                                    </p>
                                    <div className="flex justify-between items-center pt-4 border-t border-zinc-50">
                                        <span className="text-xs text-zinc-400">{assessment.questions?.length || 0} Questions</span>
                                        {canManageAssessments && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-primary border-primary/20 hover:bg-primary/5"
                                                onClick={() => setSelectedAssessmentForAssign(assessment)}
                                            >
                                                Assign
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="assignments" className="mt-6">
                    <Card className="border-none shadow-lg">
                        <CardHeader>
                            <CardTitle>Active Assignments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12 text-zinc-400">
                                <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>Assignment history logic here...</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analytics" className="mt-6">
                    {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'SCHOOL_LEADER' || user?.role === 'LEADER') && analyticsData?.users ? (
                        <EnhancedAnalyticsView data={analyticsData} />
                    ) : (
                        <AssessmentAnalyticsView />
                    )}
                </TabsContent>
            </Tabs>

            {isBuilderOpen && (
                <AssessmentBuilder
                    editingAssessment={selectedAssessmentForEdit}
                    onClose={() => {
                        setIsBuilderOpen(false);
                        setSelectedAssessmentForEdit(null);
                    }}
                    onSave={handleCreateSuccess}
                />
            )}

            {selectedAssessmentForAssign && (
                <AssessmentAssignmentModal
                    isOpen={!!selectedAssessmentForAssign}
                    assessmentId={selectedAssessmentForAssign.id}
                    assessmentTitle={selectedAssessmentForAssign.title}
                    onClose={() => setSelectedAssessmentForAssign(null)}
                    onSuccess={handleAssignSuccess}
                />
            )}

            <AlertDialog open={!!assessmentToDelete} onOpenChange={(open) => !open && setAssessmentToDelete(null)}>
                <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl">Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-500">
                            You are about to delete <span className="font-bold text-zinc-900">"{assessmentToDelete?.title}"</span>.
                            This action cannot be undone and will remove all associated assignments and teacher attempts.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl border-zinc-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-500 hover:bg-red-600 rounded-xl"
                        >
                            Delete Template
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
