import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import "./css/styles.css";

export default function App() {
  interface Update {
    id: string;
    message: string;
  }

  const [wood, setWood] = useState(0);
  const [houses, setHouses] = useState(0);
  const [housePricing, setHousePricing] = useState(4);
  const [people, setPeople] = useState(0);
  const [food, setFood] = useState(0);
  const [seeds, setSeeds] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [updates, setUpdates] = useState<Update[]>([]);

  const randomWithProbability = () => {
    const notRandomNumbers = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
      1, 2,
    ];
    const idx = Math.floor(Math.random() * notRandomNumbers.length);
    return notRandomNumbers[idx];
  };

  const addWood = () => {
    setWood((previousWood) => {
      const woodAmount = 1;
      return previousWood + woodAmount;
    });
  };

  const addFood = () => {
    setFood((previousFood) => {
      const seedAmount = randomWithProbability();
      setSeeds((previousSeeds) => previousSeeds + seedAmount);
      const foodAmount = randomWithProbability();
      if (foodAmount > 0 || seedAmount > 0) {
        setUpdates([
          ...updates,
          {
            id: uuidv4(),
            message: `You have found ${foodAmount} food and ${seedAmount} seeds!`,
          },
        ]);
      } else {
        setUpdates([
          ...updates,
          {
            id: uuidv4(),
            message: `You found nothing!`,
          },
        ]);
      }
      return previousFood + foodAmount;
    });
  };

  const constructHouse = () => {
    setWood((prevWood) => {
      if (prevWood < housePricing) {
        return prevWood;
      }
      setHouses((prevHouses) => prevHouses + 1);
      setHousePricing((previousPricing) => previousPricing + 4);
      return prevWood - housePricing;
    });
  };

  useEffect(() => {
    const intervalID = setInterval(() => {
      console.log("tick");
      setSeconds((prevSeconds) => {
        const newSeconds = prevSeconds + 1;
        if (newSeconds % 5 === 0) {
          setHouses((prevHouses) => {
            setPeople((previousPeople) => {
              const emptyHouses = prevHouses * 2 > previousPeople;
              if (emptyHouses) {
                return previousPeople + 1;
              }
              return previousPeople;
            });

            return prevHouses;
          });
        }
        return newSeconds;
      });
    }, 1000);
    const cleanup = () => {
      clearInterval(intervalID);
    };
    return cleanup;
  }, []);

  return (
    <div>
      <div>Timer: {seconds}</div>
      {/*<div>*/}
      {/*    Hello, here's Wood: {wood}*/}
      {/*    <button onClick={addWood}>Get Wood</button>*/}
      {/*</div>*/}
      <div>
        Food: {food}
        <button onClick={addFood}>Forage</button>
      </div>
      {/*<div>*/}
      {/*    Hello, here's Population: {people}*/}
      {/*</div>*/}
      {seeds > 0 ? <div>Seeds: {seeds}</div> : ""}
      {/*<div>*/}
      {/*    Hello, here's Houses: {houses}*/}
      {/*    <button onClick={constructHouse}>Construct House ({housePricing})</button>*/}
      {/*</div>*/}
      <div className="Logs">
        <span className="Logs--Heading">Logs</span>
        {updates
          ? updates.map((update) => (
              <span key={update.id} className="Logs--Log-Info">
                {update.message}
              </span>
            ))
          : ""}
      </div>
    </div>
  );
}
