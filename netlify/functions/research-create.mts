import type { Context, Config } from "@netlify/functions";
import { json, readJson, safeError, workspace, select, insert, STAGES, dayKey, config as appConfig, researchStrategy } from "./lib.mts";
function slugKey(s:string){return s.toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"").slice(0,80)}
export default async (req:Request,_ctx:Context)=>{
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  try{
    const c=appConfig();if(!c.supabaseUrl||!c.supabaseSecret)return json({error:"Database is not connected.",code:"SUPABASE_REQUIRED"},503);
    let route;try{route=await researchStrategy()}catch(e){return json({error:safeError(e),code:"PROVIDER_NOT_CONFIGURED"},503)}
    const body=await readJson(req); const entity=body.confirmed_entity;
    if(!entity?.legal_name)return json({error:"A confirmed legal entity is required."},400);
    const ws=await workspace(),day=dayKey();
    const settingRows=await select("workspace_settings",`workspace_id=eq.${ws.id}&select=settings_json&limit=1`);
    const settings=settingRows?.[0]?.settings_json||{},cost=settings.cost_protection||{};
    const localLimit=Math.max(1,Number(settings.daily_company_limit||c.dailyLimit||20));
    const todays=await select("research_jobs",`workspace_id=eq.${ws.id}&usage_day=eq.${day}&is_full_research=eq.true&select=id`);
    if((todays?.length||0)>=localLimit)return json({error:"Daily Full Deep Research application limit reached.",code:"DAILY_LIMIT",limit:localLimit},429);
    if(cost.free_only_mode!==false&&route.provider==="gemini"){
      const calls=await select("provider_usage",`workspace_id=eq.${ws.id}&usage_day=eq.${day}&provider=eq.gemini&operation=eq.grounded_search&select=request_count`);
      const used=(calls||[]).reduce((a:number,x:any)=>a+Number(x.request_count||0),0);
      const connection=await select("provider_connections",`workspace_id=eq.${ws.id}&provider=eq.gemini&select=billing_mode&limit=1`);
      const freeGroundingCap=connection?.[0]?.billing_mode==="paid"?1500:500;
      if(used+8>freeGroundingCap)return json({error:"Free-only protection stopped this research because the application-recorded Gemini grounding allowance is too close to its configured free threshold.",code:"FREE_ALLOWANCE_GUARD",recorded_grounded_calls:used,guard_limit:freeGroundingCap},429);
    }
    let companies=await select("companies",`workspace_id=eq.${ws.id}&legal_name=eq.${encodeURIComponent(entity.legal_name)}&select=*&limit=1`);
    let company=companies?.[0];
    if(!company){
      const rows=await insert("companies",{workspace_id:ws.id,legal_name:entity.legal_name,brand:entity.brand||null,country:entity.country||null,state_region:entity.state_region||null,website:entity.website||null});
      company=rows?.[0];await insert("activity_logs",{workspace_id:ws.id,action:"company_created",company_id:company.id,metadata:{source:"entity_resolution"}},false);
    }
    const rows=await insert("research_jobs",{workspace_id:ws.id,company_id:company.id,template_key:body.template_key||"vmg_full_due_diligence",custom_prompt:body.custom_prompt||null,input_seed:{seed:body.seed||"",confirmed_entity:entity},provider:route.provider+":"+route.model,usage_day:day,is_full_research:(body.template_key||"")!=="quick_company_check",status:"QUEUED"});
    const job=rows?.[0];if(!job)throw new Error("Failed to create research job.");
    await insert("research_job_stages",STAGES.map((name,i)=>({workspace_id:ws.id,research_job_id:job.id,stage_no:i+1,stage_key:slugKey(name),stage_name:name,status:"QUEUED"})),false);
    await insert("activity_logs",{workspace_id:ws.id,action:"research_created",company_id:company.id,research_job_id:job.id,metadata:{template_key:job.template_key}},false);
    fetch(new URL("/.netlify/functions/research-run-background",req.url),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({job_id:job.id})}).catch(()=>{});
    return json({job_id:job.id,company_id:company.id,status:"QUEUED"},202);
  }catch(e){return json({error:safeError(e)},500)}
};
export const config:Config={path:"/api/research-create"};