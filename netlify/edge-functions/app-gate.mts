import { isAppSession, runtimeEnv } from "../shared/session.mts";

const PUBLIC_PATHS=new Set(["/login.html","/login.js","/app.css","/robots.txt","/favicon.ico","/api/auth"]);
function secured(response:Response){
  const h=new Headers(response.headers);
  h.set("X-Robots-Tag","noindex, nofollow, noarchive");
  h.set("X-Content-Type-Options","nosniff");
  h.set("X-Frame-Options","DENY");
  h.set("Referrer-Policy","no-referrer");
  h.set("Permissions-Policy","camera=(), microphone=(), geolocation=(), payment=()");
  h.set("Cache-Control","no-store");
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});
}
const jsonError=(message:string,status:number,code:string)=>secured(new Response(JSON.stringify({error:message,code}),{status,headers:{"content-type":"application/json; charset=utf-8"}}));
const redirect=(location:string)=>secured(new Response(null,{status:303,headers:{location}}));

export default async (req:Request,ctx:any)=>{
  const url=new URL(req.url),path=url.pathname,configured=Boolean(runtimeEnv("APP_ACCESS_SECRET"));
  if(PUBLIC_PATHS.has(path))return secured(await ctx.next());
  if(!configured){
    if(path.startsWith("/api/")||path.startsWith("/.netlify/functions/"))return jsonError("VMG Intelligence access is not configured.",503,"APP_ACCESS_NOT_CONFIGURED");
    return redirect("/login.html?setup=1");
  }
  if(!(await isAppSession(req))){
    if(path.startsWith("/api/")||path.startsWith("/.netlify/functions/"))return jsonError("Authentication required.",401,"APP_AUTH_REQUIRED");
    return redirect("/login.html?next="+encodeURIComponent(path+url.search));
  }
  if(path==="/login.html"||path==="/login.js")return redirect("/");
  return secured(await ctx.next());
};
export const config={path:"/*"};
