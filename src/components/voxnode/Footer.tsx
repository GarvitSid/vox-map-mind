import logoMark from "@/assets/voxnode-mark.png";

export function Footer() {
  return (
    <footer className="border-t border-border/60 mt-32">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 py-10 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <img src={logoMark} alt="VoxNode" width={28} height={28} className="h-7 w-7 object-contain" />
          <span className="text-sm font-medium">VoxNode</span>
          <span className="text-xs text-muted-foreground">© 2026</span>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground">Privacy</a>
          <a href="#" className="hover:text-foreground">Terms</a>
          <a href="#" className="hover:text-foreground">Contact</a>
          <a href="#" className="hover:text-foreground">Twitter</a>
        </div>
      </div>
    </footer>
  );
}
