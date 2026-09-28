import { env, rest, select, workspace, recordUsage, safeError, fetchWithTimeout, geminiInteractionText } from "./lib.mts";

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
  try{const ws=await workspace();return await select("provider_connections",`workspace_id=eq.${ws.id}&select=provider,masked_suffix,status,selected_model,billing_mode,connected_at,last_verified_at,last_latency_ms,health,provider_metadata,updated_at`)||[]}catch{return[]}
}
export async function testProvider(provider:string,key:string,model?:string,billingMode="unknown"){
  const started=Date.now();let r:Response;let groundingVerified:boolean|null=null;let body:any={};
  if(provider==="gemini"){
    const selected=model||"gemini-3.8-flash";
    r=await fetchWithTimeout("https://generativelanguage.googleapis.com/v1beta/interactions",{method:"POST",headers:{"content-type":"application/json","x-goog-api-key":key,"x-goog-api-client":"vmg-company-intelligence/0.1.0"},body:JSON.stringify({model:selected,input:"Return a JSON object with ok=true.",store:false,generation_config:{temperature:0},response_format:{type:"text",mime_type:"application/json",schema:{type:"object",properties:{ok:{type:"boolean"}},required:["ok"]}}})});
    try{body=await r.json()}catch{}
    if(r.ok){
      const text=geminiInteractionText(body);let parsed:any=null;try{parsed=JSON.parse(text)}catch{}
      if(parsed?.ok!==true){r=new Response(JSON.stringify({error:{message:"Gemini structured synthesis probe did not return the required JSON."}}),{status:502,headers:{"content-type":"application/json"}});body={error:{message:"Gemini structured synthesis probe did not return the required JSON."}}}
    }
    if(r.ok&&billingMode==="paid"){
      try{
        const gr=await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(selected)}:generateContent`,{method:"POST",headers:{"content-type":"application/json","x-goog-api-key":key},body:JSON.stringify({contents:[{role:"user",parts:[{text:"Use Google Search to identify the official Google AI for Developers website. Reply in one short sentence."}]}],tools:[{google_search:{}}],generationConfig:{temperature:0,maxOutputTokens:60}})});
        const gp=await gr.json().catch(()=>({}));
        groundingVerified=Boolean(gr.ok&&gp?.candidates?.[0]?.groundingMetadata?.groundingChunks?.length);
      }catch{groundingVerified=false}
    }
  } else if(provider==="openai"){
    r=await fetchWithTimeout("https://api.openai.com/v1/models",{headers:{authorization:`Bearer ${key}`}});try{body=await r.json()}catch{}
  } else if(provider==="tavily"){
    r=await fetchWithTimeout("https://api.tavily.com/search",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${key}`},body:JSON.stringify({query:"VMG provider connection test",search_depth:"basic",max_results:1,include_answer:false})});try{body=await r.json()}catch{}
  } else throw new Error("Unsupported provider.");
  const latency_ms=Date.now()-started,ok=r.ok;
  await recordUsage(provider,"connection_test",ok,{model:provider==="gemini"?(model||"gemini-3.8-flash"):model||null,metadata:{latency_ms,status:r.status,grounding_verified:groundingVerified,structured_synthesis_verified:provider==="gemini"?ok:null,api:provider==="gemini"?"interactions":undefined}});
  if(!ok)throw new Error(`${provider} connection test failed (${r.status}): ${safeError(body?.error?.message||body?.detail||body?.message||"authentication failed")}`);
  return {ok:true,latency_ms,provider,model:model||null,grounding_verified:groundingVerified,structured_synthesis_verified:provider==="gemini"};
}
export async function saveProvider(provider:string,key:string,model:string,billingMode:string,metadata:any={}){
  const ws=await workspace();const suffix=key.slice(-4);
  return await rpc("vmg_store_provider_secret",{p_workspace_id:ws.id,p_provider:provider,p_secret:key,p_masked_suffix:suffix,p_selected_model:model,p_billing_mode:billingMode,p_metadata:metadata});
}
export async function disconnectProvider(provider:string){const ws=await workspace();return await rpc("vmg_disconnect_provider",{p_workspace_id:ws.id,p_provider:provider})}
