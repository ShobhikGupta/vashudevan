import type { Context, Config } from "@netlify/functions";
import { json, readJson } from "./lib.mts";
import { adminConfigured, isAdmin, loginResponse, logoutResponse } from "./admin-auth.mts";

export default async (req:Request,_ctx:Context)=>{
  if(req.method==="GET")return json({configured:await adminConfigured(),authorized:await isAdmin(req)});
  if(req.method==="POST"){const b=await readJson(req);return await loginResponse(String(b.secret||""))}
  if(req.method==="DELETE")return logoutResponse();
  return json({error:"Method not allowed"},405);
};
export const config:Config={path:"/api/settings-auth"};