import type { Context, Config } from "@netlify/functions";
import { json, safeError, select, exportReport } from "./lib.mts";
export default async (req:Request,_ctx:Context)=>{
  try{const u=new URL(req.url),id=u.searchParams.get("report_id"),type=(u.searchParams.get("type")||"pdf").toLowerCase();if(!id)return json({error:"report_id required"},400);
    const rows=await select("research_reports",`id=eq.${encodeURIComponent(id)}&select=*&limit=1`);if(!rows?.length)return json({error:"Report not found"},404);
    const out=await exportReport(rows[0],type);return new Response(out.bytes as any,{headers:{"content-type":out.mime,"content-disposition":`attachment; filename="vmg-company-intelligence-v${rows[0].version_no}.${out.ext}"`,"cache-control":"no-store"}});
  }catch(e){return json({error:safeError(e)},500)}
};
export const config:Config={path:"/api/report-export"};