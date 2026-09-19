import { env, json } from "./lib.mts";

const COOKIE="vmg_settings_admin";

async function digest(value:string){
  const data=new TextEncoder().encode(value);
  const hash=await crypto.subtle.digest("SHA-256",data);
  return Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,"0")).join("");
}
function cookies(req:Request){return Object.fromEntries((req.headers.get("cookie")||"").split(";").map(x=>x.trim()).filter(Boolean).map(x=>{const i=x.indexOf("=");return [decodeURIComponent(i<0?x:x.slice(0,i)),decodeURIComponent(i<0?"":x.slice(i+1))]}))}
export async function adminConfigured(){return Boolean(env("SETTINGS_ADMIN_SECRET"))}
export async function isAdmin(req:Request){
  const secret=env("SETTINGS_ADMIN_SECRET"); if(!secret)return false;
  const token=cookies(req)[COOKIE]||""; return Boolean(token)&&token===await digest(secret);
}
export async function requireAdmin(req:Request){
  if(!env("SETTINGS_ADMIN_SECRET"))return json({error:"Admin Settings Lock is not configured. Add SETTINGS_ADMIN_SECRET in Netlify first.",code:"ADMIN_LOCK_NOT_CONFIGURED"},503);
  if(!(await isAdmin(req)))return json({error:"Admin authorization required.",code:"ADMIN_AUTH_REQUIRED"},401);
  return null;
}
export async function loginResponse(secret:string){
  const expected=env("SETTINGS_ADMIN_SECRET"); if(!expected||secret!==expected)return json({error:"Invalid admin secret."},401);
  const token=await digest(expected);
  return json({authorized:true},200,{"set-cookie":`${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`});
}
export function logoutResponse(){return json({authorized:false},200,{"set-cookie":`${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`})}
