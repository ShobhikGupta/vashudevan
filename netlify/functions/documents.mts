import type { Context, Config } from "@netlify/functions";
import { json, safeError, workspace, select } from "./lib.mts";
export default async (req:Request,_ctx:Context)=>{
  try{
    const ws=await workspace();const companyId=new URL(req.url).searchParams.get("company_id");if(!companyId)return json({error:"company_id required"},400);
    const rows=await select("attachments",`workspace_id=eq.${ws.id}&company_id=eq.${encodeURIComponent(companyId)}&select=id,filename,mime_type,size_bytes,public_private,external_ai_allowed,created_at,research_job_id&order=created_at.desc`);
    return json({documents:rows||[]});
  }catch(e){return json({error:safeError(e)},500)}
};
export const config:Config={path:"/api/documents"};