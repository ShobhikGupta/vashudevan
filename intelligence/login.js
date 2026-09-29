const form=document.getElementById("loginForm"),secret=document.getElementById("accessSecret"),msg=document.getElementById("loginMessage"),btn=document.getElementById("loginBtn");
function show(text,bad=false){msg.hidden=false;msg.className="notice "+(bad?"error":"info");msg.textContent=text}
async function state(){
  try{const r=await fetch("/api/auth",{credentials:"same-origin"}),j=await r.json();if(j.authenticated){location.replace("/");return}if(!j.configured)show("Access has not been configured on the private deployment yet.",true)}
  catch{show("Could not check access configuration.",true)}
}
form.addEventListener("submit",async e=>{
  e.preventDefault();btn.disabled=true;msg.hidden=true;
  const value=secret.value;
  try{
    const r=await fetch("/api/auth",{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify({secret:value})});
    secret.value="";const j=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(j.error||"Login failed.");
    const p=new URLSearchParams(location.search),next=p.get("next");
    location.replace(next&&next.startsWith("/")?next:"/");
  }catch(err){show(err.message||"Login failed.",true);secret.focus()}
  finally{btn.disabled=false}
});
state();
