import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import "./css/styles.css";
import mechanicsNames from "./consts/mechanicNames";

interface Update {
  id: string;
  message: string;
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

export default function App() {
  const [game, setGame] = useState<Game>({
    wood: 0,
    houses: 0,
    housePricing: 0,
    people: 0,
    food: 0,
    seeds: 0,
    days: 0,
    updates: [],
    season: "Spring",
    unlockedMechanics: [],
  });

  //Todo: Fix probability to change based on season
  //Todo: Move probability to utility file
  //Todo: Create probability arrays to swap in and out
  const randomWithProbability = () => {
    const notRandomNumbers = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
      1, 2,
    ];
    const idx = Math.floor(Math.random() * notRandomNumbers.length);
    return notRandomNumbers[idx];
  };

  const addFood = () => {
    setGame((previousGameState) => {
      const seedAmount = randomWithProbability();
      const newGameSeeds = previousGameState.seeds + seedAmount;
      const foodAmount = randomWithProbability();
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

  //Todo: Re-implement Houses/Population

  // const constructHouse = () => {
  //   setWood((prevWood) => {
  //     if (prevWood < housePricing) {
  //       return prevWood;
  //     }
  //     setHouses((prevHouses) => prevHouses + 1);
  //     setHousePricing((previousPricing) => previousPricing + 4);
  //     return prevWood - housePricing;
  //   });
  // };

  useEffect(() => {
    const intervalID = setInterval(() => {
      console.log("Tick");
      setGame((prevGameState) => {
        const newSeconds = prevGameState.days + 1;
        const newSeason = getSeason(newSeconds);
        return {
          ...prevGameState,
          days: newSeconds,
          season: newSeason,
          updates: addSeasonUpdate(
            prevGameState.season,
            newSeason,
            prevGameState.updates,
          ),
        };
      });
    }, 1000);
    return () => clearInterval(intervalID);
  }, []);

  return (
    <div>
      <div>Days: {game.days}</div>
      <div>Season: {game.season}</div>
      {game.unlockedMechanics.includes(mechanicsNames.woodUnlocked) && (
        <div>
          Wood: {game.wood}
          <button onClick={addWood}>Gather Wood (-10 Food)</button>
        </div>
      )}
      <div>
        Food: {game.food}
        <button onClick={addFood}>Forage</button>
      </div>
      {/*<div>*/}
      {/*    Hello, here's Population: {people}*/}
      {/*</div>*/}
      {game.seeds > 0 ? <div>Seeds: {game.seeds}</div> : ""}
      {/*<div>*/}
      {/*    Hello, here's Houses: {houses}*/}
      {/*    <button onClick={constructHouse}>Construct House ({housePricing})</button>*/}
      {/*</div>*/}
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
