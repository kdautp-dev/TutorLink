import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/components/AuthProvider";
import { requiresEmailVerification } from "@/lib/utils";

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const { authUser, loading, profileError, authReady } = useAuth();
  const needsVerification = requiresEmailVerification(authUser);

  useEffect(() => {
    if (!loading && !authUser) {
      router.replace("/login");
    }
  }, [authUser, loading, router]);

  useEffect(() => {
    if (!loading && authUser && needsVerification) {
      router.replace("/verify-email");
    }
  }, [authUser, loading, needsVerification, router]);

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

  if (needsVerification) {
    return (
      <div className="card">
        <p className="helper-text">Please verify your email before using Homework4Cash.</p>
        <p className="helper-text">Redirecting to the verification page...</p>
      </div>
    );
  }

  return children;
}
