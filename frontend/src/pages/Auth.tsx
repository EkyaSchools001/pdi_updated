import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GraduationCap, Mail, Lock, ArrowRight, Github, Chrome, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";

export default function Auth() {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await api.post("/auth/login", { email, password });
            const { token, data } = response.data;

            toast.success(`Welcome back, ${data.user.fullName}!`);
            login(token, data.user);
        } catch (error: any) {
            const message = error.response?.data?.message || "Login failed. Please check your credentials.";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSSO = (provider: string) => {
        setIsLoading(true);
        toast.info(`Redirecting to ${provider} login...`);
        setTimeout(() => {
            setIsLoading(false);
            toast.success(`${provider} login successful!`);
            navigate("/teacher"); // Default to teacher for SSO demo
        }, 1500);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
            <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="flex justify-center mb-6">
                    <Link to="/" className="group">
                        <img src="/EKYA.png" alt="Ekya PDI" className="h-28 w-auto object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-300" />
                    </Link>
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
                        Welcome Back
                    </h2>
                    <p className="text-muted-foreground font-medium">
                        Sign in to your professional development account
                    </p>
                </div>

                <Alert className="bg-primary/5 border-primary/20">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-xs text-primary/80">
                        <strong>Test Credentials:</strong> rohit.schoolleader@pdi.com (Leader), avani.admin@pdi.com (Admin), teacher1.btmlayout@pdi.com (Teacher 1), teacher2.jpnagar@pdi.com (Teacher 2), teacher3.itpl@pdi.com (Teacher 3) with passwords: Rohit@123, Avani@123, Teacher1@123, Teacher2@123, Teacher3@123
                    </AlertDescription>
                </Alert>

                <Card className="border-none shadow-2xl bg-background/80 backdrop-blur-md overflow-hidden">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
                        <CardDescription>
                            Enter your test credentials to access your dashboard
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@pms.com"
                                        className="pl-10 h-11"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <Link
                                        to="#"
                                        className="text-xs text-primary hover:underline font-medium"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10 h-11"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <Button className="w-full h-11 text-base font-semibold" type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        Signing in...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Sign In
                                        <ArrowRight className="w-4 h-4" />
                                    </span>
                                )}
                            </Button>
                        </form>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-muted" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground font-medium">
                                    Or continue with organization
                                </span>
                            </div>
                        </div>

                        <div className="grid gap-3">
                            <Button
                                variant="outline"
                                className="w-full h-11 flex items-center justify-center gap-3 border shadow-sm hover:bg-muted/50 transition-all font-medium"
                                onClick={() => handleSSO("Google")}
                                disabled={isLoading}
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Google
                            </Button>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 bg-muted/30 py-6">
                        <p className="text-xs text-center text-muted-foreground px-8 leading-relaxed">
                            By signing in, you agree to our <Link to="#" className="underline">Terms of Service</Link> and <Link to="#" className="underline">Privacy Policy</Link>.
                        </p>
                    </CardFooter>
                </Card>

                <p className="text-center text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link to="#" className="font-semibold text-primary hover:underline">
                        Contact your administrator
                    </Link>
                </p>
            </div>
        </div >
    );
}
