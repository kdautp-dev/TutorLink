import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/components/AuthProvider";

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const { authUser, loading, profileError, authReady } = useAuth();

  useEffect(() => {
    if (!loading && !authUser) {
      router.replace("/login");
    }
  }, [authUser, loading, router]);

  if (loading) {
    return (
      <div className="card">
        <p className="helper-text">Checking your session...</p>
        {profileError && <p className="error-text">{profileError}</p>}
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="card">
        <p className="helper-text">You need to log in to view this page.</p>
        {authReady && <p className="helper-text">Redirecting to login...</p>}
        {profileError && <p className="error-text">{profileError}</p>}
      </div>
    );
  }

  return children;
}
