import type { Context, Config } from "@netlify/functions";
import { json, readJson, safeError, update, workspace, providerConnection } from "./lib.mts";
import { requireAdmin } from "./admin-auth.mts";
import { requireProviderAdminRateLimit } from "./provider-admin-security.mts";
import { storedProviderKey, testProvider } from "./provider-connections-lib.mts";
import { credentialDiagnostics, errorHttpStatus } from "./provider-diagnostics.mts";

function failureDetails(e:any,provider:string,model:string){
  return e?.details||{provider,http_status:502,provider_code:"PROVIDER_TEST_FAILED",provider_reason:null,message_safe:safeError(e),classification:"PROVIDER_ERROR",endpoint:null,model,request_shape:null};
}
export default async (req:Request,_ctx:Context)=>{
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  const denied=await requireAdmin(req);if(denied)return denied;
  let provider="",current:any=null,selected="";
  try{
    const b=await readJson(req);provider=String(b.provider||"").toLowerCase();
    const rateLimited=await requireProviderAdminRateLimit(provider,"test");if(rateLimited)return rateLimited;
    const key=await storedProviderKey(provider);if(!key)return json({error:"Provider is not connected."},409);
    current=await providerConnection(provider);selected=String(b.selected_model||current?.selected_model||"");
    const diag=await credentialDiagnostics(key),results:any[]=[];
    for(let i=1;i<=3;i++){
      results.push(await testProvider(provider,key,selected,String(current?.billing_mode||"unknown"),{credential_source:"vault",attempt:i}));
      if(i<3)await new Promise(r=>setTimeout(r,350));
    }
    const last=results.at(-1),metadata={...(current?.provider_metadata||{}),stored_credential_diagnostics:diag,stored_verification_passed:true,stored_verification_attempts:3,grounding_verified:last?.grounding_verified===true,grounding_tested:last?.grounding_verified!==null,structured_synthesis_verified:last?.structured_synthesis_verified===true,last_failure:null};
    const ws=await workspace();await update("provider_connections",`workspace_id=eq.${ws.id}&provider=eq.${provider}`,{last_verified_at:new Date().toISOString(),last_latency_ms:last?.latency_ms||null,health:"CONNECTED",status:"CONNECTED",last_error_safe:null,provider_metadata:metadata,updated_at:new Date().toISOString()},false);
    return json({pass:true,timestamp:new Date().toISOString(),latency_ms:last?.latency_ms||null,grounding_verified:last?.grounding_verified===true,structured_synthesis_verified:last?.structured_synthesis_verified===true,stored_verification_attempts:3});
  }catch(e:any){
    const d=failureDetails(e,provider,selected);
    try{
      if(provider){
        const ws=await workspace(),metadata={...(current?.provider_metadata||{}),stored_verification_passed:false,last_failure:{http_status:d.http_status||null,provider_code:d.provider_code||null,provider_reason:d.provider_reason||null,message_safe:d.message_safe,classification:d.classification,endpoint:d.endpoint||null,request_shape:d.request_shape||null,failed_at:new Date().toISOString()}};
        await update("provider_connections",`workspace_id=eq.${ws.id}&provider=eq.${provider}`,{health:d.classification,status:d.classification,last_verified_at:new Date().toISOString(),last_latency_ms:null,last_error_safe:JSON.stringify(metadata.last_failure),provider_metadata:metadata,updated_at:new Date().toISOString()},false);
      }
    }catch{}
    return json({pass:false,error:d.message_safe||safeError(e),code:d.classification,provider_code:d.provider_code||null,provider_reason:d.provider_reason||null,http_status:d.http_status||null,timestamp:new Date().toISOString()},errorHttpStatus(d.classification));
  }
};
export const config:Config={path:"/api/provider-test"};
