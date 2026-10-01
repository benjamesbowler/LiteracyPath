import { createRoot } from "react-dom/client";
import { AdminDashboardPage } from "./components/AdminDashboardPage.jsx";
import "./styles/fonts.js";
import "./index.css";
import "./App.css";
import "./styles/ui-quality-pass.css";
const fixture = new URLSearchParams(window.location.search).get("fixture") || "complete";
window.history.replaceState({},"",`/admin/app/usage-insights?fixture=${fixture}`);
const calls = []; window.__usageFixtureCalls = calls;
const rows = fixture === "empty" ? [] : Array.from({length:1005},(_,index)=>({
  source:"learn_activity",learnerRef:`learner-${index%15}`,observedAt:"2026-09-28T08:00:00Z",
  data:{ area:index%2 ? "skills_practice":"app",item_id:index%2 ? "hard-q":"home",event:index%2 ? "answer":"area_enter",
    payload:index%2 ? {questionId:"hard-q",answerEventId:`response-${index}`,firstResponseCorrect:false,responseTimeMs:4000,mode:"practice",collectionVersion:2}:
      {area:"student_home",availableAreas:["student_home","hollow","skills_practice"],collectionVersion:2} }
}));
if (fixture !== "empty") rows.push(
  {source:"student_progress",learnerRef:"learner-0",observedAt:"2026-09-28T08:00:00Z",data:{area:"learn_games",key:"__all__",payload:{games:{"word-climb":{plays:8}}}}},
  {source:"student_progress",learnerRef:"learner-0",observedAt:"2026-09-28T08:00:00Z",data:{area:"guided_reading",key:"gr-a-26",payload:{completedPages:6,readCount:2,pageStats:{1:{openedCount:3}}}}},
  {source:"student_progress",learnerRef:"learner-1",observedAt:"2026-09-28T08:00:00Z",data:{area:"story_quests",key:"fixture-story",payload:{opened:true,completed:true,visitedPageIds:["start","end"]}}}
);
const client={call:async(name,args={})=>{
  calls.push({name,args});
  if(name==="admin_purge_usage_snapshots")return{data:{ok:true,purged:0},error:null};
  if(fixture==="missing")return{data:null,error:{message:"Could not find the function admin_create_usage_snapshot in the schema cache"}};
  if(name==="admin_create_usage_snapshot")return{error:null,data:{ok:true,snapshotId:"synthetic-snapshot",rowCount:rows.length,collectionVersion:2,capturedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+1800000).toISOString(),sources:[{source:"learn_activity",available:true,rows:rows.filter(row=>row.source==="learn_activity").length},{source:"student_progress",available:true,rows:rows.filter(row=>row.source==="student_progress").length},{source:"student_focus_cycle_practice_attempts",available:false,rows:null}],rangeSemantics:"Latest progress state is not a historical event stream."}};
  if(name==="admin_read_usage_snapshot") {
    const page=rows.slice(args.p_after,args.p_after+500).map((evidence,index)=>({rowNumber:args.p_after+index+1,evidence}));
    if(fixture==="gap"&&page.length)page[0].rowNumber+=1;
    return{error:null,data:{ok:true,snapshotId:"synthetic-snapshot",rowCount:rows.length,rows:page,nextAfter:Math.min(rows.length,args.p_after+500),complete:args.p_after+500>=rows.length}};
  }
  if(name==="admin_release_usage_snapshot")return fixture==="expired"&&args.p_download_requested?{data:null,error:{message:"Snapshot no longer valid for download. Generate again."}}:{data:{ok:true,released:true},error:null};
  return{error:null,data:[]};
}};
createRoot(document.getElementById("root")).render(<div className="main-content"><AdminDashboardPage schools={[{id:"synthetic-school",name:"Fixture School"}]} supabase={client} loading={false}/></div>);
