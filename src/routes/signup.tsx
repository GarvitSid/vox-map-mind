import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell, Field, GoogleButton } from "@/components/voxnode/AuthShell";
import { useState, type FormEvent } from "react";
import { signUpWithEmail, signInWithEmail } from "@/services/auth";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({ meta: [{ title: "Create account — VoxNode" }] }),
});

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signUpWithEmail(email, password, name || undefined);
      // Auto sign-in (works when email auto-confirm is enabled)
      try { await signInWithEmail(email, password); } catch { /* may need email confirm */ }
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };
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
        <Field label="Full name" placeholder="Ada Lovelace" value={name} onChange={(e) => setName(e.target.value)} />
        <Field label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Field label="Password" type="password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button disabled={loading} className="mt-2 w-full rounded-xl bg-gradient-amber px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-glow hover:scale-[1.01] transition-transform disabled:opacity-60">
          {loading ? "Creating account…" : "Create account"}
        </button>
        <p className="text-center text-xs text-muted-foreground">
          By signing up, you agree to our Terms and Privacy Policy.
        </p>
      </form>
    </AuthShell>
  );
}
