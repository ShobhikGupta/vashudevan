import type { Context, Config } from "@netlify/functions";
import { json, safeError, workspace, select, dayKey, nextReset, config as appConfig } from "./lib.mts";
export default async (_req:Request,_ctx:Context)=>{
  try{const ws=await workspace(),day=dayKey(),c=appConfig();const jobs=await select("research_jobs",`workspace_id=eq.${ws.id}&usage_day=eq.${day}&select=id,is_full_research,status`);const usage=await select("provider_usage",`workspace_id=eq.${ws.id}&usage_day=eq.${day}&select=provider,operation,request_count,success`);
    const sum=(provider:string,op?:string)=>(usage||[]).filter((x:any)=>x.provider===provider&&(!op||x.operation===op)).reduce((a:number,x:any)=>a+(x.request_count||0),0);
    return json({usage_day:day,full_research_jobs:(jobs||[]).filter((x:any)=>x.is_full_research).length,completed_jobs:(jobs||[]).filter((x:any)=>x.status==="COMPLETE").length,gemini_grounded_calls:sum("gemini","grounded_search"),gemini_synthesis_calls:sum("gemini","structured_synthesis"),tavily_calls:sum("tavily","search"),failed_calls:(usage||[]).filter((x:any)=>!x.success).reduce((a:number,x:any)=>a+(x.request_count||0),0),application_limit:c.dailyLimit,approx_remaining_full_jobs:Math.max(0,c.dailyLimit-(jobs||[]).filter((x:any)=>x.is_full_research).length),remaining_basis:"Estimated from application-recorded usage",next_reset:nextReset()});
  }catch(e){return json({error:safeError(e)},500)}
};
export const config:Config={path:"/api/usage"};