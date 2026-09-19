const S={
  providers:null,providerMeta:{},templates:[],companies:[],reports:[],entity:null,
  selectedTemplate:"vmg_full_due_diligence",currentJob:null,currentCompany:null,currentReport:null,
  poll:null,files:[],compareIds:[],admin:{configured:false,authorized:false},connections:[],settings:{},
  currentReportData:null,currentEvidence:[],currentSources:[],systemHealth:null,alertKeys:new Set()
};

const titles={dashboard:"Dashboard",new:"New Research",progress:"Research Progress",companies:"Companies",reports:"Reports",templates:"Research Templates",compare:"Compare Companies",usage:"Usage & Limits",settings:"Settings",profile:"Company Profile"};
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const money=v=>Number.isFinite(Number(v))?"$"+Number(v).toFixed(2):"—";
const fmtDate=v=>{if(!v)return"—";try{return new Date(v).toLocaleString()}catch{return String(v)}};
const fmtShort=v=>{if(!v)return"—";try{return new Date(v).toLocaleDateString()}catch{return String(v)}};
const isObj=v=>v&&typeof v==="object"&&!Array.isArray(v);
const tag=(text,kind="neutral")=>'<span class="tag '+kind+'">'+esc(text)+'</span>';

function toast(msg){const e=document.getElementById("toast");e.textContent=msg;e.classList.add("show");clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove("show"),2600)}
function show(view){
  document.querySelectorAll(".view").forEach(x=>x.classList.toggle("active",x.id===view));
  document.querySelectorAll(".nav button").forEach(x=>x.classList.toggle("active",x.dataset.view===view));
  document.getElementById("pageTitle").textContent=titles[view]||"VMG Company Intelligence";
  if(view==="settings")loadAdminState();
  if(view==="usage")loadUsage();
  window.scrollTo({top:0,behavior:"smooth"});
}
async function api(path,opt={}){
  const r=await fetch(path,{credentials:"same-origin",...opt});let j={};try{j=await r.json()}catch{}
  if(!r.ok)throw Object.assign(new Error(j.error||("Request failed: "+r.status)),{status:r.status,data:j});return j;
}
function statusKind(value){const v=String(value||"").toUpperCase();if(["CONNECTED","AVAILABLE","PASS","OPERATIONAL","COMPLETE"].includes(v))return"ok";if(["PARTIAL","QUOTA LOW","DEGRADED"].includes(v))return"warn";if(["FAILED","AUTH ERROR","QUOTA EXHAUSTED","ERROR"].includes(v))return"bad";if(["RUNNING"].includes(v))return"info";return"neutral"}

document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>show(b.dataset.view));
document.querySelectorAll("[data-jump]").forEach(b=>b.onclick=()=>show(b.dataset.jump));
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>document.getElementById(b.dataset.close)?.classList.remove("open"));
document.getElementById("closeDrawer").onclick=()=>document.getElementById("drawer").classList.remove("open");

async function loadStatus(){
  try{
    const [p,h]=await Promise.all([api("/api/provider-status"),api("/api/system-health").catch(()=>null)]);
    S.providers=p;S.providerMeta=p.metadata||{};S.systemHealth=h;renderProviders();renderSystemConnections();
    const ready=p?.supabase?.connected&&(p?.gemini?.connected||p?.openai?.connected);
    document.getElementById("startBtn").disabled=!ready;
    const n=document.getElementById("configNotice");n.className="notice";
    if(!p?.supabase?.connected){
      n.hidden=false;n.innerHTML='<b>SYSTEM SETUP REQUIRED</b><br>1. Connect database<br>2. Apply Company Intelligence migrations<br>3. Configure Admin Settings Lock<br>4. Then connect Gemini / Tavily / OpenAI from Settings<br><br><button class="btn" id="setupInstructionsBtn">View Setup Instructions</button>';
      document.getElementById("setupInstructionsBtn").onclick=openSetupInstructions;
    }else if(!ready){
      n.hidden=false;n.innerHTML='<b>AI RESEARCH PROVIDER REQUIRED</b><br>The database is connected. Open Settings and connect/test Gemini for the free-first workflow, or an explicitly allowed alternative.';
    }else n.hidden=true;
  }catch(e){const n=document.getElementById("configNotice");n.hidden=false;n.className="notice error";n.textContent=e.message}
}
function openSetupInstructions(){
  document.getElementById("drawerTitle").textContent="System setup instructions";
  document.getElementById("drawerBody").innerHTML='<div class="notice info"><b>Bootstrap must happen on the server first.</b> Supabase cannot be safely connected from this public preview until its server-side credentials exist.</div><div class="list" style="margin-top:12px"><div class="listitem"><b>Step 1 — Create/connect the dedicated Supabase project</b><p>Add <code>SUPABASE_URL</code> and <code>SUPABASE_SERVICE_ROLE_KEY</code> as Netlify site environment variables. Do not put them in frontend code or netlify.toml.</p></div><div class="listitem"><b>Step 2 — Apply the migrations</b><p>Run <code>001_company_intelligence.sql</code> first, then <code>002_provider_connections_and_settings.sql</code>. This creates the VMG workspace, private document bucket, Vault functions, settings and research tables.</p></div><div class="listitem"><b>Step 3 — Configure the admin lock</b><p>Add <code>SETTINGS_ADMIN_SECRET</code> as a secret Netlify environment variable. Recommended preview values also include <code>APP_ENV=preview</code> and <code>RESEARCH_DAILY_COMPANY_LIMIT=20</code>.</p></div><div class="listitem"><b>Step 4 — Redeploy this preview</b><p>The exact deploy being tested must receive the environment variables.</p></div><div class="listitem"><b>Step 5 — Connect Gemini</b><p>Open Settings → Research Providers → Gemini → Connect. Tavily and OpenAI remain optional.</p></div></div>';
  document.getElementById("drawer").classList.add("open");
}
function renderProviders(){
  const p=S.providers||{};
  const state=(x)=>x?.status||x?.health||(x?.connected?"CONNECTED":x?.configured?"CONFIGURED":"NOT_CONFIGURED");
  const rows=[
    ["Gemini",state(p.gemini)],
    ["Google Search Grounding",p.google_search_grounding?.status||"NOT_CONFIGURED"],
    ["Tavily",state(p.tavily)],
    ["OpenAI",state(p.openai)],
    ["Supabase",p.supabase?.connected?"CONNECTED":p.supabase?.configured?"CONFIGURED":"NOT_CONFIGURED"]
  ];
  document.getElementById("providerMini").innerHTML=rows.map(([a,b])=>'<div class="statusline"><span>'+esc(a)+'</span><b>'+tag(String(b).replaceAll("_"," "),statusKind(b))+'</b></div>').join("");
}
async function loadTemplates(){
  try{const j=await api("/api/templates");S.templates=j.templates||[]}catch{S.templates=[]}
  renderTemplates();
}
function templateArray(){
  const fallback=[
    ["vmg_full_due_diligence","VMG Full Due Diligence","Complete business, operational, financial, legal, trade and credit review."],
    ["credit_counterparty_safety","Credit / Counterparty Safety","Debt, cash, payment behaviour, recovery and rating focus."],
    ["supplier_due_diligence","Supplier Due Diligence","Supply capability, operations and financial resilience."],
    ["buyer_intelligence","Buyer Intelligence","Demand potential, purchasing activity and payment safety."],
    ["procurement_opportunity","Procurement Opportunity","What the target buys and where VMG may fit."],
    ["quick_company_check","Quick Company Check","Lower-call initial screening."]
  ];
  return S.templates.length?S.templates.map(t=>[t.template_key,t.name,t.description]):fallback;
}
function renderTemplates(){
  const arr=templateArray(),html=arr.map(t=>'<button class="template '+(t[0]===S.selectedTemplate?"active":"")+'" data-template="'+esc(t[0])+'"><b>'+esc(t[1])+'</b><small>'+esc(t[2]||"")+'</small></button>').join("");
  document.getElementById("templateGrid").innerHTML=html;document.getElementById("templateCards").innerHTML=html;
  document.querySelectorAll("[data-template]").forEach(b=>b.onclick=()=>{S.selectedTemplate=b.dataset.template;document.querySelectorAll("[data-template]").forEach(x=>x.classList.toggle("active",x.dataset.template===S.selectedTemplate))});
}
async function loadCompanies(){
  try{const j=await api("/api/companies");S.companies=j.companies||[];document.getElementById("kCompanies").textContent=S.companies.length;renderCompanies();renderCompareOptions()}catch{document.getElementById("kCompanies").textContent="—"}
}
function renderCompanies(){
  const q=(document.getElementById("companySearch")?.value||"").toLowerCase();
  const arr=S.companies.filter(c=>(c.legal_name+" "+(c.brand||"")+" "+(c.country||"")).toLowerCase().includes(q));
  const row=c=>'<tr><td><b>'+esc(c.legal_name)+'</b></td><td>'+esc(c.brand||"—")+'</td><td>'+esc(c.country||"—")+'</td><td>'+(c.website?'<a href="'+esc(c.website)+'" target="_blank" rel="noopener">'+esc(c.website)+'</a>':"—")+'</td><td>'+esc(fmtShort(c.updated_at))+'</td><td><button class="btn" data-open-company="'+c.id+'">Open</button></td></tr>';
  document.getElementById("companyRows").innerHTML=arr.map(row).join("")||'<tr><td colspan="6">No saved companies.</td></tr>';
  document.getElementById("recentCompanies").innerHTML=S.companies.slice(0,5).map(c=>'<tr><td><b>'+esc(c.legal_name)+'</b></td><td>'+esc(c.country||"—")+'</td><td>'+esc(fmtShort(c.updated_at))+'</td><td><button class="btn" data-open-company="'+c.id+'">Open</button></td></tr>').join("")||'<tr><td colspan="4">No saved companies.</td></tr>';
  document.querySelectorAll("[data-open-company]").forEach(b=>b.onclick=()=>openCompany(b.dataset.openCompany));
}
async function loadReports(){
  try{
    const j=await api("/api/reports");S.reports=j.reports||[];document.getElementById("kReports").textContent=S.reports.length;renderReports();
  }catch{document.getElementById("kReports").textContent="—"}
}
function renderReports(){
  const defs=S.settings.report_defaults||{},exportBtn=(r,type,label)=>defs[type]===false?'<span class="tag neutral">'+label+' off</span>':'<a class="btn" href="/api/report-export?report_id='+r.id+'&type='+type+'">'+label+'</a>';
  document.getElementById("reportRows").innerHTML=S.reports.map(r=>{
    const name=r.company?.legal_name||S.companies.find(c=>c.id===r.company_id)?.legal_name||"Company";
    return '<tr><td><b>'+esc(name)+'</b></td><td>V'+esc(r.version_no)+'</td><td>'+esc(templateArray().find(t=>t[0]===r.template_key)?.[1]||r.template_key||"—")+'</td><td>'+esc(r.evidence_coverage??"—")+'%</td><td>'+esc(r.source_count??0)+'</td><td>'+esc(fmtShort(r.created_at))+'</td><td><button class="btn" data-open-report="'+r.id+'">Open</button> '+exportBtn(r,"pdf","PDF")+' '+exportBtn(r,"docx","DOCX")+' '+exportBtn(r,"xlsx","XLSX")+' <button class="btn" data-rerun="'+r.company_id+'">Re-run</button></td></tr>';
  }).join("")||'<tr><td colspan="7">No reports yet.</td></tr>';
  document.querySelectorAll("[data-open-report]").forEach(b=>b.onclick=()=>openReport(b.dataset.openReport));
  document.querySelectorAll("[data-rerun]").forEach(b=>b.onclick=()=>prefillResearch(b.dataset.rerun));
}
async function loadUsage(){
  try{
    const u=await api("/api/usage"),t=u.today||{},c=u.capacity||{},w=u.week||{},m=u.month||{},fx=u.currency_reference;
    document.getElementById("kJobs").textContent=t.full_reports??"—";document.getElementById("kCalls").textContent=t.gemini_grounded_calls??"—";document.getElementById("kAvailable").textContent=c.available_today_estimate??"—";
    document.getElementById("uJobs").textContent=(t.full_reports??0)+" / "+(t.application_limit??20);document.getElementById("uJobsSub").textContent="Application safety cap";
    document.getElementById("uGemini").textContent=t.gemini_grounded_calls??0;document.getElementById("uTavily").textContent=t.tavily_credits??t.tavily_calls??0;document.getElementById("uFailed").textContent=t.failed_calls??0;
    document.getElementById("uCost").textContent=t.estimated_cost_inr!=null?"₹"+Number(t.estimated_cost_inr).toFixed(2):"$"+Number(t.estimated_cost_usd||0).toFixed(2);
    document.getElementById("usageCapacity").innerHTML=[
      ["Application cap remaining",c.application_remaining??"—"],["Provider grounding remainder",c.grounding_remaining_estimate??"—"],
      ["Recent average grounded calls/report",c.rolling_average_grounded_calls_per_full_report==null?"Not enough history":Number(c.rolling_average_grounded_calls_per_full_report).toFixed(1)],
      ["Provider-estimated capacity",c.provider_estimated_reports_remaining??"Not enough history"],["Available today",c.available_today_estimate??"Not enough history"]
    ].map(x=>'<div class="statusline"><span>'+esc(x[0])+'</span><b>'+esc(x[1])+'</b></div>').join("");
    document.getElementById("usageReset").innerHTML=[
      ["Gemini reset",fmtDate(u.next_reset)],["Local-time equivalent",u.next_reset?new Date(u.next_reset).toLocaleString():"—"],
      ["Estimate basis",c.estimation_note||"Application-recorded estimate"],["Gemini synthesis",t.gemini_synthesis_calls??0],["OpenAI web research",t.openai_web_calls??0],["Retries",t.retries??0]
    ].map(x=>'<div class="statusline"><span>'+esc(x[0])+'</span><b>'+esc(x[1])+'</b></div>').join("");
    document.getElementById("usagePeriods").innerHTML=[
      ["This week — full reports",w.full_reports??0],["This week — API spend",costText(w.estimated_cost_inr,w.estimated_cost_usd)],
      ["This month — full reports",m.full_reports??0],["This month — API spend",costText(m.estimated_cost_inr,m.estimated_cost_usd)],["Projected month",costText(m.projected_cost_inr,m.projected_cost_usd)]
    ].map(x=>'<div class="statusline"><span>'+esc(x[0])+'</span><b>'+esc(x[1])+'</b></div>').join("");
    const avg=u.average_cost_per_full_report_inr||u.average_cost_per_full_report_usd||{},sym=u.average_cost_per_full_report_inr?"₹":"$";
    document.getElementById("usageAverageCost").innerHTML=[["Last 5",avg.last_5],["Last 10",avg.last_10],["Last 30",avg.last_30],["Conversion",fx?("₹ per $ = "+fx.usd_inr+" • estimated"):"USD shown; no INR conversion reference set"]].map(x=>'<div class="statusline"><span>'+esc(x[0])+'</span><b>'+esc(typeof x[1]==="number"?sym+Number(x[1]).toFixed(2):(x[1]??"Not enough history"))+'</b></div>').join("");
    if(document.getElementById("settingsUsage"))document.getElementById("settingsUsage").innerHTML=document.getElementById("usageCapacity").outerHTML+document.getElementById("usagePeriods").outerHTML+document.getElementById("usageAverageCost").outerHTML;
    renderAlerts(u);
  }catch(e){document.getElementById("kJobs").textContent="—";document.getElementById("kCalls").textContent="—";document.getElementById("kAvailable").textContent="—"}
}
function costText(inr,usd){return inr!=null?"₹"+Number(inr).toFixed(2)+" estimated":"$"+Number(usd||0).toFixed(2)+" estimated"}
function renderAlerts(u){
  const a=S.settings.alerts||{},msgs=[],t=u.today||{},pct=t.application_limit?100*Number(t.full_reports||0)/Number(t.application_limit):0,c=u.capacity||{};
  if((a.warn_90!==false&&pct>=90)||(a.warn_80!==false&&pct>=80)||(a.warn_70===true&&pct>=70))msgs.push("Research usage is "+Math.round(pct)+"% of the daily application cap.");
  if(a.quota_low!==false&&c.grounding_remaining_estimate!=null&&c.grounding_allowance_reference&&c.grounding_remaining_estimate/c.grounding_allowance_reference<=.2&&c.grounding_remaining_estimate>0)msgs.push("Gemini grounding allowance is running low based on application-recorded usage.");
  if(a.quota_exhausted!==false&&c.grounding_remaining_estimate===0)msgs.push("Application-recorded Gemini grounding allowance estimate is exhausted.");
  if(a.provider_disconnected!==false&&S.providers?.supabase?.connected&&!S.providers?.gemini?.configured)msgs.push("Gemini is not connected.");
  const cp=S.settings.cost_protection||{},monthly=Number(cp.monthly_budget_inr||0);if(a.budget_threshold!==false&&monthly>0&&u.month?.estimated_cost_inr!=null&&Number(u.month.estimated_cost_inr)>=monthly*.8)msgs.push("API spend has reached at least 80% of the configured monthly budget.");
  const box=document.getElementById("alertsBanner"),badge=document.getElementById("alertBadge");box.hidden=!msgs.length;badge.hidden=!msgs.length;if(msgs.length)box.innerHTML='<b>Attention</b><br>'+msgs.map(esc).join("<br>");
}
function renderFiles(){
  document.getElementById("fileList").innerHTML=S.files.map((x,i)=>'<div class="filerow"><div><b>'+esc(x.file.name)+'</b><small>'+esc((x.file.size/1024/1024).toFixed(2))+' MB • '+esc(x.file.type||"unknown")+(x.status?" • "+esc(x.status):"")+'</small></div><select class="select" data-file-class="'+i+'"><option value="private" '+(x.classification==="private"?"selected":"")+'>Private</option><option value="public" '+(x.classification==="public"?"selected":"")+'>Public</option></select><div><span class="tag neutral">AI analysis off</span><small style="display:block;margin-top:4px">Stored only; AI document analysis is not enabled yet.</small></div><button class="btn" data-file-remove="'+i+'">Remove</button></div>').join("");
  document.querySelectorAll("[data-file-class]").forEach(el=>el.onchange=()=>{S.files[+el.dataset.fileClass].classification=el.value;renderFiles()});
  document.querySelectorAll("[data-file-remove]").forEach(el=>el.onclick=()=>{S.files.splice(+el.dataset.fileRemove,1);renderFiles()});
}
document.getElementById("fileInput").onchange=e=>{for(const file of [...e.target.files])S.files.push({file,classification:"private",externalAI:false,status:"queued"});e.target.value="";renderFiles()};

async function resolveEntity(autoStart=false){
  const seed=document.getElementById("seed").value.trim();if(!seed)return toast("Enter a company identifier.");
  try{
    toast("Resolving legal entity…");const j=await api("/api/entity-resolve",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({seed})});
    if(!j.resolved||!j.candidates?.length)throw new Error("ENTITY NOT SUFFICIENTLY RESOLVED");
    document.getElementById("entityChoices").innerHTML=j.candidates.map((c,i)=>'<div class="listitem" style="margin-bottom:8px;display:flex;justify-content:space-between;gap:12px"><div><b>'+esc(c.legal_name)+'</b><p>'+esc([c.brand,c.state_region,c.country,c.registration_id,c.tax_id].filter(Boolean).join(" • "))+'</p><p>'+esc(c.evidence_summary||"")+'</p><div>'+tag(c.confidence||"UNKNOWN",c.confidence==="HIGH"?"ok":c.confidence==="MEDIUM"?"warn":"neutral")+'</div></div><button class="btn '+(i===0?"primary":"")+'" data-candidate="'+i+'">Select</button></div>').join("");
    document.querySelectorAll("[data-candidate]").forEach(b=>b.onclick=()=>{S.entity=j.candidates[+b.dataset.candidate];document.getElementById("entityModal").classList.remove("open");toast("Entity confirmed: "+S.entity.legal_name);if(autoStart)createResearch()});
    document.getElementById("entityModal").classList.add("open");
  }catch(e){toast(e.message)}
}
async function uploadQueued(companyId,jobId){
  for(const item of S.files){
    try{
      item.status="uploading";renderFiles();
      const fd=new FormData();fd.append("file",item.file);fd.append("company_id",companyId);fd.append("research_job_id",jobId||"");fd.append("classification",item.classification);fd.append("external_ai_allowed",String(item.externalAI));
      await api("/api/upload-document",{method:"POST",body:fd});item.status="uploaded";
    }catch(e){item.status="failed";item.error=e.message}
    renderFiles();
  }
}
async function createResearch(){
  try{
    const seed=document.getElementById("seed").value.trim();if(!S.entity)return resolveEntity(true);
    const j=await api("/api/research-create",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({seed,confirmed_entity:S.entity,template_key:S.selectedTemplate,custom_prompt:document.getElementById("customPrompt").value})});
    S.currentJob=j.job_id;S.currentCompany=j.company_id;uploadQueued(j.company_id,j.job_id);
    show("progress");document.getElementById("progressTitle").textContent=S.entity.legal_name;document.getElementById("jobMeta").textContent="Live research job";startPolling();
  }catch(e){toast(e.message)}
}
function stageClass(status){if(status==="COMPLETE")return"complete";if(status==="PARTIAL")return"partial";if(status==="NO RELIABLE DATA"||status==="SKIPPED")return"none";if(status==="FAILED")return"failed";if(status==="RUNNING")return"running";return""}
function renderStages(stages){
  document.getElementById("stageList").innerHTML=(stages||[]).map(s=>'<div class="stage '+stageClass(s.status)+'"><i>'+esc(s.stage_no)+'</i><div><b>'+esc(s.stage_name)+'</b><br><small>'+esc(s.status==="SKIPPED"?"SKIPPED / DISABLED":s.status)+'</small></div><span>'+esc(s.status==="COMPLETE"?"✓":s.status==="PARTIAL"?"~":s.status==="SKIPPED"?"–":s.status==="FAILED"?"!":s.status==="RUNNING"?"●":"○")+'</span></div>').join("");
}
function startPolling(){
  clearInterval(S.poll);
  const poll=async()=>{
    try{
      const j=await api("/api/research-status?job_id="+encodeURIComponent(S.currentJob));renderStages(j.stages);
      const finished=(j.stages||[]).filter(s=>["COMPLETE","PARTIAL","NO RELIABLE DATA","FAILED","SKIPPED"].includes(s.status)).length;
      document.getElementById("progressBar").style.width=Math.round(finished/24*100)+"%";document.getElementById("progressCount").textContent=finished+" / 24";document.getElementById("jobState").textContent=j.job.status;
      const er=document.getElementById("jobError");er.hidden=!j.job.error_message;er.textContent=j.job.error_message||"";
      if(["COMPLETE","FAILED","PARTIAL"].includes(j.job.status)){
        clearInterval(S.poll);S.currentCompany=j.job.company_id;S.currentReport=j.job.report_id||null;document.getElementById("openProfileBtn").disabled=!j.job.report_id;
        const al=S.settings.alerts||{};if(j.job.status==="COMPLETE"&&al.research_completed!==false)toast("Research completed.");else if(j.job.status==="FAILED"&&al.research_failed!==false)toast("Research failed. See the status message.");else if(j.job.status==="PARTIAL"&&al.partial_evidence!==false)toast("Research completed only partially.");
        await Promise.allSettled([loadCompanies(),loadReports(),loadUsage()]);
      }
    }catch(e){toast(e.message)}
  };
  poll();S.poll=setInterval(poll,2500);
}
async function openCompany(id){
  try{const rs=await api("/api/reports?company_id="+encodeURIComponent(id));if(!rs.reports?.length)return toast("No report exists for this company yet.");openReport(rs.reports[0].id)}catch(e){toast(e.message)}
}
async function openReport(id){
  try{
    const j=await api("/api/reports?id="+encodeURIComponent(id));S.currentReport=id;S.currentCompany=j.report.company_id;S.currentReportData=j.report;S.currentEvidence=j.evidence||[];S.currentSources=j.sources||[];
    const c=j.company||S.companies.find(x=>x.id===j.report.company_id)||{legal_name:"Company"};
    document.getElementById("profileName").textContent=c.legal_name;document.getElementById("profileMeta").innerHTML='Version '+esc(j.report.version_no)+' • Evidence coverage '+esc(j.report.evidence_coverage??"—")+'% • '+esc(j.report.source_count??0)+' sources • '+esc(fmtShort(j.report.created_at))+' &nbsp; <a href="/api/report-export?report_id='+j.report.id+'&type=pdf">PDF</a> · <a href="/api/report-export?report_id='+j.report.id+'&type=docx">DOCX</a> · <a href="/api/report-export?report_id='+j.report.id+'&type=xlsx">XLSX</a>';
    await renderReport(j.report.report_json||{},j.evidence||[],j.sources||[],c,j.report);
    show("profile");
  }catch(e){toast(e.message)}
}
function evidenceMap(evidence){return Object.fromEntries((evidence||[]).filter(x=>x.finding_key).map(x=>[x.finding_key,x]))}
function valueAt(obj,path){return path.split(".").reduce((a,k)=>a?.[k],obj)}
function displayVal(v){if(v===null||v===undefined||v==="")return"UNKNOWN";if(typeof v==="number")return Number.isInteger(v)?String(v):v.toFixed(2);if(Array.isArray(v))return v.map(x=>isObj(x)?(x.name||x.material||x.legal_name||x.counterparty||JSON.stringify(x)):x).join(", ")||"UNKNOWN";if(isObj(v))return v.value??v.amount??v.name??v.summary??"See detail";return String(v)}
function metricHtml(label,value,key,eMap,period=""){
  const ev=eMap[key];const cls=ev?.evidence_class||"UNKNOWN",conf=ev?.confidence||"INSUFFICIENT";
  return '<div class="metric" data-evidence-key="'+esc(key)+'"><label>'+esc(label)+'</label><strong>'+esc(displayVal(value))+'</strong><div class="sub">'+esc(period||ev?.period||"")+(period||ev?.period?" • ":"")+esc(cls)+' • '+esc(conf)+'</div></div>';
}
function latestPeriod(periods){return Array.isArray(periods)&&periods.length?periods[periods.length-1]:{}}
function latestMetric(r,key){const p=latestPeriod(r.financials?.periods||[]);const aliases={revenue:["revenue","turnover","sales"],ebitda:["ebitda"],pat:["pat","net_profit","profit_after_tax"],operating_cash_flow:["operating_cash_flow","ocf","cash_from_operations"],net_worth:["net_worth","networth"],debt:["debt","total_debt","borrowings"],working_capital:["working_capital"],receivable_days:["receivable_days","debtor_days"],creditor_days:["creditor_days","payable_days"]};for(const a of aliases[key]||[key])if(p?.[a]!=null)return p[a];return null}
function periodLabel(p){return p?.period||p?.fy||p?.year||p?.period_label||""}
async function renderReport(r,evidence,sources,company,report){
  const em=evidenceMap(evidence),periods=r.financials?.periods||[],lp=latestPeriod(periods),risk=(r.risks||[])[0],gap=(r.information_gaps||[])[0];
  const identity=r.identity||{};
  const boxes=[
    {title:"Company Identity",class:"identity",items:[
      ["Legal name",identity.legal_name||company.legal_name,"company.identity.legal_name"],
      ["Registration",identity.registration_id||identity.cin||"UNKNOWN","company.identity.registration_id"],
      ["Tax ID",identity.tax_id||identity.gstin||"UNKNOWN","company.identity.tax_id"],
      ["Country",identity.country||company.country||"UNKNOWN","company.identity.country"],
      ["Website",identity.website||company.website||"UNKNOWN","company.identity.website"]
    ]},
    {title:"Revenue",items:[["Latest",latestMetric(r,"revenue"),"financial.revenue.latest",periodLabel(lp)]]},
    {title:"PAT",items:[["Latest",latestMetric(r,"pat"),"financial.pat.latest",periodLabel(lp)]]},
    {title:"Net Worth",items:[["Latest",latestMetric(r,"net_worth"),"financial.net_worth.latest",periodLabel(lp)]]},
    {title:"Debt",items:[["Current / latest",r.debt?.summary||latestMetric(r,"debt"),"debt.current",periodLabel(lp)]]},
    {title:"Business / Main Products",class:"wide",items:[["Business",r.business?.summary||"UNKNOWN","business.summary"],["Products",r.business?.products||[],"business.products"]]},
    {title:"Plants / Capacity",items:[["Facilities",(r.operations?.facilities||[]).length||"UNKNOWN","operations.facilities"],["Capacity",r.operations?.capacity||"UNKNOWN","operations.capacity"]]},
    {title:"Credit / Payment Safety",items:[["Status",em["risk.credit_safety"]?.value_json||risk?.finding||"CREDIT SAFETY NOT SUFFICIENTLY VERIFIED","risk.credit_safety"]]},
    {title:"Legal / Insolvency",items:[["Legal findings",(r.legal||[]).length,"legal.material_cases"],["Insolvency findings",(r.insolvency||[]).length,"legal.insolvency"]]},
    {title:"Trade / Counterparty Signals",items:[["Trade coverage",r.trade?.coverage||"UNKNOWN","trade.coverage"],["Known buyers",(r.buyers||[]).length,"trade.top_buyers"],["Known suppliers",(r.suppliers||[]).length,"trade.top_suppliers"]]},
    {title:"Procurement Opportunity",items:[["Primary inputs",r.procurement||"UNKNOWN","procurement.primary_inputs"]]},
    {title:"Biggest Concern",items:[["Concern",em["risk.biggest_concern"]?.value_json||risk?.finding||gap?.item||gap?.label||gap||"UNKNOWN","risk.biggest_concern"]]}
  ];
  document.getElementById("overviewGrid").innerHTML=boxes.map(b=>'<div class="panel ibox '+(b.class||"")+'"><h4>'+esc(b.title)+'</h4>'+b.items.map(x=>metricHtml(x[0],x[1],x[2],em,x[3])).join("")+'</div>').join("");
  bindEvidence();
  renderFinancials(r,em);renderDirectors(r);renderOperations(r);renderCredit(r,em);renderRatings(r);renderTrade(r);renderLegal(r);renderCompetitors(r);renderProcurement(r);
  renderSources(sources);await renderDocuments(company.id);await renderHistory(company.id,report);
  renderGaps(r.information_gaps||[]);
}
function bindEvidence(){
  document.querySelectorAll("[data-evidence-key]").forEach(el=>el.onclick=()=>openEvidence(el.dataset.evidenceKey));
}
function openEvidence(key){
  const ev=evidenceMap(S.currentEvidence)[key];const src=(ev?.source_keys||[]).map(id=>S.currentSources.find(s=>s.id===id)).filter(Boolean);
  document.getElementById("drawerTitle").textContent=ev?.label||key||"Finding";
  document.getElementById("drawerBody").innerHTML='<div class="status">'+[
    ["Finding key",key],["Value",displayVal(ev?.value_json)],["Period",ev?.period||"—"],["Evidence Class",ev?.evidence_class||"UNKNOWN"],["Confidence",ev?.confidence||"INSUFFICIENT"],["Freshness",ev?.period||"Not dated"],["Conflict",ev?.conflict_status||"NONE"]
  ].map(x=>'<div class="statusline"><span>'+esc(x[0])+'</span><b>'+esc(x[1])+'</b></div>').join("")+'</div><h4 style="margin-top:18px">Sources</h4>'+(src.map(s=>'<div class="source"><b>'+esc(s.title||s.url)+'</b><p>'+esc(s.publisher||"")+" • Retrieved "+esc(fmtShort(s.retrieved_at))+'</p><a href="'+esc(s.url)+'" target="_blank" rel="noopener">Open source</a></div>').join("")||'<div class="notice">No exact linked source is stored for this finding.</div>');
  document.getElementById("drawer").classList.add("open");
}
function normalizeNumber(v){if(typeof v==="number")return v;if(typeof v==="string"){const n=Number(v.replace(/[,₹$€£%]/g,"").replace(/\s*(cr|crore|mn|million|bn|billion).*$/i,""));return Number.isFinite(n)?n:null}return null}
function lineChart(periods,key,title){
  const vals=periods.map(p=>({label:periodLabel(p),value:normalizeNumber(p[key])})).filter(x=>x.value!=null);
  if(vals.length<2)return '<div class="panel chart"><h4>'+esc(title)+'</h4><div class="empty">Insufficient Verified Data</div></div>';
  const w=520,h=150,pad=22,min=Math.min(...vals.map(x=>x.value)),max=Math.max(...vals.map(x=>x.value)),span=max-min||1;
  const pts=vals.map((x,i)=>({x:pad+i*((w-pad*2)/(vals.length-1)),y:h-pad-(x.value-min)/span*(h-pad*2),...x}));
  return '<div class="panel chart"><h4>'+esc(title)+'</h4><svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+esc(title)+'"><path d="'+pts.map((p,i)=>(i?"L":"M")+p.x.toFixed(1)+" "+p.y.toFixed(1)).join(" ")+'" fill="none" stroke="currentColor" stroke-width="2"/>'+pts.map(p=>'<circle cx="'+p.x+'" cy="'+p.y+'" r="3" fill="currentColor"><title>'+esc(p.label+": "+p.value)+'</title></circle>').join("")+'<line x1="'+pad+'" x2="'+(w-pad)+'" y1="'+(h-pad)+'" y2="'+(h-pad)+'" stroke="#d8d1c7"/>'+pts.map(p=>'<text x="'+p.x+'" y="'+(h-5)+'" text-anchor="middle" font-size="9" fill="#7a8491">'+esc(p.label)+'</text>').join("")+'</svg></div>';
}
function renderFinancials(r,em){
  const periods=r.financials?.periods||[],lp=latestPeriod(periods);
  const kpis=[["Revenue",latestMetric(r,"revenue"),"financial.revenue.latest"],["EBITDA",latestMetric(r,"ebitda"),"financial.ebitda.latest"],["PAT",latestMetric(r,"pat"),"financial.pat.latest"],["Operating Cash",latestMetric(r,"operating_cash_flow"),"financial.operating_cash_flow.latest"],["Net Worth",latestMetric(r,"net_worth"),"financial.net_worth.latest"]];
  const heads=["Period","Revenue","EBITDA","PAT","Operating Cash Flow","Net Worth","Debt","Working Capital","Receivable Days","Creditor Days"];
  const alias=(p,k)=>{const maps={revenue:["revenue","turnover","sales"],ebitda:["ebitda"],pat:["pat","net_profit","profit_after_tax"],ocf:["operating_cash_flow","ocf","cash_from_operations"],networth:["net_worth","networth"],debt:["debt","total_debt","borrowings"],wc:["working_capital"],rd:["receivable_days","debtor_days"],cd:["creditor_days","payable_days"]};for(const a of maps[k])if(p?.[a]!=null)return p[a];return"—"};
  const rows=periods.map(p=>[periodLabel(p),alias(p,"revenue"),alias(p,"ebitda"),alias(p,"pat"),alias(p,"ocf"),alias(p,"networth"),alias(p,"debt"),alias(p,"wc"),alias(p,"rd"),alias(p,"cd")]);
  const findKey=(names)=>names.find(n=>periods.some(p=>p?.[n]!=null))||names[0];
  document.getElementById("financialContent").innerHTML=
    '<div class="financekpi">'+kpis.map(x=>'<div class="panel mini" data-evidence-key="'+x[2]+'"><span>'+esc(x[0])+'</span><b>'+esc(displayVal(x[1]))+'</b><small>'+esc(periodLabel(lp)||"Latest verified period")+'</small></div>').join("")+'</div>'+
    '<div class="charts">'+lineChart(periods,findKey(["revenue","turnover","sales"]),"Revenue Trend")+lineChart(periods,findKey(["pat","net_profit","profit_after_tax"]),"Profit Trend")+lineChart(periods,findKey(["operating_cash_flow","ocf","cash_from_operations"]),"Operating Cash Flow")+lineChart(periods,findKey(["working_capital"]),"Working Capital")+'</div>'+
    '<div class="panel card"><h3>Five-year financial table</h3>'+renderTable(heads,rows)+'</div>';
  bindEvidence();
}
function renderTable(heads,rows){
  return '<div class="tablewrap"><table><thead><tr>'+heads.map(h=>'<th>'+esc(h)+'</th>').join("")+'</tr></thead><tbody>'+((rows||[]).map(r=>'<tr>'+r.map(v=>'<td>'+esc(displayVal(v))+'</td>').join("")+'</tr>').join("")||'<tr><td colspan="'+heads.length+'">No verified data available.</td></tr>')+'</tbody></table></div>';
}
function arrRows(arr,fields){
  return (Array.isArray(arr)?arr:[]).map(x=>fields.map(f=>displayVal(isObj(x)?x[f.key]:x)));
}
function renderDirectors(r){
  const directors=r.directors||[],owners=r.ownership||[];
  document.getElementById("directorsContent").innerHTML='<div class="sectiongrid"><div class="panel card"><h3>Directors / promoters</h3>'+renderTable(["Name","Role","Identifier","Appointed"],arrRows(directors,[{key:"name"},{key:"role"},{key:"identifier"},{key:"appointed_at"}]))+'</div><div class="panel card"><h3>Ownership</h3>'+renderTable(["Owner","Ownership %","Evidence"],arrRows(owners,[{key:"owner_name"},{key:"ownership_percent"},{key:"evidence_class"}]))+'</div></div>';
}
function renderOperations(r){
  const o=r.operations||{};
  document.getElementById("operationsContent").innerHTML='<div class="sectiongrid"><div class="panel card"><h3>Facilities</h3>'+renderTable(["Facility","Type","Address","Capacity"],arrRows(o.facilities||[],[{key:"name"},{key:"facility_type"},{key:"address"},{key:"installed_capacity"}]))+'</div><div class="panel card"><h3>Machinery / capacity</h3>'+renderList([...(o.capacity||[]),...(o.machinery||[])],"No verified machinery or capacity data.")+'</div></div>';
}
function renderCredit(r,em){
  const borrowings=r.debt?.borrowings||[],charges=r.charges||[],risks=r.risks||[];
  document.getElementById("creditContent").innerHTML='<div class="panel card" style="margin-bottom:9px"><h3>Payment & credit safety</h3><div class="notice '+(em["risk.credit_safety"]?.evidence_class==="VERIFIED"?"info":"error")+'">'+esc(displayVal(em["risk.credit_safety"]?.value_json||"CREDIT SAFETY NOT SUFFICIENTLY VERIFIED"))+'</div></div><div class="sectiongrid"><div class="panel card"><h3>Borrowings</h3>'+renderTable(["Lender","Type","Amount","As of","Evidence"],arrRows(borrowings,[{key:"lender"},{key:"borrowing_type"},{key:"amount"},{key:"as_of_date"},{key:"evidence_class"}]))+'</div><div class="panel card"><h3>Charges / lenders</h3>'+renderTable(["Lender","Charge amount","Status","Created","Satisfied"],arrRows(charges,[{key:"lender"},{key:"charge_amount"},{key:"status"},{key:"created_date"},{key:"satisfied_date"}]))+'</div></div><div class="panel card" style="margin-top:9px"><h3>Risk findings</h3>'+renderList(risks,"No material risk findings stored.")+'</div>';
}
function renderRatings(r){document.getElementById("ratingsContent").innerHTML='<div class="panel card"><h3>Credit ratings</h3>'+renderTable(["Agency","Date","Facility","Amount","Rating","Outlook","Rationale"],arrRows(r.credit_ratings||[],[{key:"agency"},{key:"rating_date"},{key:"facility"},{key:"facility_amount"},{key:"rating"},{key:"outlook"},{key:"rationale"}]))+'</div>'}
function renderTrade(r){
  const t=r.trade||{};
  document.getElementById("tradeContent").innerHTML='<div class="sectiongrid"><div class="panel card"><h3>Import activity</h3>'+renderList(t.imports||[],"No reliable import activity found.")+'</div><div class="panel card"><h3>Export activity</h3>'+renderList(t.exports||[],"No reliable export activity found.")+'</div><div class="panel card"><h3>Known buyers</h3>'+renderList(r.buyers||[],"No reliable buyers identified.")+'</div><div class="panel card"><h3>Known suppliers</h3>'+renderList(r.suppliers||[],"No reliable suppliers identified.")+'</div></div>';
}
function renderLegal(r){document.getElementById("legalContent").innerHTML='<div class="sectiongrid"><div class="panel card"><h3>Legal matters</h3>'+renderList(r.legal||[],"No reliable legal findings found.")+'</div><div class="panel card"><h3>Insolvency / defaults</h3>'+renderList(r.insolvency||[],"No reliable insolvency findings found. Absence of results is not proof of absence.")+'</div></div>'}
function renderCompetitors(r){document.getElementById("competitorsContent").innerHTML='<div class="panel card"><h3>Competitors</h3>'+renderList(r.competitors||[],"No reliable competitor list available.")+'</div>'}
function renderProcurement(r){document.getElementById("procurementContent").innerHTML='<div class="sectiongrid"><div class="panel card"><h3>Procurement requirements</h3>'+renderList(r.procurement||[],"No reliable procurement requirement identified.")+'</div><div class="panel card"><h3>Commercial opportunity</h3>'+renderList(r.opportunities||[],"No evidence-supported opportunity stored.")+'</div></div>'}
function renderList(arr,empty){
  if(!Array.isArray(arr)||!arr.length)return '<div class="empty">'+esc(empty)+'</div>';
  return '<div class="list">'+arr.map(x=>{if(!isObj(x))return'<div class="listitem"><b>'+esc(x)+'</b></div>';const title=x.name||x.material||x.finding||x.summary||x.counterparty||x.agency||x.opportunity_type||x.category||"Finding";const rest=Object.entries(x).filter(([k])=>!["name","material","finding","summary","counterparty","agency","opportunity_type","category","source_keys"].includes(k)).slice(0,5).map(([k,v])=>k.replaceAll("_"," ")+": "+displayVal(v)).join(" • ");return'<div class="listitem"><b>'+esc(title)+'</b><p>'+esc(rest)+'</p></div>'}).join("")+'</div>';
}
function renderSources(sources){document.getElementById("sourceContent").innerHTML='<div class="panel card"><h3>Source register</h3>'+(sources.map(s=>'<div class="source"><b>'+esc(s.title||s.url)+'</b><p>'+esc(s.publisher||"")+" • Retrieved "+esc(fmtShort(s.retrieved_at))+'</p><a href="'+esc(s.url)+'" target="_blank" rel="noopener">Open source</a></div>').join("")||'<div class="empty">No sources stored.</div>')+'</div>'}
async function renderDocuments(companyId){
  try{const j=await api("/api/documents?company_id="+encodeURIComponent(companyId));document.getElementById("documentsContent").innerHTML='<div class="panel card"><h3>Supporting documents</h3>'+renderTable(["File","Type","Size","Classification","External AI","Uploaded"],(j.documents||[]).map(d=>[d.filename,d.mime_type,(Number(d.size_bytes||0)/1024/1024).toFixed(2)+" MB",d.public_private,d.external_ai_allowed?"Allowed":"No",fmtShort(d.created_at)]))+'</div>'}catch(e){document.getElementById("documentsContent").innerHTML='<div class="notice error">'+esc(e.message)+'</div>'}
}
function renderGaps(gaps){
  document.getElementById("infoGaps").innerHTML='<div class="panel card"><h3>Information still needed</h3>'+(Array.isArray(gaps)&&gaps.length?renderList(gaps,""):'<div class="empty">No explicit information gaps were stored.</div>')+'<div style="margin-top:10px"><button class="btn" id="gapUpload">Upload Document</button> <button class="btn" id="gapRerun">Re-run Research</button></div></div>';
  document.getElementById("gapUpload").onclick=()=>{prefillResearch(S.currentCompany);document.getElementById("fileInput").focus()};
  document.getElementById("gapRerun").onclick=()=>prefillResearch(S.currentCompany);
}
async function renderHistory(companyId,current){
  try{
    const j=await api("/api/reports?company_id="+encodeURIComponent(companyId)),list=j.reports||[];
    let changed="";
    if(list.length>=2){const changes=diffReports(list[0].report_json||{},list[1].report_json||{});changed='<div class="panel card" style="margin-bottom:9px"><h3>What changed since last research?</h3>'+(changes.length?'<div class="list">'+changes.map(x=>'<div class="listitem"><b>'+esc(x.label)+'</b><p>'+esc(x.before)+' → '+esc(x.after)+'</p></div>').join("")+'</div>':'<div class="empty">No clear evidence-supported changes identified in comparable fields.</div>')+'</div>'}
    document.getElementById("historyContent").innerHTML=changed+'<div class="panel card"><h3>Research history</h3>'+list.map(x=>'<div class="listitem" style="margin-bottom:7px"><b>V'+esc(x.version_no)+' • '+esc(fmtShort(x.created_at))+'</b><p>'+esc(x.evidence_coverage??"—")+'% evidence coverage • '+esc(x.source_count??0)+' sources</p><button class="btn" data-history-open="'+x.id+'">Open V'+esc(x.version_no)+'</button></div>').join("")+'</div>';
    document.querySelectorAll("[data-history-open]").forEach(b=>b.onclick=()=>openReport(b.dataset.historyOpen));
  }catch(e){document.getElementById("historyContent").innerHTML='<div class="notice error">'+esc(e.message)+'</div>'}
}
function diffReports(a,b){
  const defs=[
    ["Revenue","financials.periods",x=>latestMetric({financials:x},"revenue")],["Debt","debt.summary",x=>x],["Credit Rating","credit_ratings",x=>displayVal(Array.isArray(x)?x.at(-1)?.rating:x)],
    ["Directors","directors",x=>displayVal(Array.isArray(x)?x.map(v=>v.name||v):x)],["Ownership","ownership",x=>displayVal(x)],["Operations","operations.capacity",x=>displayVal(x)],
    ["Legal","legal",x=>String(Array.isArray(x)?x.length:displayVal(x))],["Trade","trade.coverage",x=>displayVal(x)],["Buyers","buyers",x=>String(Array.isArray(x)?x.length:0)],["Suppliers","suppliers",x=>String(Array.isArray(x)?x.length:0)],["Procurement","procurement",x=>displayVal(x)],["Information Gaps","information_gaps",x=>displayVal(x)]
  ];
  const out=[];for(const [label,path,fn] of defs){const av=fn(valueAt(a,path)),bv=fn(valueAt(b,path));if(av&&bv&&av!=="UNKNOWN"&&bv!=="UNKNOWN"&&String(av)!==String(bv))out.push({label,before:bv,after:av})}return out.slice(0,12);
}
function prefillResearch(companyId){
  const c=S.companies.find(x=>x.id===companyId);if(c){document.getElementById("seed").value=c.website||c.legal_name;S.entity={legal_name:c.legal_name,brand:c.brand,country:c.country,state_region:c.state_region,website:c.website};S.currentCompany=c.id}show("new");
}

function renderCompareOptions(){
  const sel=document.getElementById("compareCompanySelect");sel.innerHTML='<option value="">Choose a company…</option>'+S.companies.map(c=>'<option value="'+c.id+'">'+esc(c.legal_name)+'</option>').join("");renderCompareChips();
}
function renderCompareChips(){
  document.getElementById("compareChips").innerHTML=S.compareIds.map(id=>{const c=S.companies.find(x=>x.id===id);return'<span class="chip">'+esc(c?.legal_name||"Company")+' <button aria-label="Remove" data-remove-compare="'+id+'">×</button></span>'}).join("");
  document.getElementById("compareBtn").disabled=S.compareIds.length<2;
  document.querySelectorAll("[data-remove-compare]").forEach(b=>b.onclick=()=>{S.compareIds=S.compareIds.filter(x=>x!==b.dataset.removeCompare);renderCompareChips()});
}
async function runCompare(){
  try{
    const j=await api("/api/compare-companies?ids="+encodeURIComponent(S.compareIds.join(",")));
    const metrics=["identity","financials","debt","credit_ratings","operations","legal","procurement"];
    document.getElementById("compareOut").innerHTML='<div class="tablewrap"><table><thead><tr><th>Area</th>'+j.companies.map(x=>'<th>'+esc(x.company.legal_name)+'</th>').join("")+'</tr></thead><tbody>'+metrics.map(m=>'<tr><td><b>'+esc(m.replaceAll("_"," "))+'</b></td>'+j.companies.map(x=>'<td>'+esc(compactMetric(x.metrics?.[m]))+'</td>').join("")+'</tr>').join("")+'</tbody></table></div><div class="notice" style="margin-top:10px">'+esc(j.note||"")+'</div>';
  }catch(e){toast(e.message)}
}
function compactMetric(v){if(v==null)return"UNKNOWN";if(typeof v==="string")return v;if(Array.isArray(v))return v.length+" recorded item(s)";if(isObj(v)){if(v.summary)return displayVal(v.summary);const ks=Object.keys(v);return ks.length?ks.slice(0,4).map(k=>k.replaceAll("_"," ")+": "+displayVal(v[k])).join(" • "):"UNKNOWN"}return displayVal(v)}

async function loadAdminState(){
  try{S.admin=await api("/api/settings-auth");renderSettingsLock();if(S.admin.authorized)await Promise.allSettled([loadConnections(),loadSettings()]);else renderLockedSettings()}catch(e){S.admin={configured:false,authorized:false};renderSettingsLock();renderLockedSettings()}
}
function renderSettingsLock(){
  const b=document.getElementById("settingsLockBanner");
  if(!S.admin.configured){b.className="notice error";b.innerHTML='<b>Admin Settings Lock is not configured.</b><br>Add <code>SETTINGS_ADMIN_SECRET</code> to the Netlify environment before provider credentials or paid-usage settings can be changed.';return}
  if(!S.admin.authorized){b.className="notice info";b.innerHTML='<b>Private settings are locked.</b> <button class="btn" id="unlockSettings" style="margin-left:8px">Unlock Admin Settings</button>';document.getElementById("unlockSettings").onclick=()=>document.getElementById("adminModal").classList.add("open");return}
  b.className="notice success";b.innerHTML='<b>Admin settings unlocked for this browser session.</b> <button class="btn" id="lockSettings" style="margin-left:8px">Lock</button>';document.getElementById("lockSettings").onclick=async()=>{await api("/api/settings-auth",{method:"DELETE"});S.admin.authorized=false;renderSettingsLock();renderLockedSettings()};
}
function renderLockedSettings(){
  ["researchProviderCards","searchProviderCards","apiConnectionRows","aiStrategyForm","researchDefaultsForm","costProtectionForm","alertsForm","privacyForm","reportDefaultsForm"].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML='<div class="notice">Unlock Admin Settings to view or change private connection and policy settings.</div>'});
  renderSystemConnections();
}
async function loadConnections(){try{const j=await api("/api/provider-connections");S.connections=j.connections||[];S.providerMeta=j.metadata||S.providerMeta;renderProviderSettings()}catch(e){toast(e.message)}}
async function loadSettings(){try{const j=await api("/api/settings");S.settings=j.settings||{};renderSettingForms()}catch(e){toast(e.message)}}
function con(provider){return S.connections.find(x=>x.provider===provider)||null}
function providerCard(provider){
  const m=S.providerMeta?.[provider]||{},c=con(provider),connected=Boolean(c?.status==="CONNECTED"||S.providers?.[provider]?.connected),health=c?.health||(connected?"CONNECTED":"NOT CONNECTED");
  const model=c?.selected_model||m.model||m.display_model||"—";
  const pricing=provider==="gemini"?"Free tier input/output: Free. Paid reference: $0.30 input / $2.50 output per 1M tokens.":provider==="tavily"?"1,000 free API credits/month. PAYG reference: $0.008/credit.":provider==="openai"?"Paid API. GPT-5.6 Luna from $0.20 input / $1.20 output per 1M tokens.":"";
  return '<div class="panel provider"><div class="providerhead"><div><div class="eyebrow">'+esc(m.badge||"PROVIDER")+'</div><h3>'+esc(m.provider||provider)+'</h3><div style="font-size:11px;font-weight:800">'+esc(model)+'</div></div><button class="btn infoBtn" data-provider-info="'+provider+'" aria-label="Provider information">ⓘ</button></div><p>'+esc(m.description||"")+'</p><div class="status"><div class="statusline"><span>Status</span><b>'+tag(health,statusKind(health))+'</b></div><div class="statusline"><span>Role</span><b>'+esc(m.role||"—")+'</b></div><div class="statusline"><span>Pricing checked</span><b>'+esc(m.last_verified_date||"—")+'</b></div><div class="statusline"><span>Usage / reset</span><b>'+esc(m.reset_rule||"—")+'</b></div></div><p>'+esc(pricing)+'</p><div class="provideractions">'+(connected?'<button class="btn" data-provider-test="'+provider+'">Test Connection</button><button class="btn" data-provider-connect="'+provider+'">Reconnect</button><button class="btn danger" data-provider-disconnect="'+provider+'">Disconnect</button>':'<button class="btn primary" data-provider-connect="'+provider+'">Connect</button>')+'</div></div>';
}
function renderProviderSettings(){
  document.getElementById("researchProviderCards").innerHTML=providerCard("gemini")+providerCard("openai");
  const g=S.providerMeta?.gemini||{},t=S.providerMeta?.tavily||{};
  document.getElementById("searchProviderCards").innerHTML='<div class="panel provider"><div class="providerhead"><div><div class="eyebrow">PRIMARY LIVE SEARCH</div><h3>Google Search Grounding</h3><div style="font-size:11px;font-weight:800">Uses Gemini connection</div></div><button class="btn infoBtn" data-provider-info="gemini">ⓘ</button></div><p>You do not need another Google Search API key. Google Search grounding is used through the Gemini API.</p><div class="statusline"><span>Status</span><b>'+tag(S.providers?.google_search_grounding?.available?"Available":"Unavailable",S.providers?.google_search_grounding?.available?"ok":"neutral")+'</b></div></div>'+providerCard("tavily");
  document.getElementById("apiConnectionRows").innerHTML=["gemini","tavily","openai"].map(p=>{const c=con(p),m=S.providerMeta?.[p]||{};return'<div class="statusline"><span><b>'+esc(m.provider||p)+'</b><br><small>'+esc(c?.selected_model||m.model||"")+'</small></span><b>'+(c?tag(c.status,statusKind(c.status))+" ••••"+esc(c.masked_suffix||"")+" • "+esc(c.last_latency_ms?c.last_latency_ms+" ms":"not tested"):"Not connected")+'</b></div>'}).join("");
  bindProviderActions();
}
function bindProviderActions(){
  document.querySelectorAll("[data-provider-connect]").forEach(b=>b.onclick=()=>openConnect(b.dataset.providerConnect));
  document.querySelectorAll("[data-provider-test]").forEach(b=>b.onclick=()=>testProvider(b.dataset.providerTest));
  document.querySelectorAll("[data-provider-disconnect]").forEach(b=>b.onclick=()=>disconnectProvider(b.dataset.providerDisconnect));
  document.querySelectorAll("[data-provider-info]").forEach(b=>b.onclick=()=>providerInfo(b.dataset.providerInfo));
}
function providerInfo(provider){
  const m=S.providerMeta?.[provider]||{};document.getElementById("drawerTitle").textContent=m.provider||provider;
  const extra=provider==="gemini"?["Company research","Web-grounded analysis","Financial interpretation","Source comparison","Structured report creation","Procurement and competitor analysis","Risk analysis","Management summary"]:provider==="tavily"?["Independent search","Additional sources","Deeper source discovery","Web content extraction","Fresh public information","Fallback when Google evidence is weak"]:["Optional second AI","Strong reasoning","Independent analysis","Web search","Difficult multi-step research","File analysis","Structured reports","Second opinion"];
  document.getElementById("drawerBody").innerHTML='<p>'+esc(m.description||"")+'</p><div class="status">'+[
    ["Model",m.display_model||m.model||"—"],["Role",m.role||"—"],["Allowance",m.allowance||"—"],["Reset rule",m.reset_rule||"—"],["Pricing checked",m.last_verified_date||"—"]
  ].map(x=>'<div class="statusline"><span>'+esc(x[0])+'</span><b>'+esc(x[1])+'</b></div>').join("")+'</div><h4 style="margin-top:16px">What it adds</h4><div class="list">'+extra.map(x=>'<div class="listitem"><b>'+esc(x)+'</b></div>').join("")+'</div>'+(m.privacy?'<h4 style="margin-top:16px">Privacy</h4><div class="notice">'+esc(m.privacy.free)+'<br><br>'+esc(m.privacy.paid)+'</div>':"")+'<h4 style="margin-top:16px">Official references</h4>'+(m.official_reference||[]).map(u=>'<div><a href="'+esc(u)+'" target="_blank" rel="noopener">'+esc(u)+'</a></div>').join("");
  document.getElementById("drawer").classList.add("open");
}
function openConnect(provider){
  const m=S.providerMeta?.[provider]||{},dash=provider==="gemini"?"https://aistudio.google.com/apikey":provider==="tavily"?"https://app.tavily.com/":"https://platform.openai.com/api-keys";
  let modelSelect="";
  if(provider==="openai")modelSelect='<div class="field"><label for="connectModel">Model</label><select id="connectModel" class="select">'+(m.models||[]).map(x=>'<option value="'+x.id+'">'+esc(x.name+" — "+x.note)+'</option>').join("")+'</select></div>';
  document.getElementById("connectTitle").textContent="Connect "+(m.provider||provider);
  document.getElementById("connectBody").innerHTML='<div class="modalsteps"><div class="step"><b>Step 1 — Open provider dashboard</b><p>Sign in on the official provider website and create or select an API credential.</p><a class="btn" href="'+dash+'" target="_blank" rel="noopener">Open Provider Dashboard</a></div><div class="step"><b>Step 2 — Paste the credential once</b><p>It is validated server-side. After validation, VMG stores it in encrypted server-side secret storage and never returns it to browser code.</p><div class="field"><label for="connectSecret">API credential</label><input id="connectSecret" class="input" type="password" autocomplete="off" placeholder="••••••••••••••••"></div>'+modelSelect+'<div class="field" style="margin-top:8px"><label for="connectBilling">Provider account mode</label><select id="connectBilling" class="select"><option value="free">Free / free allowance</option><option value="paid">Paid account</option><option value="unknown">Not sure</option></select></div></div><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn" data-close-connect>Cancel</button><button class="btn primary" id="verifyConnect">Verify & Connect</button></div></div>';
  document.querySelector("[data-close-connect]").onclick=()=>document.getElementById("connectModal").classList.remove("open");
  document.getElementById("verifyConnect").onclick=()=>connectProvider(provider);
  document.getElementById("connectModal").classList.add("open");
}
async function connectProvider(provider){
  const secret=document.getElementById("connectSecret").value.trim(),model=document.getElementById("connectModel")?.value;
  if(!secret)return toast("Paste the API credential.");
  try{
    document.getElementById("verifyConnect").disabled=true;document.getElementById("verifyConnect").textContent="Verifying…";
    const j=await api("/api/provider-connect",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({provider,secret,selected_model:model,billing_mode:document.getElementById("connectBilling").value})});
    document.getElementById("connectModal").classList.remove("open");toast("Connection successful.");await Promise.all([loadStatus(),loadConnections()]);
  }catch(e){toast(e.message)}finally{const b=document.getElementById("verifyConnect");if(b){b.disabled=false;b.textContent="Verify & Connect"}}
}
async function testProvider(provider){try{toast("Testing "+provider+"…");const j=await api("/api/provider-test",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({provider})});toast("PASS • "+j.latency_ms+" ms");await loadConnections()}catch(e){toast("FAIL • "+e.message)}}
async function disconnectProvider(provider){
  if(!confirm("Disconnect "+provider+"? VMG Company Intelligence will no longer use this provider until it is connected again."))return;
  try{const j=await api("/api/provider-disconnect",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({provider})});toast("Provider disconnected.");await Promise.all([loadStatus(),loadConnections()])}catch(e){toast(e.message)}
}
function toggleControl(label,path,value,help=""){
  return '<div class="toggleline"><div><b>'+esc(label)+'</b>'+(help?'<small>'+esc(help)+'</small>':"")+'</div><label class="switch"><input type="checkbox" data-setting-path="'+esc(path)+'" '+(value?"checked":"")+'><span class="slider"></span></label></div>';
}
function selectControl(label,path,value,options,help=""){
  return '<div class="settingrow"><div><b>'+esc(label)+'</b>'+(help?'<small>'+esc(help)+'</small>':"")+'</div><select class="select" data-setting-path="'+esc(path)+'">'+options.map(x=>'<option value="'+esc(x[0])+'" '+(value===x[0]?"selected":"")+'>'+esc(x[1])+'</option>').join("")+'</select></div>';
}
function numberControl(label,path,value,help=""){return '<div class="settingrow"><div><b>'+esc(label)+'</b>'+(help?'<small>'+esc(help)+'</small>':"")+'</div><input class="input" type="number" min="0" step="1" value="'+esc(value??0)+'" data-setting-path="'+esc(path)+'"></div>'}
function getSetting(path,fallback){const v=path.split(".").reduce((a,k)=>a?.[k],S.settings);return v===undefined?fallback:v}
function renderSettingForms(){
  document.getElementById("aiStrategyForm").innerHTML=
    selectControl("AI strategy","ai_strategy",getSetting("ai_strategy","free_first"),[["free_first","Free First"],["best_available","Best Available"],["gemini_only","Gemini Only"],["openai_only","OpenAI Only"],["custom","Custom"]],"Free First never silently switches to a paid provider.")+
    selectControl("Primary AI","primary_ai",getSetting("primary_ai","gemini"),[["gemini","Gemini"],["openai","OpenAI"]])+
    selectControl("Primary search","primary_search",getSetting("primary_search","google_grounding"),[["google_grounding","Google Search Grounding"],["openai_web","OpenAI Web Search"]])+
    selectControl("Fallback search","fallback_search",getSetting("fallback_search","tavily"),[["tavily","Tavily"],["none","None"]])+
    selectControl("Second opinion","second_opinion",getSetting("second_opinion","none"),[["none","None"],["openai","OpenAI"]])+
    selectControl("OpenAI model","openai_model",getSetting("openai_model","gpt-5.6-luna"),(S.providerMeta.openai?.models||[]).map(x=>[x.id,x.name]));
  const rd="research_defaults.";
  document.getElementById("researchDefaultsForm").innerHTML=
    selectControl("Default mode",rd+"default_mode",getSetting(rd+"default_mode","deep"),[["quick","Quick Check"],["standard","Standard Research"],["deep","Deep Research"]])+
    selectControl("Default template",rd+"default_template",getSetting(rd+"default_template","vmg_full_due_diligence"),templateArray().map(x=>[x[0],x[1]]))+
    numberControl("Minimum preferred credible sources",rd+"minimum_preferred_sources",getSetting(rd+"minimum_preferred_sources",5))+
    [["Research negative signals","negative_signals"],["Search directors/promoters","directors_promoters"],["Search credit ratings","credit_ratings"],["Search debt/charges","debt_charges"],["Search litigation / insolvency","litigation_insolvency"],["Search imports/exports","imports_exports"],["Search buyers/suppliers","buyers_suppliers"],["Search competitors","competitors"],["Search procurement","procurement"],["Follow related entities when relevant","follow_related_entities"],["Use Tavily when evidence is weak","tavily_when_weak"],["Automatically use paid provider","automatically_use_paid_provider"]].map(x=>toggleControl(x[0],rd+x[1],getSetting(rd+x[1],x[1]!=="automatically_use_paid_provider"))).join("");
  const cp="cost_protection.";
  document.getElementById("costProtectionForm").innerHTML=
    toggleControl("Free-only mode",cp+"free_only_mode",getSetting(cp+"free_only_mode",true),"Stops rather than silently creating paid API usage.")+
    toggleControl("Allow paid API usage",cp+"allow_paid_api_usage",getSetting(cp+"allow_paid_api_usage",false))+
    toggleControl("Auto-switch to paid provider",cp+"auto_switch_paid_provider",getSetting(cp+"auto_switch_paid_provider",false))+
    numberControl("Maximum cost / report (₹)",cp+"max_cost_per_report_inr",getSetting(cp+"max_cost_per_report_inr",0))+
    numberControl("Daily API budget (₹)",cp+"daily_budget_inr",getSetting(cp+"daily_budget_inr",0))+
    numberControl("Weekly API budget (₹)",cp+"weekly_budget_inr",getSetting(cp+"weekly_budget_inr",0))+
    numberControl("Monthly API budget (₹)",cp+"monthly_budget_inr",getSetting(cp+"monthly_budget_inr",0));
  const al="alerts.";
  document.getElementById("alertsForm").innerHTML=[["Warn at 70% usage","warn_70",false],["Warn at 80% usage","warn_80",true],["Warn at 90% usage","warn_90",true],["Free quota nearly exhausted","quota_low",true],["Free quota exhausted","quota_exhausted",true],["Provider disconnected","provider_disconnected",true],["Provider authentication error","auth_error",true],["Research completed","research_completed",true],["Research failed","research_failed",true],["Partial evidence","partial_evidence",true],["Paid spend reaches budget","budget_threshold",true]].map(x=>toggleControl(x[0],al+x[1],getSetting(al+x[1],x[2]))).join("");
  const pr="privacy.";
  document.getElementById("privacyForm").innerHTML=[["Store source snapshots","store_source_snapshots",true],["Store research history","store_research_history",true],["Preserve report versions","preserve_report_versions",true],["Allow AI to process PUBLIC research documents","public_document_ai",true],["Send PRIVATE uploaded files to external AI","private_document_ai",false]].map(x=>toggleControl(x[0],pr+x[1],getSetting(pr+x[1],x[2]),x[1]==="private_document_ai"?"Default OFF. Enabling this sends private documents to configured external AI providers.":"")).join("");
  const rp="report_defaults.";
  document.getElementById("reportDefaultsForm").innerHTML=
    selectControl("Default template",rp+"template",getSetting(rp+"template","vmg_full_due_diligence"),templateArray().map(x=>[x[0],x[1]]))+
    [["Executive Summary","executive_summary"],["Five-Year Financials","five_year_financials"],["Graphs","graphs"],["Evidence Labels","evidence_labels"],["Sources","sources"],["Information Gaps","information_gaps"],["Credit Safety","credit_safety"],["Procurement Opportunity","procurement_opportunity"],["Competitor Analysis","competitor_analysis"],["Management Takeaways","management_takeaways"],["Generate PDF","pdf"],["Generate DOCX","docx"],["Generate XLSX","xlsx"]].map(x=>toggleControl(x[0],rp+x[1],getSetting(rp+x[1],true))).join("");
  document.querySelectorAll("[data-setting-path]").forEach(el=>el.onchange=()=>{setPath(S.settings,el.dataset.settingPath,el.type==="checkbox"?el.checked:el.type==="number"?Number(el.value):el.value);saveSettingsDebounced()});
}
function setPath(obj,path,val){const ks=path.split(".");let o=obj;for(let i=0;i<ks.length-1;i++)o=o[ks[i]]||(o[ks[i]]={});o[ks.at(-1)]=val}
let saveTimer;function saveSettingsDebounced(){clearTimeout(saveTimer);saveTimer=setTimeout(saveSettings,450)}
async function saveSettings(){if(!S.admin.authorized)return;try{await api("/api/settings",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({settings:S.settings})});toast("Settings saved.")}catch(e){toast(e.message)}}
function renderSystemConnections(){
  const p=S.providers||{};document.getElementById("systemConnections").innerHTML=[
    ["Database — Supabase",p.supabase?.connected?"CONNECTED":"NOT CONNECTED"],
    ["Storage — Supabase Storage",p.supabase?.connected?"CONFIGURED WITH DATABASE":"NOT CONNECTED"],
    ["Server — Netlify Functions","OPERATIONAL"],
    ["Environment",p.app_env||"preview"]
  ].map(x=>'<div class="statusline"><span>'+esc(x[0])+'</span><b>'+tag(x[1],statusKind(x[1]))+'</b></div>').join("");
}
document.querySelectorAll("[data-setting]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-setting]").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll(".settings-pane").forEach(x=>x.classList.toggle("active",x.id==="setting-"+b.dataset.setting))});
document.getElementById("adminUnlockBtn").onclick=async()=>{try{await api("/api/settings-auth",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({secret:document.getElementById("adminSecret").value})});document.getElementById("adminSecret").value="";document.getElementById("adminModal").classList.remove("open");await loadAdminState();toast("Admin settings unlocked.")}catch(e){toast(e.message)}};

document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll(".tabpanel").forEach(x=>x.classList.toggle("active",x.id==="tab-"+b.dataset.tab))});
document.getElementById("resolveBtn").onclick=()=>resolveEntity(false);
document.getElementById("startBtn").onclick=()=>S.entity?createResearch():resolveEntity(true);
document.getElementById("openProfileBtn").onclick=()=>S.currentReport&&openReport(S.currentReport);
document.getElementById("quickBtn").onclick=()=>{document.getElementById("seed").value=document.getElementById("quickSeed").value;show("new")};
document.getElementById("companySearch").oninput=renderCompanies;
document.getElementById("companySearchBtn").onclick=renderCompanies;
document.getElementById("addCompareBtn").onclick=()=>{const id=document.getElementById("compareCompanySelect").value;if(id&&!S.compareIds.includes(id)&&S.compareIds.length<5)S.compareIds.push(id);renderCompareChips()};
document.getElementById("compareBtn").onclick=runCompare;
document.getElementById("refreshBtn").onclick=init;

async function init(){await loadStatus();await Promise.allSettled([loadTemplates(),loadCompanies(),loadReports(),loadUsage()])}
init();
