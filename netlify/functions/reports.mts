import type { Context, Config } from "@netlify/functions";
import { json, safeError, workspace, select } from "./lib.mts";
export default async (req:Request,_ctx:Context)=>{
  try{const ws=await workspace();const u=new URL(req.url),id=u.searchParams.get("id"),companyId=u.searchParams.get("company_id");
    if(id){const r=await select("research_reports",`workspace_id=eq.${ws.id}&id=eq.${encodeURIComponent(id)}&select=*&limit=1`);if(!r?.length)return json({error:"Report not found"},404);const ev=await select("evidence_items",`report_id=eq.${id}&select=*`);const src=await select("sources",`company_id=eq.${r[0].company_id}&select=*&order=retrieved_at.desc`);return json({report:r[0],evidence:ev||[],sources:src||[]})}
    const q=`workspace_id=eq.${ws.id}${companyId?`&company_id=eq.${encodeURIComponent(companyId)}`:""}&select=*&order=created_at.desc`;return json({reports:await select("research_reports",q)||[]});
  }catch(e){return json({error:safeError(e)},500)}
};
export const config:Config={path:"/api/reports"};