import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="container">
      <div style={{maxWidth:460,margin:"50px auto"}} className="card">
        <h1>Sign in</h1>
        <p className="muted">Use your Coders Arena account.</p>
        <LoginForm />
      </div>
    </main>
  );
}
