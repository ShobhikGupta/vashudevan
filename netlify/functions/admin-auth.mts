import { env, json } from "./lib.mts";
import { issueSession, parseCookies, secretMatches, verifySessionToken } from "../shared/session.mts";

const COOKIE="vmg_settings_admin";
const ADMIN_SESSION_SECONDS=60*60*8;

export async function adminConfigured(){return Boolean(env("SETTINGS_ADMIN_SECRET"))}
export async function isAdmin(req:Request){
  const secret=env("SETTINGS_ADMIN_SECRET");if(!secret)return false;
  const token=parseCookies(req)[COOKIE]||"";
  return Boolean(token)&&await verifySessionToken(token,secret);
}
export async function requireAdmin(req:Request){
  if(!env("SETTINGS_ADMIN_SECRET"))return json({error:"Admin Settings Lock is not configured. Add SETTINGS_ADMIN_SECRET in Netlify first.",code:"ADMIN_LOCK_NOT_CONFIGURED"},503);
  if(!(await isAdmin(req)))return json({error:"Admin authorization required.",code:"ADMIN_AUTH_REQUIRED"},401);
  return null;
}
export async function loginResponse(secret:string){
  const expected=env("SETTINGS_ADMIN_SECRET");
  if(!expected||!(await secretMatches(secret,expected)))return json({error:"Invalid admin secret."},401);
  const token=await issueSession(expected,ADMIN_SESSION_SECONDS);
  return json({authorized:true},200,{"set-cookie":COOKIE+"="+encodeURIComponent(token)+"; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age="+ADMIN_SESSION_SECONDS});
}
export function logoutResponse(){return json({authorized:false},200,{"set-cookie":COOKIE+"=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0"})}
