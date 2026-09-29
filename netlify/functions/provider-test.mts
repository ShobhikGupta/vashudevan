import type { Context, Config } from "@netlify/functions";
import { json, readJson, safeError, update, workspace, providerConnection } from "./lib.mts";
import { requireAdmin } from "./admin-auth.mts";
import { requireProviderAdminRateLimit } from "./provider-admin-security.mts";
import { storedProviderKey, testProvider, rpc } from "./provider-connections-lib.mts";
import { credentialDiagnostics, errorHttpStatus } from "./provider-diagnostics.mts";

function failureDetails(e:any,provider:string,model:string){
  return e?.details||{provider,http_status:502,provider_code:"PROVIDER_TEST_FAILED",provider_reason:null,message_safe:safeError(e),classification:"PROVIDER_ERROR",endpoint:null,model,request_shape:null,retry_after_seconds:0};
}
const GEMINI_SUCCESS_DELAY_SECONDS=20;
function cooldownSeconds(d:any){
  const retry=Math.max(0,Number(d?.retry_after_seconds||0));
  if(d?.classification==="RATE_LIMIT")return Math.max(60,retry);
  if(d?.classification==="TRANSIENT_ERROR")return Math.max(45,retry);
  return 0;
}
function sequenceReject(gate:any){
  const retry=Math.max(0,Number(gate?.retry_after_seconds||0));
  const reason=String(gate?.reason||"SEQUENCE_REJECTED");
  const status=reason==="COOLDOWN"?429:409;
  const message=reason==="SEQUENCE_ACTIVE"?"A Gemini verification sequence is already active."
    :reason==="ATTEMPT_IN_FLIGHT"?"This Gemini verification attempt is already running."
    :reason==="TOO_EARLY"?"Gemini verification is cooling down before the next stored-key attempt."
    :reason==="COOLDOWN"?"Gemini verification is temporarily cooling down after a provider failure."
    :"Gemini verification sequence state changed. Start one clean sequence after the cooldown.";
  return json({pass:false,error:message,code:reason,retry_after_seconds:retry},status,retry?{"retry-after":String(retry)}:{});
}
export default async (req:Request,_ctx:Context)=>{
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  const denied=await requireAdmin(req);if(denied)return denied;
  let provider="",current:any=null,selected="",sequenceId="",attempt=1,sequenceAccepted=false;
  try{
    const b=await readJson(req);provider=String(b.provider||"").toLowerCase();
    sequenceId=String(b.verification_sequence_id||"");attempt=Math.max(1,Math.min(3,Number(b.attempt||1)));
    const rateLimited=await requireProviderAdminRateLimit(provider,"test");if(rateLimited)return rateLimited;
    current=await providerConnection(provider);selected=String(b.selected_model||current?.selected_model||"");

    if(provider==="gemini"){
      if(!sequenceId)return json({error:"verification_sequence_id is required for Gemini stored-key verification.",code:"INVALID_REQUEST"},400);
      const ws=await workspace();
      const gate=await rpc("vmg_provider_verification_transition",{
        p_workspace_id:ws.id,p_provider:"gemini",p_sequence_id:sequenceId,p_action:"begin",
        p_attempt:attempt,p_delay_seconds:GEMINI_SUCCESS_DELAY_SECONDS,p_cooldown_seconds:0,p_failure:null,p_latency_ms:null
      });
      if(gate?.accepted!==true)return sequenceReject(gate);
      sequenceAccepted=true;
    }

    const key=await storedProviderKey(provider);if(!key)throw Object.assign(new Error("Provider is not configured."),{details:{provider,http_status:500,provider_code:"VAULT_READ_EMPTY",provider_reason:null,message_safe:"Stored provider credential could not be read from Vault.",classification:"PROVIDER_ERROR",endpoint:null,model:selected,request_shape:null,retry_after_seconds:0}});
    const diag=await credentialDiagnostics(key);
    const result=await testProvider(provider,key,selected,String(current?.billing_mode||"unknown"),{credential_source:"vault",attempt,sequence_id:sequenceId||null});
    const ws=await workspace();

    if(provider!=="gemini"){
      const meta=current?.provider_metadata||{},metadata={...meta,stored_credential_diagnostics:diag,stored_verification_passed:true,stored_verification_attempts:1,grounding_verified:result.grounding_verified===true,grounding_tested:result.grounding_verified!==null,structured_synthesis_verified:result.structured_synthesis_verified===true,last_failure:null};
      await update("provider_connections",`workspace_id=eq.${ws.id}&provider=eq.${provider}`,{last_verified_at:new Date().toISOString(),last_latency_ms:result.latency_ms,health:"CONNECTED",status:"CONNECTED",last_error_safe:null,provider_metadata:metadata,updated_at:new Date().toISOString()},false);
      return json({pass:true,connected:true,attempt:1,attempts_required:1,timestamp:new Date().toISOString(),latency_ms:result.latency_ms});
    }

    const transitioned=await rpc("vmg_provider_verification_transition",{
      p_workspace_id:ws.id,p_provider:"gemini",p_sequence_id:sequenceId,p_action:"success",
      p_attempt:attempt,p_delay_seconds:GEMINI_SUCCESS_DELAY_SECONDS,p_cooldown_seconds:0,p_failure:null,p_latency_ms:result.latency_ms
    });
    if(transitioned?.accepted!==true)return sequenceReject(transitioned);
    return json({
      pass:true,connected:transitioned?.connected===true,attempt,attempts_required:3,
      retry_after_seconds:Number(transitioned?.retry_after_seconds||0),
      timestamp:new Date().toISOString(),latency_ms:result.latency_ms,
      grounding_verified:result.grounding_verified===true,structured_synthesis_verified:true,
      verification_sequence_id:sequenceId
    });
  }catch(e:any){
    const d=failureDetails(e,provider,selected),cooldown=cooldownSeconds(d);
    if(provider==="gemini"&&sequenceAccepted&&sequenceId){
      try{
        const ws=await workspace();
        const failure={http_status:d.http_status||null,provider_code:d.provider_code||null,provider_reason:d.provider_reason||null,message_safe:d.message_safe,classification:d.classification,endpoint:d.endpoint||null,request_shape:d.request_shape||null,retry_after_seconds:d.retry_after_seconds||0,failed_at:new Date().toISOString(),verification_attempt:attempt,verification_sequence_id:sequenceId};
        await rpc("vmg_provider_verification_transition",{
          p_workspace_id:ws.id,p_provider:"gemini",p_sequence_id:sequenceId,p_action:"failure",
          p_attempt:attempt,p_delay_seconds:GEMINI_SUCCESS_DELAY_SECONDS,p_cooldown_seconds:cooldown,p_failure:failure,p_latency_ms:null
        });
      }catch{}
    }
    return json({
      pass:false,error:d.message_safe||safeError(e),code:d.classification,
      provider_code:d.provider_code||null,provider_reason:d.provider_reason||null,
      http_status:d.http_status||null,retry_after_seconds:cooldown,attempt,
      verification_sequence_id:sequenceId||null,timestamp:new Date().toISOString()
    },errorHttpStatus(d.classification),cooldown?{"retry-after":String(cooldown)}:{});
  }
};
export const config:Config={path:"/api/provider-test"};
