import type { Context, Config } from "@netlify/functions";
import { json, safeError, select, exportReport } from "./lib.mts";

export default async (req:Request,_ctx:Context)=>{
  try{
    const u=new URL(req.url),id=u.searchParams.get("report_id"),type=(u.searchParams.get("type")||"pdf").toLowerCase();
    if(!id)return json({error:"report_id required"},400);
    const rows=await select("research_reports",`id=eq.${encodeURIComponent(id)}&select=*&limit=1`);if(!rows?.length)return json({error:"Report not found"},404);
    const report=rows[0];
    const [ev,src,c]=await Promise.all([
      select("evidence_items",`report_id=eq.${encodeURIComponent(id)}&select=*`),
      select("sources",`company_id=eq.${encodeURIComponent(report.company_id)}&select=*&order=retrieved_at.desc`),
      select("companies",`id=eq.${encodeURIComponent(report.company_id)}&select=id,legal_name,brand,country,website&limit=1`)
    ]);
    const out=await exportReport({...report,evidence_rows:ev||[],source_rows:src||[],company:c?.[0]||null},type);
    const safeName=String(c?.[0]?.legal_name||"company-intelligence").replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/^-|-$/g,"").slice(0,80)||"company-intelligence";
    return new Response(out.bytes as any,{headers:{"content-type":out.mime,"content-disposition":`attachment; filename="${safeName}-V${report.version_no}.${out.ext}"`,"cache-control":"no-store"}});
  }catch(e){return json({error:safeError(e)},500)}
};
export const config:Config={path:"/api/report-export"};