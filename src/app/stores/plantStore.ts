import { create } from "zustand";

export interface Plant {
  id: string;
  name: string;
  image_url?: string;
}

interface PlantStore {
  plants: Plant[];
  setPlants: (plants: Plant[]) => void;
  resetPlants: () => void;
}

export const usePlantStore = create<PlantStore>((set) => ({
  plants: [],
  setPlants: (plants) => set({ plants }),
  resetPlants: () => set({ plants: [] }),
}));
