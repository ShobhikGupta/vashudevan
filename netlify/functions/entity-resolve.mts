import type { Context, Config } from "@netlify/functions";
import { json, readJson, safeError, geminiGrounded, geminiJson, openAIGrounded, openAIJson, entityPrompt, researchStrategy } from "./lib.mts";

export default async (req:Request,_ctx:Context)=>{
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  try{
    const {seed}=await readJson(req);if(!String(seed||"").trim())return json({error:"Company seed is required."},400);
    const route=await researchStrategy(),prompt=entityPrompt(String(seed).trim());
    const grounded=route.provider==="openai"?await openAIGrounded(prompt,route.model):await geminiGrounded(prompt);
    const synthesisPrompt=`Using ONLY the evidence below, return the entity-resolution JSON requested. Do not invent candidates.\nSEED: ${seed}\nEVIDENCE:\n${grounded.text}\nSOURCES:\n${JSON.stringify(grounded.sources)}`;
    const structured=route.provider==="openai"?await openAIJson(synthesisPrompt,route.model):await geminiJson(synthesisPrompt);
    return json({...structured,sources:grounded.sources,research_provider:route.provider,model:route.model});
  }catch(e){return json({error:safeError(e)},500)}
};
export const config:Config={path:"/api/entity-resolve"};