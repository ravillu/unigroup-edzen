import { NavBar } from "./nav-bar";

export function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto py-8 px-4">
        {children}
      </main>
    </div>
  );
}
