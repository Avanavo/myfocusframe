import { Logo } from './Logo';

export function Header() {
  return (
    <header className="py-4 px-4 md:px-6 border-b border-border/60 shadow-sm">
      <div className="container mx-auto flex items-center gap-3">
        <Logo />
        <h1 className="text-2xl font-semibold text-foreground">Sphere of Control</h1>
      </div>
    </header>
  );
}
