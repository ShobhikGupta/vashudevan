import type { Context, Config } from "@netlify/functions";
import { createSignedStorageUpload, insert, json, readJson, safeError, select, workspace, workspaceSettings } from "./lib.mts";

const ALLOWED=new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv","image/jpeg","image/png","image/webp"
]);
const MAX=20*1024*1024;
function safeName(name:string){return name.replace(/[^a-zA-Z0-9._-]+/g,"_").replace(/^\.+/,"").slice(0,120)||"document"}
export default async (req:Request,_ctx:Context)=>{
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  try{
    const b=await readJson(req),companyId=String(b.company_id||""),jobId=String(b.research_job_id||""),filename=String(b.filename||""),mime=String(b.mime_type||""),size=Number(b.size_bytes||0);
    const classification=String(b.classification||"private")==="public"?"public":"private",requestedExternal=b.external_ai_allowed===true;
    if(!companyId||!jobId||!filename)return json({error:"company_id, research_job_id and filename are required."},400);
    if(!ALLOWED.has(mime))return json({error:"Unsupported file type."},415);
    if(!(size>0&&size<=MAX))return json({error:"File must be between 1 byte and 20 MB."},413);
    const ws=await workspace(),jobs=await select("research_jobs",`id=eq.${encodeURIComponent(jobId)}&workspace_id=eq.${ws.id}&company_id=eq.${encodeURIComponent(companyId)}&select=id,status,input_seed&limit=1`);
    const job=jobs?.[0];if(!job)return json({error:"Prepared research job not found."},404);
    if(job.status!=="PREPARING")return json({error:"Documents may only be attached while research is PREPARING.",code:"JOB_NOT_PREPARING"},409);
    const settings=await workspaceSettings(),privacy=settings.privacy||{};
    const workspaceAllows=classification==="private"?privacy.private_document_ai===true:privacy.public_document_ai!==false;
    if(requestedExternal&&!workspaceAllows)return json({error:"Workspace privacy policy does not allow external AI processing for this document classification.",code:"EXTERNAL_AI_POLICY_BLOCK"},403);
    const externalAllowed=requestedExternal&&workspaceAllows,path=`${ws.id}/${companyId}/${crypto.randomUUID()}-${safeName(filename)}`;
    const rows=await insert("attachments",{workspace_id:ws.id,company_id:companyId,research_job_id:jobId,filename,storage_path:path,mime_type:mime,size_bytes:size,public_private:classification,external_ai_allowed:externalAllowed,upload_status:"AUTHORIZED",parse_status:mime.startsWith("image/")?"NOT_ALLOWED":"QUEUED",extraction_metadata:{external_ai_policy_allowed:workspaceAllows}});
    const attachment=rows?.[0];if(!attachment)throw new Error("Could not create attachment record.");
    const signed=await createSignedStorageUpload(path);
    return json({attachment_id:attachment.id,storage_path:path,classification,external_ai_allowed:externalAllowed,...signed},201);
  }catch(e){return json({error:safeError(e)},500)}
};
export const config:Config={path:"/api/document-upload-authorize"};
