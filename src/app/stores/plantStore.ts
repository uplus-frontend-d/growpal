// import { create } from "zustand";

// interface TodoData {
//   plant_id: string;
//   task_type: string;
//   etc_detail?: string;
// }

// interface DiaryData {
//   plant_id: string;
//   content: string;
//   image_url: string;
// }

// interface Plant {
//   id: string;
//   name: string;
//   image_url?: string;
// }

// interface PlantStore {
//   // 기존 상태
//   todoData: TodoData;
//   setTodoData: (data: Partial<TodoData>) => void;
//   resetTodoData: () => void;

//   diaryData: DiaryData;
//   setDiaryData: (data: Partial<DiaryData>) => void;
//   resetDiaryData: () => void;

//   // 추가된 상태
//   plants: Plant[];
//   setPlants: (plants: Plant[]) => void;
//   resetPlants: () => void;
// }

// export const usePlantStore = create<PlantStore>((set) => ({
//   // 기존 초기값
//   todoData: {
//     plant_id: "",
//     task_type: "",
//     etc_detail: "",
//   },
//   setTodoData: (data) =>
//     set((state) => ({
//       todoData: { ...state.todoData, ...data },
//     })),
//   resetTodoData: () =>
//     set({
//       todoData: {
//         plant_id: "",
//         task_type: "",
//         etc_detail: "",
//       },
//     }),

//   diaryData: {
//     plant_id: "",
//     content: "",
//     image_url: "",
//   },
//   setDiaryData: (data) =>
//     set((state) => ({
//       diaryData: { ...state.diaryData, ...data },
//     })),
//   resetDiaryData: () =>
//     set({
//       diaryData: {
//         plant_id: "",
//         content: "",
//         image_url: "",
//       },
//     }),

//   // ✅ 추가된 부분
//   plants: [],
//   setPlants: (plants) => set({ plants }),
//   resetPlants: () => set({ plants: [] }),
// }));

// stores/plantStore.ts
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
