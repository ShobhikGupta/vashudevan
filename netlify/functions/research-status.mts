import type { Context, Config } from "@netlify/functions";
import { json, safeError, select, workspace } from "./lib.mts";
export default async (req:Request,_ctx:Context)=>{
  try{const id=new URL(req.url).searchParams.get("job_id");if(!id)return json({error:"job_id required"},400);
    const ws=await workspace(),jobs=await select("research_jobs",`workspace_id=eq.${ws.id}&id=eq.${encodeURIComponent(id)}&select=*&limit=1`);if(!jobs?.length)return json({error:"Research job not found"},404);
    const stages=await select("research_job_stages",`research_job_id=eq.${encodeURIComponent(id)}&select=*&order=stage_no.asc`);
    return json({job:jobs[0],stages});
  }catch(e){return json({error:safeError(e)},500)}
};
export const config:Config={path:"/api/research-status"};
