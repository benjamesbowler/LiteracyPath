import { useEffect,useRef,useState } from 'react';
import { adventureStickVector } from './engine/adventureControls.js';

export default function AdventureStick({onMove,depth}) {
 const held=useRef(null),moveRef=useRef(onMove),[offset,setOffset]=useState({x:0,y:0});
 useEffect(()=>{moveRef.current=onMove;},[onMove]);
 const release=()=>{if(held.current===null)return;held.current=null;setOffset({x:0,y:0});moveRef.current('analogX',0);moveRef.current('analogY',0);};
 useEffect(()=>{const stop=()=>{if(held.current===null)return;held.current=null;setOffset({x:0,y:0});moveRef.current('analogX',0);moveRef.current('analogY',0);};window.addEventListener('blur',stop);return()=>{window.removeEventListener('blur',stop);if(held.current!==null){moveRef.current('analogX',0);moveRef.current('analogY',0);}};},[]);
 function steer(event){if(held.current!==event.pointerId)return;const r=event.currentTarget.getBoundingClientRect(),v=adventureStickVector(event.clientX-r.left-r.width/2,depth?event.clientY-r.top-r.height/2:0);setOffset({x:v.x*42,y:v.y*42});onMove('analogX',v.x);onMove('analogY',depth?v.y:0);}
 return <div className="ss-adventure-stick" role="group" aria-label="Movement stick" tabIndex={0} onPointerDown={event=>{event.preventDefault();held.current=event.pointerId;event.currentTarget.setPointerCapture(event.pointerId);steer(event);}} onPointerMove={steer} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release} onBlur={release}>
  <span className="ss-stick-ring"/><span className="ss-stick-thumb" style={{transform:`translate(${offset.x}px,${offset.y}px)`}}/><span className="ss-stick-caption">Move</span>
 </div>;
}
