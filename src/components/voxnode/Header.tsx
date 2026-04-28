import { Link } from "@tanstack/react-router";
import logoMark from "@/assets/voxnode-mark.png";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="mx-auto max-w-7xl px-6 pt-5">
        <div className="glass flex items-center justify-between rounded-2xl px-5 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoMark} alt="VoxNode" width={32} height={32} className="h-8 w-8 object-contain" />
            <span className="text-base font-semibold tracking-tight">VoxNode</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline">
              Sign in
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-gradient-amber px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow transition-transform hover:scale-[1.02]"
            >
              Get started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
