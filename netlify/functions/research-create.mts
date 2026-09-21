import type { Context, Config } from "@netlify/functions";
import { json, readJson, safeError, workspace, select, insert, update, STAGES, dayKey, config as appConfig, researchStrategy } from "./lib.mts";

function slugKey(s:string){return s.toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"").slice(0,80)}
function normId(v:any){return String(v||"").toUpperCase().replace(/[^A-Z0-9]/g,"")}
function normName(v:any){return String(v||"").toLowerCase().replace(/[^a-z0-9]/g,"")}
function domain(v:any){try{return new URL(/^https?:/i.test(String(v))?String(v):"https://"+String(v)).hostname.toLowerCase().replace(/^www\./,"")}catch{return""}}
function identifiers(entity:any){
  const out:any[]=[];
  const add=(type:string,value:any)=>{const v=normId(value);if(v)out.push({type,value:v})};
  add("CIN",entity.cin);add("LLPIN",entity.llpin);add("REGISTRATION",entity.registration_id);add("GSTIN",entity.gstin||entity.tax_id);
  const d=domain(entity.website);if(d)out.push({type:"DOMAIN",value:d});
  return [...new Map(out.map(x=>[x.type+":"+x.value,x])).values()];
}
async function findCompany(wsId:string,entity:any){
  for(const id of identifiers(entity)){
    const rows=await select("company_identifiers",`workspace_id=eq.${wsId}&identifier_type=eq.${encodeURIComponent(id.type)}&identifier_value=eq.${encodeURIComponent(id.value)}&select=company_id&limit=1`);
    if(rows?.[0]?.company_id){const c=await select("companies",`id=eq.${rows[0].company_id}&select=*&limit=1`);if(c?.[0])return c[0]}
  }
  const rows=await select("companies",`workspace_id=eq.${wsId}&select=*`)||[],targetName=normName(entity.legal_name),targetCountry=String(entity.country||"").toLowerCase(),targetDomain=domain(entity.website);
  return rows.find((c:any)=>targetDomain&&domain(c.website)===targetDomain)
    ||rows.find((c:any)=>normName(c.legal_name)===targetName&&(!targetCountry||String(c.country||"").toLowerCase()===targetCountry))
    ||null;
}
async function ensureIdentifiers(wsId:string,companyId:string,entity:any){
  for(const id of identifiers(entity)){
    try{await insert("company_identifiers",{workspace_id:wsId,company_id:companyId,identifier_type:id.type,identifier_value:id.value},false)}catch{}
  }
}
export default async (req:Request,_ctx:Context)=>{
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  try{
    const c=appConfig();if(!c.supabaseUrl||!c.supabaseSecret)return json({error:"Database is not connected.",code:"SUPABASE_REQUIRED"},503);
    let route;try{route=await researchStrategy()}catch(e){return json({error:safeError(e),code:"PROVIDER_NOT_CONFIGURED"},503)}
    const body=await readJson(req),entity=body.confirmed_entity;if(!entity?.legal_name)return json({error:"A confirmed legal entity is required."},400);
    const attachmentCount=Math.max(0,Math.floor(Number(body.attachment_count||0))),hasAttachments=body.has_attachments===true||attachmentCount>0;
    const ws=await workspace(),day=dayKey();
    const settingRows=await select("workspace_settings",`workspace_id=eq.${ws.id}&select=settings_json&limit=1`),settings=settingRows?.[0]?.settings_json||{},cost=settings.cost_protection||{};
    const localLimit=Math.max(1,Number(settings.daily_company_limit||c.dailyLimit||20));
    const todays=await select("research_jobs",`workspace_id=eq.${ws.id}&usage_day=eq.${day}&is_full_research=eq.true&select=id`);
    if((todays?.length||0)>=localLimit)return json({error:"Daily Full Deep Research application limit reached.",code:"DAILY_LIMIT",limit:localLimit},429);
    if(cost.free_only_mode!==false&&route.provider==="gemini"){
      const calls=await select("provider_usage",`workspace_id=eq.${ws.id}&usage_day=eq.${day}&provider=eq.gemini&operation=eq.grounded_search&select=request_count`);
      const used=(calls||[]).reduce((a:number,x:any)=>a+Number(x.request_count||0),0);
      const connection=await select("provider_connections",`workspace_id=eq.${ws.id}&provider=eq.gemini&select=billing_mode&limit=1`);
      const freeGroundingCap=connection?.[0]?.billing_mode==="paid"?1500:500;
      if(used+8>freeGroundingCap)return json({error:"Free-only protection stopped this research because the application-recorded Gemini grounding allowance is too close to its configured threshold.",code:"FREE_ALLOWANCE_GUARD",recorded_grounded_calls:used,guard_limit:freeGroundingCap},429);
    }
    let company=await findCompany(ws.id,entity);
    if(!company){
      try{const rows=await insert("companies",{workspace_id:ws.id,legal_name:entity.legal_name,brand:entity.brand||null,country:entity.country||null,state_region:entity.state_region||null,website:entity.website||null});company=rows?.[0]}
      catch{company=await findCompany(ws.id,entity)}
      if(!company)throw new Error("Could not create or resolve the company profile.");
      await insert("activity_logs",{workspace_id:ws.id,action:"company_created",company_id:company.id,metadata:{source:"entity_resolution"}},false);
    }else{
      await update("companies",`id=eq.${company.id}`,{brand:company.brand||entity.brand||null,country:company.country||entity.country||null,state_region:company.state_region||entity.state_region||null,website:company.website||entity.website||null,updated_at:new Date().toISOString()},false);
    }
    await ensureIdentifiers(ws.id,company.id,entity);
    const template=body.template_key||settings.research_defaults?.default_template||"vmg_full_due_diligence";
    const rows=await insert("research_jobs",{workspace_id:ws.id,company_id:company.id,template_key:template,custom_prompt:body.custom_prompt||null,input_seed:{seed:body.seed||"",confirmed_entity:entity},provider:route.provider+":"+route.model,usage_day:day,is_full_research:template!=="quick_company_check",status:hasAttachments?"PREPARING":"QUEUED"});
    const job=rows?.[0];if(!job)throw new Error("Failed to create research job.");
    await insert("research_job_stages",STAGES.map((name,i)=>({workspace_id:ws.id,research_job_id:job.id,stage_no:i+1,stage_key:slugKey(name),stage_name:name,status:"QUEUED"})),false);
    await insert("activity_logs",{workspace_id:ws.id,action:"research_created",company_id:company.id,research_job_id:job.id,metadata:{template_key:template,provider:route.provider,model:route.model}},false);
    if(!hasAttachments){
      const invoke=await fetch(new URL("/.netlify/functions/research-run-background",req.url),{method:"POST",headers:{"content-type":"application/json",cookie:req.headers.get("cookie")||""},body:JSON.stringify({job_id:job.id})});
      if(!invoke.ok){
        const msg=`Background research invocation failed (${invoke.status}).`;
        await update("research_jobs",`id=eq.${job.id}`,{status:"FAILED",error_message:msg,completed_at:new Date().toISOString()},false);
        return json({error:msg,code:"BACKGROUND_INVOCATION_FAILED",job_id:job.id,company_id:company.id},502);
      }
    }
    return json({job_id:job.id,company_id:company.id,status:hasAttachments?"PREPARING":"QUEUED",background_accepted:!hasAttachments,attachments_expected:attachmentCount},202);
  }catch(e){return json({error:safeError(e)},500)}
};
export const config:Config={path:"/api/research-create"};