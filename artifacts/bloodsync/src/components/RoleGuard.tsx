import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth, routeForRole } from "@/lib/auth";

/**
 * Global role-based redirect guard. Mounted once inside <AppLayout/> so it
 * runs on every route change and every auth state change.
 *
 * Rules:
 *  • Admin landing on /, /login, /user-profile, /donor-dashboard, /dashboard
 *    → forced to /admin (their Command Center).
 *  • Donor landing on /user-profile or /admin → forced to /donor-dashboard.
 *  • Normal user landing on /admin or /donor-dashboard → forced to /user-profile.
 *  • Any logged-in user landing on /login → forced to their role dashboard.
 *
 * Public pages (/, /find-donors, /blog, /blog/:id, /register, /register-user)
 * remain freely browsable for non-admins so people can read content while
 * signed in.
 */
export function RoleGuard() {
  const { profile, loading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (loading || !profile) return;

    const target = routeForRole(profile.role);

    // Pages that EVERY signed-in user gets bounced from to their dashboard.
    if (location === "/login") {
      setLocation(target, { replace: true });
      return;
    }

    if (profile.role === "admin") {
      // Admins live at /admin. Push them off the home page and any other
      // role-specific dashboards.
      const adminBlocked = ["/", "/user-profile", "/donor-dashboard", "/dashboard"];
      if (adminBlocked.includes(location)) {
        setLocation("/admin", { replace: true });
      }
      return;
    }

    if (profile.role === "donor") {
      if (location === "/user-profile" || location === "/admin" || location === "/dashboard") {
        setLocation("/donor-dashboard", { replace: true });
      }
      return;
    }

    // Normal user
    if (location === "/admin" || location === "/dashboard" || location === "/donor-dashboard") {
      setLocation("/user-profile", { replace: true });
    }
  }, [location, profile, loading, setLocation]);

  return null;
}
