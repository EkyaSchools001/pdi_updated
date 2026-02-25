import React from "react";
import AdminAnalyticsView from "@/components/growth/AdminAnalyticsView";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";

const AdminGrowthAnalyticsPage = () => {
    const { user } = useAuth();
    if (!user) return null;

    return (
        <DashboardLayout role={user.role.toLowerCase() as any} userName={user.fullName}>
            <div className="p-0 animate-in fade-in duration-500">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">System-Wide Growth Analytics</h1>
                    <p className="text-muted-foreground">Monitor professional development impacts and participation trends across academic types.</p>
                </div>

                <AdminAnalyticsView />
            </div>
        </DashboardLayout>
    );
};

export default AdminGrowthAnalyticsPage;
