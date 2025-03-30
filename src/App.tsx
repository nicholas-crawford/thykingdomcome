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

interface Game {
  wood: number;
  houses: number;
  housePricing: number;
  people: number;
  food: number;
  seeds: number;
  days: number;
  updates: Update[];
  season: string;
  unlockedMechanics: string[];
}

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

const addUpdate = (message: string, previousUpdates: Update[]) => {
  const newUpdate = { id: uuidv4(), message: message };
  const newAllUpdates = [newUpdate, ...previousUpdates];
  return newAllUpdates.slice(0, 10);
};

const addSeasonUpdate = (
  oldSeason: string,
  newSeason: string,
  previousUpdates: Update[],
) => {
  if (oldSeason === newSeason) {
    return previousUpdates;
  }
  const message = `It's now ${newSeason}`;
  return addUpdate(message, previousUpdates);
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
    1: 0.7,
    2: 0.1,
    0: 0.2,
  };
};

export default function App() {
  const [game, setGame] = useState<Game>({
    wood: 0,
    houses: 0,
    housePricing: 10,
    people: 0,
    food: 0,
    seeds: 0,
    days: 0,
    updates: [],
    season: "Spring",
    unlockedMechanics: [],
  });

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
      const seedAmount = randomWithProbability(probs);
      const newGameSeeds = previousGameState.seeds + seedAmount;
      const foodAmount = randomWithProbability(probs);
      const newGameFood = previousGameState.food + foodAmount;
      const newUpdateMessage = getAddFoodMessage(foodAmount, seedAmount);
      const newUpdates = addUpdate(newUpdateMessage, previousGameState.updates);

      if (
        previousGameState.food >= 10 &&
        !previousGameState.unlockedMechanics.includes(
          mechanicsNames.woodUnlocked,
        )
      ) {
        const newGameMechanics = [
          ...previousGameState.unlockedMechanics,
          mechanicsNames.woodUnlocked,
        ];
        return {
          ...previousGameState,
          unlockedMechanics: newGameMechanics,
          food: newGameFood,
          seeds: newGameSeeds,
          updates: newUpdates,
        };
      }

      return {
        ...previousGameState,
        food: newGameFood,
        seeds: newGameSeeds,
        updates: newUpdates,
      };
    });
  };

  const addWood = () => {
    setGame((previousGameState) => {
      if (previousGameState.food < 10) {
        const newUpdates = addUpdate(
          `You don't have enough food to complete this action`,
          previousGameState.updates,
        );

        return {
          ...previousGameState,
          updates: newUpdates,
        };
      }

      const newGameWood = previousGameState.wood + 1;
      const newGameFood = previousGameState.food - 10;
      const newUpdates = addUpdate(
        `You gathered 1 wood`,
        previousGameState.updates,
      );

      return {
        ...previousGameState,
        wood: newGameWood,
        food: newGameFood,
        updates: newUpdates,
      };
    });
  };

  const constructHouse = () => {
    setGame((prevGameState) => {
      if (prevGameState.wood < prevGameState.housePricing) {
        const newUpdates = addUpdate(
          "You require more wood to build a house",
          prevGameState.updates,
        );
        return { ...prevGameState, updates: newUpdates };
      }
      return {
        ...prevGameState,
        wood: prevGameState.wood - prevGameState.housePricing,
        housePricing: prevGameState.housePricing + 4,
        houses: prevGameState.houses + 1,
      };
    });
  };

  const populationEatsFood = (currentFood: number, populationCount: number) => {
    return currentFood + populationCount * -2;
  };

  useEffect(() => {
    const intervalID = setInterval(() => {
      setGame((prevGameState) => {
        const newSeconds = prevGameState.days + 1;
        const newSeason = getSeason(newSeconds);
        const newSeasonUpdate = addSeasonUpdate(
          prevGameState.season,
          newSeason,
          prevGameState.updates,
        );
        const shouldIncreasePopulation =
          prevGameState.houses * 2 > prevGameState.people;

        const newPopulation = shouldIncreasePopulation
          ? prevGameState.people + 1
          : prevGameState.people;

        const newFood = populationEatsFood(
          prevGameState.food,
          prevGameState.people,
        );

        return {
          ...prevGameState,
          days: newSeconds,
          season: newSeason,
          updates: newSeasonUpdate,
          people: newPopulation,
          food: newFood,
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
      {game.seeds > 0 ? <div>Seeds: {game.seeds}</div> : ""}
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
