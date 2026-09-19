import type { Context, Config } from "@netlify/functions";
import { json, safeError, config as appConfig, workspace } from "./lib.mts";

export default async (_req:Request,_ctx:Context)=>{
  const c=appConfig(),checked_at=new Date().toISOString();
  const out:any={checked_at,environment:c.appEnv,functions:{status:"OPERATIONAL",checked_at},database:{status:"NOT_CONFIGURED",checked_at},storage:{status:"NOT_CONFIGURED",checked_at}};
  if(!c.supabaseUrl||!c.supabaseSecret)return json(out);
  try{await workspace();out.database={status:"CONNECTED",checked_at}}catch(e){out.database={status:"ERROR",checked_at,error:safeError(e)};return json(out)}
  try{
    const r=await fetch(`${c.supabaseUrl}/storage/v1/bucket/company-documents`,{headers:{apikey:c.supabaseSecret,authorization:`Bearer ${c.supabaseSecret}`}});
    const body=await r.text();if(!r.ok)throw new Error(`Storage ${r.status}: ${body.slice(0,250)}`);
    const parsed=body?JSON.parse(body):{};out.storage={status:parsed?.public===false?"CONNECTED":"ERROR",private:parsed?.public===false,checked_at};
  }catch(e){out.storage={status:"ERROR",checked_at,error:safeError(e)}}
  return json(out);
};
export const config:Config={path:"/api/system-health"};