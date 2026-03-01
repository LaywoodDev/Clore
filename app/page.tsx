"use client";

import dynamic from "next/dynamic";

const AuthGate = dynamic(
  () => import("@/components/auth-gate").then((module) => module.AuthGate),
  {
    ssr: false,
    loading: () => <main className="h-[100dvh] min-h-[100dvh] w-full bg-background" />,
  }
);

export default function Page() {
  return <AuthGate />;
}
