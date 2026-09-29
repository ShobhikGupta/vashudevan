declare const Netlify: any;

const enc=new TextEncoder();
export const APP_COOKIE="vmg_app_session";
export const APP_SESSION_SECONDS=60*60*24*30;

export function runtimeEnv(name:string){
  try{return String(Netlify?.env?.get?.(name)||"")}catch{return""}
}
export function parseCookies(req:Request){
  const out:Record<string,string>={};
  for(const part of (req.headers.get("cookie")||"").split(";")){
    const s=part.trim(); if(!s) continue;
    const i=s.indexOf("="),k=i<0?s:s.slice(0,i),v=i<0?"":s.slice(i+1);
    try{out[decodeURIComponent(k)]=decodeURIComponent(v)}catch{}
  }
  return out;
}
function b64url(bytes:Uint8Array){
  let s=""; for(const b of bytes)s+=String.fromCharCode(b);
  return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function fromB64url(value:string){
  const s=value.replace(/-/g,"+").replace(/_/g,"/"),pad=s+"=".repeat((4-s.length%4)%4);
  const raw=atob(pad),out=new Uint8Array(raw.length); for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i); return out;
}
async function hmacKey(secret:string){
  return await crypto.subtle.importKey("raw",enc.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign","verify"]);
}
export async function issueSession(secret:string,ttlSeconds=APP_SESSION_SECONDS){
  const exp=Math.floor(Date.now()/1000)+ttlSeconds,nonce=b64url(crypto.getRandomValues(new Uint8Array(18)));
  const body="v1."+exp+"."+nonce,key=await hmacKey(secret);
  const sig=new Uint8Array(await crypto.subtle.sign("HMAC",key,enc.encode(body)));
  return body+"."+b64url(sig);
}
export async function verifySessionToken(token:string,secret:string){
  try{
    const parts=String(token||"").split("."); if(parts.length!==4||parts[0]!=="v1")return false;
    const exp=Number(parts[1]),now=Math.floor(Date.now()/1000);
    if(!Number.isFinite(exp)||exp<=now||exp>now+APP_SESSION_SECONDS+300)return false;
    const body=parts.slice(0,3).join("."),key=await hmacKey(secret);
    return await crypto.subtle.verify("HMAC",key,fromB64url(parts[3]),enc.encode(body));
  }catch{return false}
}
export async function isAppSession(req:Request){
  const secret=runtimeEnv("APP_ACCESS_SECRET"); if(!secret)return false;
  return await verifySessionToken(parseCookies(req)[APP_COOKIE]||"",secret);
}
export async function secretMatches(candidate:string,expected:string){
  if(!expected)return false;
  const [a,b]=await Promise.all([crypto.subtle.digest("SHA-256",enc.encode(candidate)),crypto.subtle.digest("SHA-256",enc.encode(expected))]);
  const aa=new Uint8Array(a),bb=new Uint8Array(b); if(aa.length!==bb.length)return false;
  let diff=0; for(let i=0;i<aa.length;i++)diff|=aa[i]^bb[i]; return diff===0;
}
export const setSessionCookie=(token:string,maxAge=APP_SESSION_SECONDS)=>APP_COOKIE+"="+encodeURIComponent(token)+"; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age="+maxAge;
export const clearSessionCookie=()=>APP_COOKIE+"=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0";
