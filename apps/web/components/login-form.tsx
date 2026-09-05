"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [message,setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setMessage(error.message); return; }
    window.location.href = "/dashboard";
  }

  return (
    <form onSubmit={submit} className="grid" style={{marginTop:20}}>
      <label>Email<input value={email} onChange={e=>setEmail(e.target.value)} required type="email" style={{width:"100%",padding:12,marginTop:6}} /></label>
      <label>Password<input value={password} onChange={e=>setPassword(e.target.value)} required type="password" style={{width:"100%",padding:12,marginTop:6}} /></label>
      <button className="btn" type="submit">Sign in</button>
      {message && <p role="alert">{message}</p>}
    </form>
  );
}
