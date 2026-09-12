/** Navigation pictures are separate from the letters and words being learnt. */
export default function CampaignIcon({name}) {
  const paths={
    replay:<><path d="M19 8A8 8 0 1 0 20 15"/><path d="M19 3v5h-5"/></>,
    sound:<><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></>,
    map:<><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/></>,
    pause:<><path d="M8 5v14M16 5v14"/></>,
    jump:<><path d="M12 18V4m-6 6 6-6 6 6M4 21h16"/></>,
    use:<><path d="M8 12V5a2 2 0 0 1 4 0v6l1-2a2 2 0 0 1 3 1 2 2 0 0 1 3 2v4c0 4-3 6-6 6s-4-2-6-4l-3-4a2 2 0 0 1 3-2l1 1"/></>,
    help:<><path d="M9 18h6m-5 3h4M8 14a7 7 0 1 1 8 0l-1 2H9z"/></>,
    next:<><path d="M4 12h16m-7-7 7 7-7 7"/></>,
  };
  return <svg className="ss-picture-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]||paths.use}</svg>;
}
