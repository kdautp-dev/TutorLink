import { useEffect } from "react";
import { useRouter } from "next/router";

export default function LegacyCreatePostPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/post?type=assignment");
  }, [router]);

  return <p className="helper-text">Redirecting to the new post page...</p>;
}
