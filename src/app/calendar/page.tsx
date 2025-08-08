"use client";

import React, { useEffect, useState } from "react";
import { formatDateRange } from "little-date";
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

  const getActivitiesByDate = (target: Date) => {
    const dateStr = formatDateToYMD(target);
    return activities.filter(
      (activity) =>
        (activity.type === "diary" &&
          activity.created_at?.slice(0, 10) === dateStr) ||
        (activity.type === "todo" && activity.due_date === dateStr)
    );
  };

  useEffect(() => {
    if (!date) return;
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
        id: diary.id,
        type: "diary",
        note: diary.note,
        created_at: diary.created_at,
        image_url: diary.image_url,
        plant_id: diary.plant_id,
      }));

      const all = [...todoItems, ...diaryItems];
      setActivities(all);
      setTodayActivities(
        all.filter(
          (activity) =>
            (activity.type === "diary" &&
              activity.created_at?.slice(0, 10) === todayStr) ||
            (activity.type === "todo" && activity.due_date === todayStr)
        )
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
        <Card className="w-[70%] flex flex-col py-4 mb-5">
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
                  className="flex gap-4 bg-muted after:bg-primary/70 relative rounded-md p-2 pl-6 text-sm after:absolute after:inset-y-2 after:left-2 after:w-1 after:rounded-full"
                >
                  <img
                    src={
                      activity.type === "todo"
                        ? taskTypeImageMap[activity.task_type!] ||
                          taskTypeImageMap["etc"]
                        : taskTypeImageMap["diary"]
                    }
                    className="w-10"
                  />
                  <div>
                    <div className="font-medium">
                      {activity.type === "todo"
                        ? activity.task_type
                        : "다이어리"}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {activity.plant_id}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {activity.type === "todo" &&
                        // formatDateRange(
                        //   new Date(activity.created_at!),
                        //   new Date(activity.due_date!)
                        // )
                        activity.due_date}
                    </div>
                    {activity.type === "diary" && activity.note && (
                      <div className="mt-1 text-xs line-clamp-2">
                        {activity.note}
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
