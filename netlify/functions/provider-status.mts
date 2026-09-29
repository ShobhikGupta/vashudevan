import type { Context, Config } from "@netlify/functions";
import { json, providerStatus, safeError, workspace, providerConnections, providerSecret } from "./lib.mts";
import { publicProviderMetadata } from "./provider-metadata.mts";

function state(hasSecret:boolean,row:any,provider:string){
  if(!hasSecret)return {configured:false,connected:false,status:"NOT_CONFIGURED",health:"NOT_CONNECTED"};
  const health=String(row?.health||"CONFIGURED").toUpperCase(),meta=row?.provider_metadata||{};
  const stable=provider==="gemini"
    ? health==="CONNECTED"&&row?.status==="CONNECTED"&&meta.structured_synthesis_verified===true&&meta.stored_verification_passed===true&&Number(meta.stored_verification_attempts||0)>=3
    : health==="CONNECTED"&&row?.status==="CONNECTED";
  return {
    configured:true,
    connected:stable,
    status:stable?"CONNECTED":health||"CONFIGURED",
    health,
    row,
    last_error_safe:row?.last_error_safe||null,
    last_failure:meta.last_failure||null,
    stored_verification_passed:meta.stored_verification_passed===true,
    stored_verification_attempts:Number(meta.stored_verification_attempts||0)
  };
}
export default async (_req:Request,_ctx:Context)=>{
  const base=providerStatus(),rows=await providerConnections(),by=Object.fromEntries(rows.map((x:any)=>[x.provider,x]));
  let supabase:any={...base.supabase,connected:false,last_checked:new Date().toISOString()};
  if(base.supabase.configured){try{await workspace();supabase={...base.supabase,connected:true,last_checked:new Date().toISOString()}}catch(e){supabase={...base.supabase,connected:false,error:safeError(e),last_checked:new Date().toISOString()}}}
  const gs=state(Boolean(await providerSecret("gemini")),by.gemini,"gemini"),ts=state(Boolean(await providerSecret("tavily")),by.tavily,"tavily"),os=state(Boolean(await providerSecret("openai")),by.openai,"openai");
  return json({
    app_env:base.app_env,research_daily_company_limit:base.research_daily_company_limit,
    gemini:{...gs,role:"PRIMARY",selected_model:by.gemini?.selected_model||"gemini-3.8-flash",last_verified_at:by.gemini?.last_verified_at||null,last_latency_ms:by.gemini?.last_latency_ms||null},
    google_search_grounding:{configured:gs.configured,available:gs.connected&&by.gemini?.provider_metadata?.grounding_verified===true,status:gs.connected?(by.gemini?.provider_metadata?.grounding_verified===true?"AVAILABLE":"NOT_AVAILABLE_ON_CURRENT_TIER"):gs.configured?"CONFIGURED":"NOT_CONFIGURED",role:"PRIMARY SEARCH WHEN AVAILABLE",last_verified_at:by.gemini?.last_verified_at||null},
    tavily:{...ts,role:"FALLBACK",last_verified_at:by.tavily?.last_verified_at||null,last_latency_ms:by.tavily?.last_latency_ms||null},
    openai:{...os,role:"OPTIONAL",selected_model:by.openai?.selected_model||"gpt-5.6-luna",last_verified_at:by.openai?.last_verified_at||null,last_latency_ms:by.openai?.last_latency_ms||null},
    supabase,metadata:publicProviderMetadata(),checked_at:new Date().toISOString()
  });
};
export const config:Config={path:"/api/provider-status"};
