import type { Context, Config } from "@netlify/functions";
import { json, readJson } from "./lib.mts";
import { APP_SESSION_SECONDS, clearSessionCookie, isAppSession, issueSession, runtimeEnv, secretMatches, setSessionCookie } from "../shared/session.mts";

export default async (req:Request,_ctx:Context)=>{
  const secret=runtimeEnv("APP_ACCESS_SECRET");
  if(req.method==="GET")return json({configured:Boolean(secret),authenticated:secret?await isAppSession(req):false});
  if(req.method==="POST"){
    if(!secret)return json({error:"VMG Intelligence access is not configured.",code:"APP_ACCESS_NOT_CONFIGURED"},503);
    let body:any; try{body=await readJson(req)}catch{return json({error:"Expected login request."},400)}
    if(!(await secretMatches(String(body?.secret||""),secret)))return json({error:"Invalid access secret."},401);
    const token=await issueSession(secret,APP_SESSION_SECONDS);
    return json({authenticated:true,expires_in_seconds:APP_SESSION_SECONDS},200,{"set-cookie":setSessionCookie(token)});
  }
  if(req.method==="DELETE")return json({authenticated:false},200,{"set-cookie":clearSessionCookie()});
  return json({error:"Method not allowed"},405);
};
export const config:Config={path:"/api/auth"};
