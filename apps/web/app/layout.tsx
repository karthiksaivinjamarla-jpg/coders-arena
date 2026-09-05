import "./globals.css";
import Link from "next/link";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <Link className="brand" href="/">Coders Arena</Link>
          <div style={{display:"flex",gap:16}}>
            <Link href="/contests">Contests</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/login">Login</Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
