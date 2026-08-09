import test from "node:test";
import assert from "node:assert/strict";
import { buildReadingPassport, savePassportReflection } from "../../src/policy/readingPassportPolicy.js";
import { computeHydratedValue } from "../../src/utils/progressMerge.js";

const books=[{id:"a",title:"Ants",level:"A",type:"Nonfiction"},{id:"b",title:"The Hat",level:"A",type:"Fiction"}];
test("passport stamps only completed real books and derives discoveries",()=>{const passport=buildReadingPassport({books,records:{a:{completed:true,completedAt:"2026-08-01",buddyReader:{turns:[{}]}},b:{completedAt:"2026-08-02"},missing:{completed:true}}});assert.equal(passport.stamps.length,2);assert.equal(passport.competitive,false);assert.deepEqual(new Set(passport.discoveries.map(row=>row.id)),new Set(["first-book","two-kinds","buddy-reader"]))});
test("reflection choices store no child media",()=>{const next=savePassportReflection({}, {bookId:"a",bookTitle:"Ants",reflectionId:"learn",at:"2026-08-09T00:00:00Z"});assert.equal(next.reflections.a.reflectionId,"learn");assert.equal(next.reflections.a.bookTitle,"Ants");assert.equal(next.reflections.a.childMediaCollected,false);assert.throws(()=>savePassportReflection(next,{bookId:"a",reflectionId:"photo"}))});
test("newest reflection per book survives cross-device merge",()=>{const merged=computeHydratedValue("reading_passport","__all__",{reflections:{a:{reflectionId:"learn",updatedAt:"2026-08-09"}}},{reflections:{a:{reflectionId:"laugh",updatedAt:"2026-08-08"},b:{reflectionId:"again",updatedAt:"2026-08-09"}}});assert.equal(merged.reflections.a.reflectionId,"learn");assert.equal(merged.reflections.b.reflectionId,"again")});
