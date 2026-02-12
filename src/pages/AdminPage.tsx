import { useAuth } from "@/hooks/useAuth";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";

export default function AdminPage() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground font-body">Loading...</div>
      </div>
    );
  }

  return session ? <AdminDashboard /> : <AdminLogin />;
}
