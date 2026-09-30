// Final line art derived from the six current Guide portraits, using the
// built-in image tool. Region coordinates use a normalised 1024-square canvas.
// Connected head/body regions share a code; independent leaves/stars have
// separate codes. Labels avoid eyes, noses, mouths, veins and small markings.
export const WORKSHEET_CHARACTER_ART = [
  { id: 'muddy', name: 'Muddy', regions: [[490,330,0],[560,760,0],[125,205,1],[93,464,1],[118,700,1],[925,160,2],[920,460,2],[915,720,2]] },
  { id: 'chompy', name: 'Chompy', regions: [[545,260,0],[605,835,0],[125,162,1],[93,405,1],[122,640,1],[885,142,2],[902,387,2],[913,638,2]] },
  { id: 'pip', name: 'Pip', regions: [[485,280,0],[570,800,0],[116,197,1],[105,532,1],[132,800,1],[898,214,2],[909,529,2],[911,815,2]] },
  { id: 'fluff', name: 'Fluff', regions: [[550,259,0],[474,820,0],[114,170,1],[92,630,1],[101,863,1],[913,161,2],[922,641,2],[904,877,2]] },
  { id: 'chips', name: 'Chips', regions: [[500,270,0],[559,645,0],[100,230,1],[103,602,1],[123,854,1],[898,160,2],[923,537,2],[823,690,2]] },
  { id: 'socks', name: 'Socks', regions: [[545,298,0],[622,743,0],[119,160,1],[83,432,1],[87,660,1],[897,191,2],[920,582,2],[906,828,2]] }
];
