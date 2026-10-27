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
