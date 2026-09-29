import type { Context } from "@netlify/functions";
import { runResearchJob, safeError, update, insert, select } from "./lib.mts";

export default async (req:Request,_ctx:Context)=>{
  try{
    const body=await req.json() as any,jobId=String(body?.job_id||"");if(!jobId)return;
    try{await runResearchJob(jobId)}
    catch(e){
      try{
        const rows=await select("research_jobs",`id=eq.${encodeURIComponent(jobId)}&select=workspace_id,company_id,status&limit=1`),j=rows?.[0];
        if(j&&["QUEUED","RUNNING"].includes(String(j.status||""))){
          await update("research_jobs",`id=eq.${encodeURIComponent(jobId)}&status=eq.${encodeURIComponent(j.status)}`,{status:"FAILED",error_message:safeError(e),completed_at:new Date().toISOString()},false);
          await insert("activity_logs",{workspace_id:j.workspace_id,action:"research_failed",company_id:j.company_id,research_job_id:jobId,metadata:{error:safeError(e)}},false);
        }
      }catch{}
    }
  }catch{}
};
