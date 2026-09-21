import type { Context, Config } from "@netlify/functions";
import { json, readJson, safeError, select, update } from "./lib.mts";

export default async (req:Request,_ctx:Context)=>{
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  try{
    const b=await readJson(req),jobId=String(b.job_id||"");if(!jobId)return json({error:"job_id required"},400);
    const rows=await select("research_jobs",`id=eq.${encodeURIComponent(jobId)}&select=*&limit=1`),job=rows?.[0];if(!job)return json({error:"Research job not found."},404);
    if(job.status!=="PREPARING")return json({error:"Research job is not PREPARING.",status:job.status},409);
    const attachments=await select("attachments",`research_job_id=eq.${encodeURIComponent(jobId)}&select=id,upload_status,parse_status,filename`)||[];
    const expected=Math.max(0,Number(job.input_seed?.attachments_expected||0));
    if(expected&&attachments.length!==expected)return json({error:"Not all expected attachments have been authorized.",code:"ATTACHMENTS_INCOMPLETE",expected,found:attachments.length},409);
    const pending=attachments.filter((a:any)=>a.upload_status!=="UPLOADED"||!["READY","PARTIAL","NOT_ALLOWED"].includes(String(a.parse_status||"")));
    if(pending.length)return json({error:"Attachments are still uploading or parsing.",code:"ATTACHMENTS_NOT_READY",pending:pending.map((a:any)=>({id:a.id,filename:a.filename,upload_status:a.upload_status,parse_status:a.parse_status}))},409);
    const claimed=await update("research_jobs",`id=eq.${encodeURIComponent(jobId)}&status=eq.PREPARING`,{status:"QUEUED",preparation_completed_at:new Date().toISOString()},true);
    if(!claimed?.length)return json({error:"Research job was already started by another request.",code:"START_ALREADY_CLAIMED"},409);
    const invoke=await fetch(new URL("/.netlify/functions/research-run-background",req.url),{method:"POST",headers:{"content-type":"application/json",cookie:req.headers.get("cookie")||""},body:JSON.stringify({job_id:jobId})});
    if(!invoke.ok){await update("research_jobs",`id=eq.${jobId}&status=eq.QUEUED`,{status:"FAILED",error_message:`Background research invocation failed (${invoke.status}).`,completed_at:new Date().toISOString()},false);return json({error:"Background research invocation failed.",code:"BACKGROUND_INVOCATION_FAILED"},502)}
    return json({job_id:jobId,status:"QUEUED",background_accepted:true},202);
  }catch(e){return json({error:safeError(e)},500)}
};
export const config:Config={path:"/api/research-start"};
