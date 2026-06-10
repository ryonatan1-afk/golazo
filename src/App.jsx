import { useState, useEffect, useMemo } from "react";

const T = {
  bg: "#F1F4EF", surface: "#FFFFFF", ink: "#121A14", inkSoft: "#5B6660",
  line: "#E3E8E1", pitch: "#0C7A44", pitchDeep: "#06502B", yellow: "#FFC83D", red: "#E5484D",
};

const R = {
  Mexico:78,"South Africa":62,"South Korea":70,Czechia:68,Canada:72,Bosnia:66,
  USA:76,Paraguay:67,Qatar:58,Switzerland:74,Brazil:88,Morocco:78,Haiti:55,
  Scotland:67,Australia:68,"Türkiye":72,Germany:86,"Curaçao":52,
};
const FLAG = {
  Mexico:"🇲🇽","South Africa":"🇿🇦","South Korea":"🇰🇷",Czechia:"🇨🇿",Canada:"🇨🇦",
  Bosnia:"🇧🇦",USA:"🇺🇸",Paraguay:"🇵🇾",Qatar:"🇶🇦",Switzerland:"🇨🇭",Brazil:"🇧🇷",
  Morocco:"🇲🇦",Haiti:"🇭🇹",Scotland:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",Australia:"🇦🇺","Türkiye":"🇹🇷",Germany:"🇩🇪","Curaçao":"🇨🇼",
};
const ABBR = {
  Mexico:"MEX","South Africa":"RSA","South Korea":"KOR",Czechia:"CZE",Canada:"CAN",
  Bosnia:"BIH",USA:"USA",Paraguay:"PAR",Qatar:"QAT",Switzerland:"SUI",Brazil:"BRA",
  Morocco:"MAR",Haiti:"HAI",Scotland:"SCO",Australia:"AUS","Türkiye":"TUR",Germany:"GER","Curaçao":"CUW",
};

const MATCHES = [
  {id:"m1",day:"Thu Jun 11",time:"22:00",home:"Mexico",away:"South Africa",city:"Mexico City",group:"A",opener:true},
  {id:"m2",day:"Fri Jun 12",time:"05:00",home:"South Korea",away:"Czechia",city:"Guadalajara",group:"A"},
  {id:"m3",day:"Fri Jun 12",time:"22:00",home:"Canada",away:"Bosnia",city:"Toronto",group:"B"},
  {id:"m4",day:"Sat Jun 13",time:"04:00",home:"USA",away:"Paraguay",city:"Los Angeles",group:"D"},
  {id:"m5",day:"Sat Jun 13",time:"22:00",home:"Qatar",away:"Switzerland",city:"Santa Clara",group:"B"},
  {id:"m6",day:"Sun Jun 14",time:"01:00",home:"Brazil",away:"Morocco",city:"New York/NJ",group:"C"},
  {id:"m7",day:"Sun Jun 14",time:"04:00",home:"Haiti",away:"Scotland",city:"Boston",group:"C"},
  {id:"m8",day:"Sun Jun 14",time:"07:00",home:"Australia",away:"Türkiye",city:"Vancouver",group:"D"},
  {id:"m9",day:"Sun Jun 14",time:"20:00",home:"Germany",away:"Curaçao",city:"Houston",group:"E"},
];

const AGENTS = [
  {id:"quant",name:"The Quant",emoji:"📊",color:"#2F4BFF",tag:"Cold numbers. No heart.",bio:"Runs the probabilities. Whatever the model says — favourite, draw, doesn't care."},
  {id:"romantic",name:"The Romantic",emoji:"🌹",color:"#E84A6F",tag:"Believes in stories.",bio:"Backs underdogs and goals. Loses beautifully, wins unforgettably."},
  {id:"chalk",name:"The Chalk",emoji:"🧱",color:"#3E4A56",tag:"Favourites. Always.",bio:"Shortest price on the board, every market. Small wins, stacked patiently."},
  {id:"degen",name:"The Degenerate",emoji:"🎢",color:"#FF7A1A",tag:"Longest odds or nothing.",bio:"Lives for the upset. Considers a 9-match losing streak 'variance'."},
  {id:"homer",name:"The Homer",emoji:"📣",color:"#8A3FFC",tag:"Your team. No questions.",bio:"Backs your team blindly. Crowd favourites everywhere else."},
];

const FRIENDS = [
  {name:"Benny",agent:"degen",fav:"Türkiye"},{name:"Nitai",agent:"quant",fav:"Germany"},
  {name:"Uri",agent:"chalk",fav:"Brazil"},{name:"Noa",agent:"romantic",fav:"Morocco"},
  {name:"Tal",agent:"quant",fav:"USA"},{name:"Shir",agent:"homer",fav:"Brazil"},
  {name:"Omer",agent:"chalk",fav:"Switzerland"},{name:"Dana",agent:"degen",fav:"Scotland"},
  {name:"Avi",agent:"romantic",fav:"Haiti"},
];
const DARLINGS = ["Brazil","Mexico","USA","Germany"];
const AVATARS = ["🦊","🐯","🦁","🐸","🐙","🦄","🐼","🦅"];

function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
function mulberry32(seed){let a=seed>>>0;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function poisson(lambda,rnd){const L=Math.exp(-lambda);let k=0,p=1;do{k++;p*=rnd();}while(p>L);return k-1;}

function marketProbs(m){
  const d=R[m.home]-R[m.away];
  const pHraw=1/(1+Math.exp(-d/11));
  const pD=clamp(0.27-Math.abs(d)*0.004,0.1,0.3);
  const pH=pHraw*(1-pD),pA=(1-pHraw)*(1-pD);
  const q=R[m.home]+R[m.away];
  const pOver=clamp(0.4+(q-138)*0.005-Math.abs(d)*0.003,0.3,0.64);
  const w=Math.min(R[m.home],R[m.away]);
  const pBtts=clamp(0.44+(w-62)*0.006-Math.abs(d)*0.004,0.28,0.62);
  return{pH,pD,pA,pOver,pBtts};
}
function toOdds(p){return Math.max(1.05,Math.round(0.93/p*100)/100);}
function marketOdds(m){
  const p=marketProbs(m);
  return{H:toOdds(p.pH),D:toOdds(p.pD),A:toOdds(p.pA),O:toOdds(p.pOver),U:toOdds(1-p.pOver),Y:toOdds(p.pBtts),N:toOdds(1-p.pBtts),p};
}
function agentPicks(agentId,m,favTeam){
  const o=marketOdds(m);const{pH,pA,pOver,pBtts}=o.p;
  const homeFav=pH>=pA;const fav=homeFav?"H":"A";const dog=homeFav?"A":"H";
  const gap=Math.abs(R[m.home]-R[m.away]);
  let res,ou,btts;
  if(agentId==="quant"){const{pD}=o.p;res=pH>=pD&&pH>=pA?"H":pA>=pD?"A":"D";ou=pOver>=0.5?"O":"U";btts=pBtts>=0.5?"Y":"N";}
  else if(agentId==="chalk"){res=fav;ou=o.O<=o.U?"O":"U";btts=o.Y<=o.N?"Y":"N";}
  else if(agentId==="romantic"){res=gap<16?dog:"D";ou="O";btts="Y";}
  else if(agentId==="degen"){const ro=[["H",o.H],["D",o.D],["A",o.A]].sort((a,b)=>b[1]-a[1]);res=ro[0][0];ou=o.O>=o.U?"O":"U";btts=o.Y>=o.N?"Y":"N";}
  else{
    if(m.home===favTeam){res="H";ou="O";btts=gap>12?"N":"Y";}
    else if(m.away===favTeam){res="A";ou="O";btts=gap>12?"N":"Y";}
    else if(DARLINGS.includes(m.home)){res="H";ou="O";btts="N";}
    else if(DARLINGS.includes(m.away)){res="A";ou="O";btts="N";}
    else{res=fav;ou="O";btts="Y";}
  }
  return{res,ou,btts,odds:o};
}
function pickLabel(m,picks){
  const team=picks.res==="H"?ABBR[m.home]:picks.res==="A"?ABBR[m.away]:null;
  return{res:picks.res==="D"?"Draw":`${team} win`,ou:picks.ou==="O"?"Over 2.5":"Under 2.5",btts:picks.btts==="Y"?"BTTS · Yes":"BTTS · No"};
}
function reasoning(agentId,m,picks){
  const homeFav=R[m.home]>=R[m.away];
  const favName=homeFav?m.home:m.away;const dogName=homeFav?m.away:m.home;
  const o=picks.odds;const dOdds=(picks.res==="H"?o.H:picks.res==="D"?o.D:o.A).toFixed(2);
  const lines={
    quant:`Model has ${favName} at ${Math.round(Math.max(o.p.pH,o.p.pA)*100)}%. Numbers don't blink.`,
    romantic:picks.res==="D"?"Chaos of a draw, with goals — I'm in.":`${dogName} have a story tonight.`,
    chalk:`${favName} are the shortest price. I don't do drama.`,
    degen:`${picks.res==="D"?"Draw":picks.res==="H"?ABBR[m.home]:ABBR[m.away]} at ${dOdds}? Lottery ticket with better art.`,
    homer:`Scarf on. ${picks.res==="H"?m.home:picks.res==="A"?m.away:"The draw"} when it matters.`,
  };
  return lines[agentId];
}
function simulateMatch(m,rnd){
  const d=R[m.home]-R[m.away];
  const lh=clamp(1.32+d*0.034,0.2,3.6),la=clamp(1.32-d*0.034,0.2,3.6);
  const gh=poisson(lh,rnd),ga=poisson(la,rnd);
  return{gh,ga,res:gh>ga?"H":ga>gh?"A":"D",over:gh+ga>2.5,btts:gh>0&&ga>0};
}
function settle(picks,stake,sim){
  if(!stake||!sim)return{pnl:0,hits:[null,null,null]};
  const per=stake/3;const o=picks.odds;
  const wins=[picks.res===sim.res,(picks.ou==="O")===sim.over,(picks.btts==="Y")===sim.btts];
  const ret=(wins[0]?per*(picks.res==="H"?o.H:picks.res==="D"?o.D:o.A):0)+(wins[1]?per*(picks.ou==="O"?o.O:o.U):0)+(wins[2]?per*(picks.btts==="Y"?o.Y:o.N):0);
  return{pnl:Math.round(ret-stake),hits:wins};
}

const KEY="golazo-v3";
async function loadState(){try{const r=await window.storage.get(KEY);return r?JSON.parse(r.value):null;}catch{return null;}}
async function saveState(s){try{await window.storage.set(KEY,JSON.stringify(s));}catch{}}
const CODE_CHARS="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function genCode(){let c="";for(let i=0;i<6;i++)c+=CODE_CHARS[Math.floor(Math.random()*CODE_CHARS.length)];return c;}
function genId(){return"u"+Math.random().toString(36).slice(2,10)+Date.now().toString(36);}
async function sGet(k){try{const r=await window.storage.get(k,true);return r?JSON.parse(r.value):null;}catch{return null;}}
async function sSet(k,v){try{await window.storage.set(k,JSON.stringify(v),true);}catch{}}
async function sList(prefix){try{const r=await window.storage.list(prefix,true);return r?r.keys:[];}catch{return[];}}
async function pushMember(code,member){await sSet("league:"+code+":member:"+member.userId,member);}
async function fetchMembers(code){
  const keys=await sList("league:"+code+":member:");
  const out=[];for(const k of keys){const m=await sGet(k);if(m)out.push(m);}return out;
}

function Eyebrow({children,color}){return <div style={{fontSize:11,fontWeight:800,letterSpacing:"0.13em",textTransform:"uppercase",color:color||"#5B6660"}}>{children}</div>;}
function Pill({children,tone}){
  const bg=tone==="win"?"#E3F4E8":tone==="loss"?"#FCE9EA":tone==="gold"?"#FFF3D1":"#EEF1ED";
  const fg=tone==="win"?"#06502B":tone==="loss"?"#A22329":tone==="gold"?"#7A5A00":"#5B6660";
  return <span style={{background:bg,color:fg,borderRadius:999,padding:"3px 9px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{children}</span>;
}
function Coin({v,signed}){
  const s=signed&&v>0?"+":"";
  const color=!signed?"#121A14":v>0?"#0C7A44":v<0?"#E5484D":"#5B6660";
  return <span style={{fontVariantNumeric:"tabular-nums",fontWeight:800,color}}>{s}{v.toLocaleString()}</span>;
}

function AgentCard({a,selected,onSelect,form}){
  return(
    <button onClick={onSelect} style={{width:"100%",textAlign:"left",background:"#fff",border:"none",borderRadius:20,padding:0,overflow:"hidden",cursor:"pointer",boxShadow:selected?"0 0 0 3px "+a.color+", 0 8px 24px rgba(18,26,20,0.10)":"0 2px 12px rgba(18,26,20,0.07)"}}>
      <div style={{height:10,background:"repeating-linear-gradient(-45deg,"+a.color+","+a.color+" 10px,"+a.color+"CC 10px,"+a.color+"CC 20px)"}}/>
      <div style={{display:"flex",gap:12,padding:"12px 14px 14px",alignItems:"center"}}>
        <div style={{width:46,height:46,borderRadius:14,flexShrink:0,display:"grid",placeItems:"center",fontSize:22,background:a.color+"1A",border:"2px solid "+a.color+"33"}}>{a.emoji}</div>
        <div style={{minWidth:0,flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <div style={{fontWeight:900,fontSize:15}}>{a.name}</div>
            {selected&&<Pill tone="gold">Your agent</Pill>}
          </div>
          <div style={{fontSize:12,color:a.color,fontWeight:800}}>{a.tag}</div>
          <div style={{fontSize:12,color:"#5B6660",marginTop:3,lineHeight:1.4}}>{a.bio}</div>
          {form!=null&&<div style={{marginTop:5,fontSize:11,color:"#5B6660"}}>MD1 form (flat 50s): <Coin v={form} signed/></div>}
        </div>
      </div>
    </button>
  );
}

function MatchTicket({m,picks,stake,setStake,locked,sim,settled,agent}){
  const lbl=pickLabel(m,picks);const o=picks.odds;
  const oddsOf={res:picks.res==="H"?o.H:picks.res==="D"?o.D:o.A,ou:picks.ou==="O"?o.O:o.U,btts:picks.btts==="Y"?o.Y:o.N};
  const rows=[
    {k:"res",label:lbl.res,odds:oddsOf.res,hit:settled?settled.hits[0]:null},
    {k:"ou",label:lbl.ou,odds:oddsOf.ou,hit:settled?settled.hits[1]:null},
    {k:"btts",label:lbl.btts,odds:oddsOf.btts,hit:settled?settled.hits[2]:null},
  ];
  return(
    <div style={{background:"#fff",borderRadius:20,overflow:"hidden",boxShadow:"0 2px 12px rgba(18,26,20,0.07)"}}>
      <div style={{padding:"12px 16px 10px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <Eyebrow>{m.day} · {m.time} · Grp {m.group}</Eyebrow>
          {m.opener&&!sim&&<Pill tone="gold">Opener ⭐</Pill>}
          {sim&&<Pill tone={settled&&settled.pnl>0?"win":settled&&settled.pnl<0?"loss":undefined}>FT {sim.gh}–{sim.ga}</Pill>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:7,marginTop:7,flexWrap:"wrap"}}>
          <span style={{fontSize:20}}>{FLAG[m.home]}</span>
          <span style={{fontWeight:900,fontSize:16}}>{m.home}</span>
          <span style={{color:"#5B6660",fontWeight:600,fontSize:12}}>vs</span>
          <span style={{fontWeight:900,fontSize:16}}>{m.away}</span>
          <span style={{fontSize:20}}>{FLAG[m.away]}</span>
        </div>
        <div style={{fontSize:11,color:"#5B6660",marginTop:1}}>{m.city}</div>
      </div>
      <div style={{position:"relative",height:0,borderTop:"2px dashed #E3E8E1"}}>
        <div style={{position:"absolute",left:-10,top:-10,width:20,height:20,borderRadius:"50%",background:"#F1F4EF"}}/>
        <div style={{position:"absolute",right:-10,top:-10,width:20,height:20,borderRadius:"50%",background:"#F1F4EF"}}/>
      </div>
      <div style={{padding:"10px 16px 14px"}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:7,marginBottom:9}}>
          <span style={{fontSize:14,flexShrink:0}}>{agent.emoji}</span>
          <div style={{fontSize:11,color:"#5B6660",fontStyle:"italic",lineHeight:1.4}}>"{reasoning(agent.id,m,picks)}"</div>
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {rows.map(r=>(
            <div key={r.k} style={{display:"flex",alignItems:"center",gap:4,borderRadius:10,padding:"5px 9px",background:r.hit===true?"#E3F4E8":r.hit===false?"#FCE9EA":"#F2F5F0",border:"1px solid "+(r.hit===true?"#BCE3C8":r.hit===false?"#F4C7CA":"#E3E8E1")}}>
              <span style={{fontWeight:800,fontSize:11}}>{r.hit===true?"✓ ":r.hit===false?"✗ ":""}{r.label}</span>
              <span style={{fontSize:10,color:"#5B6660"}}>@{r.odds.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:11}}>
          {sim&&settled?(
            <><Eyebrow>Result</Eyebrow><div style={{fontSize:15}}><Coin v={settled.pnl} signed/> <span style={{fontSize:10,color:"#5B6660",fontWeight:600}}>on {stake}</span></div></>
          ):(
            <><Eyebrow>Stake</Eyebrow>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button disabled={locked} onClick={()=>setStake(Math.max(0,stake-25))} style={{width:32,height:32,borderRadius:9,border:"1.5px solid #E3E8E1",background:"#fff",fontSize:15,fontWeight:800,cursor:locked?"default":"pointer",opacity:locked?0.3:1}}>−</button>
              <div style={{minWidth:40,textAlign:"center",fontWeight:900,fontSize:16,fontVariantNumeric:"tabular-nums"}}>{stake}</div>
              <button disabled={locked} onClick={()=>setStake(Math.min(250,stake+25))} style={{width:32,height:32,borderRadius:9,border:"1.5px solid #E3E8E1",background:"#fff",fontSize:15,fontWeight:800,cursor:locked?"default":"pointer",opacity:locked?0.3:1}}>＋</button>
            </div></>
          )}
        </div>
      </div>
    </div>
  );
}

const inp={width:"100%",padding:"12px 13px",borderRadius:12,border:"1.5px solid #E3E8E1",fontSize:14,fontWeight:600,fontFamily:"inherit",background:"#fff",color:"#121A14",outline:"none",boxSizing:"border-box"};

export default function App(){
  const [ready,setReady]=useState(false);
  const [step,setStep]=useState("welcome");
  const [agentId,setAgentId]=useState(null);
  const [favTeam,setFavTeam]=useState(null);
  const [tab,setTab]=useState("matches");
  const [stakes,setStakes]=useState(()=>Object.fromEntries(MATCHES.map(m=>[m.id,50])));
  const [locked,setLocked]=useState(false);
  const [seed,setSeed]=useState(null);
  const [played,setPlayed]=useState(false);
  const [toast,setToast]=useState(null);
  const [profile,setProfile]=useState(null);
  const [pName,setPName]=useState("");
  const [pEmoji,setPEmoji]=useState("🦊");
  const [myLeagues,setMyLeagues]=useState([]);
  const [leagueView,setLeagueView]=useState(null);
  const [leagueMembers,setLeagueMembers]=useState({});
  const [busy,setBusy]=useState(false);
  const [refreshing,setRefreshing]=useState(false);
  const [lName,setLName]=useState("");
  const [jCode,setJCode]=useState("");
  const [lMode,setLMode]=useState(null);
  const [pendingJoin,setPendingJoin]=useState(()=>{const p=new URLSearchParams(window.location.search);return p.get("join")||null;});

  useEffect(()=>{(async()=>{
    const s=await loadState();
    if(s){
      if(s.step)setStep(s.step);if(s.agentId)setAgentId(s.agentId);if(s.favTeam)setFavTeam(s.favTeam);
      if(s.stakes)setStakes(s.stakes);if(s.locked)setLocked(s.locked);if(s.seed!=null)setSeed(s.seed);
      if(s.played)setPlayed(s.played);if(s.profile)setProfile(s.profile);if(s.myLeagues)setMyLeagues(s.myLeagues);
    }
    setReady(true);
  })();},[]);

  useEffect(()=>{if(!ready)return;saveState({step,agentId,favTeam,stakes,locked,seed,played,profile,myLeagues});},[ready,step,agentId,favTeam,stakes,locked,seed,played,profile,myLeagues]);

  const agent=AGENTS.find(a=>a.id===agentId)||AGENTS[0];
  const myPicks=useMemo(()=>Object.fromEntries(MATCHES.map(m=>[m.id,agentPicks(agentId||"quant",m,favTeam)])),[agentId,favTeam]);
  const totalStaked=MATCHES.reduce((s,m)=>s+(stakes[m.id]||0),0);
  const sims=useMemo(()=>{if(!played||seed==null)return null;const rnd=mulberry32(seed);return Object.fromEntries(MATCHES.map(m=>[m.id,simulateMatch(m,rnd)]));},[played,seed]);
  const mySettles=useMemo(()=>{if(!sims)return null;return Object.fromEntries(MATCHES.map(m=>[m.id,settle(myPicks[m.id],stakes[m.id]||0,sims[m.id])]));},[sims,myPicks,stakes]);
  const myPnl=mySettles?MATCHES.reduce((s,m)=>s+mySettles[m.id].pnl,0):0;
  const myBank=1000+myPnl;
  const friendResults=useMemo(()=>{
    if(!sims||seed==null)return null;
    return FRIENDS.map((f,idx)=>{let pnl=0;MATCHES.forEach((m,i)=>{const rnd=mulberry32(seed+idx*97+i*13);const sk=f.name==="Nitai"?50:f.name==="Noa"?25:f.name==="Uri"&&i%3===0?120:f.name==="Uri"?20:Math.round((10+rnd()*19))*10;pnl+=settle(agentPicks(f.agent,m,f.fav),sk,sims[m.id]).pnl;});return{...f,bank:1000+pnl,pnl};});
  },[sims,seed]);
  const agentForm=useMemo(()=>{if(!sims)return null;const fm={};AGENTS.forEach(a=>{let pnl=0;MATCHES.forEach(m=>{pnl+=settle(agentPicks(a.id,m,favTeam),50,sims[m.id]).pnl;});fm[a.id]=pnl;});return fm;},[sims,favTeam]);

  function notify(msg){setToast(msg);setTimeout(()=>setToast(null),2800);}
  function bldMember(){return{userId:profile.userId,name:profile.name,emoji:profile.emoji,agentId,favTeam,played,bank:played?myBank:1000,pnl:played?myPnl:0,ts:Date.now()};}
  useEffect(()=>{if(!ready||!profile||step!=="app"||!myLeagues.length)return;const m=bldMember();myLeagues.forEach(l=>pushMember(l.code,m));},[ready,profile,step,agentId,favTeam,played,myBank,myPnl]);
  async function refreshL(code){setRefreshing(true);const ms=await fetchMembers(code);setLeagueMembers(s=>({...s,[code]:ms}));setRefreshing(false);}
  async function handleCreate(){if(!lName.trim())return;setBusy(true);let code=null;for(let i=0;i<5;i++){const c=genCode();const ex=await sGet("league:"+c);if(!ex){code=c;break;}}if(!code){setBusy(false);notify("Couldn't create — try again.");return;}await sSet("league:"+code,{code,name:lName.trim(),createdBy:profile.userId,createdAt:Date.now()});await pushMember(code,bldMember());setMyLeagues(ls=>[...ls,{code,name:lName.trim()}]);setLName("");setLMode(null);setBusy(false);setLeagueView(code);refreshL(code);notify("League created! Share code "+code+" 🏆");}
  async function handleJoin(overrideCode){const code=(overrideCode||jCode).trim().toUpperCase();if(myLeagues.some(l=>l.code===code)){setLeagueView(code);refreshL(code);setJCode("");setLMode(null);return;}setBusy(true);const doc=await sGet("league:"+code);if(!doc){setBusy(false);notify("No league with that code.");return;}await pushMember(code,bldMember());setMyLeagues(ls=>[...ls,{code,name:doc.name}]);setJCode("");setLMode(null);setBusy(false);setLeagueView(code);refreshL(code);notify('Joined "'+doc.name+'" — go get them 🏆');}
  useEffect(()=>{if(!pendingJoin||!profile||step!=="app")return;window.history.replaceState({},"",window.location.pathname);const c=pendingJoin;setPendingJoin(null);handleJoin(c);},[pendingJoin,profile,step]);
  async function fastForward(){let s=await sGet("golazo-md1-seed");if(s==null){s=Math.floor(Math.random()*2147483647);await sSet("golazo-md1-seed",s);}setSeed(s);setPlayed(true);setTab("matches");}
  async function resetAll(){try{await window.storage.delete(KEY);}catch{}setStep("welcome");setAgentId(null);setFavTeam(null);setTab("matches");setStakes(Object.fromEntries(MATCHES.map(m=>[m.id,50])));setLocked(false);setSeed(null);setPlayed(false);setProfile(null);setMyLeagues([]);setLeagueView(null);setLeagueMembers({});}

  if(!ready)return <div style={{minHeight:"100vh",background:"#F1F4EF"}}/>;

  const P=T.pitch,PD=T.pitchDeep,Y=T.yellow;
  const css="*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased}.cta{width:100%;border:none;border-radius:14px;padding:14px;background:"+P+";color:#fff;font-size:15px;font-weight:900;cursor:pointer;font-family:inherit}.cta:disabled{background:#B9C4BC;cursor:default}.ghost{background:#fff!important;color:#121A14!important;border:1.5px solid #E3E8E1!important}.fade{animation:fu .28s ease both}@keyframes fu{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}input:focus{border-color:"+P+"!important;box-shadow:0 0 0 3px "+P+"22!important}";

  if(step!=="app")return(
    <div style={{minHeight:"100vh",background:"#F1F4EF",color:"#121A14"}}>
      <style>{css}</style>
      <div style={{maxWidth:440,margin:"0 auto",padding:"28px 18px 60px"}}>
        {step==="welcome"&&<div className="fade">
          <div style={{borderRadius:24,background:PD,color:"#fff",padding:"32px 22px 26px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",inset:0,opacity:.18,background:"repeating-linear-gradient(90deg,transparent,transparent 44px,rgba(255,255,255,.3) 44px,rgba(255,255,255,.3) 88px)"}}/>
            <div style={{position:"relative"}}>
              <Eyebrow color="#9FD6B4">World Cup 2026 · Jun 11 – Jul 19</Eyebrow>
              <h1 style={{fontSize:46,fontWeight:900,letterSpacing:"-0.04em",lineHeight:1,margin:"8px 0 10px"}}>GOLAZO<span style={{color:Y}}>.</span></h1>
              <p style={{fontSize:16,lineHeight:1.5,margin:0,fontWeight:600,color:"#DFF1E5"}}>Your agent makes the picks.<br/>You run the bank.<br/>Your friends eat your dust.</p>
            </div>
          </div>
          <div style={{background:"#fff",borderRadius:20,padding:"16px 18px",marginTop:10,boxShadow:"0 4px 16px rgba(18,26,20,0.06)"}}>
            {[["🃏","Pick one of 5 agents — each bets with a different brain."],["💰","1,000 coins. You size the stake on every match."],["🏆","3 markets per game: result, over/under 2.5, BTTS."],["👥","Create a league, share a 6-letter code, beat your mates."]].map(([e,t],i)=>(
              <div key={i} style={{display:"flex",gap:11,padding:"6px 0",fontSize:13,lineHeight:1.45,color:"#5B6660"}}><span style={{fontSize:16}}>{e}</span><span>{t}</span></div>
            ))}
          </div>
          <div style={{marginTop:12}}><button className="cta" onClick={()=>setStep("agent")}>Choose your agent →</button></div>
          <p style={{textAlign:"center",fontSize:11,color:"#5B6660",marginTop:8}}>Play-money only. No real betting.</p>
        </div>}

        {step==="agent"&&<div className="fade">
          <Eyebrow color={P}>Step 1 of 2</Eyebrow>
          <h2 style={{fontSize:24,fontWeight:900,letterSpacing:"-0.03em",margin:"5px 0 3px"}}>Who bets for you?</h2>
          <p style={{color:"#5B6660",fontSize:13,margin:"0 0 12px"}}>You can switch agents between matchdays — for a fee.</p>
          <div style={{display:"grid",gap:9}}>{AGENTS.map(a=><AgentCard key={a.id} a={a} selected={agentId===a.id} onSelect={()=>setAgentId(a.id)}/>)}</div>
          <div style={{marginTop:12}}><button className="cta" disabled={!agentId} onClick={()=>setStep("team")}>{agentId?"Sign "+AGENTS.find(a=>a.id===agentId).name+" →":"Pick an agent to continue"}</button></div>
        </div>}

        {step==="team"&&<div className="fade">
          <Eyebrow color={P}>Step 2 of 2</Eyebrow>
          <h2 style={{fontSize:24,fontWeight:900,letterSpacing:"-0.03em",margin:"5px 0 3px"}}>Pick your team</h2>
          <p style={{color:"#5B6660",fontSize:13,margin:"0 0 12px"}}>The Homer backs them blindly. Every agent trash-talks them.</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
            {Object.keys(R).map(t=><button key={t} onClick={()=>setFavTeam(t)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 11px",borderRadius:11,border:"1.5px solid "+(favTeam===t?P:"#E3E8E1"),background:favTeam===t?"#EAF6EE":"#fff",fontWeight:700,fontSize:13,cursor:"pointer",color:"#121A14"}}><span style={{fontSize:16}}>{FLAG[t]}</span>{t}</button>)}
          </div>
          <div style={{marginTop:14}}><button className="cta" disabled={!favTeam} onClick={()=>{setStep("app");if(pendingJoin){setTab("table");notify("Almost in! Set up your player card to join the league.");}else{notify("1,000 coins in the bank. Matchday 1 is live. ⚽");}}}>{favTeam?"Kick off with "+favTeam+" "+FLAG[favTeam]:"Pick a team to continue"}</button></div>
        </div>}
      </div>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:"#F1F4EF",color:"#121A14"}}>
      <style>{css}</style>
      <div style={{position:"sticky",top:0,zIndex:20,background:"#F1F4EF",borderBottom:"1px solid #E3E8E1"}}>
        <div style={{maxWidth:440,margin:"0 auto",padding:"11px 18px 9px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontWeight:900,fontSize:18,letterSpacing:"-0.03em"}}>GOLAZO<span style={{color:P}}>.</span></div><div style={{fontSize:11,color:"#5B6660",fontWeight:700}}>{agent.emoji} {agent.name} · {favTeam} {FLAG[favTeam]}</div></div>
          <div style={{textAlign:"right"}}><Eyebrow>Bankroll</Eyebrow><div style={{fontSize:18}}><Coin v={played?myBank:1000}/> <span style={{fontSize:11,color:"#5B6660",fontWeight:700}}>coins</span></div></div>
        </div>
      </div>
      <div style={{maxWidth:440,margin:"0 auto",padding:"14px 18px 110px"}}>

        {tab==="matches"&&<div className="fade">
          {played?(
            <div style={{background:myPnl>=0?PD:"#5A1B1E",color:"#fff",borderRadius:20,padding:"16px 18px",marginBottom:12}}>
              <Eyebrow color={myPnl>=0?"#9FD6B4":"#F2B3B6"}>Matchday 1 · Full time</Eyebrow>
              <div style={{fontSize:30,fontWeight:900,letterSpacing:"-0.03em",margin:"3px 0 2px"}}>{myPnl>=0?"+":""}{myPnl.toLocaleString()} coins</div>
              <div style={{fontSize:13,color:"#E8F2EA",fontWeight:600}}>{agent.name} {myPnl>=0?"delivered.":"owes you an apology. Transfers are open."}</div>
            </div>
          ):(
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:10}}>
              <div><h2 style={{fontSize:20,fontWeight:900,letterSpacing:"-0.03em",margin:0}}>Matchday 1</h2><div style={{fontSize:11,color:"#5B6660"}}>9 matches · 3 markets · Israel time</div></div>
              <Pill tone={totalStaked>1000?"loss":undefined}>{totalStaked}/1,000</Pill>
            </div>
          )}
          <div style={{display:"grid",gap:10}}>{MATCHES.map(m=><MatchTicket key={m.id} m={m} agent={agent} picks={myPicks[m.id]} stake={stakes[m.id]||0} setStake={v=>setStakes(s=>({...s,[m.id]:v}))} locked={locked} sim={sims?sims[m.id]:null} settled={mySettles?mySettles[m.id]:null}/>)}</div>
          {!played&&<div style={{marginTop:12,display:"grid",gap:8}}>
            {!locked?<button className="cta" disabled={totalStaked>1000} onClick={()=>{if(totalStaked>1000){notify("Over bankroll — trim stakes.");return;}setLocked(true);notify("Locked! Your agent is on the clock. ⚽");}}>{totalStaked>1000?"Over bankroll — lower stakes":"Lock Matchday 1 · "+totalStaked+" coins"}</button>
            :<button className="cta" style={{background:Y,color:"#121A14"}} onClick={fastForward}>⏩ Fast-forward matchday (demo)</button>}
            <p style={{textAlign:"center",fontSize:11,color:"#5B6660",margin:0}}>{locked?"Demo simulates instantly. Live version uses real scores.":"Lock to put your agent on record."}</p>
          </div>}
        </div>}

        {tab==="agents"&&<div className="fade">
          <h2 style={{fontSize:20,fontWeight:900,letterSpacing:"-0.03em",margin:"0 0 3px"}}>The catalogue</h2>
          <p style={{fontSize:12,color:"#5B6660",margin:"0 0 10px"}}>{played?"MD1 form at flat 50-coin stakes.":"Tap to switch — free until matchday locked."}</p>
          <div style={{display:"grid",gap:9}}>{AGENTS.map(a=><AgentCard key={a.id} a={a} selected={agentId===a.id} form={agentForm?agentForm[a.id]:null} onSelect={()=>{if(played){setAgentId(a.id);notify(a.name+" takes over from MD2 (−50 fee).");}else if(!locked){setAgentId(a.id);notify(a.name+" is now picking for you.");}else notify("Locked — transfers open after final whistle.");}}/>)}</div>
        </div>}

        {tab==="table"&&<div className="fade">
          {!profile&&<>
            <h2 style={{fontSize:20,fontWeight:900,letterSpacing:"-0.03em",margin:"0 0 10px"}}>Leagues</h2>
            <div style={{background:"#fff",borderRadius:20,padding:18,boxShadow:"0 4px 16px rgba(18,26,20,0.06)"}}>
              <div style={{fontWeight:900,fontSize:16}}>Set up your player card</div>
              <p style={{fontSize:13,color:"#5B6660",margin:"3px 0 12px"}}>How you appear on league tables.</p>
              <input value={pName} onChange={e=>setPName(e.target.value)} placeholder="Your name" maxLength={16} style={inp}/>
              <div style={{display:"flex",gap:7,flexWrap:"wrap",margin:"10px 0 12px"}}>
                {AVATARS.map(a=><button key={a} onClick={()=>setPEmoji(a)} style={{width:40,height:40,borderRadius:11,fontSize:18,cursor:"pointer",border:"2px solid "+(pEmoji===a?P:"#E3E8E1"),background:pEmoji===a?"#EAF6EE":"#fff"}}>{a}</button>)}
              </div>
              <button className="cta" disabled={!pName.trim()} onClick={()=>{setProfile({userId:genId(),name:pName.trim(),emoji:pEmoji});notify("Player card saved!");}}>Save player card</button>
            </div>
          </>}

          {profile&&leagueView&&leagueView!=="demo"&&(()=>{
            const league=myLeagues.find(l=>l.code===leagueView)||{code:leagueView,name:"League"};
            const rows=[...(leagueMembers[leagueView]||[])].sort((a,b)=>(b.bank||0)-(a.bank||0));
            return <>
              <button onClick={()=>setLeagueView(null)} style={{background:"none",border:"none",color:P,fontWeight:900,fontSize:13,cursor:"pointer",padding:0,marginBottom:8}}>‹ All leagues</button>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <h2 style={{fontSize:20,fontWeight:900,letterSpacing:"-0.03em",margin:0}}>{league.name}</h2>
                <button onClick={()=>refreshL(leagueView)} style={{background:"none",border:"none",color:P,fontWeight:800,fontSize:13,cursor:"pointer"}}>{refreshing?"Loading…":"↻ Refresh"}</button>
              </div>
              <div style={{background:PD,color:"#fff",borderRadius:18,padding:"13px 16px",margin:"10px 0"}}>
                <Eyebrow color="#9FD6B4">Invite friends</Eyebrow>
                <div style={{fontSize:26,fontWeight:900,letterSpacing:"0.2em",margin:"4px 0 2px"}}>{league.code}</div>
                <div style={{fontSize:11,color:"#9FD6B4",marginBottom:10,fontWeight:600}}>Or just send them the link — one tap to join.</div>
                <button onClick={()=>{const link=window.location.origin+"?join="+league.code;navigator.clipboard.writeText(link).then(()=>notify("Link copied! 🔗 Share it anywhere."));}} style={{width:"100%",padding:"11px",borderRadius:12,border:"1.5px solid rgba(255,255,255,0.35)",background:"rgba(255,255,255,0.15)",color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",letterSpacing:"0.01em"}}>📋 Copy invite link</button>
              </div>
              <div style={{background:"#fff",borderRadius:18,overflow:"hidden",boxShadow:"0 4px 16px rgba(18,26,20,0.06)"}}>
                {!rows.length&&<div style={{padding:16,fontSize:13,color:"#5B6660"}}>No players yet — share the code and hit refresh.</div>}
                {rows.map((r,i)=>{const a=AGENTS.find(x=>x.id===r.agentId)||AGENTS[0];const isMe=r.userId===profile.userId;return(
                  <div key={r.userId} style={{display:"flex",alignItems:"center",gap:9,padding:"11px 13px",background:isMe?"#EAF6EE":"transparent",borderBottom:i<rows.length-1?"1px solid #E3E8E1":"none"}}>
                    <div style={{width:18,fontWeight:900,color:i<3&&r.played?P:"#5B6660",fontVariantNumeric:"tabular-nums"}}>{i+1}</div>
                    <div style={{width:34,height:34,borderRadius:10,display:"grid",placeItems:"center",background:a.color+"1A",fontSize:16,flexShrink:0}}>{r.emoji||a.emoji}</div>
                    <div style={{flex:1,minWidth:0}}><div style={{fontWeight:800,fontSize:13}}>{r.name} {isMe&&"⭐"}</div><div style={{fontSize:11,color:"#5B6660"}}>{a.emoji} {a.name} · {FLAG[r.favTeam]||""}</div></div>
                    <div style={{textAlign:"right"}}><div style={{fontSize:14}}><Coin v={r.bank??1000}/></div>{r.played&&<div style={{fontSize:11}}><Coin v={r.pnl??0} signed/></div>}</div>
                  </div>
                );})}
              </div>
            </>;
          })()}

          {profile&&leagueView==="demo"&&<>
            <button onClick={()=>setLeagueView(null)} style={{background:"none",border:"none",color:P,fontWeight:900,fontSize:13,cursor:"pointer",padding:0,marginBottom:8}}>‹ All leagues</button>
            <h2 style={{fontSize:20,fontWeight:900,letterSpacing:"-0.03em",margin:"0 0 3px"}}>🤖 Bots League</h2>
            <p style={{fontSize:12,color:"#5B6660",margin:"0 0 10px"}}>{played?"Same agents, different bank management — that's the game.":"Comes alive after Matchday 1."}</p>
            <div style={{background:"#fff",borderRadius:18,overflow:"hidden",boxShadow:"0 4px 16px rgba(18,26,20,0.06)"}}>
              {(()=>{const me={name:profile.name,agentId,bank:played?myBank:1000,pnl:myPnl,isMe:true,fav:favTeam,played};const rows=friendResults?[...friendResults.map(f=>({...f,agentId:f.agent})),me].sort((a,b)=>b.bank-a.bank):[me,...FRIENDS.map(f=>({...f,agentId:f.agent,bank:1000,pnl:0}))];return rows.map((r,i)=>{const a=AGENTS.find(x=>x.id===(r.agentId||r.agent))||AGENTS[0];return(<div key={r.name+i} style={{display:"flex",alignItems:"center",gap:9,padding:"11px 13px",background:r.isMe?"#EAF6EE":"transparent",borderBottom:i<rows.length-1?"1px solid #E3E8E1":"none"}}>
                <div style={{width:18,fontWeight:900,color:i<3&&played?P:"#5B6660"}}>{i+1}</div>
                <div style={{width:34,height:34,borderRadius:10,display:"grid",placeItems:"center",background:a.color+"1A",fontSize:16}}>{a.emoji}</div>
                <div style={{flex:1}}><div style={{fontWeight:800,fontSize:13}}>{r.name} {r.isMe&&"⭐"}</div><div style={{fontSize:11,color:"#5B6660"}}>{a.name}</div></div>
                <div style={{textAlign:"right"}}><div style={{fontSize:14}}><Coin v={r.bank}/></div>{played&&<div style={{fontSize:11}}><Coin v={r.pnl} signed/></div>}</div>
              </div>);});})()} 
            </div>
          </>}

          {profile&&!leagueView&&<>
            <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:12}}>
              <div style={{width:36,height:36,borderRadius:11,display:"grid",placeItems:"center",fontSize:17,background:"#EAF6EE"}}>{profile.emoji}</div>
              <div><div style={{fontWeight:800,fontSize:14}}>{profile.name}</div><div style={{fontSize:11,color:"#5B6660"}}>Your player card</div></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              <button className="cta" style={{padding:12,fontSize:13}} onClick={()=>setLMode(lMode==="create"?null:"create")}>＋ Create</button>
              <button className="cta ghost" style={{padding:12,fontSize:13}} onClick={()=>setLMode(lMode==="join"?null:"join")}>Join with code</button>
            </div>
            {lMode==="create"&&<div className="fade" style={{background:"#fff",borderRadius:16,padding:14,marginBottom:8,boxShadow:"0 4px 16px rgba(18,26,20,0.06)"}}>
              <input value={lName} onChange={e=>setLName(e.target.value)} placeholder="League name" maxLength={28} style={inp}/>
              <button className="cta" style={{marginTop:9}} disabled={!lName.trim()||busy} onClick={handleCreate}>{busy?"Creating…":"Create & get invite code"}</button>
            </div>}
            {lMode==="join"&&<div className="fade" style={{background:"#fff",borderRadius:16,padding:14,marginBottom:8,boxShadow:"0 4px 16px rgba(18,26,20,0.06)"}}>
              <input value={jCode} onChange={e=>setJCode(e.target.value.toUpperCase())} placeholder="ENTER CODE" maxLength={6} style={{...inp,letterSpacing:"0.28em",textTransform:"uppercase",fontWeight:900,textAlign:"center"}}/>
              <button className="cta" style={{marginTop:9}} disabled={jCode.trim().length!==6||busy} onClick={handleJoin}>{busy?"Joining…":"Join league"}</button>
            </div>}
            <Eyebrow>Your leagues</Eyebrow>
            <div style={{display:"grid",gap:7,marginTop:7}}>
              {myLeagues.map(l=><button key={l.code} onClick={()=>{setLeagueView(l.code);refreshL(l.code);}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",textAlign:"left",background:"#fff",border:"none",borderRadius:16,padding:"13px 15px",cursor:"pointer",boxShadow:"0 4px 16px rgba(18,26,20,0.06)"}}>
                <div><div style={{fontWeight:900,fontSize:14}}>🏆 {l.name}</div><div style={{fontSize:11,color:"#5B6660"}}>Code: {l.code}</div></div>
                <span style={{color:"#5B6660",fontWeight:900}}>›</span>
              </button>)}
              <button onClick={()=>setLeagueView("demo")} style={{display:"flex",alignItems:"center",justifyContent:"space-between",textAlign:"left",background:"#fff",border:"1.5px dashed #E3E8E1",borderRadius:16,padding:"13px 15px",cursor:"pointer"}}>
                <div><div style={{fontWeight:900,fontSize:14}}>🤖 Bots League</div><div style={{fontSize:11,color:"#5B6660"}}>Demo — 9 simulated players</div></div>
                <span style={{color:"#5B6660",fontWeight:900}}>›</span>
              </button>
            </div>
            <p style={{fontSize:11,color:"#5B6660",marginTop:10,lineHeight:1.5}}>League data is visible to all players who use this artifact.</p>
            <div style={{marginTop:12}}><button className="cta ghost" onClick={resetAll}>Start over</button></div>
          </>}
        </div>}
      </div>

      {toast&&<div style={{position:"fixed",bottom:88,left:"50%",transform:"translateX(-50%)",background:"#121A14",color:"#fff",padding:"11px 16px",borderRadius:12,fontSize:13,fontWeight:700,maxWidth:320,width:"calc(100% - 36px)",textAlign:"center",zIndex:40,boxShadow:"0 8px 24px rgba(0,0,0,.25)"}}>{toast}</div>}

      <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:30,background:"rgba(255,255,255,.94)",backdropFilter:"blur(10px)",borderTop:"1px solid #E3E8E1"}}>
        <div style={{maxWidth:440,margin:"0 auto",display:"flex",padding:"4px 8px 10px"}}>
          {[["matches","⚽","Matches"],["agents","🃏","Agents"],["table","🏆","Leagues"]].map(([id,icon,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={{flex:1,border:"none",background:"none",padding:"9px 0 0",cursor:"pointer"}}>
              <div style={{fontSize:19,filter:tab===id?"none":"grayscale(1) opacity(.45)"}}>{icon}</div>
              <div style={{fontSize:11,fontWeight:800,color:tab===id?P:"#5B6660"}}>{label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
