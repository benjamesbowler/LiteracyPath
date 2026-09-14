export function Icon({name,size=24}) {
  const shapes={
    sound:<><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8q6 4 0 8M18 4q10 8 0 16"/></>,
    quiet:<><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m16 9 5 6m0-6-5 6"/></>,
    pause:<><path d="M8 5v14M16 5v14"/></>,
    play:<path d="m8 4 12 8-12 8Z"/>,
    arrow:<path d="M4 12h15m-6-6 6 6-6 6"/>,
    back:<path d="M20 12H5m6-6-6 6 6 6"/>,
    leaf:<><path d="M20 3C7 1 0 11 7 18 14 25 22 16 20 3Z"/><path d="M4 21 16 8"/></>,
    lantern:<><path d="M8 6V4a4 4 0 0 1 8 0v2M7 7h10l2 11-3 3H8l-3-3L7 7Z"/><path d="M9 7v12m6-12v12M7 18h10"/></>,
    basket:<><path d="M3 11h18l-3 10H6L3 11Zm3 0 6-9 6 9M8 14l1 4m7-4-1 4"/></>,
    bridge:<><path d="M2 18v-8m20 8v-8M2 13Q12 2 22 13M2 17Q12 8 22 17M7 9v6m5-8v6m5-4v6"/></>,
    flower:<><path d="M12 21v-9m0 6q-8 0-8-6 8 0 8 6Zm0-9C4 13 2 5 8 5c-2-6 10-6 8 0 6 0 4 8-4 4Z"/></>,
    check:<path d="m4 12 5 5L20 6"/>,
    map:<><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16"/></>,
    star:<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z"/>,
    home:<><path d="m2 11 10-8 10 8M5 9v12h14V9M10 21v-7h4v7"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name]||shapes.leaf}</svg>;
}
export function Flower({lit=false}) {return <span className={`flower-art ${lit?'lit':''}`} aria-hidden="true"><i/><i/><i/><i/><i/><b/></span>;}
export function Lantern({lit=false}) {return <span className={`lantern-art ${lit?'lit':''}`} aria-hidden="true"><i/><b/><em/></span>;}
