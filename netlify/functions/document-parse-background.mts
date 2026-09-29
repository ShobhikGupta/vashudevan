import type { Context } from "@netlify/functions";
import { Buffer } from "node:buffer";
import mammoth from "mammoth";
import { CanvasFactory } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";
import ExcelJS from "exceljs";
import { downloadStorage, insert, safeError, select, update } from "./lib.mts";

function textChunks(text:string,max=7000){
  const clean=String(text||"").replace(/\u0000/g,"").trim();if(!clean)return[];
  const out:string[]=[];let pos=0;
  while(pos<clean.length){
    let end=Math.min(clean.length,pos+max);
    if(end<clean.length){const cut=clean.lastIndexOf("\n",end);if(cut>pos+Math.floor(max*.55))end=cut}
    out.push(clean.slice(pos,end).trim());pos=end;
  }
  return out.filter(Boolean);
}
function csvRows(text:string){
  const rows:string[][]=[],row:string[]=[];let cell="",quoted=false;
  const pushCell=()=>{row.push(cell);cell=""},pushRow=()=>{pushCell();rows.push(row.splice(0))};
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(ch==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted}
    else if(ch===","&&!quoted)pushCell();
    else if((ch==="\n"||ch==="\r")&&!quoted){if(ch==="\r"&&text[i+1]==="\n")i++;pushRow()}
    else cell+=ch;
  }
  if(cell||row.length)pushRow();return rows;
}
function cellText(value:any){
  if(value==null)return"";if(value instanceof Date)return value.toISOString();
  if(typeof value==="object")return String(value.text??value.result??value.hyperlink??JSON.stringify(value));return String(value);
}
async function parseAttachment(a:any,bytes:ArrayBuffer){
  const mime=String(a.mime_type||""),rows:any[]=[];
  if(mime==="application/pdf"){
    const parser=new PDFParse({data:Buffer.from(bytes),CanvasFactory});
    try{
      const result:any=await parser.getText({pageJoiner:""});
      for(const page of result.pages||[])for(const text of textChunks(page.text))rows.push({page_number:Number(page.num)||null,extracted_text:text,extraction_method:"pdf-parse:text"});
      return {rows,metadata:{pages:Number(result.total||result.pages?.length||0)}};
    }finally{await parser.destroy()}
  }
  if(mime==="application/vnd.openxmlformats-officedocument.wordprocessingml.document"){
    const result=await mammoth.extractRawText({buffer:Buffer.from(bytes)});
    for(const text of textChunks(result.value))rows.push({extracted_text:text,extraction_method:"mammoth:raw-text"});
    return {rows,metadata:{warnings:(result.messages||[]).map((x:any)=>String(x.message||x)).slice(0,20)}};
  }
  if(mime==="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"||mime==="text/csv"){
    const sheets:{name:string;rows:string[][]}[]=[];
    if(mime==="text/csv")sheets.push({name:"CSV",rows:csvRows(new TextDecoder("utf-8").decode(bytes))});
    else{
      const wb=new ExcelJS.Workbook();await wb.xlsx.load(Buffer.from(bytes) as any);
      wb.eachSheet(ws=>{const data:string[][]=[];ws.eachRow({includeEmpty:false},row=>data.push((row.values as any[]).slice(1).map(cellText)));sheets.push({name:ws.name,rows:data})});
    }
    for(const sheet of sheets)for(let i=0;i<sheet.rows.length;i+=100){
      const part=sheet.rows.slice(i,i+100),text=part.map(row=>row.map(v=>JSON.stringify(v)).join(",")).join("\n").trim();
      if(text)rows.push({sheet_name:sheet.name,row_start:i+1,row_end:i+part.length,extracted_text:text.slice(0,20000),extraction_method:mime==="text/csv"?"csv:local":"exceljs:sheet"});
    }
    return {rows,metadata:{sheets:sheets.map(x=>x.name)}};
  }
  return {rows:[],metadata:{stored_only:true}};
}
export default async (req:Request,_ctx:Context)=>{
  try{
    const b=await req.json() as any,attachmentId=String(b?.attachment_id||"");if(!attachmentId)return;
    const found=await select("attachments",`id=eq.${encodeURIComponent(attachmentId)}&select=*&limit=1`),a=found?.[0];if(!a||a.upload_status!=="UPLOADED")return;
    if(String(a.mime_type||"").startsWith("image/")){await update("attachments",`id=eq.${attachmentId}`,{parse_status:"NOT_ALLOWED",parsed_at:new Date().toISOString(),extraction_metadata:{...(a.extraction_metadata||{}),stored_only:true}},false);return}
    const claim=await update("attachments",`id=eq.${attachmentId}&parse_status=eq.QUEUED`,{parse_status:"PARSING",parse_started_at:new Date().toISOString(),parse_error:null},true);
    if(!claim?.length)return;
    try{
      const bytes=await downloadStorage(a.storage_path),parsed=await parseAttachment(a,bytes);
      for(const row of parsed.rows)await insert("attachment_extractions",{workspace_id:a.workspace_id,attachment_id:a.id,segment_type:"text",...row},false);
      const status=parsed.rows.length?"READY":"PARTIAL";
      await update("attachments",`id=eq.${attachmentId}`,{parse_status:status,parsed_at:new Date().toISOString(),extraction_metadata:{...(a.extraction_metadata||{}),...parsed.metadata,segment_count:parsed.rows.length,parser_local_only:true}},false);
    }catch(e){await update("attachments",`id=eq.${attachmentId}`,{parse_status:"FAILED",parsed_at:new Date().toISOString(),parse_error:safeError(e),extraction_metadata:{...(a.extraction_metadata||{}),parser_local_only:true}},false)}
  }catch{}
};
