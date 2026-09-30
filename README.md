# Thy Kingdom Come

A browser incremental game set in a medieval kingdom, built with React, TypeScript and Vite.

You start by foraging for food. Once you have enough food you can gather wood, and wood builds houses and farms. Houses grow your population, and you assign people to jobs. Scholars earn research points, research unlocks farmers and lumberjacks, and soldiers add to your might. Every 2 seconds is one in-game day, and the season changes how much food foraging and farms produce. Everyone eats, and if food runs out, people starve.

## Getting started

You need Node.js 18 or later.

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually http://localhost:5173). Refreshing the page starts a new game.

Other scripts: `npm run build`, `npm run lint`, `npm run preview`.

## Solution retrospective

**Status:** Paused while I work on other projects (currently cheap-records-api) and build up my game design knowledge.

### What are you most proud of, and what would you do differently next time?

Rebuilding the state into a single typed `Game` object was the biggest win. I wasn't sure how to manage game logic with React state, and getting that set up defined the structure for everything after it. The job rules (`jobRules` and `canAssign`) made adding new jobs much easier, and the code easier to understand. Next time I'd spend more time on game design and write a structured gameplay plan before building any logic. Not having one is still the main reason for the delays, and it's why so much is hardcoded or commented out. Seeds are the clearest example: they made sense in my head, but in practice they slowed progress in a way that wasn't satisfying to play, so I removed them. I also tried having Claude generate an MVP plan, but handing that much to AI didn't fix the gap in my own game design knowledge, so I scrapped it.

### What challenges did you encounter, and how did you overcome them?

The tick loop was the hardest part, because I hadn't written this kind of logic before. My first version had eight separate `useState` calls, so reading one value inside the interval meant nesting setters (`setPeople` inside `setHouses` inside `setSeconds`). That got messy fast and pushed me to move everything into one `Game` object that the interval updates with `setGame(prev => ...)`. Intervals were also stacking and speeding the game up, until I added the empty dependency array and `clearInterval` cleanup. Job assignment used to need its own error message in each function, so I moved the checks into one `assignJobs` function that logs the error and stops the assignment if it's not allowed.

### What's next?

When I come back to it, I'll write a plan first and build from that. The idea is to use the mechanics that are already there to make a good core loop, then get feedback and build from there.
