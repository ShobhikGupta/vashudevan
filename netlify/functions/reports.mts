import type { Context, Config } from "@netlify/functions";
import { json, safeError, workspace, select } from "./lib.mts";

async function enrich(rows:any[]){
  const cache:any={};const out=[];
  for(const r of rows||[]){
    if(!cache[r.company_id]){const c=await select("companies",`id=eq.${encodeURIComponent(r.company_id)}&select=id,legal_name,brand,country,website&limit=1`);cache[r.company_id]=c?.[0]||null}
    out.push({...r,company:cache[r.company_id]});
  }
  return out;
}
export default async (req:Request,_ctx:Context)=>{
  try{
    const ws=await workspace();const u=new URL(req.url),id=u.searchParams.get("id"),companyId=u.searchParams.get("company_id");
    if(id){
      const r=await select("research_reports",`workspace_id=eq.${ws.id}&id=eq.${encodeURIComponent(id)}&select=*&limit=1`);if(!r?.length)return json({error:"Report not found"},404);
      const report=r[0];
      const ev=await select("evidence_items",`report_id=eq.${encodeURIComponent(id)}&select=*`);
      const src=report.research_job_id
        ? await select("sources",`research_job_id=eq.${encodeURIComponent(report.research_job_id)}&select=*&order=retrieved_at.desc`)
        : [];
      const c=await select("companies",`id=eq.${report.company_id}&select=id,legal_name,brand,country,state_region,website,updated_at&limit=1`);
      return json({report,company:c?.[0]||null,evidence:ev||[],sources:src||[]});
    }
    const q=`workspace_id=eq.${ws.id}${companyId?`&company_id=eq.${encodeURIComponent(companyId)}`:""}&select=*&order=created_at.desc`;
    const rows=await select("research_reports",q)||[];return json({reports:await enrich(rows)});
  }catch(e){return json({error:safeError(e)},500)}
};
export const config:Config={path:"/api/reports"};