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
  let provider="",current:any=null,selected="",sequenceId="",attempt=1;
  try{
    const b=await readJson(req);provider=String(b.provider||"").toLowerCase();
    sequenceId=String(b.verification_sequence_id||"");attempt=Math.max(1,Math.min(3,Number(b.attempt||1)));
    const rateLimited=await requireProviderAdminRateLimit(provider,"test");if(rateLimited)return rateLimited;
    const key=await storedProviderKey(provider);if(!key)return json({error:"Provider is not configured."},409);
    current=await providerConnection(provider);selected=String(b.selected_model||current?.selected_model||"");
    const meta=current?.provider_metadata||{};

    if(provider==="gemini"){
      if(!sequenceId)return json({error:"verification_sequence_id is required for Gemini stored-key verification.",code:"INVALID_REQUEST"},400);
      const priorSeq=String(meta.verification_sequence_id||""),priorPassed=Number(meta.verification_sequence_passed||0);
      if(attempt===1){
        const ws=await workspace();await update("provider_connections",`workspace_id=eq.${ws.id}&provider=eq.gemini`,{status:"VERIFYING",health:"VERIFYING",last_error_safe:null,provider_metadata:{...meta,verification_sequence_id:sequenceId,verification_sequence_passed:0,stored_verification_passed:false,stored_verification_attempts:0,last_failure:null,verification_started_at:new Date().toISOString()},updated_at:new Date().toISOString()},false);
      }else if(priorSeq!==sequenceId||priorPassed!==attempt-1){
        return json({error:"Gemini verification sequence is out of order. Start a new controlled verification sequence.",code:"INVALID_REQUEST"},409);
      }
    }

    const diag=await credentialDiagnostics(key);
    const result=await testProvider(provider,key,selected,String(current?.billing_mode||"unknown"),{credential_source:"vault",attempt});
    const ws=await workspace();

    if(provider!=="gemini"){
      const metadata={...meta,stored_credential_diagnostics:diag,stored_verification_passed:true,stored_verification_attempts:1,grounding_verified:result.grounding_verified===true,grounding_tested:result.grounding_verified!==null,structured_synthesis_verified:result.structured_synthesis_verified===true,last_failure:null};
      await update("provider_connections",`workspace_id=eq.${ws.id}&provider=eq.${provider}`,{last_verified_at:new Date().toISOString(),last_latency_ms:result.latency_ms,health:"CONNECTED",status:"CONNECTED",last_error_safe:null,provider_metadata:metadata,updated_at:new Date().toISOString()},false);
      return json({pass:true,connected:true,attempt:1,attempts_required:1,timestamp:new Date().toISOString(),latency_ms:result.latency_ms});
    }

    const connected=attempt===3;
    const metadata={...meta,verification_sequence_id:sequenceId,verification_sequence_passed:attempt,stored_credential_diagnostics:diag,stored_verification_passed:connected,stored_verification_attempts:attempt,grounding_verified:result.grounding_verified===true,grounding_tested:result.grounding_verified!==null,structured_synthesis_verified:result.structured_synthesis_verified===true,last_failure:null,verification_completed_at:connected?new Date().toISOString():null};
    await update("provider_connections",`workspace_id=eq.${ws.id}&provider=eq.gemini`,{last_verified_at:new Date().toISOString(),last_latency_ms:result.latency_ms,health:connected?"CONNECTED":"VERIFYING",status:connected?"CONNECTED":"VERIFYING",last_error_safe:null,provider_metadata:metadata,updated_at:new Date().toISOString()},false);
    return json({pass:true,connected,attempt,attempts_required:3,timestamp:new Date().toISOString(),latency_ms:result.latency_ms,grounding_verified:result.grounding_verified===true,structured_synthesis_verified:true});
  }catch(e:any){
    const d=failureDetails(e,provider,selected);
    try{
      if(provider){
        const ws=await workspace(),meta=current?.provider_metadata||{},metadata={...meta,verification_sequence_id:sequenceId||meta.verification_sequence_id||null,verification_sequence_passed:0,stored_verification_passed:false,stored_verification_attempts:0,last_failure:{http_status:d.http_status||null,provider_code:d.provider_code||null,provider_reason:d.provider_reason||null,message_safe:d.message_safe,classification:d.classification,endpoint:d.endpoint||null,request_shape:d.request_shape||null,failed_at:new Date().toISOString(),verification_attempt:attempt}};
        await update("provider_connections",`workspace_id=eq.${ws.id}&provider=eq.${provider}`,{health:d.classification,status:d.classification,last_verified_at:new Date().toISOString(),last_latency_ms:null,last_error_safe:JSON.stringify(metadata.last_failure),provider_metadata:metadata,updated_at:new Date().toISOString()},false);
      }
    }catch{}
    return json({pass:false,error:d.message_safe||safeError(e),code:d.classification,provider_code:d.provider_code||null,provider_reason:d.provider_reason||null,http_status:d.http_status||null,attempt,timestamp:new Date().toISOString()},errorHttpStatus(d.classification));
  }
};
export const config:Config={path:"/api/provider-test"};
