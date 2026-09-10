import { useEffect, useState } from "react";
import { getChildWordAsset } from "../../../../data/childAssets.js";

// The same scene exists before and after Use. Only the object and its affected
// pieces change. Animation carries no score and reduced motion shows the same
// settled result immediately. Existing reviewed images are rendered unchanged.
export function WorkshopObjectAction({ target, active }) {
  const asset = getChildWordAsset(target.word);
  const [failed, setFailed] = useState([]);
  const image = [asset?.image, asset?.fallbackImage].find(candidate => candidate && !failed.includes(candidate));
  // SVG <image> error delivery differs between browsers; the image loader
  // gives the same URL a dependable failure path without retrying it forever.
  useEffect(() => {
    if (!image) return;
    const loader = new Image();
    loader.onerror = () => setFailed(previous => [...new Set([...previous, image])]);
    loader.src = image;
    return () => { loader.onerror = null; };
  }, [image]);
  const action = target.action;
  const water = ["float", "hop"].includes(action);
  const paper = ["write", "blow"].includes(action);
  const hanging = ["hang", "wave"].includes(action);
  const garden = ["grow", "park"].includes(action);
  const caption = active ? target.useResult : `Ready: ${target.label.toLowerCase()} and the ${target.destination}.`;

  return <div className={`lg-object-scene${active ? " is-used" : ""}`} data-action={action} data-state={active ? "used" : "ready"} role="img" aria-label={caption}>
    <svg viewBox="0 0 420 210" aria-hidden="true" focusable="false">
      <rect width="420" height="210" rx="18" fill={action === "fly" ? "#213752" : "#fff5df"} />
      {action === "fly" ? <g fill="#f9dc81"><path d="M335 24a27 27 0 1 0 35 36 26 26 0 0 1-35-36Z" /><circle cx="210" cy="32" r="3" /><circle cx="380" cy="98" r="3" /><circle cx="145" cy="71" r="2" /></g> : <>
        <path d="M0 146Q120 130 230 147T420 145V210H0Z" fill={water || garden ? "#bdd8bd" : "#ead4b3"} />
        <path d="M0 175H420M32 175v35m92-35v35m105-35v35m112-35v35" fill="none" stroke="#ccb393" strokeWidth="2" />
      </>}
      {water && <g><path d="M29 146Q96 122 202 143T397 142L380 193H42Z" fill="#88cdd9" stroke="#438998" strokeWidth="3" /><path d="M52 164q22-12 43 0t43 0m108 10q22-12 43 0t43 0" fill="none" stroke="#eaffff" strokeWidth="4" />{action === "hop" && <path d="M273 153c-23-27-79-7-73 13 6 22 88 22 99-3l-26-10 14-17Z" fill="#599e69" stroke="#376849" strokeWidth="3" />}</g>}
      {paper && <g className={action === "blow" ? "lg-object-paper" : ""}><path d="M182 83h148l-6 96H175Z" fill="#fffefd" stroke="#8198a6" strokeWidth="3" /><path d="M197 105h109m-111 22h109m-112 22h74" stroke="#d0e0e6" strokeWidth="3" />{action === "blow" && <path d="M334 139h58v51h-58Z" fill="#b7936a" stroke="#795b40" strokeWidth="3" />}</g>}
      {action === "write" && <path className="lg-object-ink" d="M197 149q25-66 50-26t61-14" pathLength="1" fill="none" stroke="#386ba5" strokeWidth="5" strokeLinecap="round" />}
      {action === "clean" && <g className="lg-object-puddle" fill="#82bdcc" stroke="#438998" strokeWidth="2"><ellipse cx="262" cy="170" rx="67" ry="19" /><ellipse cx="345" cy="178" rx="13" ry="6" /></g>}
      {action === "rest" && <g><ellipse cx="255" cy="167" rx="95" ry="27" fill="#bb7780" stroke="#884e5a" strokeWidth="3" /><ellipse cx="255" cy="167" rx="77" ry="18" fill="none" stroke="#ead0b2" strokeWidth="4" /></g>}
      {action === "room" && <g stroke="#8e7256" strokeWidth="4"><path d="M179 142V30h159v112" fill="#f5debd" /><path d="M205 42h100v65H205Z" fill="#c7e0e4" /><path d="M255 42v65m-50-33h100" /><path d="M180 142h160" /></g>}
      {hanging && <g stroke="#897053" strokeWidth="6" fill="#d4aa71">{action === "wave" ? <><path d="M251 22v167" /><circle cx="251" cy="22" r="6" /></> : <><path d="M176 59h186v20H176Z" /><path d="M261 78v32q0 14 13 4" fill="none" /></>}</g>}
      {["drive", "rail"].includes(action) && <g><path d="M12 157h396v33H12Z" fill={action === "rail" ? "#b18c6b" : "#748187"} /><path d={action === "rail" ? "M20 161h380m-380 23h380" : "M20 174h380"} stroke="#fff6dc" strokeWidth="3" strokeDasharray={action === "rail" ? undefined : "17 13"} /><path d="M339 67v87m-20-85h40v32h-40Z" fill="#e3ac63" stroke="#7b5d40" strokeWidth="4" />{action === "rail" && <path d="M20 168h380" stroke="#8c644b" strokeWidth="20" strokeDasharray="6 14" />}</g>}
      {garden && <g>{target.destination === "window" && <g stroke="#799aa2" strokeWidth="5"><path d="M180 22h160v131H180Z" fill="#d0ebed" /><path d="M260 22v131m-80-65h160" /></g>}<path d="M179 181q59-53 147 0" fill="#65a076" /><path d="m350 171-5-26m0 11-12-8m12 3 13-10" fill="none" stroke="#4d7e57" strokeWidth="4" /></g>}
      {action === "light" && <><path d="M120 167h254v19H120Z" fill="#926f53" /><path className="lg-object-glow" d="m246 65-93 100h194Z" fill="#ffd363" opacity=".75" /><path d="M289 128h32v38h-32Z" fill="#8bac9d" /><path d="M299 128v-27m10 27v-21" stroke="#6a5a83" strokeWidth="5" /></>}
      {action === "plate" && <g><ellipse cx="260" cy="172" rx="94" ry="22" fill="#e1edf0" stroke="#7c9eaa" strokeWidth="4" /><ellipse cx="260" cy="172" rx="70" ry="13" fill="none" /></g>}
      {action === "drop" && <g><path d="m218 118 10 68h79l10-68Z" fill={target.word === "ring" ? "#c48b70" : "#87b4bd"} stroke="#4e7e8a" strokeWidth="4" /><path d="M224 136q-14-96 87 0" fill="none" stroke="#4e7e8a" strokeWidth="4" /></g>}
      {action === "catch" && <circle className="lg-object-ball" cx="100" cy="0" r="17" fill="#db9c54" stroke="#8e653f" strokeWidth="3" />}
      {action === "beat" && <g className="lg-object-sticks" stroke="#8f603f" strokeWidth="8" strokeLinecap="round"><path d="m205 56 48 61m64-61-48 61" /></g>}
      {action === "tick" && <g className="lg-object-ticks" stroke="#8d6c51" strokeWidth="4"><path d="M165 83h-21m193 0h-21m-145-38-16-12m167 12 16-12" /></g>}
      {action === "spin" && <g fill="#d8baa6" stroke="#b1907e" strokeWidth="2"><path d="m153 148 110-16 120 30-112 34Z" /><path d="m198 142 116 43m-64-51 108 39m-175-11 98-22" fill="none" /></g>}
      {action === "park" && <path d="M40 184q150-50 340 0" fill="none" stroke="#cca583" strokeWidth="24" />}
      {action === "post" && <g><path d="M173 96h199v90H173Z" fill="#fffef9" stroke="#859ba1" strokeWidth="3" /><path d="m173 96 98 62 101-62m-199 90 73-51m126 51-73-51" fill="none" stroke="#c6d2d5" strokeWidth="2" /></g>}
      {action === "comb" && <g stroke="#936744" strokeWidth="9" strokeLinecap="round" fill="none"><path className="lg-object-tangles" d="M217 87c-45 53 57 29 3 86m24-86c43 49-60 23 0 86m26-86c-41 55 53 30 3 86m23-86c43 49-45 37 0 86" /><path className="lg-object-smooth" d="M217 87q-7 45 0 86m27-86q-6 45 0 86m26-86q5 45 3 86m23-86q7 45 0 86" /></g>}
      <g className="lg-object-actor" data-object={target.word}>
        {image ? <image href={image} x="16" y="44" width="118" height="118" preserveAspectRatio="xMidYMid meet" onError={() => setFailed(previous => [...new Set([...previous, image])])} /> : <g><rect x="16" y="62" width="118" height="78" rx="12" fill="#fff" stroke="#8c7865" strokeWidth="3" /><text x="75" y="108" textAnchor="middle" fill="#433c35" fontSize="22">{target.word}</text></g>}
      </g>
    </svg>
  </div>;
}
