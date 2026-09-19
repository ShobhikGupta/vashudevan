import type { Context, Config } from "@netlify/functions";
import { json, providerStatus, config as appConfig, safeError, workspace, select } from "./lib.mts";

export default async (_req:Request,_ctx:Context)=>{
  const status=providerStatus();
  const tests:any={...status};
  if(status.supabase.configured){
    try{await workspace();tests.supabase={...status.supabase,connected:true}}catch(e){tests.supabase={...status.supabase,connected:false,error:safeError(e)}}
  }
  return json(tests);
};
export const config:Config={path:"/api/provider-status"};