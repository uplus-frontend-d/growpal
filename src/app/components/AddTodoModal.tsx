"use client";

import { useEffect, useState } from "react";
import {
  createPlantTodo,
  createPlantDiary,
  getUserPlants,
  getUserTodosByExactDate,
  getUserDiariesByExactDate,
} from "@/lib/api";
import { useUserStore } from "@/app/lib/userStore";
import { formatDateToYMD } from "@/lib/dateUtil";
import { usePlantStore } from "../stores/plantStore";
import { Activity, useActivityStore } from "../stores/activityStore";

interface AddTodoModalProps {
  date: Date;
  onClose: () => void;
}

const AddTodoModal = ({ date, onClose }: AddTodoModalProps) => {
  const { user } = useUserStore();
  const { plants, setPlants } = usePlantStore();
  const { activity, setActivity, resetActivity, activities, updateActivities } =
    useActivityStore();

  const [mode, setMode] = useState<"todo" | "diary">("todo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlants = async () => {
      try {
        const data = await getUserPlants(user?.id!);
        setPlants(data);
        console.log("userplants:", data);
        if (data.length > 0) {
          setActivity({ plant_id: data[0].id });
        }
      } catch (err) {
        console.error(err);
        setError("식물 목록을 불러오는 데 실패했습니다.");
      }
    };

    if (user?.id) loadPlants();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      const targetDateStr = formatDateToYMD(date);

      if (mode === "todo") {
        if (!activity.task_type?.trim()) {
          setError("할 일을 입력해주세요.");
          return;
        }

        await createPlantTodo(activity.plant_id, {
          task_type: activity.task_type,
          due_date: targetDateStr,
        });

        const rawTodos = await getUserTodosByExactDate({
          user_id: user?.id,
          date: targetDateStr,
        });
        console.log("rawTodos:", rawTodos);
        const activities: Activity[] = rawTodos.map((todo) => ({
          id: todo.id,
          type: "todo",
          plant_id: todo.plant_id,
          task_type: todo.task_type,
          due_date: todo.due_date,
        }));
        updateActivities(activities, targetDateStr);
      } else {
        if (!activity.content?.trim()) {
          setError("일지 내용을 입력해주세요.");
          return;
        }

        await createPlantDiary(activity.plant_id, {
          note: activity.content,
          image_url: activity.image_url,
        });

        const rawDiaries = await getUserDiariesByExactDate({
          user_id: user?.id!,
          date: targetDateStr,
        });
        console.log(rawDiaries);
        const test: Activity[] = rawDiaries.map((diary) => ({
          id: diary.id,
          type: "diary",
          plant_id: diary.id,
          created_at: diary.created_at,
          content: diary.note,
        }));
        updateActivities(test, targetDateStr);
      }

      onClose();
      resetActivity();
    } catch (err) {
      console.error(err);
      setError("작성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const selectedPlant = plants.find((p) => p.id === activity.plant_id) || null;

  return (
    <div className="fixed inset-0 bg-gray-10 bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
        <h2 className="text-xl font-semibold mb-4">
          🌱 {mode === "todo" ? "할 일 추가" : "식물 일지 작성"}
        </h2>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-2 rounded mb-4 border border-red-200">
            {error}
          </div>
        )}

        {/* 모드 선택 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            작성 유형
          </label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "todo" | "diary")}
            className="w-full border border-gray-300 px-3 py-2 rounded-md"
          >
            <option value="todo">할 일</option>
            <option value="diary">식물 일지</option>
          </select>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 식물 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              식물 선택
            </label>
            <select
              value={activity.plant_id}
              onChange={(e) => setActivity({ plant_id: e.target.value })}
              className="w-full border border-gray-300 px-3 py-2 rounded-md"
            >
              {plants.map((plant) => (
                <option key={plant.id} value={plant.id}>
                  {plant.name}
                </option>
              ))}
            </select>

            {selectedPlant?.image_url && (
              <div className="mt-2 flex items-center gap-3">
                <img
                  src={selectedPlant.image_url}
                  alt={selectedPlant.name}
                  className="w-20 h-20 object-cover rounded border border-gray-300"
                  onError={(e) => {
                    e.currentTarget.src = "/images/plants/Miscell.png";
                  }}
                />
                <div className="text-sm text-gray-600">
                  <div className="font-medium">{selectedPlant.name}</div>
                  <div className="text-xs text-gray-400">
                    이미지 경로: {selectedPlant.image_url}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 할 일 모드 */}
          {mode === "todo" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                할 일
              </label>
              <select
                value={activity.task_type}
                onChange={(e) => setActivity({ task_type: e.target.value })}
                className="w-full border border-gray-300 px-3 py-2 rounded-md mb-2"
                required
              >
                <option value="">선택하세요</option>
                <option value="watering">물주기</option>
                <option value="repotting">분갈이</option>
                <option value="fertilizing">영양제</option>
                <option value="etc">기타</option>
              </select>

              {activity.task_type === "etc" && (
                <input
                  type="text"
                  value={activity.task_type || ""}
                  onChange={(e) => setActivity({ task_type: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md"
                  placeholder="기타 작업 내용을 입력하세요"
                  required
                />
              )}
            </div>
          )}

          {/* 일지 모드 */}
          {mode === "diary" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  내용
                </label>
                <textarea
                  value={activity.content || ""}
                  onChange={(e) => setActivity({ content: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md"
                  rows={4}
                  placeholder="오늘 식물의 상태나 관리 내용을 기록하세요."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  사진 URL (선택)
                </label>
                <input
                  type="text"
                  value={activity.image_url || ""}
                  onChange={(e) => setActivity({ image_url: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md"
                  placeholder="예: https://..."
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:bg-green-400"
            >
              {loading ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTodoModal;
