import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell, Field, GoogleButton } from "@/components/voxnode/AuthShell";
import type { FormEvent } from "react";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({ meta: [{ title: "Create account — VoxNode" }] }),
});

function SignupPage() {
  const navigate = useNavigate();
  const onSubmit = (e: FormEvent) => { e.preventDefault(); navigate({ to: "/dashboard" }); };
  return (
    <AuthShell
      title="Create your account"
      subtitle="Start turning voice into structured thought."
      footer={<>Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <GoogleButton />
        <div className="relative my-4 flex items-center">
          <div className="flex-1 border-t border-border" />
          <span className="px-3 text-xs text-muted-foreground">or</span>
          <div className="flex-1 border-t border-border" />
        </div>
        <Field label="Full name" placeholder="Ada Lovelace" />
        <Field label="Email" type="email" placeholder="you@example.com" />
        <Field label="Password" type="password" placeholder="At least 8 characters" />
        <button className="mt-2 w-full rounded-xl bg-gradient-amber px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-glow hover:scale-[1.01] transition-transform">
          Create account
        </button>
        <p className="text-center text-xs text-muted-foreground">
          By signing up, you agree to our Terms and Privacy Policy.
        </p>
      </form>
    </AuthShell>
  );
}
