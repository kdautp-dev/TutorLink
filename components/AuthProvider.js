import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { getUserProfile } from "@/lib/firestore";

const AuthContext = createContext({
  authUser: null,
  profile: null,
  loading: true,
  profileError: "",
  authReady: false,
});

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setAuthReady(true);
      setLoading(false);
      return undefined;
    }

    const loadingTimer = window.setTimeout(() => {
      setLoading(false);
      setProfileError((current) =>
        current || "Session check timed out. Try refreshing or logging in again."
      );
      setAuthReady(true);
    }, 6000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setAuthUser(user);
      setProfileError("");
      setAuthReady(true);

      if (!user) {
        setProfile(null);
        setLoading(false);
        window.clearTimeout(loadingTimer);
        return;
      }

      try {
        const userProfile = await getUserProfile(user.uid);
        setProfile(userProfile);
      } catch (error) {
        setProfile(null);
        setProfileError(error.message || "Unable to load your profile.");
      } finally {
        window.clearTimeout(loadingTimer);
        setLoading(false);
      }
    });

    return () => {
      window.clearTimeout(loadingTimer);
      unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      authUser,
      profile,
      loading,
      profileError,
      authReady,
      refreshProfile: async () => {
        if (!auth?.currentUser) return;

        try {
          setProfileError("");
          const userProfile = await getUserProfile(auth.currentUser.uid);
          setProfile(userProfile);
        } catch (error) {
          setProfile(null);
          setProfileError(error.message || "Unable to refresh your profile.");
        }
      },
    }),
    [authReady, authUser, loading, profile, profileError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
