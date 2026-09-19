import type { Context, Config } from "@netlify/functions";
import { json, readJson, safeError, geminiGrounded, geminiJson, entityPrompt, providerStatus } from "./lib.mts";
export default async (req:Request,_ctx:Context)=>{
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  try{
    const {seed}=await readJson(req); if(!String(seed||"").trim())return json({error:"Company seed is required."},400);
    if(!providerStatus().gemini.configured)return json({error:"Research provider is not configured.","code":"PROVIDER_NOT_CONFIGURED"},503);
    const grounded=await geminiGrounded(entityPrompt(String(seed).trim()));
    const structured=await geminiJson(`Using ONLY the evidence below, return the entity-resolution JSON requested. Do not invent candidates.\nSEED: ${seed}\nEVIDENCE:\n${grounded.text}\nSOURCES:\n${JSON.stringify(grounded.sources)}`);
    return json({...structured,sources:grounded.sources});
  }catch(e){return json({error:safeError(e)},500)}
};
export const config:Config={path:"/api/entity-resolve"};