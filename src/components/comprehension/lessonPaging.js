// Page whole words against the actual rendered text box. Never shorten a story.
export function paginateLessonText(text, fits) {
 const words=text.trim().split(/\s+/).filter(Boolean);
 if(!words.length)return [''];
 const pages=[];
 for(let start=0;start<words.length;){
  let low=start+1,high=words.length,best=start+1;
  while(low<=high){const end=Math.floor((low+high)/2);if(fits(words.slice(start,end).join(' '))){best=end;low=end+1;}else high=end-1;}
  pages.push(words.slice(start,best).join(' '));start=best;
 }
 return pages;
}

// The first estimate uses plain text. Refine an overflowing rendered page using
// its real DOM runs/marks; move every remaining word forward without dropping it.
export function refineRenderedLessonPage(pages,index,fits){
 const current=pages[index];
 if(typeof current!=='string'||fits(current))return pages;
 const words=current.split(/\s+/).filter(Boolean);
 if(words.length<2)return pages;
 let low=1,high=words.length-1,best=1;
 while(low<=high){const end=Math.floor((low+high)/2);if(fits(words.slice(0,end).join(' '))){best=end;low=end+1;}else high=end-1;}
 const remaining=words.slice(best).join(' ');
 return [...pages.slice(0,index),words.slice(0,best).join(' '),`${remaining}${pages[index+1]?` ${pages[index+1]}`:''}`,...pages.slice(index+2)];
}
