import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, TrendingUp, CheckCircle2, Award, ArrowUp, ArrowDown } from "lucide-react";
import api from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

const AdminAnalyticsView = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await api.get("/growth/analytics");
                setData(response.data.data.analytics);
            } catch (err) {
                console.error("Failed to load analytics");
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading || !data) {
        return <div className="p-12 text-center animate-pulse">Loading growth insights...</div>;
    }

    const pieData = [
        { name: "Core", value: data.totalCore, color: "#3B82F6" },
        { name: "Non-Core", value: data.totalNonCore, color: "#8B5CF6" },
    ];

    const stats = [
        { title: "Core Teachers", value: data.totalCore, icon: Users, color: "text-blue-600", bg: "bg-blue-100", trend: "+2.5%", trendUp: true },
        { title: "Non-Core Teachers", value: data.totalNonCore, icon: Award, color: "text-purple-600", bg: "bg-purple-100", trend: "+1.2%", trendUp: true },
        { title: "Observation Rate", value: `${data.observationCompletionRate}%`, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100", trend: "+5.4%", trendUp: true },
        { title: "Growth Index", value: "4.0", icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-100", trend: "Stable", trendUp: true },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className="shadow-sm border-none bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <span className={`text-xs font-bold flex items-center ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                                    {stat.trend}
                                    {stat.trendUp ? <ArrowUp className="w-3 h-3 ml-0.5" /> : <ArrowDown className="w-3 h-3 ml-0.5" />}
                                </span>
                            </div>
                            <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
                            <p className="text-2xl font-bold">{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 shadow-sm border-none">
                    <CardHeader>
                        <CardTitle>Growth Trends by Academic Type</CardTitle>
                        <CardDescription>Monthly engagement across Core vs Non-Core modules</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.growthTrends}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="core" name="Core" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="nonCore" name="Non-Core" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-none">
                    <CardHeader>
                        <CardTitle>Academic Distribution</CardTitle>
                        <CardDescription>Teacher count by classification</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex flex-col items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex gap-4 mt-2">
                            {pieData.map(item => (
                                <div key={item.name} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-xs font-medium">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminAnalyticsView;
