import { useMemo, useState } from "react";
import { PRESS_ASSETS } from "../../content/decodablePress/pressAssetRegistry.js";
import { analyzeSentenceDecodability } from "../../utils/decodablePress/analyzeSentenceDecodability.js";
import { validatePressBook } from "../../utils/decodablePress/pressPublicationPolicy.js";
import { saveStudentPressRevision, submitStudentPressRevision } from "../../data/decodablePress/decodablePress.js";
import { StoryPlanner } from "./StoryPlanner.jsx";
import { SentenceBuilder } from "./SentenceBuilder.jsx";
import { PageIllustrator } from "./PageIllustrator.jsx";
import { BookPreview } from "./BookPreview.jsx";

export function DecodableBookEditorPage({ client, token, project, onClose, onSaved }) {
  const rules = project.rules;
  const prior = project.book?.content;
  const prompts = rules.pagePrompts;
  const [bookId,setBookId]=useState(project.book?.id || null);
  const [revisionId,setRevisionId]=useState(project.book?.current_revision_id || null);
  const [title,setTitle]=useState(prior?.title || "My tiny tale");
  const [planner,setPlanner]=useState(prior?.planner || {});
  const [pages,setPages]=useState(() => prompts.map((prompt,index) => prior?.pages?.[index] || { promptId: prompt.id, text: "", assetId: rules.assetIds[index % rules.assetIds.length] }));
  const [preview,setPreview]=useState(false); const [busy,setBusy]=useState(false); const [message,setMessage]=useState(project.book?.review?.child_feedback || "");
  const [submitted,setSubmitted]=useState(project.book?.status === "submitted");
  const validation = useMemo(() => pages.map(page => analyzeSentenceDecodability({ sentence: page.text, decodableWords: rules.words, knownHighFrequencyWords: rules.highFrequencyWords, approvedChallenges: project.book?.review?.approved_challenges || [] })), [pages, project.book?.review?.approved_challenges, rules.highFrequencyWords, rules.words]);
  const book = { title, planner, pages };
  function updatePage(index, patch) { setPages(current => current.map((page,i) => i===index ? { ...page, ...patch } : page)); }
  async function save({ submit = false } = {}) { setBusy(true); setMessage(""); try { const frozen=validatePressBook(book,{assetIds:PRESS_ASSETS.map(asset=>asset.id),requireComplete:submit}); const result=await saveStudentPressRevision(client,{token,projectId:project.id,bookId,clientEventId:crypto.randomUUID(),book:frozen,validation:{purpose:"writing_support_not_assessment",pages:validation,complete:frozen.complete}}); setBookId(result.book_id); setRevisionId(result.revision_id); if(submit){await submitStudentPressRevision(client,{token,bookId:result.book_id,revisionId:result.revision_id});setSubmitted(true);setMessage("Sent to your teacher. This exact version is locked while they review it.");}else setMessage(frozen.complete?`Complete draft revision ${result.revision} saved privately.`:`Draft revision ${result.revision} saved privately. You can finish the other pages later.`); await onSaved?.(); } catch(error){setMessage(error?.message || "Your book could not be saved. Try again without leaving this page.");} finally{setBusy(false);} }
  if(preview) return <main className="press-editor"><button type="button" onClick={()=>setPreview(false)}>{submitted ? "See locked pages" : "Back to editing"}</button><BookPreview book={book}/>{submitted?<p className="press-privacy-note">This exact version is waiting for your teacher. Your words and pictures cannot change during review.</p>:<div className="press-editor-actions"><button type="button" disabled={busy} onClick={()=>save()}>Save private draft</button><button type="button" disabled={busy} onClick={()=>save({submit:true})}>Send exact version to teacher</button></div>}{message&&<p role="status">{message}</p>}</main>;
  return <main className="press-editor"><header><div><p>Class Decodable Press</p><h1>{rules.projectTitle}</h1><span>Four pages · private until your teacher approves the exact version</span></div><button type="button" onClick={onClose}>Back to Books</button></header>{submitted&&<p className="press-privacy-note">This exact version is waiting for teacher review and is read-only.</p>}<label className="press-title">Book title<input disabled={submitted} maxLength="80" value={title} onChange={event=>setTitle(event.target.value)} /></label><StoryPlanner disabled={submitted} value={planner} onChange={setPlanner}/><section className="press-pages" aria-label="Book pages">{pages.map((page,index)=><article key={prompts[index].id}><SentenceBuilder disabled={submitted} pageNumber={index+1} prompt={prompts[index]} value={page.text} wordBank={rules.words} highFrequencyWords={rules.highFrequencyWords} approvedChallenges={project.book?.review?.approved_challenges||[]} onChange={text=>updatePage(index,{text})}/><PageIllustrator disabled={submitted} pageNumber={index+1} value={page.assetId} allowedAssetIds={rules.assetIds} onChange={assetId=>updatePage(index,{assetId})}/></article>)}</section><details className="press-word-bank"><summary>Words for this project</summary><p>{[...rules.words,...rules.highFrequencyWords].join(" · ")}</p></details><div className="press-editor-actions">{!submitted&&<button type="button" disabled={busy} onClick={()=>save()}>Save private draft</button>}<button type="button" onClick={()=>setPreview(true)}>Preview all four pages</button></div>{revisionId&&<p>Current saved revision: {revisionId.slice(0,8)}</p>}{message&&<p role="status">{message}</p>}</main>;
}
