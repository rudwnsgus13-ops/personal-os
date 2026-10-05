const CLIENT_ID = "795262990945-lr75dt13cai408qcn33o3bf6di644r5n.apps.googleusercontent.com";
const SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const FILE_NAME = "personal-os-v1.json";
let token=null, fileId=null, timer=null;
let state;
try { state=JSON.parse(localStorage.getItem("personalOSv1")) || {tasks:[]}; } catch { state={tasks:[]}; }
state.tasks ||= [];
const $=s=>document.querySelector(s);
$("#today").textContent=new Intl.DateTimeFormat("ko-KR",{dateStyle:"full"}).format(new Date());

function render(){
  const box=$("#taskList"); box.innerHTML="";
  const items=[...state.tasks].sort((a,b)=>Number(a.done)-Number(b.done)||(b.updatedAt||"").localeCompare(a.updatedAt||""));
  for(const t of items){
    const row=document.createElement("div"); row.className="task"+(t.done?" done":"");
    const cb=document.createElement("input"); cb.type="checkbox"; cb.checked=!!t.done;
    cb.onchange=()=>{t.done=cb.checked;t.updatedAt=new Date().toISOString();saveLocal();};
    const txt=document.createElement("div"); txt.className="taskText"; txt.textContent=t.text;
    const del=document.createElement("button"); del.className="delete"; del.textContent="×";
    del.onclick=()=>{state.tasks=state.tasks.filter(x=>x.id!==t.id);saveLocal();};
    row.append(cb,txt,del); box.append(row);
  }
  $("#count").textContent=state.tasks.filter(t=>!t.done).length;
}
function saveLocal(){
  localStorage.setItem("personalOSv1",JSON.stringify(state)); render();
  if(token){clearTimeout(timer);$("#sync").textContent="변경사항 Drive 저장 중…";timer=setTimeout(()=>saveCloud().catch(syncError),600);}
}
$("#taskForm").addEventListener("submit",e=>{
  e.preventDefault(); const v=$("#taskInput").value.trim(); if(!v)return;
  state.tasks.push({id:crypto.randomUUID(),text:v,done:false,updatedAt:new Date().toISOString()});
  $("#taskInput").value=""; saveLocal();
});

async function request(url,opts={}){
  opts.headers={...(opts.headers||{}),Authorization:`Bearer ${token}`};
  const r=await fetch(url,opts);
  if(!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  if(r.status===204)return null;
  return r.json();
}
function merge(a,b){
  const m=new Map();
  for(const t of [...(b.tasks||[]),...(a.tasks||[])]){
    const old=m.get(t.id);
    if(!old||(t.updatedAt||"")>(old.updatedAt||""))m.set(t.id,t);
  }
  return {schemaVersion:1,tasks:[...m.values()],updatedAt:new Date().toISOString()};
}
async function findFile(){
  const q=encodeURIComponent(`name='${FILE_NAME}' and trashed=false`);
  const x=await request(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,name)`);
  return x.files?.[0]||null;
}
async function createFile(){
  const boundary="pos_"+Date.now();
  const metadata=JSON.stringify({name:FILE_NAME,parents:["appDataFolder"],mimeType:"application/json"});
  const body=`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(state)}\r\n--${boundary}--`;
  const x=await request("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",{method:"POST",headers:{"Content-Type":`multipart/related; boundary=${boundary}`},body});
  fileId=x.id;
}
async function loadCloud(){
  $("#sync").textContent="Google Drive 동기화 중…";
  const f=await findFile();
  if(!f){await createFile();}
  else{
    fileId=f.id;
    const cloud=await request(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`);
    state=merge(state,cloud);
    localStorage.setItem("personalOSv1",JSON.stringify(state)); render();
    await saveCloud();
  }
  $("#sync").textContent="Google Drive 동기화됨";
}
async function saveCloud(){
  if(!token||!fileId)return;
  state.updatedAt=new Date().toISOString();
  await request(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(state)});
  $("#sync").textContent="Google Drive 동기화됨 · "+new Date().toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"});
}
function syncError(e){console.error(e);$("#sync").textContent="동기화 오류 · Google 연결을 확인하세요";}
$("#googleBtn").addEventListener("click",()=>{
  if(!window.google?.accounts?.oauth2){alert("Google 로그인 모듈을 불러오는 중입니다. 잠시 후 다시 눌러주세요.");return;}
  const tc=google.accounts.oauth2.initTokenClient({
    client_id:CLIENT_ID,scope:SCOPE,
    callback:async r=>{
      if(r.error){syncError(new Error(r.error));return;}
      token=r.access_token;$("#googleBtn").textContent="Drive 연결됨";
      try{await loadCloud();}catch(e){syncError(e);}
    }
  });
  tc.requestAccessToken({prompt:"consent"});
});
render();
if("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js");
