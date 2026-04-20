import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Shield, User, Droplet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [role, setRole] = useState("user");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: `Logged in as ${role}`,
        description: "Welcome back to BloodSync",
      });
      if (role === "admin") {
        setLocation("/dashboard");
      } else {
        setLocation("/find-donors");
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen pt-28 pb-20 flex items-center justify-center">
      <div className="container mx-auto px-4 md:px-6 max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-6">
              <Droplet className="w-8 h-8 text-primary" fill="currentColor" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-400">Sign in to your BloodSync account</p>
          </div>

          <GlassCard className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              
              <div className="space-y-4">
                <Label className="text-gray-300">Select Role</Label>
                <RadioGroup value={role} onValueChange={setRole} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <RadioGroupItem value="user" id="role-user" className="peer sr-only" />
                    <Label
                      htmlFor="role-user"
                      className="flex flex-col items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                    >
                      <User className="mb-2 h-6 w-6" />
                      <span className="text-sm font-medium">User</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="donor" id="role-donor" className="peer sr-only" />
                    <Label
                      htmlFor="role-donor"
                      className="flex flex-col items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                    >
                      <Droplet className="mb-2 h-6 w-6" />
                      <span className="text-sm font-medium">Donor</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="admin" id="role-admin" className="peer sr-only" />
                    <Label
                      htmlFor="role-admin"
                      className="flex flex-col items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                    >
                      <Shield className="mb-2 h-6 w-6" />
                      <span className="text-sm font-medium">Admin</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier" className="text-gray-300">Email or Phone Number</Label>
                  <Input 
                    id="identifier" 
                    placeholder="Enter your email or phone" 
                    required 
                    className="bg-white/5 border-white/10 text-white h-12 focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-gray-300">Password</Label>
                    <a href="#" className="text-xs text-primary hover:text-primary/80">Forgot password?</a>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    required 
                    className="bg-white/5 border-white/10 text-white h-12 focus-visible:ring-primary"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
              
              <div className="text-center text-sm text-gray-400 mt-4">
                Don't have an account? <a href="/register" className="text-white hover:text-primary transition-colors font-medium">Register here</a>
              </div>
            </form>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
