// Loaded only when an administrator requests a report. The current catalog is
// evidence of availability, never evidence a learner was shown every item.
export async function loadUsageItemManifest() {
  const [assessments, books, games, quests, cycles, cycleContent, textAnalysis] = await Promise.all([
    import("./loadAssessmentSkillBank.js"), import("../utils/guidedReading/runtimeBooks.js"),
    import("./learnGamesData.js"), import("./storyQuests.js"), import("./elSkillsBlockCycles.js"),
    import("../components/cycle-practice/cyclePracticeContent.js"), import("../utils/guidedReading/bookTextAnalysis.js")
  ]);
  const bank = await assessments.loadAssessmentBanksForSkills(assessments.getActiveAssessmentSkillIds());
  const manifest = [];
  for (const question of bank) for (const area of ["skills_assessment", "skills_practice"]) manifest.push({
    area, id: question.id, skillId: question.skillId || question.assessmentSkillId, level: question.level, phase: question.phase,
    format: question.formatType || question.templateType, target: question.targetWord || question.itemKey || "", source: question._sourceFile || "current v3 runtime bank"
  });
  for (const book of books.getRuntimeGuidedReadingBooks()) {
    const analysis=textAnalysis.getBookTextAnalysis(book);
    manifest.push({ area: "guided_reading", id: book.id, title: book.title, instructionalLevel:book.level,
      appReadingLevel:analysis.appReadingLevel, readingLevelReviewStatus:analysis.status, textFingerprint:analysis.textFingerprint || null,
      lexile:analysis.lexile, source: "runtimeBooks + current text review" });
  }
  for (const game of games.GAME_LIST) manifest.push({ area: "games", id: game.id, title: game.title, source: "GAME_LIST" });
  for (const quest of quests.storyQuests) manifest.push({ area: "story_quests", id: quest.id, title: quest.title, contentRevision: quest.contentRevision, source: "storyQuests" });
  for (const cycle of cycles.elSkillsBlockCycles) {
    const seen = new Set();
    for (const check of [false,true]) for (const round of Object.values(cycleContent.buildCyclePracticePools(cycle, "admin-usage-catalog", check)).flat()) {
      if (seen.has(round.id)) continue;
      seen.add(round.id);
      manifest.push({ area: "cycle_practice", id: round.id, cycleId: cycle.id, format: round.mechanicId, target: round.targetWord || round.itemKey || "", source: "current authored cycle pools", note: "Runtime choice/order variants may differ; compare stored semantic keys." });
    }
  }
  return manifest;
}
