export interface Probabilities {
  [key: string]: number;
}

export const getSeason = (day: number) => {
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

export const getProbability = (season: string): Probabilities => {
  if (season === "Spring") {
    return {
      1: 0.2,
      2: 0.45,
      3: 0.35,
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

export const getFarmYield = (season: string): number => {
  if (season === "Summer") return 3;
  if (season === "Winter") return 1;
  return 2; // Spring and Autumn
};
