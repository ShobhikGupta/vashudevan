import type { Context, Config } from "@netlify/functions";
import { json, readJson, safeError, workspace, select, insert, STAGES, dayKey, providerStatus, config as appConfig } from "./lib.mts";
function slugKey(s:string){return s.toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"").slice(0,80)}
export default async (req:Request,_ctx:Context)=>{
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  try{
    const p=providerStatus(); if(!p.gemini.configured||!p.supabase.configured)return json({error:"Research provider or database is not configured.",code:"CONFIG_REQUIRED",providers:p},503);
    const body=await readJson(req); const entity=body.confirmed_entity;
    if(!entity?.legal_name)return json({error:"A confirmed legal entity is required."},400);
    const ws=await workspace(); const c=appConfig(); const day=dayKey();
    const todays=await select("research_jobs",`workspace_id=eq.${ws.id}&usage_day=eq.${day}&is_full_research=eq.true&select=id`);
    if((todays?.length||0)>=c.dailyLimit)return json({error:"Daily Full Deep Research application limit reached.",code:"DAILY_LIMIT",limit:c.dailyLimit},429);
    let companies=await select("companies",`workspace_id=eq.${ws.id}&legal_name=eq.${encodeURIComponent(entity.legal_name)}&select=*&limit=1`);
    let company=companies?.[0];
    if(!company){
      const rows=await insert("companies",{workspace_id:ws.id,legal_name:entity.legal_name,brand:entity.brand||null,country:entity.country||null,state_region:entity.state_region||null,website:entity.website||null});
      company=rows?.[0];
      await insert("activity_logs",{workspace_id:ws.id,action:"company_created",company_id:company.id,metadata:{source:"entity_resolution"}},false);
    }
    const rows=await insert("research_jobs",{workspace_id:ws.id,company_id:company.id,template_key:body.template_key||"vmg_full_due_diligence",custom_prompt:body.custom_prompt||null,input_seed:{seed:body.seed||"",confirmed_entity:entity},provider:"gemini-2.5-flash",usage_day:day,is_full_research:(body.template_key||"")!=="quick_company_check",status:"QUEUED"});
    const job=rows?.[0]; if(!job)throw new Error("Failed to create research job.");
    await insert("research_job_stages",STAGES.map((name,i)=>({workspace_id:ws.id,research_job_id:job.id,stage_no:i+1,stage_key:slugKey(name),stage_name:name,status:"QUEUED"})),false);
    await insert("activity_logs",{workspace_id:ws.id,action:"research_created",company_id:company.id,research_job_id:job.id,metadata:{template_key:job.template_key}},false);
    fetch(new URL("/.netlify/functions/research-run-background",req.url),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({job_id:job.id})}).catch(()=>{});
    return json({job_id:job.id,company_id:company.id,status:"QUEUED"},202);
  }catch(e){return json({error:safeError(e)},500)}
};
export const config:Config={path:"/api/research-create"};