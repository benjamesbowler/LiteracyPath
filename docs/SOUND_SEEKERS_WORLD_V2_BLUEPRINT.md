# Sound Seekers World V2 Blueprint

## Non-negotiable quality bar

Sound Seekers is one continuous adventure, not forty copies of one corridor. The phonics progression remains fixed and evidence-led, while the journey changes destination, terrain, cast, route shape, physical verb, set piece, music and chapter reward. Every visible character belongs to the same authored 3D language. Every selected creature part and every equipped item must remain visible together on the playable avatar.

The runtime source of truth is `src/data/questChapters.js`. Tests require exactly eight chapters, five stops per chapter, all forty curriculum stops assigned once, at least four route topologies per chapter, and a unique destination, score and reward for every chapter.

## Eight-chapter journey

| Chapter | Stops | Destination | Main conflict | Physical identity | Chapter reward |
| --- | --- | --- | --- | --- | --- |
| Seedwake Meadow | 1-5 | Bramble Gate | Dark sound-lantern gardens | Flowers, streams, orchards, bridges | Seedwake Lantern |
| River Gardens | 6-10 | Singing Weir | Runaway canals and cargo boats | Islands, ferries, sluices, waterwheels | River Whistle |
| Fossil Canyon | 11-15 | Claw Pass | Buried trail and missing dig crew | Bone arches, excavations, cliff routes | Fossil Compass |
| Forge Settlement | 16-20 | Word Forge | Jammed machines and stranded train | Workshops, rail yards, cranes, furnaces | Wordsmith Tool |
| Glass Marsh | 21-25 | Mirror Fen | Frozen reed mirrors and hidden paths | Lily ferries, luminous water, glass reeds | Mirror Reed |
| Storm Coast | 26-30 | Thunder Lighthouse | Scattered lens during a reading storm | Cliffs, coves, harbour, sea caves | Storm Lens |
| Lantern Forest | 31-35 | Sleeping Observatory | Rearranging paths and a blind dome | Root stairs, canopy bridges, lantern trees | Living Lantern Map |
| Star Reach | 36-40 | First Reading Star | Broken sky road and fading sounds | Floating gardens, light bridges, constellations | First Reading Star |

## Stop rhythm

Each chapter follows a five-part dramatic rhythm without forcing one repeated challenge layout:

1. Arrive and discover the local problem through movement.
2. Learn the chapter's physical verb in a low-pressure field task.
3. Use the verb in a branching or returning route with a meaningful choice.
4. Combine current phonics with spaced review under a changed world condition.
5. Complete a chapter set piece, permanently alter the world and earn a usable reward.

## Continuity rules

- A gate is a geographic connection, never a return to the letter menu.
- Collectibles persist across gates and visibly feed a repair, route unlock, creature relationship or reward meter.
- Repeated residents must move, react and change location; static encounter portraits are not an acceptable substitute.
- Chapter scenery may share a production kit, but adjacent stops may not share the same route topology and encounter staging.
- Chapter rewards change later play. They are not merely inventory thumbnails.

## Production order

1. Lock the chapter and curriculum contracts.
2. Make the saved creature the real articulated 3D player.
3. Replace the fixed negative-Z corridor with a route graph.
4. Build physical challenge modules against the evidence matrix.
5. Stream connected chapter sections and add persistent world repairs.
6. Add chapter-specific audio, authored models, effects, performance tiers and full playtesting.
