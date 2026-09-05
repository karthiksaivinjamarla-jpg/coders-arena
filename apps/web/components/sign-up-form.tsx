"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignUpForm() {
  const [fullName,setFullName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [message,setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    setMessage(error ? error.message : "Account created. Check your email if confirmation is enabled.");
  }

  return (
    <form onSubmit={submit} className="grid" style={{marginTop:20}}>
      <label>Full name<input value={fullName} onChange={e=>setFullName(e.target.value)} required style={{width:"100%",padding:12,marginTop:6}} /></label>
      <label>Email<input value={email} onChange={e=>setEmail(e.target.value)} required type="email" style={{width:"100%",padding:12,marginTop:6}} /></label>
      <label>Password<input value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} type="password" style={{width:"100%",padding:12,marginTop:6}} /></label>
      <button className="btn" type="submit">Create account</button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
