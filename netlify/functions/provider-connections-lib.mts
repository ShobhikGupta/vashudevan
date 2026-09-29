import { env, rest, select, workspace, recordUsage, fetchWithTimeout, geminiInteractionText, geminiStructuredRequest } from "./lib.mts";
import { ProviderCallError, credentialDiagnostics, compareCredentialDiagnostics, providerErrorDetails } from "./provider-diagnostics.mts";

export async function rpc(name:string,body:any){return await rest(`rpc/${name}`,{method:"POST",body:JSON.stringify(body)})}
export function envProviderKey(provider:string){
  const map:any={gemini:"GEMINI_API_KEY",tavily:"TAVILY_API_KEY",openai:"OPENAI_API_KEY"};
  return env(map[provider]||"");
}
export async function storedProviderKey(provider:string){
  try{const ws=await workspace();const value=await rpc("vmg_get_provider_secret",{p_workspace_id:ws.id,p_provider:provider});return typeof value==="string"?value:""}catch{return""}
}
export async function providerKey(provider:string){return envProviderKey(provider)||await storedProviderKey(provider)}
export async function connectionRows(){
  try{const ws=await workspace();return await select("provider_connections",`workspace_id=eq.${ws.id}&select=provider,masked_suffix,status,selected_model,billing_mode,connected_at,last_verified_at,last_latency_ms,health,last_error_safe,provider_metadata,updated_at`)||[]}catch{return[]}
}

const GEMINI_PROBE_INPUT="Return a JSON object with ok=true.";
const GEMINI_PROBE_SCHEMA={type:"object",properties:{ok:{type:"boolean"}},required:["ok"]};

export async function testProvider(provider:string,key:string,model?:string,billingMode="unknown",meta:any={}){
  const started=Date.now();let r:Response|undefined;let groundingVerified:boolean|null=null;let body:any={};
  try{
    if(provider==="gemini"){
      const selected=model||"gemini-3.8-flash";
      const result=await geminiStructuredRequest(key,selected,GEMINI_PROBE_INPUT,GEMINI_PROBE_SCHEMA,0,45000);
      r=result.response;body=result.body;
      const text=geminiInteractionText(body);let parsed:any=null;try{parsed=JSON.parse(text)}catch{}
      if(parsed?.ok!==true)throw new ProviderCallError({provider:"gemini",http_status:502,provider_code:"STRUCTURED_PROBE_INVALID",provider_reason:null,message_safe:"Gemini structured synthesis probe did not return the required JSON.",classification:"PROVIDER_ERROR",endpoint:result.endpoint,model:selected,request_shape:result.request_shape});
      if(billingMode==="paid"){
        try{
          const gr=await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(selected)}:generateContent`,{method:"POST",headers:{"content-type":"application/json","x-goog-api-key":key},body:JSON.stringify({contents:[{role:"user",parts:[{text:"Use Google Search to identify the official Google AI for Developers website. Reply in one short sentence."}]}],tools:[{google_search:{}}],generationConfig:{temperature:0,maxOutputTokens:60}})});
          const gp=await gr.json().catch(()=>({}));
          groundingVerified=Boolean(gr.ok&&gp?.candidates?.[0]?.groundingMetadata?.groundingChunks?.length);
        }catch{groundingVerified=false}
      }
    } else if(provider==="openai"){
      r=await fetchWithTimeout("https://api.openai.com/v1/models",{headers:{authorization:`Bearer ${key}`}});try{body=await r.json()}catch{}
      if(!r.ok)throw new ProviderCallError({...providerErrorDetails("openai",r.status,body),endpoint:"/v1/models",model:model||null,request_shape:"models_list"});
    } else if(provider==="tavily"){
      r=await fetchWithTimeout("https://api.tavily.com/search",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${key}`},body:JSON.stringify({query:"VMG provider connection test",search_depth:"basic",max_results:1,include_answer:false})});try{body=await r.json()}catch{}
      if(!r.ok)throw new ProviderCallError({...providerErrorDetails("tavily",r.status,body),endpoint:"/search",model:model||"tavily-search",request_shape:"basic_search"});
    } else throw new Error("Unsupported provider.");

    const latency_ms=Date.now()-started;
    await recordUsage(provider,"connection_test",true,{model:provider==="gemini"?(model||"gemini-3.8-flash"):model||null,metadata:{latency_ms,status:r?.status||200,grounding_verified:groundingVerified,structured_synthesis_verified:provider==="gemini",credential_source:meta.credential_source||"unknown",verification_attempt:meta.attempt||null,endpoint:provider==="gemini"?"/v1beta/interactions":provider==="tavily"?"/search":"/v1/models",request_shape:provider==="gemini"?"structured_json":provider==="tavily"?"basic_search":"models_list"}});
    return {ok:true,latency_ms,provider,model:model||null,grounding_verified:groundingVerified,structured_synthesis_verified:provider==="gemini",request_contract:{endpoint:provider==="gemini"?"/v1beta/interactions":provider==="tavily"?"/search":"/v1/models",auth_header:provider==="gemini"?"x-goog-api-key":provider==="tavily"?"Authorization":"Authorization",model:provider==="gemini"?(model||"gemini-3.8-flash"):model||null,request_shape:provider==="gemini"?"structured_json":provider==="tavily"?"basic_search":"models_list",billing_mode:billingMode}};
  }catch(e:any){
    const latency_ms=Date.now()-started;
    const d=e?.details||{provider,http_status:0,provider_code:"CLIENT_ERROR",provider_reason:null,message_safe:String(e?.message||"Provider request failed.").slice(0,700),classification:"PROVIDER_ERROR",endpoint:null,model:model||null,request_shape:null};
    await recordUsage(provider,"connection_test",false,{model:provider==="gemini"?(model||"gemini-3.8-flash"):model||null,metadata:{latency_ms,status:d.http_status||0,classification:d.classification,provider_code:d.provider_code||null,provider_reason:d.provider_reason||null,message_safe:d.message_safe,credential_source:meta.credential_source||"unknown",verification_attempt:meta.attempt||null,endpoint:d.endpoint||null,request_shape:d.request_shape||null}});
    throw e;
  }
}

export async function saveProvider(provider:string,key:string,model:string,billingMode:string,metadata:any={}){
  const ws=await workspace();const suffix=key.slice(-4);
  return await rpc("vmg_store_provider_secret",{p_workspace_id:ws.id,p_provider:provider,p_secret:key,p_masked_suffix:suffix,p_selected_model:model,p_billing_mode:billingMode,p_metadata:metadata});
}

export async function verifyStoredCredentialEquivalence(provider:string,expectedDiagnostics:any,model:string){
  const stored=await storedProviderKey(provider);
  if(!stored)throw new ProviderCallError({provider,http_status:500,provider_code:"VAULT_READ_EMPTY",provider_reason:null,message_safe:"Stored provider credential could not be read back from Vault.",classification:"PROVIDER_ERROR",endpoint:null,model,request_shape:null});
  const storedDiagnostics=await credentialDiagnostics(stored),equivalence=compareCredentialDiagnostics(expectedDiagnostics,storedDiagnostics);
  if(!(equivalence.exact_length_match&&equivalence.exact_byte_length_match&&equivalence.fingerprint_match&&equivalence.both_trimmed_equivalent&&equivalence.no_control_whitespace)){
    throw new ProviderCallError({provider,http_status:500,provider_code:"VAULT_ROUNDTRIP_MISMATCH",provider_reason:null,message_safe:"Credential read back from Vault did not match the freshly validated credential.",classification:"PROVIDER_ERROR",endpoint:null,model,request_shape:null,equivalence});
  }
  return {storedDiagnostics,equivalence};
}

export async function disconnectProvider(provider:string){const ws=await workspace();return await rpc("vmg_disconnect_provider",{p_workspace_id:ws.id,p_provider:provider})}
