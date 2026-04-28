import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell, Field, GoogleButton } from "@/components/voxnode/AuthShell";
import type { FormEvent } from "react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in — VoxNode" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const onSubmit = (e: FormEvent) => { e.preventDefault(); navigate({ to: "/dashboard" }); };
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to keep mapping your thoughts."
      footer={<>New here? <Link to="/signup" className="text-primary hover:underline">Create an account</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <GoogleButton />
        <div className="relative my-4 flex items-center">
          <div className="flex-1 border-t border-border" />
          <span className="px-3 text-xs text-muted-foreground">or</span>
          <div className="flex-1 border-t border-border" />
        </div>
        <Field label="Email" type="email" placeholder="you@example.com" />
        <Field label="Password" type="password" placeholder="••••••••" />
        <button className="mt-2 w-full rounded-xl bg-gradient-amber px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-glow hover:scale-[1.01] transition-transform">
          Sign in
        </button>
      </form>
    </AuthShell>
  );
}
