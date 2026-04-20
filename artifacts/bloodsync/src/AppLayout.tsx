import { Switch, Route } from "wouter";
import { Navbar } from "@/components/Navbar";
import Home from "@/pages/home";
import FindDonors from "@/pages/find-donors";
import Register from "@/pages/register";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import DonorDashboard from "@/pages/donor-dashboard";

export default function AppLayout() {
  return (
    <div className="min-h-[100dvh] flex flex-col relative selection:bg-primary/40 selection:text-white">
      <div className="app-bg" aria-hidden />
      <Navbar />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/find-donors" component={FindDonors} />
        <Route path="/register" component={Register} />
        <Route path="/login" component={Login} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/donor-dashboard" component={DonorDashboard} />
        <Route>
          <div className="flex-1 flex items-center justify-center text-white pt-32">
            <p>Page Not Found</p>
          </div>
        </Route>
      </Switch>
    </div>
  );
}
