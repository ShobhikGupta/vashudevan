import type { Context, Config } from "@netlify/functions";
import { json, readJson, safeError, update, workspace } from "./lib.mts";
import { requireAdmin } from "./admin-auth.mts";
import { providerKey, testProvider } from "./provider-connections-lib.mts";

export default async (req:Request,_ctx:Context)=>{
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  const denied=await requireAdmin(req);if(denied)return denied;
  let provider="";
  try{
    const b=await readJson(req);provider=String(b.provider||"").toLowerCase();const key=await providerKey(provider);
    if(!key)return json({error:"Provider is not connected."},409);
    const result=await testProvider(provider,key,String(b.selected_model||""));
    try{const ws=await workspace();await update("provider_connections",`workspace_id=eq.${ws.id}&provider=eq.${provider}`,{last_verified_at:new Date().toISOString(),last_latency_ms:result.latency_ms,health:"CONNECTED",status:"CONNECTED",provider_metadata:{grounding_verified:result.grounding_verified===true},updated_at:new Date().toISOString()},false)}catch{}
    return json({pass:true,timestamp:new Date().toISOString(),latency_ms:result.latency_ms,grounding_verified:result.grounding_verified===true});
  }catch(e){
    try{if(provider){const ws=await workspace();await update("provider_connections",`workspace_id=eq.${ws.id}&provider=eq.${provider}`,{health:"AUTH_ERROR",status:"AUTH_ERROR",last_verified_at:new Date().toISOString(),updated_at:new Date().toISOString()},false)}}catch{}
    return json({pass:false,error:safeError(e),timestamp:new Date().toISOString()},400);
  }
};
export const config:Config={path:"/api/provider-test"};