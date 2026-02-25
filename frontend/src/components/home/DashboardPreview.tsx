import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, DollarSign, ArrowUpRight } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const data = [
    { name: "Mon", value: 400 },
    { name: "Tue", value: 300 },
    { name: "Wed", value: 550 },
    { name: "Thu", value: 450 },
    { name: "Fri", value: 600 },
    { name: "Sat", value: 700 },
    { name: "Sun", value: 800 },
];

const barData = [
    { name: "Jan", total: 12 },
    { name: "Feb", total: 18 },
    { name: "Mar", total: 10 },
    { name: "Apr", total: 25 },
    { name: "May", total: 32 },
    { name: "Jun", total: 28 },
];

export function DashboardPreview() {
    return (
        <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
            <div className="rounded-xl border bg-card/50 backdrop-blur-sm shadow-2xl overflow-hidden animate-slide-up hover:shadow-primary/10 transition-shadow duration-500">

                {/* Mock Header */}
                <div className="border-b bg-muted/30 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-400" />
                            <div className="w-3 h-3 rounded-full bg-yellow-400" />
                            <div className="w-3 h-3 rounded-full bg-green-400" />
                        </div>
                    </div>
                    <div className="h-2 w-32 bg-muted rounded-full" />
                </div>

                <div className="p-6 md:p-8 grid gap-6">

                    {/* Top Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-background/80 backdrop-blur">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">$45,231.89</div>
                                <p className="text-xs text-muted-foreground flex items-center text-green-500">
                                    +20.1% <ArrowUpRight className="h-3 w-3 ml-1" />
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-background/80 backdrop-blur">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">+2350</div>
                                <p className="text-xs text-muted-foreground flex items-center text-green-500">
                                    +180.1% <ArrowUpRight className="h-3 w-3 ml-1" />
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-background/80 backdrop-blur">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">+12,234</div>
                                <p className="text-xs text-muted-foreground flex items-center text-green-500">
                                    +19% <ArrowUpRight className="h-3 w-3 ml-1" />
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-background/80 backdrop-blur col-span-1">
                            <CardHeader>
                                <CardTitle>Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={data}>
                                            <defs>
                                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="name" hide />
                                            <YAxis hide />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                            />
                                            <Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorValue)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-background/80 backdrop-blur col-span-1">
                            <CardHeader>
                                <CardTitle>Recent Sales</CardTitle>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={barData}>
                                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis hide />
                                            <Bar dataKey="total" fill="#adfa1d" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* List Preview */}
                    <div className="rounded-lg border bg-background/50 p-4">
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                                        <div className="space-y-1">
                                            <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                                            <div className="h-2 w-16 bg-muted rounded animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="h-4 w-12 bg-muted rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
