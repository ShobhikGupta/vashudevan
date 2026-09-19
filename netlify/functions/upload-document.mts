import type { Context, Config } from "@netlify/functions";
import { json, safeError, workspace, select, insert, uploadStorage } from "./lib.mts";

export default async (req:Request,_ctx:Context)=>{
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  try{
    const form=await req.formData(),file=form.get("file"),companyId=String(form.get("company_id")||""),jobId=String(form.get("research_job_id")||"")||null,privacy=String(form.get("classification")||"private");
    if(!(file instanceof File))return json({error:"file required"},400);if(!companyId)return json({error:"company_id required"},400);
    const allowed=new Set(["application/pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","text/csv","image/jpeg","image/png","image/webp"]);
    if(!allowed.has(file.type))return json({error:"Unsupported file type"},415);if(file.size>20*1024*1024)return json({error:"File exceeds 20 MB limit"},413);
    const ws=await workspace(),companies=await select("companies",`workspace_id=eq.${ws.id}&id=eq.${encodeURIComponent(companyId)}&select=id&limit=1`);if(!companies?.length)return json({error:"Company not found"},404);
    const safeName=file.name.replace(/[^a-zA-Z0-9._-]+/g,"_"),path=`${ws.id}/${companyId}/${crypto.randomUUID()}-${safeName}`;
    await uploadStorage(path,await file.arrayBuffer(),file.type);
    const rows=await insert("attachments",{workspace_id:ws.id,company_id:companyId,research_job_id:jobId,filename:file.name,storage_path:path,mime_type:file.type,size_bytes:file.size,public_private:privacy==="public"?"public":"private",external_ai_allowed:false});
    await insert("activity_logs",{workspace_id:ws.id,action:"document_uploaded",company_id:companyId,research_job_id:jobId,metadata:{filename:file.name,size_bytes:file.size,classification:privacy,external_ai_allowed:false,ai_document_analysis_enabled:false}},false);
    return json({attachment:rows?.[0],ai_document_analysis_enabled:false,note:"AI document analysis is not enabled yet. The file is stored privately and attached to the company profile."},201);
  }catch(e){return json({error:safeError(e)},500)}
};
export const config:Config={path:"/api/upload-document"};