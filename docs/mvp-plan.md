# Thy Kingdom Come — MVP Gap Analysis, Plan & Worked Examples

> **You're writing the code. This doc is the analysis + guided sketches.** Snippets are deliberately incomplete — they show the *shape* of each mechanic, name the pattern, and flag the trade-offs, so you build it yourself rather than paste-and-hope.

---

## Context

You're building an incremental / city-builder hybrid (closest cousins: Kittens Game, A Dark Room) themed around a medieval kingdom. The game lives almost entirely in `src/App.tsx:1-461`, with mechanic identifiers in `src/consts/mechanicNames.tsx`. A 2-second tick equals one in-game day; 90 days per season, 360 per year.

Goal: a testable MVP — long enough to gather meaningful feedback, but not "complete in five minutes." The current build dead-ends in ~5 minutes not because the tester "won" but because there's nothing left to *do*. The plan below fixes that by wiring the dead-end systems you already have and adding **one** new system (raids) as the long-arc anchor.

**Locked-in decisions:**
- Long-arc anchor: **escalating raid waves** *from named neighbouring nations*. The long-term win condition (post-MVP) is conquering those same nations one by one. See **Post-MVP vision** below.
- Research tree: **5-6 nodes, 2 layers** (some nodes gate others).
- Save/load to `localStorage`: **in scope.**

---

## State of the game today (quick map)

- **Forage** (click) → random food, season-weighted — `App.tsx:210-242`
- **Food ≥ 10** unlocks Wood gathering (10 food → 1 wood) — `App.tsx:244-263, 399-404`
- **Wood** → Houses (10 +4 per build) — `App.tsx:265-280`
- **Wood** → Farms (10 +4 per build) — `App.tsx:305-320`
- **Population** auto-grows up to `houses × 2`; each person eats 4 food/tick — `App.tsx:322-369`
- **Jobs**: farmers (+5 food/tick), scholars (+0.5 RP/tick), soldiers (→ "might"), lumberjacks (commented out) — `App.tsx:43-48, 147-188, 326-385`
- **Research**: one node, **Farming** (40 RP) → reveals the farmer assignment button — `App.tsx:282-303, 427-435`

The unlock-gate framing (food → wood → research → farming) is a sound incremental instinct. The bones are right.

---

## Gaps the MVP must close

### 1. Dead-end mechanics *(highest leverage)*
- **Soldiers → Might.** Might is displayed (`App.tsx:436`) and never consumed. No raids, no enemies.
- **Scholars → RP → one upgrade.** Once Farming is researched, scholars are pointless.
- **Lumberjacks commented out** (`App.tsx:446-448`). No passive wood loop.
- **Population beyond your job slots is pure food drain.**

Wire these before adding anything else. New systems on top of dead systems is bad design.

### 2. No long-arc goal
No reason to keep playing. Raids fix this for MVP.

### 3. No "what's next" preview
Single highest-retention pattern in incrementals is **greyed-out future content** (Cookie Clicker, Forager, Kittens Game). After Farming is unlocked, nothing visibly waits.

### 4. No save state
Refresh wipes progress. Tester goodwill is fragile.

### 5. Pacing knobs *(defer — testers will surface this)*
- Early: pop scales faster than food, recovery from bad rolls is hard.
- Mid: ~2 farmers feeds ~2.5 people forever — optimisation puzzle collapses.

Don't pre-tune. Let testers tell you where the cliffs are.

### 6. Latent bug *(flag, not blocker)*
`App.tsx:357-361` — when no farmers exist, starvation does `newJobs.farmers = newJobs.lumberjacks - 1`. Since lumberjacks is unused, this sets farmers to `-1`. Almost certainly a typo. Fix as part of touching that file.

---

## MVP scope

### A. Raid system *(Pattern: encounter loop / Reigns; long-term: conquest setup)*
- Minor raid each season change (4× per in-game year) — generic raiding parties, no nation identity.
- Major named raid each year, **each from a distinct neighbouring nation** (e.g. Year 1 = Northmen, Year 2 = Eastern Khanate, Year 3 = Southern Empire). These nations *are* the post-MVP conquest targets — naming them now makes the bridge to the endgame free.
- Resolution by `might / strength` ratio: decisive win / costly stalemate / defeat — with appropriate loot or losses.

### B. Research tree — 5-6 nodes, 2 layers *(Pattern: prerequisite DAG)*
Three parallel branches (food / construction / defence), each with a layer-1 and layer-2 node:
```
Farming (40, no prereq)         ──> Crop Rotation (60)   [winter farm yield +1]
Carpentry (50, no prereq)       ──> Masonry (80)         [house capacity 2 → 3]
Military Drill (50, no prereq)  ──> Stone Walls (100)    [raid damage halved]
```
Locked nodes render greyed-out with their cost + prereq shown. Closes gap #3 simultaneously.

### C. Lumberjacks alive *(Pattern: parallel passive producer)*
Gated by Carpentry. ~0.5 wood/tick each. Mirrors farmers.

### D. localStorage save *(Pattern: persistence at the edge + debounce)*
Hydrate on mount; persist on state change (debounced). Versioned key. Reset button.

### E. Research effects apply to game math
Currently research only flips visibility. New nodes need to *change* numbers (e.g. winter yield, might multiplier, raid damage). Helper: `hasResearch(state, name)` called inside the math. Six conditionals are fine for MVP — **don't build a generic effect system.**

---

## Out of scope

- Conquest endgame implementation (see **Post-MVP vision** below — the win condition lives there. MVP raids are shaped to bridge into it cleanly, but none of the conquest mechanics ship now).
- Animations, sounds, particle effects.
- Multiple maps / spatial element.
- Prestige / new-game-plus.
- Trading / diplomacy / faith.
- Splitting `App.tsx` into components — **after** scope is locked. Becomes the first post-MVP refactor.

---

## Post-MVP vision — conquest endgame

> Captured here so the MVP doesn't accidentally close off the path. Nothing in this section ships in MVP. It exists to make sure the small MVP decisions don't paint the eventual endgame into a corner.

The long-term win condition is **conquest**: claim every surrounding nation until you've unified the map. *Thy Kingdom Come* pays off when no neighbour remains uncrowned.

**The bridge from MVP → endgame:**
- The raid waves *are* the future conquest targets. Each year-end major raid comes from a distinct neighbouring nation. The Northmen attacking you in year 1 is the same Northmen you'll eventually invade and annex.
- Minor raids stay flavour — unaffiliated raiding parties, not nations. Only major raids correspond to conquerable powers.
- Once the player can mount counter-attacks, the verb flips: surviving raids → choosing your campaigns → conquering the source.

**Likely endgame mechanic shape (post-MVP, *not now*):**
- Each nation has a `conquestThreshold` (much higher than its raid strength) and a campaign cost in food/wood/might.
- Declaring a campaign locks might away for several seasons (you're vulnerable to other nations' raids during the window).
- Successful conquest: that nation stops sending raids, grants a one-off windfall + a passive yield (border tribute), possibly unlocks a unique research node themed to that culture.
- Game end: every named nation defeated → "Thy kingdom has come."

**What this means for MVP (the only changes the vision forces):**
- Raid config uses **nation names**, not flavour tags — a one-line renaming.
- Optional `nationId` field on raids, unread in MVP — a single forward-compat hook so the conquest layer plugs into existing raid data later without a migration.
- The major-raid sequence is the seed list of conquerable nations — three is enough for MVP, but pick names you'd be happy to ship in the endgame.

**What this explicitly does NOT change in MVP:**
- No `defeatedNations` state field. Empty hooks rot — add it when you build the endgame.
- No conquest UI, no campaign mechanic, no "invade" button.
- No nation strength tracking beyond the raid strength itself.
- Don't try to balance MVP raid difficulty against the eventual conquest threshold — those are different numbers, set them when you need them.

---

## Critical files to touch

- `src/App.tsx` — state shape additions, tick handler additions, conditional research effects, UI for research tree + raid log + reset button.
- `src/consts/mechanicNames.tsx` — identifiers for the 5 new nodes.
- `src/consts/researchTree.ts` *(new)* — node config.
- `src/consts/raids.ts` *(new)* — raid strength curve, named-raid sequence, loot tables.

Existing helpers to reuse:
- `addUpdate()` (`App.tsx:62-67`) for raid log entries.
- `randomWithProbability()` (`App.tsx:192-208`) for raid outcome variance.
- `getSeason()` (`App.tsx:81-92`) for the seasonal trigger.

---

# Worked examples

> **Read these as guided sketches, not finished code.** I've left intentional gaps so the wiring happens in your head. Every snippet names the pattern and the trade-off — that's the part to internalise.

**Recommended build order:** save/load → research tree → lumberjacks → raids. Foundation first, small wiring next, big system last.

---

## Example 1 — Save/load to `localStorage` *(Pattern: persistence at the edge + debounce)*

The naive version saves on every state change. With a 2-second tick that's fine *now*, but you'll add fast-changing UI state (button hovers, etc.) and the spam matters. The idiomatic version debounces.

### The shape

```ts
const SAVE_KEY = 'thykingdomcome:save_v1';

// 1. Initial state factory — so Reset is trivial later
const initialGameState = (): Game => ({
  wood: 0, houses: 0, /* …everything else… */
});

// 2. Lazy initializer — runs once, reads localStorage on first mount
const [game, setGame] = useState<Game>(() => {
  const saved = localStorage.getItem(SAVE_KEY);
  if (!saved) return initialGameState();
  try {
    return { ...initialGameState(), ...JSON.parse(saved) };
  } catch {
    return initialGameState(); // corrupt save — start fresh
  }
});

// 3. Debounced persist
useEffect(() => {
  const timer = setTimeout(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
  }, 500);
  return () => clearTimeout(timer); // cancel if state changes again first
}, [game]);

// 4. Reset
const resetGame = () => {
  localStorage.removeItem(SAVE_KEY);
  setGame(initialGameState());
};
```

### Why the pieces matter

- **Lazy `useState` initialiser** — passing a *function* to `useState` runs it once. If you pass the parsed value directly, the JSON parse runs on every render. Tiny detail, real gotcha.
- **Spread `{ ...initialGameState(), ...JSON.parse(saved) }`** — if you ship a new field next week, old saves missing it will still hydrate cleanly. Cheap forward-compatibility.
- **Versioned key (`save_v1`)** — when the state shape changes incompatibly during testing, bump to `save_v2`. Old testers get a fresh start instead of a corrupted game.
- **Debounce via `setTimeout` + cleanup** — every state update cancels the pending write and starts a new 500ms timer. Only the *last* state in a burst hits disk. Named pattern: **trailing-edge debounce**. Same shape you'd use for typeahead search.
- **`try/catch` around `JSON.parse`** — a malformed value in localStorage shouldn't crash the app. Treat the storage boundary as an untrusted input — same hygiene as a `fetch` response.

### What would change later
- Migration step (`if (saved.schemaVersion < 2) { … }`) once you actually need to migrate.
- Move to IndexedDB if state grows beyond ~5 MB (localStorage cap).

---

## Example 2 — Research tree with prerequisites *(Pattern: config table + derived state)*

Config-driven UI is the right shape here. The data describes the tree; the rendering and math read it. You write the data once and the UI mostly takes care of itself.

### The data shape

```ts
// src/consts/researchTree.ts
export type ResearchId =
  | 'farming' | 'cropRotation'
  | 'carpentry' | 'masonry'
  | 'militaryDrill' | 'stoneWalls';

export interface ResearchNode {
  id: ResearchId;
  label: string;
  cost: number;
  prereqs: ResearchId[];
  description: string;
}

export const researchTree: ResearchNode[] = [
  { id: 'farming',       label: 'Farming',        cost: 40,  prereqs: [],          description: 'Assign farmers to fields.' },
  { id: 'cropRotation',  label: 'Crop Rotation',  cost: 60,  prereqs: ['farming'], description: '+1 farm yield in winter.' },
  { id: 'carpentry',     label: 'Carpentry',      cost: 50,  prereqs: [],          description: 'Assign lumberjacks.' },
  { id: 'masonry',       label: 'Masonry',        cost: 80,  prereqs: ['carpentry'], description: 'Houses hold 3 instead of 2.' },
  { id: 'militaryDrill', label: 'Military Drill', cost: 50,  prereqs: [],          description: 'Soldiers contribute 2 might instead of 1.5.' },
  { id: 'stoneWalls',    label: 'Stone Walls',    cost: 100, prereqs: ['militaryDrill'], description: 'Raid damage halved.' },
];
```

### Derived helpers (pure functions — easy to test, easy to reason about)

```ts
export const hasResearch = (state: Game, id: ResearchId) =>
  state.unlockedMechanics.includes(id);

export const prereqsMet = (state: Game, node: ResearchNode) =>
  node.prereqs.every((p) => hasResearch(state, p));

// "Available" = not already unlocked AND prereqs met
export const isAvailable = (state: Game, node: ResearchNode) =>
  !hasResearch(state, node.id) && prereqsMet(state, node);
```

### Applying effects to existing math

Currently you have:
```ts
const getFarmYield = (season: string): number => {
  if (season === "Summer") return 3;
  if (season === "Winter") return 1;
  return 2;
};
```
The minimal change:
```ts
const getFarmYield = (state: Game, season: string): number => {
  let base = season === 'Summer' ? 3 : season === 'Winter' ? 1 : 2;
  if (season === 'Winter' && hasResearch(state, 'cropRotation')) base += 1;
  return base;
};
```
Same shape for `might` (read `militaryDrill`), house capacity in `App.tsx:363-364` (read `masonry`), and raid damage (read `stoneWalls`).

### Rendering the tree

The UI just maps the config:

```tsx
{researchTree.map((node) => {
  const owned = hasResearch(game, node.id);
  const available = isAvailable(game, node);
  const canAfford = game.researchPoints >= node.cost;

  if (owned) return <div key={node.id} className="research--owned">{node.label} ✓</div>;

  return (
    <button
      key={node.id}
      disabled={!available || !canAfford}
      onClick={() => conductResearch(node.id, node.cost)}
      className={available ? 'research' : 'research--locked'}
      title={available ? node.description : `Requires: ${node.prereqs.join(', ')}`}
    >
      {node.label} ({node.cost} RP)
    </button>
  );
})}
```

### Why this shape

- **Config table + render-from-config** — the alternative is hard-coding each button in JSX. Adding a node would require touching three places (button, state field, effect). With this shape, you add one row + one math-side conditional. Same pattern as routing tables, form schemas, dropdown options.
- **`prereqs` as an array of ids, not nested children** — keeps the shape flat and lets one node be a prereq for multiple others later. Same reason database designs use foreign keys rather than nested documents.
- **Pure helpers** — `hasResearch`, `prereqsMet`, `isAvailable` take state in, return a boolean. No surprises, no side effects. You can write a 5-line test for each.
- **Render-don't-hide for locked nodes** — keeping them in the DOM (just `disabled` + dimmed CSS) is what closes gap #3. The carrot has to be visible.

### What would change later
- A real DAG visualisation (lines between prereq and dependent) — currently the layer is implicit in the data, not displayed.
- Effects as data (`effect: { type: 'farmYieldBonus', season: 'winter', amount: 1 }`) — only worth it once you have ~15+ nodes and the conditional sprawl is real. Six nodes is well under that line.

---

## Example 3 — Lumberjacks revival *(Pattern: parallel passive producer)*

Symmetric to farmers. Find the food-yield line in the tick handler and add the lumberjack equivalent for wood.

Currently (`App.tsx:343-346`):
```ts
newFood = newFood
  + seasonGameState.farms * getFarmYield(newSeason)
  + seasonGameState.jobs.farmers * FARMER_BONUS;
```

You'd add, just below:
```ts
const LUMBERJACK_YIELD = 0.5;
const newWood = seasonGameState.wood
  + seasonGameState.jobs.lumberjacks * LUMBERJACK_YIELD;
// …then include newWood in the returned state.
```

And uncomment the UI block at `App.tsx:446-448`, gated:
```tsx
{hasResearch(game, 'carpentry') && (
  <div>
    <span>Lumberjacks: {game.jobs.lumberjacks}</span>
    <button onClick={() => assignJobs('lumberjacks', -1)}>-1</button>
    <button onClick={() => assignJobs('lumberjacks', 1)}>+1</button>
  </div>
)}
```

That's the whole change. Tiny — but it validates that the research-effect pattern works end-to-end before you tackle the bigger raid system.

---

## Example 4 — Raid system *(Pattern: scheduled encounter + pure resolver)*

The biggest piece, but it splits cleanly into three small parts:

1. **Schedule** — *when* does a raid fire?
2. **Resolve** — given state + raid, what's the outcome and the resulting state?
3. **Trigger** — inside the tick, check if it's time, call the resolver, apply the result.

The resolver is a **pure function** — no React, no `setGame`, just `(state, raid) => { outcome, newState }`. That gives you something you can unit-test later without mounting the component.

### Data: the raid config

```ts
// src/consts/raids.ts
export interface Raid {
  name: string;
  strength: number;
  isMajor: boolean;
  nationId?: string; // present on major raids — unread in MVP, used by the post-MVP conquest layer
}

// Major raids — one per year, escalating. Each comes from a named neighbour.
// These nations are the future conquest targets (see Post-MVP vision in the plan doc).
export const namedRaids: Raid[] = [
  { name: 'Northmen Warband',     strength: 5,  isMajor: true, nationId: 'northmen' },
  { name: 'Khanate Riders',       strength: 15, isMajor: true, nationId: 'khanate' },
  { name: 'Southern Legionaries', strength: 30, isMajor: true, nationId: 'southernEmpire' },
];

// Minor raid: scales with day count, with mild randomness.
export const minorRaid = (day: number): Raid => ({
  name: 'Raiders',
  strength: Math.max(2, Math.floor(day / 90) + Math.floor(Math.random() * 3)),
  isMajor: false,
});
```

### State additions

```ts
interface Game {
  // …existing fields…
  nextRaidDay: number;          // when the next raid fires
  yearsSurvived: number;        // for picking the next major raid
}
```

### The pure resolver

```ts
type RaidOutcome = 'decisive' | 'costly' | 'defeat';

interface RaidResult {
  outcome: RaidOutcome;
  message: string;
  newState: Game;
}

export const resolveRaid = (state: Game, raid: Raid): RaidResult => {
  const might = state.jobs.soldiers * (hasResearch(state, 'militaryDrill') ? 2 : 1.5);
  const ratio = might / Math.max(raid.strength, 1);
  const wallsBonus = hasResearch(state, 'stoneWalls') ? 0.5 : 1;

  if (ratio >= 1.5) {
    return {
      outcome: 'decisive',
      message: `Decisive victory over the ${raid.name}! +20 food, +10 wood.`,
      newState: { ...state, food: state.food + 20, wood: state.wood + 10 },
    };
  }

  if (ratio >= 0.5) {
    const foodLoss = Math.round(10 * wallsBonus);
    return {
      outcome: 'costly',
      message: `Held off the ${raid.name} at cost. -${foodLoss} food.`,
      newState: { ...state, food: Math.max(0, state.food - foodLoss) },
    };
  }

  const popLoss = Math.round((raid.isMajor ? 3 : 1) * wallsBonus);
  return {
    outcome: 'defeat',
    message: `The ${raid.name} overran your village! -${popLoss} people.`,
    newState: { ...state, people: Math.max(0, state.people - popLoss) },
  };
};
```

### The trigger, inside your existing tick

In the `useEffect` (`App.tsx:326-387`), after computing the new day but before returning:

```ts
let workingState = { /* …state assembled so far… */ };

if (workingState.days >= workingState.nextRaidDay) {
  const isYearEnd = workingState.days % 360 === 0 && workingState.days > 0;
  const raid = isYearEnd
    ? (namedRaids[workingState.yearsSurvived] ?? minorRaid(workingState.days))
    : minorRaid(workingState.days);

  const result = resolveRaid(workingState, raid);
  workingState = addUpdate(result.message, result.newState);
  workingState.nextRaidDay = workingState.days + 90;
  if (isYearEnd) workingState.yearsSurvived += 1;
}

return workingState;
```

### Why this shape

- **Pure resolver function** — `resolveRaid` takes state, returns state. No `useState`, no DOM, no time. You can test it in isolation: `expect(resolveRaid(stateWithNoSoldiers, bandits).outcome).toBe('defeat')`. Same separation backend engineers reach for when they isolate business logic from a Rails controller or Express handler. Named: **functional core, imperative shell** — the math is pure, the side-effect (`setGame`) lives at the edge.
- **Config-table raids** — same reason as research nodes: data describes the content, code consumes it. Adding "Vikings II" is one line in `namedRaids`.
- **Schedule via `nextRaidDay`, not modular arithmetic** — at first glance you could write `if (days % 90 === 0) { … }`. That breaks the moment you let the player *delay* a raid (research, item, anything). Storing the next-fire time lets future mechanics manipulate it. Named: **next-event timestamp**, same pattern a job scheduler or cron table uses.
- **Walls bonus as a multiplier** — keeps the effect math read-once at the top, reduces conditional sprawl. Tiny but the kind of thing that compounds as you add more research nodes touching the same numbers.
- **`Math.max(0, …)`** — clamping at zero everywhere a resource can be subtracted is cheaper than thinking "could this go negative?" each time. Belt-and-braces.

### What would change later
- Raids as events with **phases** (warning → arrival → resolution) so you have a "prepare your forces" beat in between. That's narrative texture, not MVP.
- Multiple raid *types* (food raid steals food, slaver raid steals people) — currently all raids resolve uniformly. Easy extension: add a `kind` field on `Raid` and branch in the resolver.
- A pause / "play next turn" button so the player can choose when to engage. Real-time-with-pause is the **Crusader Kings / Stardew Valley** pattern. Worth considering after testers tell you the real-time pressure feels right or wrong.

---

## Reference patterns from other games

When you want to look the pattern up directly:

- **Kittens Game** — closest sibling. Steal: progression cadence, science tree shape.
- **A Dark Room** — narrative reveal-as-loop. Steal: slow drip of new mechanics.
- **Reigns** — card-based event encounters. Steal: the raid-event shape.
- **Vampire Survivors / Brotato** — escalating timed waves. Steal: cadence + named milestone enemies.
- **Forager** — visible branching skill tree. Steal: locked-node previews.
- **Banished / Frostpunk** — survival-citybuilders with seasonality. Steal: pacing intuition.
- **Civilization / Total War** — 4X conquest. Steal: the named-neighbour identity and the "subjugate them all" arc that the raid waves bridge into post-MVP.
- **Crusader Kings** — neighbours as persistent named characters/realms, not statistics. Steal: how *naming* a foe makes them feel like a rival rather than a number.

---

## Verification — how to know the MVP is right

End-to-end tester flow that should be possible:
1. Tester reaches Wood unlock in ~1 min.
2. Reaches first Farming research in ~3-5 min.
3. Sees at least 2 further research nodes visibly locked during this window.
4. First minor raid fires by end of in-game year 1 (~12 min real time).
5. First named raid (Bandits) fires at end of year 1 — outcome is meaningful (clear win or clear loss depending on soldier investment).
6. Tester forms an opinion about whether they want to keep playing toward year 2's named neighbour.
7. Refresh mid-session preserves progress.

Failure modes to watch in feedback:
- If step 3 doesn't happen, locked-node previews aren't doing their job.
- If step 5 is a non-event ("I had no soldiers, lost nothing meaningful"), raid stakes aren't biting — raise the loss penalties.
- If testers reach research layer 2 in under 10 minutes, RP yields are too generous.

Manual test pass before handing to testers:
1. Run dev server. Play to first raid without assigning any soldiers — verify loss feels punishing.
2. Restart. Play with heavy soldier investment — verify win feels rewarding.
3. Unlock Carpentry → assign lumberjacks → verify passive wood loop works.
4. Unlock all three layer-1 nodes → verify each layer-2 node only becomes available with its prereq met.
5. Refresh page mid-game → verify state restores. Click Reset → verify it clears.
