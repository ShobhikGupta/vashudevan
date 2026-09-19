import type { Context, Config } from "@netlify/functions";
import { json, safeError, workspace, select, dayKey, nextReset, config as appConfig } from "./lib.mts";

function isoAgo(days:number){return new Date(Date.now()-days*86400000).toISOString()}
function monthStart(){const d=new Date();return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1)).toISOString()}
function sum(rows:any[],field:string,filter?:(x:any)=>boolean){return (rows||[]).filter(x=>!filter||filter(x)).reduce((a,x)=>a+Number(x?.[field]||0),0)}
function costStats(jobs:any[],usage:any[],n:number){
  const selected=(jobs||[]).slice(0,n),ids=new Set(selected.map(x=>x.id)),by:any={};
  for(const u of usage||[])if(u.research_job_id&&ids.has(u.research_job_id))by[u.research_job_id]=(by[u.research_job_id]||0)+Number(u.estimated_cost_usd||0);
  const vals=selected.map(x=>Number(by[x.id]||0));return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;
}
export default async (_req:Request,_ctx:Context)=>{
  try{
    const ws=await workspace(),day=dayKey(),c=appConfig(),week=isoAgo(7),month=monthStart(),thirty=isoAgo(30);
    const settingRows=await select("workspace_settings",`workspace_id=eq.${ws.id}&select=settings_json&limit=1`),settings=settingRows?.[0]?.settings_json||{},fx=Number(settings.cost_protection?.usd_inr_reference||0);
    const [jobsToday,jobsWeek,jobsMonth,jobs30,usageToday,usageWeek,usageMonth,usage30,geminiConn]=await Promise.all([
      select("research_jobs",`workspace_id=eq.${ws.id}&usage_day=eq.${day}&select=id,is_full_research,status,created_at`),
      select("research_jobs",`workspace_id=eq.${ws.id}&created_at=gte.${encodeURIComponent(week)}&select=id,is_full_research,status,created_at`),
      select("research_jobs",`workspace_id=eq.${ws.id}&created_at=gte.${encodeURIComponent(month)}&select=id,is_full_research,status,created_at`),
      select("research_jobs",`workspace_id=eq.${ws.id}&created_at=gte.${encodeURIComponent(thirty)}&is_full_research=eq.true&status=eq.COMPLETE&select=id,created_at&order=created_at.desc`),
      select("provider_usage",`workspace_id=eq.${ws.id}&usage_day=eq.${day}&select=*`),
      select("provider_usage",`workspace_id=eq.${ws.id}&created_at=gte.${encodeURIComponent(week)}&select=*`),
      select("provider_usage",`workspace_id=eq.${ws.id}&created_at=gte.${encodeURIComponent(month)}&select=*`),
      select("provider_usage",`workspace_id=eq.${ws.id}&created_at=gte.${encodeURIComponent(thirty)}&select=*`),
      select("provider_connections",`workspace_id=eq.${ws.id}&provider=eq.gemini&select=billing_mode&limit=1`)
    ]);
    const fullToday=(jobsToday||[]).filter((x:any)=>x.is_full_research).length,appLimit=Math.max(1,Number(settings.daily_company_limit||c.dailyLimit||20));
    const gToday=sum(usageToday,"request_count",(x:any)=>x.provider==="gemini"&&x.operation==="grounded_search"),groundingCap=geminiConn?.[0]?.billing_mode==="paid"?1500:500;
    const grounded30=sum(usage30,"request_count",(x:any)=>x.provider==="gemini"&&x.operation==="grounded_search"),reports30=jobs30?.length||0,avgGrounded=reports30?grounded30/reports30:null;
    const providerRemaining=Math.max(0,groundingCap-gToday),providerReports=avgGrounded?Math.floor(providerRemaining/avgGrounded):null,appRemaining=Math.max(0,appLimit-fullToday),available=providerReports==null?appRemaining:Math.min(appRemaining,providerReports);
    const costToday=sum(usageToday,"estimated_cost_usd"),costWeek=sum(usageWeek,"estimated_cost_usd"),costMonth=sum(usageMonth,"estimated_cost_usd");
    const now=new Date(),daysInMonth=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+1,0)).getUTCDate(),dayOfMonth=Math.max(1,now.getUTCDate()),projected=costMonth/dayOfMonth*daysInMonth;
    const providerBreakdown=["gemini","tavily","openai"].map(provider=>({provider,cost_usd:sum(usageMonth,"estimated_cost_usd",(x:any)=>x.provider===provider),calls:sum(usageMonth,"request_count",(x:any)=>x.provider===provider)}));
    const completed30=[...(jobs30||[])];
    return json({
      usage_day:day,
      today:{full_reports:fullToday,application_limit:appLimit,gemini_grounded_calls:gToday,gemini_synthesis_calls:sum(usageToday,"request_count",(x:any)=>x.provider==="gemini"&&x.operation==="structured_synthesis"),tavily_calls:sum(usageToday,"request_count",(x:any)=>x.provider==="tavily"),tavily_credits:sum(usageToday,"tavily_credits",(x:any)=>x.provider==="tavily"),openai_web_calls:sum(usageToday,"request_count",(x:any)=>x.provider==="openai"&&x.operation==="web_research"),openai_calls:sum(usageToday,"request_count",(x:any)=>x.provider==="openai"),retries:sum(usageToday,"request_count",(x:any)=>x.provider==="system"&&x.operation==="retry"),failed_calls:sum(usageToday,"request_count",(x:any)=>x.success===false),estimated_cost_usd:costToday,estimated_cost_inr:fx>0?costToday*fx:null},
      week:{full_reports:(jobsWeek||[]).filter((x:any)=>x.is_full_research&&x.status==="COMPLETE").length,estimated_cost_usd:costWeek,estimated_cost_inr:fx>0?costWeek*fx:null},
      month:{full_reports:(jobsMonth||[]).filter((x:any)=>x.is_full_research&&x.status==="COMPLETE").length,estimated_cost_usd:costMonth,estimated_cost_inr:fx>0?costMonth*fx:null,projected_cost_usd:projected,projected_cost_inr:fx>0?projected*fx:null},
      provider_breakdown:providerBreakdown,
      average_cost_per_full_report_usd:{last_5:costStats(completed30,usage30,5),last_10:costStats(completed30,usage30,10),last_30:costStats(completed30,usage30,30)},
      average_cost_per_full_report_inr:fx>0?{last_5:(costStats(completed30,usage30,5)??0)*fx,last_10:(costStats(completed30,usage30,10)??0)*fx,last_30:(costStats(completed30,usage30,30)??0)*fx}:null,
      currency_reference:fx>0?{usd_inr:fx,label:"Stored cost-protection conversion reference"}:null,
      capacity:{application_remaining:appRemaining,grounding_allowance_reference:groundingCap,grounding_remaining_estimate:providerRemaining,rolling_average_grounded_calls_per_full_report:avgGrounded,provider_estimated_reports_remaining:providerReports,available_today_estimate:available,estimation_note:avgGrounded==null?"Not enough research history to estimate reports/day.":"Application-recorded estimate; provider-authoritative quota remaining is not available."},
      next_reset:nextReset(),checked_at:new Date().toISOString()
    });
  }catch(e){return json({error:safeError(e)},500)}
};
export const config:Config={path:"/api/usage"};