import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Run the real hook with a minimal hook host and event-driven media element.
// Media events/gesture permissions are external browser behavior, not scoring.
async function host(t) {
 const saved={Audio:globalThis.Audio,window:globalThis.window,document:globalThis.document};
 const instances=[],states=[],cleanups=[];let gesture=false;
 class AudioElement {
  constructor(){this.src='';this.currentTime=0;this.paused=true;this.granted=false;instances.push(this);}
  play(){if(gesture)this.granted=true;if(!this.granted)return Promise.reject(Object.assign(Error('Gesture required'),{name:'NotAllowedError'}));this.paused=false;this.onplaying?.();return Promise.resolve();}
  pause(){this.paused=true;}
  end(){this.onended?.();}
 }
 globalThis.Audio=AudioElement;
 const events={};
 globalThis.window={addEventListener(name,listener){events[name]=listener;},removeEventListener(){}};
 globalThis.document={hidden:false,addEventListener(name,listener){events[name]=listener;},removeEventListener(){}};
 const modulePath=new URL('../../src/utils/mockAudioElement.js',import.meta.url);
 const shared=fs.existsSync(modulePath)?await import(`${modulePath}?test=${Date.now()}-${Math.random()}`):{};
 const source=fs.readFileSync(new URL('../../src/hooks/useMockAudio.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('export function useMockAudio','function useMockAudio');
 const useState=initial=>{const i=states.length;states.push(initial);return [initial,value=>{states[i]=typeof value==='function'?value(states[i]):value;}];};
 const hook=new Function('useState','useRef','useCallback','useEffect','STOP_CHILD_AUDIO_EVENT','getMockAudioElement',`${source}\nreturn useMockAudio;`)(useState,value=>({current:value}),fn=>fn,fn=>{const cleanup=fn();if(cleanup)cleanups.push(cleanup);},'stop-child-audio',shared.getMockAudioElement);
 t.after(()=>{for(const cleanup of cleanups.reverse())cleanup();Object.assign(globalThis,saved);});
 return {instances,states,hook,events,gesture:fn=>{gesture=true;const result=fn();gesture=false;return result;}};
}

test('one gesture plays the complete assessment sequence on the same permitted media element',async t=>{
 const h=await host(t),audio=h.hook([{path:'/audio/first.mp3'},{path:'/audio/second.mp3'}]);
 const playing=h.gesture(()=>audio.play());
 assert.equal(h.instances.length,1);h.instances[0].end();await Promise.resolve();await Promise.resolve();
 assert.equal(h.instances.length,1,'A new element loses the iPad gesture permission between required clips');
 assert.equal(h.instances[0].src,'/audio/second.mp3');h.instances[0].end();await playing;
 assert.deepEqual(h.states[0],{'/audio/first.mp3':'completed','/audio/second.mp3':'completed'});
 assert.equal(h.states[2],false);
});

test('playing without progress cannot leave Listen frozen forever or count as completed',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const h=await host(t),audio=h.hook([{path:'/audio/frozen.mp3'}]);
 const playing=h.gesture(()=>audio.play());
 t.mock.timers.tick(16000);await Promise.resolve();
 assert.equal(h.states[1],false,'A player that emits playing then freezes must leave the busy state');
 assert.equal(h.states[0]['/audio/frozen.mp3'],'failed');await playing;
});

test('repeated buffering/playing notifications without clock progress cannot postpone the stall deadline',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const h=await host(t),audio=h.hook([{path:'/audio/buffering.mp3'}]);
 const playing=h.gesture(()=>audio.play());
 t.mock.timers.tick(5000);h.instances[0].onwaiting?.();
 t.mock.timers.tick(5000);h.instances[0].onplaying?.();
 t.mock.timers.tick(6000);await Promise.resolve();
 assert.equal(h.states[1],false);assert.equal(h.states[0]['/audio/buffering.mp3'],'failed');await playing;
});

test('a delayed timeupdate event does not fail audio whose native playback clock advanced',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const h=await host(t),audio=h.hook([{path:'/audio/long-passage.mp3'}]);
 const playing=h.gesture(()=>audio.play());
 // Media plays outside the page event loop. Its clock can advance before
 // WebKit delivers another timeupdate (for example while that loop is busy).
 h.instances[0].currentTime=12;
 t.mock.timers.tick(16000);await Promise.resolve();
 assert.equal(h.states[0]['/audio/long-passage.mp3'],undefined,'A stale event deadline is not a media failure');
 assert.equal(h.instances[0].paused,false,'Do not interrupt an advancing recording');
 h.instances[0].end();await playing;
 assert.equal(h.states[0]['/audio/long-passage.mp3'],'completed');
});

test('native clock progress at a delayed deadline still requires ended and a later genuine stall fails',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const h=await host(t),audio=h.hook([{path:'/audio/progress-then-stall.mp3'}]);
 const playing=h.gesture(()=>audio.play());h.instances[0].currentTime=9;
 t.mock.timers.tick(16000);await Promise.resolve();
 assert.equal(h.states[0]['/audio/progress-then-stall.mp3'],undefined);
 t.mock.timers.tick(16000);await playing;
 assert.equal(h.states[0]['/audio/progress-then-stall.mp3'],'failed');
});

test('autoplay denial is recoverable with a speaker tap and never becomes a media failure',async t=>{
 const h=await host(t),audio=h.hook([{path:'/audio/tap.mp3'}]);
 await audio.play();assert.equal(h.states[2],true);assert.equal(h.states[0]['/audio/tap.mp3'],undefined);
 const playing=h.gesture(()=>audio.play());h.instances.at(-1).end();await playing;
 assert.equal(h.states[0]['/audio/tap.mp3'],'completed');assert.equal(h.states[2],false);
});

test('an interrupted queue stops without fabricated receipts or later clips',async t=>{
 const h=await host(t),audio=h.hook([{path:'/audio/a.mp3'},{path:'/audio/b.mp3'}]);
 const playing=h.gesture(()=>audio.play());audio.stop();await playing;
 assert.deepEqual(h.states[0],{});assert.equal(h.instances.length,1);assert.equal(h.states[1],false);
});

test('a choice-speaker interruption completes the remaining required cues rather than stranding Next',async t=>{
 const h=await host(t),audio=h.hook([{path:'/audio/direction.mp3'},{path:'/audio/choice.mp3'}]);
 const initial=h.gesture(()=>audio.play());
 const replay=h.gesture(()=>audio.play([{path:'/audio/choice.mp3'}]));
 h.instances[0].end();await Promise.resolve();await Promise.resolve();
 assert.equal(h.instances[0].src,'/audio/direction.mp3','Unheard required material must resume after the requested replay');
 h.instances[0].end();await Promise.all([initial,replay]);
 assert.deepEqual(h.states[0],{'/audio/choice.mp3':'completed','/audio/direction.mp3':'completed'});
});

test('sound-check permission survives a new question hook without a fresh media element',async t=>{
 const h=await host(t),check=h.hook([{path:'/audio/check.mp3'}]);
 const first=h.gesture(()=>check.play());h.instances[0].end();await first;check.stop();
 const question=h.hook([{path:'/audio/question.mp3'}]),playing=question.play();
 assert.equal(h.instances.length,1);h.instances[0].end();await playing;
});

test('a new playback owner cancels the older queue and its later cleanup cannot pause the new clip',async t=>{
 const h=await host(t),first=h.hook([{path:'/audio/old.mp3'}]),second=h.hook([{path:'/audio/new.mp3'}]);
 const oldPlaying=h.gesture(()=>first.play()),newPlaying=second.play();
 assert.equal(h.states[1],false,'Only one queue can own the shared Safari element');
 first.stop();assert.equal(h.instances[0].paused,false,'Cleanup from a retired question must not stop its successor');
 h.instances[0].end();await Promise.all([oldPlaying,newPlaying]);
 assert.deepEqual(h.states[0],{});assert.equal(h.states[4]['/audio/new.mp3'],'completed');
});

const flushAudio = async () => { await Promise.resolve(); await Promise.resolve(); };
const processingCues = [{role:'direction',path:'/audio/question.mp3'}, {role:'stimulus',path:'/audio/stimulus.mp3'},
 {role:'choice',path:'/audio/one.mp3'}, {role:'choice',path:'/audio/two.mp3'}];

test('answer narration waits two seconds after the final stimulus ends, not after it starts',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const h=await host(t),audio=h.hook(processingCues),playing=h.gesture(()=>audio.play());
 h.instances[0].end();await flushAudio();
 assert.equal(h.instances[0].src,'/audio/stimulus.mp3');
 t.mock.timers.tick(5000);h.instances[0].end();await flushAudio();
 t.mock.timers.tick(1999);await flushAudio();
 assert.equal(h.instances[0].src,'/audio/stimulus.mp3','Give the child the full processing pause after ended');
 assert.equal(h.instances[0].paused,true);
 assert.equal(h.states[1],true,'The required audio queue remains pending during processing time');
 t.mock.timers.tick(1);await flushAudio();
 assert.equal(h.instances[0].src,'/audio/one.mp3');
 h.instances[0].end();await flushAudio();
 assert.equal(h.instances[0].src,'/audio/two.mp3','Do not insert question-processing delays between answers');
 h.instances[0].end();await playing;
});

test('stop during the processing pause cancels future answers without recording their delivery',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const h=await host(t),audio=h.hook([processingCues[0],processingCues[2]]),playing=h.gesture(()=>audio.play());
 h.instances[0].end();await flushAudio();audio.stop();
 t.mock.timers.tick(3000);await playing;
 assert.equal(h.instances[0].src,'/audio/question.mp3');
 assert.deepEqual(h.states[0],{'/audio/question.mp3':'completed'});
 assert.equal(h.states[1],false);
});

test('backgrounding during processing cancels the pause and never starts an answer in the background',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const h=await host(t),audio=h.hook([processingCues[0],processingCues[2]]),playing=h.gesture(()=>audio.play());
 h.instances[0].end();await flushAudio();document.hidden=true;h.events.visibilitychange();
 t.mock.timers.tick(3000);await playing;
 assert.equal(h.instances[0].src,'/audio/question.mp3');
 assert.equal(h.states[1],false);
});

test('answer-speaker interruption delivers unheard question material before the processing pause',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const h=await host(t),audio=h.hook([processingCues[0],processingCues[2]]);
 const initial=h.gesture(()=>audio.play()),replay=h.gesture(()=>audio.play([processingCues[2]]));
 assert.equal(h.instances[0].src,'/audio/question.mp3');
 h.instances[0].end();await flushAudio();t.mock.timers.tick(1999);await flushAudio();
 assert.equal(h.instances[0].src,'/audio/question.mp3');
 t.mock.timers.tick(1);await flushAudio();assert.equal(h.instances[0].src,'/audio/one.mp3');
 h.instances[0].end();await Promise.all([initial,replay]);
});

test('question replay during processing restarts the question and owns its own full pause',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const h=await host(t),audio=h.hook([processingCues[0],processingCues[2]]);
 const initial=h.gesture(()=>audio.play());h.instances[0].end();await flushAudio();t.mock.timers.tick(1000);
 const replay=h.gesture(()=>audio.play());
 t.mock.timers.tick(2000);await flushAudio();
 assert.equal(h.instances[0].src,'/audio/question.mp3');assert.equal(h.instances[0].paused,false);
 h.instances[0].end();await flushAudio();t.mock.timers.tick(1999);await flushAudio();
 assert.equal(h.instances[0].src,'/audio/question.mp3');
 t.mock.timers.tick(1);await flushAudio();h.instances[0].end();await Promise.all([initial,replay]);
});


test('a newer audio owner cancels an old processing timer without pausing the new clip',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const h=await host(t),old=h.hook([processingCues[0],processingCues[2]]);
 const first=h.gesture(()=>old.play());h.instances[0].end();await flushAudio();
 const newer=h.hook([{role:'direction',path:'/audio/new.mp3'}]),second=newer.play();
 old.stop();t.mock.timers.tick(2100);await flushAudio();
 assert.equal(h.instances[0].src,'/audio/new.mp3');assert.equal(h.instances[0].paused,false);
 h.instances[0].end();await Promise.all([first,second]);
 assert.deepEqual(h.states[0],{'/audio/question.mp3':'completed'});
});

test('an inactive question cannot restart narration from a queued autoplay or replay callback',async t=>{
 const h=await host(t),audio=h.hook(processingCues,false);
 await h.gesture(()=>audio.play());
 assert.equal(h.instances.length,0);
 assert.deepEqual(h.states[0],{});
});
