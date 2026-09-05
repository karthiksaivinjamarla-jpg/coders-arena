"use client";
import {useState} from "react";
export function RegisterButton({contestId}:{contestId:string}){const [state,setState]=useState("Register"); return <button className="btn" disabled={state!=="Register"} onClick={async()=>{setState("Registering…");const r=await fetch("/api/registrations",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({contestId})});const d=await r.json();setState(r.ok?`Registered • ${d.participant_no}`:d.error??"Failed");}}>{state}</button>}
