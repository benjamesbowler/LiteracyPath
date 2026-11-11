import JSZip from 'jszip';

// PptxGenJS repeats identical media for linked activity states. Share the same
// embedded bytes across all slides so a flip-card game stays a small download.
export async function deduplicatePowerPointMedia(blob) {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  const contentTypes = zip.file('[Content_Types].xml');
  if (contentTypes) {
    // PptxGenJS declares a master for every slide but writes only the shared master.
    const xml = await contentTypes.async('string');
    zip.file(contentTypes.name, xml.replace(
      /<Override PartName="\/(ppt\/slideMasters\/slideMaster\d+\.xml)"[^>]*\/>/g,
      (entry, part) => zip.file(part) ? entry : ''
    ));
  }
  const canonical = new Map(), replacements = new Map();
  for (const file of Object.values(zip.files).filter(item => !item.dir && item.name.startsWith('ppt/media/'))) {
    const bytes = await file.async('uint8array');
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const key = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('') + file.name.slice(file.name.lastIndexOf('.'));
    if (canonical.has(key)) replacements.set(file.name.slice(4), canonical.get(key));
    else canonical.set(key, file.name.slice(4));
  }
  for (const file of Object.values(zip.files).filter(item => !item.dir && item.name.endsWith('.rels'))) {
    const xml = await file.async('string');
    zip.file(file.name, xml.replace(/Target="\.\.\/(media\/[^"<>]+)"/g, (match, path) => replacements.has(path) ? `Target="../${replacements.get(path)}"` : match));
  }
  for (const path of replacements.keys()) zip.remove(`ppt/${path}`);
  for (const file of Object.values(zip.files).filter(item => /^ppt\/slides\/slide\d+\.xml$/.test(item.name))) {
    let nextShapeId = 1;
    let xml = (await file.async('string')).replace(/<p:timing>[\s\S]*?<\/p:timing>/g, '').replace(/(<p:cNvPr\s+id=")[^"]+/g, (_, prefix) => `${prefix}${nextShapeId++}`);
    const audioIds = [];
    xml = xml.replace(/<p:pic>[\s\S]*?<\/p:pic>/g, picture => {
      if (!picture.includes('ppaction://media')) return picture;
      audioIds.push(/<p:cNvPr id="(\d+)"/.exec(picture)[1]);
      return picture.replaceAll('a:videoFile', 'a:audioFile')
        .replace('<a:hlinkClick r:id="" action="ppaction://media"', '<a:hlinkClick action="ppaction://media"');
    });
    // Native click-to-play needs both the audio relationship and a timing node.
    // Also give every shape a unique ID before referring to its audio target.
    if (audioIds.length) {
      let timeId = 3;
      const effects = [], mediaNodes = [];
      audioIds.forEach(id => {
        const outer = timeId++, inner = timeId++, effect = timeId++, call = timeId++, media = timeId++;
        effects.push(`<p:par><p:cTn id="${outer}" fill="hold"><p:stCondLst><p:cond delay="indefinite"/></p:stCondLst><p:childTnLst><p:par><p:cTn id="${inner}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst><p:par><p:cTn id="${effect}" presetID="1" presetClass="mediacall" presetSubtype="0" fill="hold" nodeType="clickEffect"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst><p:cmd type="call" cmd="playFrom(0.0)"><p:cBhvr><p:cTn id="${call}" dur="1000" fill="hold"/><p:tgtEl><p:spTgt spid="${id}"/></p:tgtEl></p:cBhvr></p:cmd></p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par>`);
        mediaNodes.push(`<p:audio><p:cMediaNode vol="100000"><p:cTn id="${media}" fill="hold" display="0"><p:stCondLst><p:cond delay="indefinite"/></p:stCondLst><p:endCondLst><p:cond evt="onStopAudio" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:endCondLst></p:cTn><p:tgtEl><p:spTgt spid="${id}"/></p:tgtEl></p:cMediaNode></p:audio>`);
      });
      const sequence = `<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>${effects.join('')}</p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst><p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>`;
      xml = xml.replace('</p:sld>', `<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>${sequence}${mediaNodes.join('')}</p:childTnLst></p:cTn></p:par></p:tnLst></p:timing></p:sld>`);
    }
    zip.file(file.name, xml);
  }
  return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', compression: 'DEFLATE', compressionOptions: { level: 6 } });
}
