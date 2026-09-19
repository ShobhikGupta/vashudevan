import type { Context, Config } from "@netlify/functions";
import { json, safeError, workspace, select } from "./lib.mts";
function latestMetrics(report:any){const r=report?.report_json||{};return {identity:r.identity||{},financials:r.financials||{},debt:r.debt||{},credit_ratings:r.credit_ratings||[],operations:r.operations||{},legal:r.legal||[],procurement:r.procurement||[]}}
export default async (req:Request,_ctx:Context)=>{
  try{const ws=await workspace();const ids=(new URL(req.url).searchParams.get("ids")||"").split(",").filter(Boolean).slice(0,5);if(ids.length<2)return json({error:"Select 2 to 5 company ids."},400);
    const out=[];for(const id of ids){const cs=await select("companies",`workspace_id=eq.${ws.id}&id=eq.${encodeURIComponent(id)}&select=*&limit=1`);if(!cs?.length)continue;const rs=await select("research_reports",`company_id=eq.${encodeURIComponent(id)}&select=*&order=version_no.desc&limit=1`);out.push({company:cs[0],report:rs?.[0]||null,metrics:latestMetrics(rs?.[0])})}
    return json({companies:out,note:"Compare only values with compatible periods; the UI must display each metric period explicitly."});
  }catch(e){return json({error:safeError(e)},500)}
};
export const config:Config={path:"/api/compare-companies"};