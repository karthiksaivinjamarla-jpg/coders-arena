import { SignUpForm } from "@/components/sign-up-form";

export default function SignUpPage() {
  return (
    <main className="container">
      <div className="card" style={{maxWidth:460,margin:"50px auto"}}>
        <h1>Create account</h1>
        <p className="muted">Register for Coders Arena.</p>
        <SignUpForm />
      </div>
    </main>
  );
}
