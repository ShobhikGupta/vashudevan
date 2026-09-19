import { env, rest, select, workspace, recordUsage, safeError } from "./lib.mts";

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
export async function testProvider(provider:string,key:string,model?:string){
  const started=Date.now();let r:Response;let groundingVerified=false;let body:any={};
  if(provider==="gemini"){
    r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",{method:"POST",headers:{"content-type":"application/json","x-goog-api-key":key},body:JSON.stringify({contents:[{role:"user",parts:[{text:"Use Google Search grounding to identify the official Google AI for Developers website. Reply in one short sentence."}]}],tools:[{google_search:{}}],generationConfig:{temperature:0,maxOutputTokens:40}})});
    try{body=await r.json()}catch{}
    groundingVerified=Boolean(body?.candidates?.[0]?.groundingMetadata?.groundingChunks?.length);
  } else if(provider==="openai"){
    r=await fetch("https://api.openai.com/v1/models",{headers:{authorization:`Bearer ${key}`}});try{body=await r.json()}catch{}
  } else if(provider==="tavily"){
    r=await fetch("https://api.tavily.com/search",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${key}`},body:JSON.stringify({query:"VMG provider connection test",search_depth:"basic",max_results:1,include_answer:false})});try{body=await r.json()}catch{}
  } else throw new Error("Unsupported provider.");
  const latency_ms=Date.now()-started,ok=r.ok;
  await recordUsage(provider,"connection_test",ok,{metadata:{latency_ms,status:r.status,grounding_verified:groundingVerified}});
  if(!ok)throw new Error(`${provider} connection test failed (${r.status}): ${safeError(body?.error?.message||body?.detail||body?.message||"authentication failed")}`);
  if(provider==="gemini"&&!groundingVerified)throw new Error("Gemini credential is valid, but Google Search grounding was not verified by the test response.");
  return {ok:true,latency_ms,provider,model:model||null,grounding_verified:groundingVerified};
}
export async function saveProvider(provider:string,key:string,model:string,billingMode:string,metadata:any={}){
  const ws=await workspace();const suffix=key.slice(-4);
  return await rpc("vmg_store_provider_secret",{p_workspace_id:ws.id,p_provider:provider,p_secret:key,p_masked_suffix:suffix,p_selected_model:model,p_billing_mode:billingMode,p_metadata:metadata});
}
export async function disconnectProvider(provider:string){const ws=await workspace();return await rpc("vmg_disconnect_provider",{p_workspace_id:ws.id,p_provider:provider})}
