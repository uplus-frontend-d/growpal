import { create } from "zustand";

export type ActivityType = "todo" | "diary";

export interface Activity {
  id: string;
  type: ActivityType;
  plant_id: string;
  task_type?: string;
  due_date?: string;
  content?: string;
  image_url?: string;
  created_at?: string;
}

interface ActivityStore {
  // 작성 중인 activity
  activity: Activity;
  setActivity: (data: Partial<Activity>) => void;
  resetActivity: () => void;

  // 전체 활동 목록
  activities: Activity[];
  setActivities: (list: Activity[]) => void;
  updateActivities: (newItems: Activity[], date: string) => void;
}

export const useActivityStore = create<ActivityStore>((set) => ({
  activity: {
    id: "",
    type: "todo",
    plant_id: "",
    task_type: "",
    due_date: "",
    content: "",
    image_url: "",
    created_at: "",
  },
  setActivity: (data) =>
    set((state) => ({
      activity: { ...state.activity, ...data },
    })),
  resetActivity: () =>
    set({
      activity: {
        id: "",
        type: "todo",
        plant_id: "",
        task_type: "",
        due_date: "",
        content: "",
        image_url: "",
        created_at: "",
      },
    }),

  activities: [],
  setActivities: (list) => set({ activities: list }),

  updateActivities: (newItems, date) =>
    set((state) => ({
      activities: [
        ...state.activities.filter((a) => {
          const baseDate =
            a.type === "todo" ? a.due_date : a.created_at?.slice(0, 10);
          return baseDate !== date;
        }),
        ...newItems,
      ],
    })),
}));
