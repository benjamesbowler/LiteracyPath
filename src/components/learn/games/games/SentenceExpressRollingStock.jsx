import { useId } from 'react';

// Authored three-quarter rolling stock. Side panels remain clear for live words;
// roof, end wall, rim, undercarriage and independently rotating wheels give depth.
const PAINT = [['#68b0ef', '#245487'], ['#ffc45a', '#a86316'], ['#61c4a1', '#236650'], ['#b399ed', '#614392']];
function Wheel({ x, y, r, metal }) {
  return <g transform={`translate(${x} ${y})`}>
    <circle r={r + 1.5} fill="#14212a" />
    <g className="sx-wheel">
      <circle r={r} fill={metal} stroke="#24343c" strokeWidth="1.2" />
      <circle r={r * .72} fill="#263942" />
      {[0, 60, 120].map(a => <path key={a} d={`M${-r * .67} 0H${r * .67}`} transform={`rotate(${a})`} stroke="#b7c5c6" strokeWidth="2" />)}
      <circle r="2.4" fill="#edcd86" />
    </g>
  </g>;
}
export default function SentenceExpressRollingStock({ kind = 'wagon', tone = 0, rusty = false }) {
  const id = useId().replace(/:/g, '');
  const [hi, lo] = rusty ? ['#b99263', '#715037'] : kind === 'engine' ? ['#f38162', '#9b352e'] : kind === 'caboose' ? ['#e98062', '#963c31'] : PAINT[tone % PAINT.length];
  const fill = name => `url(#${id}-${name})`;
  const engine = kind === 'engine';
  const width = engine ? 170 : 150;
  return <svg className="sx-carsvg" viewBox={`0 0 ${width} 116`} aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-paint`} x2="0" y2="1"><stop stopColor={hi}/><stop offset=".38" stopColor={hi}/><stop offset="1" stopColor={lo}/></linearGradient>
      <linearGradient id={`${id}-roof`} x2="0" y2="1"><stop stopColor="#9aadb0"/><stop offset=".28" stopColor="#526a74"/><stop offset="1" stopColor="#243b48"/></linearGradient>
      <linearGradient id={`${id}-metal`} x2="1" y2="1"><stop stopColor="#d0d9d4"/><stop offset=".45" stopColor="#70878c"/><stop offset="1" stopColor="#344d58"/></linearGradient>
      <linearGradient id={`${id}-glass`} x2="1" y2="1"><stop stopColor="#edffff"/><stop offset=".4" stopColor="#99d8e4"/><stop offset="1" stopColor="#3b798e"/></linearGradient>
    </defs>
    <ellipse cx={width / 2} cy="108" rx={width / 2 - 4} ry="6" fill="#172c30" opacity=".22"/>
    <path d={`M3 91H${width - 3}v7H3z`} fill="#253b47"/>
    <path d={`M8 91l10-5H${width - 13}l7 5z`} fill={fill('metal')}/>
    {engine ? <>
      <path d="M17 50Q11 47 17 41L91 34Q106 38 106 59V87H19Z" fill={fill('paint')} stroke={lo} strokeWidth="1.5"/>
      <ellipse cx="19" cy="65" rx="9" ry="23" fill={lo}/>
      <ellipse cx="18" cy="64" rx="6" ry="18" fill={fill('roof')}/>
      <path d="M31 41v45M82 36v50" stroke="#edce88" strokeWidth="3"/>
      <path d="M26 45Q60 38 91 39" fill="none" stroke="#ffd1a0" strokeWidth="2" opacity=".7"/>
      <path d="M103 25l13-9h42v64l-13 10h-42z" fill={lo}/>
      <path d="M103 25h42v65h-42z" fill={fill('paint')} stroke={lo}/>
      <path d="M145 25l13-9v64l-13 10z" fill={lo}/>
      <path d="M98 22l13-11h48q6 0 6 7l-14 12H98z" fill={fill('roof')}/>
      <path d="M106 34h31v24h-31z" fill={fill('glass')} stroke="#263d48" strokeWidth="3"/>
      <path d="M148 32l7-5v22l-7 5z" fill={fill('glass')}/>
      <path d="M29 16h13l-1 30H30z" fill={fill('roof')}/>
      <ellipse cx="35.5" cy="16" rx="10" ry="4" fill="#2a424d"/>
      <ellipse cx="35.5" cy="15" rx="7" ry="2" fill="#102932"/>
      <path d="M62 36v-5q0-8 8-8t8 8v4" fill="#dfb657" stroke="#8c7136"/>
      <circle cx="12" cy="59" r="6" fill="#ffdc83" stroke="#a18148" strokeWidth="2"/>
      <circle cx="11" cy="57" r="2.5" fill="#fff9d7"/>
      <path d="M1 96l12-20 11 19z" fill={fill('metal')} stroke="#334b55"/>
      <Wheel x={46} y={101} r={12} metal={fill('metal')}/><Wheel x={83} y={101} r={12} metal={fill('metal')}/><Wheel x={125} y={103} r={9} metal={fill('metal')}/>
      <path className="sx-piston" d="M43 103H86" stroke="#d4d9cc" strokeWidth="3" strokeLinecap="round"/>
    </> : <>
      <path d="M9 36l13-10h122v53l-12 11H9z" fill={lo}/>
      <path d="M9 36h123v54H9z" fill={fill('paint')} stroke={lo} strokeWidth="1.5"/>
      <path d="M132 36l12-10v53l-12 11z" fill={lo}/>
      <path d="M4 34q0-9 8-9l12-9h117q7 0 7 9l-12 11H4z" fill={fill('roof')}/>
      <path d="M12 26H136" stroke="#c2d0c8" opacity=".65" strokeWidth="1.5"/>
      <path d="M14 41H127M14 84H127" stroke="#ffdf99" opacity=".6" strokeWidth="1.5"/>
      {kind === 'caboose' && <>
        <path d="M55 17V7h39l9-5v18l-9 6H55z" fill={lo}/>
        <path d="M55 7h39v17H55z" fill={fill('paint')}/>
        <path d="M52 7l9-6h41l4 5H52z" fill={fill('roof')}/>
        <path d="M62 11h10v9H62zM79 11h10v9H79z" fill={fill('glass')}/>
        <path d="M138 39v44M135 46h7m-7 8h7m-7 8h7m-7 8h7" stroke="#acb6ad" strokeWidth="1.5"/>
      </>}
      {kind === 'wagon' && [20, 45, 97, 122].map(x => <path key={x} d={`M${x} 40v43`} stroke={lo} opacity=".5"/>)}
      {rusty && [25, 62, 112].map((x, i) => <path key={x} d={`M${x} ${77-i*12}l7-4 5 6-4 6-9-2z`} fill="#6a4830" opacity=".7"/>)}
      {[17, 125].map(x => <g key={x} fill="#ecd49c"><circle cx={x} cy="43" r="1.2"/><circle cx={x} cy="81" r="1.2"/></g>)}
      <Wheel x={37} y={102} r={10} metal={fill('metal')}/><Wheel x={108} y={102} r={10} metal={fill('metal')}/>
    </>}
    <path className="sx-coupler" d={`M${width - 9} 94h8v5h-8`} fill="#a1aaa1" stroke="#30424a"/>
  </svg>;
}
