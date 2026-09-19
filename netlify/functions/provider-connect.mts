import type { Context, Config } from "@netlify/functions";
import { json, readJson, safeError, config as appConfig } from "./lib.mts";
import { requireAdmin } from "./admin-auth.mts";
import { testProvider, saveProvider } from "./provider-connections-lib.mts";
import { PROVIDER_METADATA } from "./provider-metadata.mts";

function defaultModel(provider:string){return provider==="gemini"?"gemini-2.5-flash":provider==="openai"?"gpt-5.6-luna":"tavily-search"}
export default async (req:Request,_ctx:Context)=>{
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  const denied=await requireAdmin(req);if(denied)return denied;
  try{
    const cfg=appConfig();if(!cfg.supabaseUrl||!cfg.supabaseSecret)return json({error:"Supabase must be connected before provider credentials can be stored securely.",code:"SUPABASE_REQUIRED"},503);
    const b=await readJson(req),provider=String(b.provider||"").toLowerCase(),secret=String(b.secret||"").trim(),model=String(b.selected_model||defaultModel(provider)),billingMode=String(b.billing_mode||"unknown");
    if(!["gemini","tavily","openai"].includes(provider))return json({error:"Unsupported provider."},400);
    if(secret.length<8)return json({error:"Credential format is not valid."},400);
    const test=await testProvider(provider,secret,model);
    const saved=await saveProvider(provider,secret,model,billingMode,{connected_via:"settings",pricing_checked:(PROVIDER_METADATA as any)[provider]?.last_verified_date||null,grounding_verified:test.grounding_verified===true});
    return json({connected:true,provider,selected_model:model,masked_suffix:secret.slice(-4),connected_at:new Date().toISOString(),latency_ms:test.latency_ms,metadata:saved});
  }catch(e){return json({error:safeError(e)},400)}
};
export const config:Config={path:"/api/provider-connect"};