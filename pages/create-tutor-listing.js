import { useEffect } from "react";
import { useRouter } from "next/router";

export default function LegacyCreateTutorListingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/post?type=tutor");
  }, [router]);

  return <p className="helper-text">Redirecting to the new post page...</p>;
}
