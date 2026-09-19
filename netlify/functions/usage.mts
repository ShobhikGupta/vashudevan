import type { Context, Config } from "@netlify/functions";
import { json, safeError, workspace, select, dayKey, nextReset, config as appConfig } from "./lib.mts";
function startIso(days:number){return new Date(Date.now()-days*86400000).toISOString()}
export default async (_req:Request,_ctx:Context)=>{
  try{
    const ws=await workspace(),day=dayKey(),c=appConfig();
    const settingRows=await select("workspace_settings",`workspace_id=eq.${ws.id}&select=settings_json&limit=1`),settings=settingRows?.[0]?.settings_json||{};
    const jobs=await select("research_jobs",`workspace_id=eq.${ws.id}&usage_day=eq.${day}&select=id,is_full_research,status,created_at`);
    const usage=await select("provider_usage",`workspace_id=eq.${ws.id}&usage_day=eq.${day}&select=provider,operation,request_count,success,prompt_tokens,output_tokens,estimated_cost_usd,created_at`);
    const last30Jobs=await select("research_jobs",`workspace_id=eq.${ws.id}&is_full_research=eq.true&status=eq.COMPLETE&created_at=gte.${encodeURIComponent(startIso(30))}&select=id,created_at`);
    const last30Usage=await select("provider_usage",`workspace_id=eq.${ws.id}&provider=eq.gemini&operation=eq.grounded_search&created_at=gte.${encodeURIComponent(startIso(30))}&select=request_count`);
    const sum=(p:string,op?:string)=>(usage||[]).filter((x:any)=>x.provider===p&&(!op||x.operation===op)).reduce((a:number,x:any)=>a+Number(x.request_count||0),0);
    const grounded30=(last30Usage||[]).reduce((a:number,x:any)=>a+Number(x.request_count||0),0),reports30=last30Jobs?.length||0;
    const avgGrounded=reports30?grounded30/reports30:null;
    const fullToday=(jobs||[]).filter((x:any)=>x.is_full_research).length;
    const appLimit=Math.max(1,Number(settings.daily_company_limit||c.dailyLimit||20));
    const con=await select("provider_connections",`workspace_id=eq.${ws.id}&provider=eq.gemini&select=billing_mode&limit=1`);const groundingCap=con?.[0]?.billing_mode==="paid"?1500:500;
    const gToday=sum("gemini","grounded_search"),providerRemaining=Math.max(0,groundingCap-gToday),providerReports=avgGrounded?Math.floor(providerRemaining/avgGrounded):null,appRemaining=Math.max(0,appLimit-fullToday);
    const estimatedAvailable=providerReports==null?appRemaining:Math.min(appRemaining,providerReports);
    const cost=(usage||[]).reduce((a:number,x:any)=>a+Number(x.estimated_cost_usd||0),0);
    return json({
      usage_day:day,full_research_jobs:fullToday,completed_jobs:(jobs||[]).filter((x:any)=>x.status==="COMPLETE").length,
      gemini_grounded_calls:gToday,gemini_synthesis_calls:sum("gemini","structured_synthesis"),tavily_calls:sum("tavily","search"),openai_calls:sum("openai"),
      failed_calls:(usage||[]).filter((x:any)=>!x.success).reduce((a:number,x:any)=>a+Number(x.request_count||0),0),
      retries:sum("system","retry"),application_limit:appLimit,approx_remaining_full_jobs:appRemaining,
      rolling_average_grounded_calls_per_full_report:avgGrounded,provider_grounding_allowance_reference:groundingCap,provider_grounding_remaining_estimate:providerRemaining,
      provider_estimated_reports_remaining:providerReports,available_today_estimate:estimatedAvailable,
      estimation_note:avgGrounded==null?"Not enough research history to estimate reports/day.":"Application-recorded estimate; provider-authoritative quota remaining is not available.",
      estimated_api_cost_usd_today:cost,next_reset:nextReset(),remaining_basis:"Estimated from application-recorded usage"
    });
  }catch(e){return json({error:safeError(e)},500)}
};
export const config:Config={path:"/api/usage"};