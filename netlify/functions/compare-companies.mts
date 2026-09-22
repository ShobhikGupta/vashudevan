import type { Context, Config } from "@netlify/functions";
import { json, safeError, workspace, select } from "./lib.mts";

function raw(v:any){return v&&typeof v==="object"&&"value" in v?v.value:v}
function unit(v:any){return v&&typeof v==="object"?{currency:v.currency||null,unit:v.unit||null,evidence_class:v.evidence_class||null}:{}}
function latest(periods:any[],aliases:string[]){
  for(let i=(periods||[]).length-1;i>=0;i--){const p=periods[i];for(const a of aliases)if(p?.[a]!=null){const v=p[a];return{value:raw(v),period:p.period||p.fy||p.year||null,...unit(v)}}}
  return{value:null,period:null};
}
function ratio(r:any,key:string){const arr=r?.financials?.ratios||[];const hit=arr.find((x:any)=>String(x.metric_key||x.name||x.ratio||"").toLowerCase().replace(/[^a-z]/g,"")===key.toLowerCase().replace(/[^a-z]/g,""));return hit?{value:raw(hit.value??hit.value_numeric),period:hit.period||hit.fy||null}: {value:null,period:null}}
function compact(r:any){
  const periods=r?.financials?.periods||[],lastRating=(r?.credit_ratings||[]).at(-1)||{},capacity=(r?.operations?.capacity||[])[0]||null;
  return {
    revenue:latest(periods,["revenue","turnover","sales"]),
    pat:latest(periods,["pat","net_profit","profit_after_tax"]),
    net_worth:latest(periods,["net_worth","networth"]),
    debt:latest(periods,["debt","total_debt","borrowings"]),
    debt_equity:ratio(r,"debtequity"),
    credit_rating:{value:lastRating.rating||null,period:lastRating.rating_date||lastRating.date||null},
    capacity:{value:capacity,period:capacity?.period||null},
    products:{value:(r?.business?.products||[]).map((x:any)=>x?.name||x).filter(Boolean).slice(0,8),period:null},
    plants:{value:(r?.operations?.facilities||[]).map((x:any)=>x?.name||x?.address||x).filter(Boolean).slice(0,8),period:null},
    exports:{value:Array.isArray(r?.trade?.exports)?r.trade.exports.length:null,period:r?.trade?.period||null},
    legal_signals:{value:Array.isArray(r?.legal)?r.legal.length:null,period:null},
    procurement_relevance:{value:(r?.procurement||[]).map((x:any)=>x?.material||x?.category||x).filter(Boolean).slice(0,8),period:null}
  };
}
export default async (req:Request,_ctx:Context)=>{
  try{
    const ws=await workspace(),ids=[...new Set((new URL(req.url).searchParams.get("ids")||"").split(",").filter(Boolean))];if(ids.length<2||ids.length>5)return json({error:"Select 2 to 5 companies."},400);
    const out=[];
    for(const id of ids){
      const cs=await select("companies",`workspace_id=eq.${ws.id}&id=eq.${encodeURIComponent(id)}&select=*&limit=1`);if(!cs?.length)continue;
      const rs=await select("research_reports",`company_id=eq.${encodeURIComponent(id)}&select=*&order=version_no.desc&limit=1`);
      out.push({company:cs[0],report:rs?.[0]?{id:rs[0].id,version_no:rs[0].version_no,created_at:rs[0].created_at,evidence_coverage:rs[0].evidence_coverage}:null,comparison:compact(rs?.[0]?.report_json||{})});
    }
    if(out.length!==ids.length)return json({error:"One or more selected companies were not found in this workspace.",code:"COMPANY_SCOPE_MISMATCH"},404);
    return json({companies:out,note:"Every financial value includes its stored period. Different periods are intentionally shown rather than silently treated as equivalent."});
  }catch(e){return json({error:safeError(e)},500)}
};
export const config:Config={path:"/api/compare-companies"};
