import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import "./css/styles.css";
import mechanicsNames from "./consts/mechanicNames";

interface Update {
  id: string;
  message: string;
}

interface Probabilities {
  [key: string]: number;
}

interface Jobs {
  farmers: number;
  lumberjacks: number;
  soldiers: number;
  scholars: number;
}

interface Game {
  wood: number;
  houses: number;
  housePricing: number;
  people: number;
  food: number;
  farms: number;
  farmPricing: number;
  // seeds: number;
  days: number;
  updates: Update[];
  season: string;
  unlockedMechanics: string[];
  jobs: Jobs;
  researchPoints: number;
}

type JobRule = {
  canAssign?: (state: Game, newCount: number) => string | null;
};

const jobRules: Record<keyof Jobs, JobRule> = {
  farmers: {},
  lumberjacks: {},
  soldiers: {},
  scholars: {},
};

const getAddFoodMessage = (foodAmount: number, seedAmount: number) => {
  if (foodAmount > 0 && seedAmount > 0) {
    return `You have found ${foodAmount} food and ${seedAmount} seeds!`;
  } else if (foodAmount > 0) {
    return `You have found ${foodAmount} food`;
  } else if (seedAmount > 0) {
    return `You have found ${seedAmount} seed!`;
  } else {
    return "You found nothing!";
  }
};

const addUpdate = (message: string, previousGameState: Game) => {
  const newUpdate = { id: uuidv4(), message: message };
  const newAllUpdates = [newUpdate, ...previousGameState.updates];
  const slicedUpdates = newAllUpdates.slice(0, 10);
  return { ...previousGameState, updates: slicedUpdates };
};

const addSeasonUpdate = (
  oldSeason: string,
  newSeason: string,
  previousGameState: Game,
) => {
  if (oldSeason === newSeason) {
    return previousGameState;
  }
  const message = `It's now ${newSeason}`;
  return addUpdate(message, previousGameState);
};

const getSeason = (day: number) => {
  const remainder = day % 360;
  if (remainder < 90) {
    return "Spring";
  } else if (remainder < 180) {
    return "Summer";
  } else if (remainder < 270) {
    return "Autumn";
  } else {
    return "Winter";
  }
};

const getProbability = (season: string) => {
  if (season === "Spring") {
    return {
      1: 0.5,
      2: 0.45,
      0: 0.05,
    };
  }
  if (season === "Winter") {
    return {
      1: 0.09,
      2: 0.01,
      0: 0.9,
    };
  }
  return {
    1: 0.4,
    2: 0.1,
    0: 0.5,
  };
};

const FARMER_BONUS = 5;

const getFarmYield = (season: string): number => {
  if (season === "Summer") return 3;
  if (season === "Winter") return 1;
  return 2; // Spring and Autumn
};

export default function App() {
  const [game, setGame] = useState<Game>({
    wood: 0,
    houses: 0,
    housePricing: 10,
    people: 0,
    food: 0,
    farms: 0,
    farmPricing: 10,
    // seeds: 0,
    days: 0,
    updates: [],
    season: "Spring",
    unlockedMechanics: [],
    jobs: {
      farmers: 0,
      lumberjacks: 0,
      soldiers: 0,
      scholars: 0,
    },
    researchPoints: 0,
  });

  const jobs: Jobs = game.jobs;

  const might: number = Math.round(jobs.soldiers * 1.5);

  const getTotalJobs = (jobs: Jobs) =>
    jobs.farmers + jobs.lumberjacks + jobs.soldiers + jobs.scholars;

  const assignJobs = (title: keyof Jobs, amount: number) => {
    setGame((previousGameState) => {
      const totalJobs = getTotalJobs(previousGameState.jobs);
      const currentCount = previousGameState.jobs[title];
      const newCount = currentCount + amount;

      if (amount > 0 && totalJobs >= previousGameState.people) {
        return addUpdate(
          `You require more people to add a ${title}`,
          previousGameState,
        );
      }

      if (newCount < 0) {
        return addUpdate(
          `There are no ${title} left to unassign`,
          previousGameState,
        );
      }

      const rule = jobRules[title];
      const error = rule?.canAssign?.(previousGameState, newCount);
      if (error) {
        return addUpdate(error, previousGameState);
      }

      return {
        ...previousGameState,
        jobs: {
          ...previousGameState.jobs,
          [title]: newCount,
        },
      };
    });
  };

  //Todo: Move probability to utility file
  //Todo: Create probability objects to swap in and out
  function randomWithProbability(probabilities: Probabilities) {
    const random = Math.random();

    let cumulativeProb = 0;

    for (const [value, probability] of Object.entries(probabilities)) {
      cumulativeProb += probability;

      if (random <= cumulativeProb) {
        return parseFloat(value);
      }
    }

    return parseFloat(
      Object.keys(probabilities)[Object.keys(probabilities).length - 1],
    );
  }

  const addFood = () => {
    setGame((previousGameState) => {
      const probs = getProbability(previousGameState.season);
      // const seedAmount = randomWithProbability(probs);
      // const newGameSeeds = previousGameState.seeds + seedAmount;
      const foodAmount = randomWithProbability(probs);
      const newGameFood = previousGameState.food + foodAmount;
      const newUpdateMessage = getAddFoodMessage(foodAmount, 0);
      const newGameState = addUpdate(newUpdateMessage, previousGameState);

      if (
        newGameState.food >= 10 &&
        !newGameState.unlockedMechanics.includes(mechanicsNames.woodUnlocked)
      ) {
        const newGameMechanics = [
          ...newGameState.unlockedMechanics,
          mechanicsNames.woodUnlocked,
        ];
        return {
          ...newGameState,
          unlockedMechanics: newGameMechanics,
          food: newGameFood,
          // seeds: newGameSeeds,
        };
      }

      return {
        ...newGameState,
        food: newGameFood,
        // seeds: newGameSeeds,
      };
    });
  };

  const addWood = () => {
    setGame((previousGameState) => {
      if (previousGameState.food < 10) {
        return addUpdate(
          `You don't have enough food to complete this action`,
          previousGameState,
        );
      }

      const newGameWood = previousGameState.wood + 1;
      const newGameFood = previousGameState.food - 10;
      const gameState = addUpdate(`You gathered 1 wood`, previousGameState);

      return {
        ...gameState,
        wood: newGameWood,
        food: newGameFood,
      };
    });
  };

  const constructHouse = () => {
    setGame((prevGameState) => {
      if (prevGameState.wood < prevGameState.housePricing) {
        return addUpdate(
          "You require more wood to build a house",
          prevGameState,
        );
      }
      return {
        ...prevGameState,
        wood: prevGameState.wood - prevGameState.housePricing,
        housePricing: prevGameState.housePricing + 4,
        houses: prevGameState.houses + 1,
      };
    });
  };

  const constructFarm = () => {
    setGame((prevGameState) => {
      if (prevGameState.wood < prevGameState.farmPricing) {
        return addUpdate(
          "You require more wood to build a farm",
          prevGameState,
        );
      }
      return {
        ...prevGameState,
        wood: prevGameState.wood - prevGameState.farmPricing,
        farmPricing: prevGameState.farmPricing + 4,
        farms: prevGameState.farms + 1,
      };
    });
  };

  const populationEatsFood = (currentFood: number, populationCount: number) => {
    return currentFood + populationCount * -4;
  };

  useEffect(() => {
    const intervalID = setInterval(() => {
      setGame((prevGameState) => {
        const newSeconds = prevGameState.days + 1;
        const newSeason = getSeason(newSeconds);
        let newUpdates = prevGameState;
        const seasonGameState = addSeasonUpdate(
          prevGameState.season,
          newSeason,
          prevGameState,
        );

        let newFood = populationEatsFood(
          seasonGameState.food,
          seasonGameState.people,
        );

        newFood =
          newFood +
          seasonGameState.farms * getFarmYield(newSeason) +
          seasonGameState.jobs.farmers * FARMER_BONUS;
        let newPopulation;
        const newJobs = seasonGameState.jobs;

        if (newFood <= 0 && seasonGameState.people > 0) {
          newFood = 0;
          newPopulation = seasonGameState.people - 1;
          newUpdates = addUpdate(
            "Someone starved because you ran out of food! Build more farms!",
            prevGameState,
          );
          if (seasonGameState.jobs.farmers > 0) {
            newJobs.farmers = newJobs.farmers - 1;
          } else if (seasonGameState.jobs.lumberjacks > 0) {
            newJobs.farmers = newJobs.lumberjacks - 1;
          }
        } else {
          const shouldIncreasePopulation =
            seasonGameState.houses * 2 > seasonGameState.people;

          newPopulation = shouldIncreasePopulation
            ? seasonGameState.people + 1
            : seasonGameState.people;
        }

        const newResearchPoints =
          seasonGameState.researchPoints + seasonGameState.jobs.scholars * 0.5;

        return {
          ...seasonGameState,
          days: newSeconds,
          season: newSeason,
          people: newPopulation,
          food: newFood,
          jobs: newJobs,
          updates: newUpdates.updates,
          researchPoints: Math.round(newResearchPoints * 10) / 10,
        };
      });
    }, 2000);
    return () => clearInterval(intervalID);
  }, []);

  return (
    <div>
      <div>Days: {game.days}</div>
      <div>Season: {game.season}</div>
      <div>Population: {game.people}</div>
      <div>
        Food: {game.food}
        <button onClick={addFood}>Forage</button>
      </div>
      {/*{game.seeds > 0 ? <div>Seeds: {game.seeds}</div> : ""}*/}
      {game.unlockedMechanics.includes(mechanicsNames.woodUnlocked) && (
        <div>
          Wood: {game.wood}
          <button onClick={addWood}>Gather Wood (-10 Food)</button>
        </div>
      )}
      <div>
        Houses: {game.houses}
        <button onClick={constructHouse}>
          Construct House (-{game.housePricing} Wood)
        </button>
      </div>
      <div>
        Farms: {game.farms}
        <button onClick={constructFarm}>
          Construct Farm (-{game.farmPricing} Wood)
        </button>
      </div>
      <div>Might: {might}</div>
      <div>Research Points: {game.researchPoints}</div>
      <div>
        Assign Jobs:
        <div>
          <span>Farmers: {game.jobs.farmers}</span>
          <button onClick={() => assignJobs("farmers", -1)}>-1</button>
          <button onClick={() => assignJobs("farmers", 1)}>+1</button>
          <span>Soldiers: {game.jobs.soldiers}</span>
          <button onClick={() => assignJobs("soldiers", -1)}>-1</button>
          <button onClick={() => assignJobs("soldiers", 1)}>+1</button>
          <span>Scholars: {game.jobs.scholars}</span>
          <button onClick={() => assignJobs("scholars", -1)}>-1</button>
          <button onClick={() => assignJobs("scholars", 1)}>+1</button>
          {/*<span>Lumberjacks: {game.jobs.lumberjacks}</span>*/}
          {/*<button onClick={() => assignJobs("lumberjacks", -1)}>-1</button>*/}
          {/*<button onClick={() => assignJobs("lumberjacks", 1)}>+1</button>*/}
        </div>
      </div>
      <div className="Logs">
        <span className="Logs--Heading">Logs</span>
        {game.updates.map((update) => (
          <span key={update.id} className="Logs--Log-Info">
            {update.message}
          </span>
        ))}
      </div>
    </div>
  );
}
