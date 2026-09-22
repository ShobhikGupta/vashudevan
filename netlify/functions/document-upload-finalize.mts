import type { Context, Config } from "@netlify/functions";
import { json, readJson, safeError, select, storageInfo, update, workspace } from "./lib.mts";

export default async (req:Request,_ctx:Context)=>{
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  try{
    const b=await readJson(req),attachmentId=String(b.attachment_id||"");if(!attachmentId)return json({error:"attachment_id required"},400);
    const ws=await workspace(),rows=await select("attachments",`workspace_id=eq.${ws.id}&id=eq.${encodeURIComponent(attachmentId)}&select=*&limit=1`),a=rows?.[0];if(!a)return json({error:"Attachment not found."},404);
    if(a.upload_status==="UPLOADED")return json({attachment:a,already_finalized:true});
    if(a.upload_status!=="AUTHORIZED")return json({error:"Attachment is not awaiting upload finalization."},409);
    const jobs=await select("research_jobs",`id=eq.${encodeURIComponent(a.research_job_id)}&select=status&limit=1`);if(jobs?.[0]?.status!=="PREPARING")return json({error:"Research job is not PREPARING."},409);
    const info=await storageInfo(a.storage_path),actual=Number(info?.metadata?.size??info?.size??0);
    if(actual&&Number(a.size_bytes)&&actual!==Number(a.size_bytes))return json({error:"Uploaded object size does not match the authorized file.",code:"UPLOAD_SIZE_MISMATCH"},409);
    const image=String(a.mime_type||"").startsWith("image/");
    await update("attachments",`id=eq.${attachmentId}`,{upload_status:"UPLOADED",uploaded_at:new Date().toISOString(),parse_status:image?"NOT_ALLOWED":"QUEUED",extraction_metadata:{...(a.extraction_metadata||{}),storage_verified:true,storage_object_id:info?.id||null}},false);
    if(!image){
      const invoke=await fetch(new URL("/.netlify/functions/document-parse-background",req.url),{method:"POST",headers:{"content-type":"application/json",cookie:req.headers.get("cookie")||""},body:JSON.stringify({attachment_id:attachmentId})});
      if(!invoke.ok)return json({error:`Parser invocation failed (${invoke.status}).`,code:"PARSER_INVOCATION_FAILED"},502);
    }
    return json({attachment_id:attachmentId,upload_status:"UPLOADED",parse_status:image?"NOT_ALLOWED":"QUEUED",analysis:image?"stored_only":"parsing"},202);
  }catch(e){return json({error:safeError(e)},500)}
};
export const config:Config={path:"/api/document-upload-finalize"};
