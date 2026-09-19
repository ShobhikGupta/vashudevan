import type { Context, Config } from "@netlify/functions";
import { json, safeError, config as appConfig, workspace, select, rpc } from "./lib.mts";

export default async (_req:Request,_ctx:Context)=>{
  const c=appConfig(),checked_at=new Date().toISOString();
  const out:any={
    checked_at,environment:c.appEnv,
    functions:{status:"OPERATIONAL",checked_at},
    database:{status:"NOT_CONFIGURED",checked_at},
    migrations:{status:"NOT_CONFIGURED",checked_at,checks:{}},
    vault:{status:"NOT_CONFIGURED",checked_at},
    storage:{status:"NOT_CONFIGURED",checked_at}
  };
  if(!c.supabaseUrl||!c.supabaseSecret)return json(out);
  let ws:any;
  try{ws=await workspace();out.database={status:"CONNECTED",checked_at}}catch(e){out.database={status:"ERROR",checked_at,error:safeError(e)};return json(out)}
  const tables=[
    "workspace_settings","provider_connections","companies","company_identifiers","attachments","activity_logs",
    "provider_usage","research_jobs","research_reports","report_versions","research_job_stages","evidence_items",
    "sources","source_snapshots","financial_periods","financial_metrics"
  ];
  let migrationOk=true;
  for(const table of tables){
    try{await select(table,"select=id&limit=1");out.migrations.checks[table]="OK"}catch{migrationOk=false;out.migrations.checks[table]="MISSING"}
  }
  out.migrations.status=migrationOk?"CONNECTED":"INCOMPLETE";
  try{
    const probe=await rpc("vmg_get_provider_secret",{p_workspace_id:ws.id,p_provider:"__healthcheck__"});
    out.vault={status:probe===null||probe===""?"CONNECTED":"CONNECTED",rpc:"SERVICE_ROLE_OK",checked_at};
  }catch(e){out.vault={status:"ERROR",rpc:"UNAVAILABLE",checked_at,error:safeError(e)}}
  try{
    const r=await fetch(`${c.supabaseUrl}/storage/v1/bucket/company-documents`,{headers:{apikey:c.supabaseSecret,authorization:`Bearer ${c.supabaseSecret}`}});
    const body=await r.text();if(!r.ok)throw new Error(`Storage ${r.status}: ${body.slice(0,250)}`);
    const parsed=body?JSON.parse(body):{};out.storage={status:parsed?.public===false?"CONNECTED":"ERROR",private:parsed?.public===false,bucket:"company-documents",checked_at};
  }catch(e){out.storage={status:"ERROR",checked_at,error:safeError(e)}}
  return json(out);
};
export const config:Config={path:"/api/system-health"};