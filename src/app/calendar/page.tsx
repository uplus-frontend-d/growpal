"use client";

import React, { useEffect, useState } from "react";
import { formatDateRange } from "little-date";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import PrivateRoute from "../components/PrivateRoute";
import Navigation from "../components/Navigation";
import { getUserTodos, getUserTodosByDate } from "@/lib/api";
import { useUserStore } from "../lib/userStore";
import { formatDateToYMD } from "@/lib/dateUtil";
import AddTodoModal from "../components/AddTodoModal";

const CalendarPage = () => {
  const { user } = useUserStore();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [events, setEvents] = useState([]);

  const handleSelectDate = async (selectedDate: Date | undefined) => {
    if (!selectedDate || !user?.id) return;

    console.log(formatDateToYMD(selectedDate));
    setDate(selectedDate);

    const response = await getUserTodosByDate({
      user_id: user?.id,
      from_date: formatDateToYMD(selectedDate),
    });
    setEvents(response);
  };

  useEffect(() => {
    const init = async () => {
      const today = formatDateToYMD(new Date());
      console.log(today);
      const response = await getUserTodosByDate({
        user_id: user?.id,
        from_date: today,
      });
      setEvents(response);
      console.log("response:", response);
    };
    if (user?.id) {
      init();
    }
  }, [user?.id]);

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-white">
        <Card className="w-full h-full py-4">
          <CardContent className="px-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSelectDate}
              className="w-[50%] m-auto bg-transparent p-0"
              required
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
                {/* <PlusIcon /> */}
                <i
                  className="fa-solid fa-plus"
                  onClick={() => setIsModalOpen(true)}
                >
                  <span className="sr-only">Add Event</span>
                </i>
              </Button>
            </div>
            <div className="flex w-full flex-col gap-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex gap-4 bg-muted after:bg-primary/70 relative rounded-md p-2 pl-6 text-sm after:absolute after:inset-y-2 after:left-2 after:w-1 after:rounded-full"
                >
                  <img
                    src={
                      event.task_type === "watering"
                        ? "/images/tasks/watering.png"
                        : event.task_type === "repotting"
                        ? "/images/tasks/repotting.png"
                        : "/images/tasks/fertilizing.png"
                    }
                    className="w-10"
                  />
                  <div>
                    <div className="font-medium">{event.task_type}</div>
                    <div className="text-muted-foreground text-xs">
                      {formatDateRange(
                        new Date(event.created_at),
                        new Date(event.due_date)
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardFooter>
        </Card>
        {/* 하단 네비게이션 섹션 */}
        <Navigation />
        {isModalOpen && (
          <AddTodoModal date={date!} onClose={() => setIsModalOpen(false)} />
        )}
      </div>
    </PrivateRoute>
  );
};
export default CalendarPage;
