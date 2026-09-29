import type { Context, Config } from "@netlify/functions";
import { json, readJson, safeError, config as appConfig, update, workspace } from "./lib.mts";
import { requireAdmin } from "./admin-auth.mts";
import { requireProviderAdminRateLimit } from "./provider-admin-security.mts";
import { testProvider, saveProvider, verifyStoredProvider } from "./provider-connections-lib.mts";
import { credentialDiagnostics, errorHttpStatus } from "./provider-diagnostics.mts";
import { PROVIDER_METADATA } from "./provider-metadata.mts";

function defaultModel(provider:string){return provider==="gemini"?"gemini-3.8-flash":provider==="openai"?"gpt-5.6-luna":"tavily-search"}
function failureDetails(e:any,provider:string,model:string){
  return e?.details||{provider,http_status:502,provider_code:"PROVIDER_TEST_FAILED",provider_reason:null,message_safe:safeError(e),classification:"PROVIDER_ERROR",endpoint:null,model,request_shape:null};
}
async function persistFailure(provider:string,model:string,currentMeta:any,e:any){
  const d=failureDetails(e,provider,model),ws=await workspace();
  const metadata={...(currentMeta||{}),last_failure:{http_status:d.http_status||null,provider_code:d.provider_code||null,provider_reason:d.provider_reason||null,message_safe:d.message_safe,classification:d.classification,endpoint:d.endpoint||null,request_shape:d.request_shape||null,failed_at:new Date().toISOString()},stored_verification_passed:false};
  await update("provider_connections",`workspace_id=eq.${ws.id}&provider=eq.${provider}`,{health:d.classification,status:d.classification,last_verified_at:new Date().toISOString(),last_latency_ms:null,last_error_safe:JSON.stringify(metadata.last_failure),provider_metadata:metadata,updated_at:new Date().toISOString()},false);
  return d;
}
export default async (req:Request,_ctx:Context)=>{
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  const denied=await requireAdmin(req);if(denied)return denied;
  let provider="",model="",saved=false,baseMeta:any={};
  try{
    const cfg=appConfig();if(!cfg.supabaseUrl||!cfg.supabaseSecret)return json({error:"Supabase must be connected before provider credentials can be stored securely.",code:"SUPABASE_REQUIRED"},503);
    const b=await readJson(req);provider=String(b.provider||"").toLowerCase();const secret=String(b.secret||"").trim();model=String(b.selected_model||defaultModel(provider));const billingMode=String(b.billing_mode||"unknown");
    if(!["gemini","tavily","openai"].includes(provider))return json({error:"Unsupported provider."},400);
    const rateLimited=await requireProviderAdminRateLimit(provider,"connect");if(rateLimited)return rateLimited;
    if(secret.length<8)return json({error:"Credential format is not valid."},400);

    const freshDiagnostics=await credentialDiagnostics(secret);
    const freshTest=await testProvider(provider,secret,model,billingMode,{credential_source:"fresh",attempt:1});
    baseMeta={connected_via:"settings",pricing_checked:(PROVIDER_METADATA as any)[provider]?.last_verified_date||null,grounding_verified:freshTest.grounding_verified===true,grounding_tested:freshTest.grounding_verified!==null,structured_synthesis_verified:freshTest.structured_synthesis_verified===true,fresh_credential_diagnostics:freshDiagnostics,request_contract:freshTest.request_contract};
    await saveProvider(provider,secret,model,billingMode,baseMeta);saved=true;

    const stored=await verifyStoredProvider(provider,freshDiagnostics,model,billingMode,3);
    const last=stored.results.at(-1),latencies=stored.results.map((x:any)=>Number(x.latency_ms||0)).filter((x:number)=>x>0);
    const metadata={...baseMeta,grounding_verified:last?.grounding_verified===true,grounding_tested:last?.grounding_verified!==null,structured_synthesis_verified:last?.structured_synthesis_verified===true,stored_credential_diagnostics:stored.storedDiagnostics,credential_roundtrip:stored.equivalence,stored_verification_passed:true,stored_verification_attempts:stored.attempts_passed,last_failure:null};
    const ws=await workspace();
    await update("provider_connections",`workspace_id=eq.${ws.id}&provider=eq.${provider}`,{status:"CONNECTED",health:"CONNECTED",last_verified_at:new Date().toISOString(),last_latency_ms:latencies.length?latencies.at(-1):null,last_error_safe:null,provider_metadata:metadata,updated_at:new Date().toISOString()},false);
    return json({connected:true,provider,selected_model:model,connected_at:new Date().toISOString(),latency_ms:latencies.length?latencies.at(-1):freshTest.latency_ms,grounding_verified:last?.grounding_verified===true,structured_synthesis_verified:last?.structured_synthesis_verified===true,stored_verification_attempts:stored.attempts_passed,credential_roundtrip:stored.equivalence});
  }catch(e:any){
    const d=saved?await persistFailure(provider,model,baseMeta,e):failureDetails(e,provider,model);
    return json({error:d.message_safe||safeError(e),code:d.classification,provider_code:d.provider_code||null,provider_reason:d.provider_reason||null,http_status:d.http_status||null},errorHttpStatus(d.classification));
  }
};
export const config:Config={path:"/api/provider-connect"};
