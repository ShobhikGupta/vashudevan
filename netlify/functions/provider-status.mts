import type { Context, Config } from "@netlify/functions";
import { json, providerStatus, safeError, workspace, providerConnections, providerSecret } from "./lib.mts";
import { publicProviderMetadata } from "./provider-metadata.mts";

export default async (_req:Request,_ctx:Context)=>{
  const base=providerStatus();const rows=await providerConnections();const by=Object.fromEntries(rows.map((x:any)=>[x.provider,x]));
  let supabase={...base.supabase,connected:false};
  if(base.supabase.configured){try{await workspace();supabase={...base.supabase,connected:true}}catch(e){supabase={...base.supabase,connected:false,error:safeError(e)}}}
  const geminiConnected=Boolean(await providerSecret("gemini")),tavilyConnected=Boolean(await providerSecret("tavily")),openaiConnected=Boolean(await providerSecret("openai"));
  return json({
    app_env:base.app_env,research_daily_company_limit:base.research_daily_company_limit,
    gemini:{configured:geminiConnected,connected:geminiConnected,role:"PRIMARY",health:by.gemini?.health||(geminiConnected?"CONNECTED":"NOT_CONNECTED"),selected_model:by.gemini?.selected_model||"gemini-2.5-flash"},
    google_search_grounding:{available:geminiConnected,role:"PRIMARY SEARCH"},
    tavily:{configured:tavilyConnected,connected:tavilyConnected,role:"FALLBACK",health:by.tavily?.health||(tavilyConnected?"CONNECTED":"NOT_CONNECTED")},
    openai:{configured:openaiConnected,connected:openaiConnected,role:"OPTIONAL",health:by.openai?.health||(openaiConnected?"CONNECTED":"NOT_CONNECTED"),selected_model:by.openai?.selected_model||"gpt-5.6-luna"},
    supabase,
    metadata:publicProviderMetadata()
  });
};
export const config:Config={path:"/api/provider-status"};