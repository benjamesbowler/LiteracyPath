// Preview reporting reads public route attributes only. A campaign stage does
// not imply that a requested legacy fixture phase has been reached.
export function readSoundSeekersPreviewReadiness(document,{hasFixture=false}={}) {
  const campaign=document.querySelector('[data-sound-seekers-game][data-presentation]');
  if(campaign){
    const view=campaign.getAttribute('data-presentation')||null;
    const stageStatus=campaign.getAttribute('data-runtime-status')||null;
    const status=stageStatus==='error'?'error':view&&stageStatus==='ready'?'ready':'loading';
    return {status,currentPhaseId:null,view,stageStatus};
  }
  const legacy=document.querySelector('[data-sound-seekers-game="v2"]');
  const currentPhaseId=legacy?.getAttribute('data-phase-id')||null;
  const view=legacy?.getAttribute('data-view')||null;
  const stageStatus=legacy?.querySelector('[data-sound-seekers-stage]')?.getAttribute('data-runtime-status')||null;
  const ready=Boolean(legacy&&view)&&(!hasFixture||Boolean(currentPhaseId))&&stageStatus!=='loading';
  return {status:ready?'ready':'loading',currentPhaseId,view,stageStatus};
}
