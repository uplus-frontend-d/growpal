"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import PrivateRoute from "../components/PrivateRoute";
import { getUserActivities } from "@/lib/api";
import { useUserStore } from "../lib/userStore";
import { formatDateToYMD } from "@/lib/dateUtil";
import AddTodoModal from "../components/AddTodoModal";
import { Activity, useActivityStore } from "../stores/activityStore";

// 아이콘 맵
export const taskTypeImageMap: Record<string, string> = {
  watering: "/images/tasks/watering.png",
  repotting: "/images/tasks/repotting.png",
  fertilizing: "/images/tasks/fertilizing.png",
  etc: "/images/tasks/etc.png",
  diary: "/images/tasks/diary.png",
};

const CalendarPage = () => {
  const { user } = useUserStore();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [todayActivities, setTodayActivities] = useState<Activity[]>([]);
  const { activities, setActivities } = useActivityStore();

  // 날짜 선택
  const handleSelectDate = async (selectedDate: Date | undefined) => {
    if (!selectedDate || !user?.id) return;
    setDate(selectedDate);
    setTodayActivities(getActivitiesByDate(selectedDate));
  };

  const getActivitiesByDate = (target: Date | undefined) => {
    if (!target) return [];
    const dateStr = formatDateToYMD(target);

    return activities
      .filter(
        (activity) =>
          (activity.type === "diary" &&
            activity.created_at?.slice(0, 10) === dateStr) ||
          (activity.type === "todo" && activity.due_date === dateStr)
      )
      .sort((a, b) => {
        const aTime = new Date(a.created_at ?? 0).getTime();
        const bTime = new Date(b.created_at ?? 0).getTime();
        return bTime - aTime;
      });
  };

  useEffect(() => {
    if (!date || !activities.length) return;
    setTodayActivities(getActivitiesByDate(date));
  }, [activities, date]);

  // 초기 로딩: 오늘 날짜
  useEffect(() => {
    if (!user?.id) return;
    const init = async () => {
      const todayStr = formatDateToYMD(new Date());
      const { todos, diaries } = await getUserActivities(user.id);

      const todoItems: Activity[] = todos.map((todo) => ({
        ...todo,
        type: "todo",
      }));

      const diaryItems: Activity[] = diaries.map((diary) => ({
        ...diary,
        type: "diary",
      }));

      const all = [...todoItems, ...diaryItems];
      setActivities(all);
      setTodayActivities(
        all
          .filter(
            (activity) =>
              (activity.type === "diary" &&
                activity.created_at?.slice(0, 10) === todayStr) ||
              (activity.type === "todo" && activity.due_date === todayStr)
          )
          .sort((a, b) => {
            const aTime = new Date(a.created_at).getTime();
            const bTime = new Date(b.created_at).getTime();
            return bTime - aTime; // 내림차순
          })
      );
    };
    init();
  }, [user?.id, setActivities]);

  // calendar 하이라이트 날짜 계산
  const markedDates = activities
    .map((activity) => {
      const base =
        activity.type === "todo"
          ? activity.due_date
          : activity.created_at?.slice(0, 10);
      if (!base) return null;
      const [y, m, d] = base.split("-").map(Number);
      return new Date(y, m - 1, d);
    })
    .filter(Boolean);

  return (
    <PrivateRoute>
      <div className="bg-white w-full flex justify-center ">
        <Card className="w-[70%] flex flex-col py-4 mb-5 border-none">
          <CardContent className="px-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSelectDate}
              className="w-[50%] m-auto bg-transparent p-0"
              required
              modifiers={{
                hasEvent: markedDates as Date[],
              }}
            />
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-3 border-t px-4 !pt-4">
            <div className="flex w-full items-center justify-between px-1">
              <div className="text-sm font-medium">
                {date?.toLocaleDateString("ko", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                title="Add Event"
              >
                <i
                  className="fa-solid fa-plus"
                  onClick={() => setIsModalOpen(true)}
                >
                  <span className="sr-only">Add Event</span>
                </i>
              </Button>
            </div>

            <div className="w-full flex flex-col gap-2 overflow-y-auto max-h-[300px] custom-scroll">
              {todayActivities.map((activity) => (
                <div
                  key={`${activity.type}-${activity.id}`}
                  className="flex items-center gap-4 bg-muted after:bg-primary/70 relative rounded-md p-2 pl-6 text-sm after:absolute after:inset-y-2 after:left-2 after:w-1 after:rounded-full"
                >
                  <img
                    src={
                      activity.type === "todo"
                        ? taskTypeImageMap[activity.task_type!] ||
                          taskTypeImageMap["etc"]
                        : activity.image_url ?? taskTypeImageMap["diary"]
                    }
                    className="object-contain"
                    style={{
                      maxWidth: "40px",
                      maxHeight: "40px",
                      width: "auto",
                      height: "auto",
                    }}
                  />
                  <div>
                    <div className="font-medium">
                      {activity.type === "todo"
                        ? activity.task_type
                        : "다이어리"}
                    </div>
                    {activity.type === "todo" && activity.plants?.name && (
                      <div className="text-muted-foreground text-xs">
                        {activity?.plants.name}
                      </div>
                    )}
                    {activity.type === "diary" && activity.plants?.name && (
                      <div className="mt-1 text-xs line-clamp-2">
                        {activity?.plants.name + " | " + activity?.note}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardFooter>
        </Card>

        {isModalOpen && (
          <AddTodoModal date={date!} onClose={() => setIsModalOpen(false)} />
        )}
      </div>
    </PrivateRoute>
  );
};

export default CalendarPage;
