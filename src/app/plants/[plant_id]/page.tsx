"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getPlant,
  getPlantTodos,
  getPlantDiaries,
  type Plant,
  type PlantTodo,
  updatePlantTodo,
} from "@/lib/api";
import Layout from "@/app/components/Layout";
import { taskTypeImageMap } from "@/app/calendar/page";
import {
  Activity,
  ActivityType,
  useActivityStore,
} from "@/app/stores/activityStore";

export default function PlantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const plantId = params.plant_id as string;

  const [plant, setPlant] = useState<Plant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { activities, setActivities } = useActivityStore();

  // 식물 정보 및 관련 데이터 불러오기
  const loadPlantData = async () => {
    try {
      setLoading(true);
      const [plantData, todosData, diariesData] = await Promise.all([
        getPlant(plantId),
        getPlantTodos(plantId),
        getPlantDiaries(plantId),
      ]);

      setPlant(plantData);
      // todos + diaries → Activity[] 변환
      const mergedActivities: Activity[] = [
        ...todosData.map((t) => ({
          ...t,
          type: "todo" as ActivityType,
        })),
        ...diariesData.map((d) => ({
          ...d,
          type: "diary" as ActivityType,
        })),
      ];
      setActivities(mergedActivities);
      setError(null);
    } catch (err) {
      setError("식물 정보를 불러오는데 실패했습니다.");
      console.error("Failed to load plant data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTodoClick = async (todo: PlantTodo) => {
    const updated = await updatePlantTodo(todo.plant_id, todo.id, {
      is_done: !todo.is_done,
    });
    const updatedActivity: Activity = {
      ...updated,
      type: "todo",
    };
    const newActivities = activities.map((activity) =>
      activity.id == updated.id && activity.type === "todo"
        ? updatedActivity
        : activity
    );
    setActivities(newActivities);
  };

  useEffect(() => {
    if (plantId) {
      loadPlantData();
    }
  }, [plantId]);

  const pendingTodos = useMemo(
    () =>
      activities.filter(
        (a) => a.type === "todo" && a.plant_id === plantId && !a.is_done
      ),
    [activities, plantId]
  );

  const completedItems = useMemo(() => {
    const completedTodos = activities.filter(
      (a) => a.type === "todo" && a.plant_id === plantId && a.is_done
    );
    const diaries = activities.filter(
      (a) => a.type === "diary" && a.plant_id === plantId
    );

    return [...completedTodos, ...diaries].sort((a, b) => {
      const getDate = (activity: Activity) => {
        if (activity.type === "todo") {
          return new Date(
            activity.executed_at || activity.created_at || ""
          ).getTime();
        } else {
          return new Date(activity.created_at || "").getTime();
        }
      };

      return getDate(b) - getDate(a); // 최신순 정렬
    });
  }, [activities, plantId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Layout subtitle="식물 상세 정보">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-2 text-gray-600">식물 정보를 불러오는 중...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !plant) {
    return (
      <Layout subtitle="식물 상세 정보">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || "식물을 찾을 수 없습니다."}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout subtitle={`${plant.name} 상세 정보`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          뒤로가기
        </button>

        {/* 식물 기본 정보 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="md:flex">
            {/* 식물 이미지 */}
            <div className="md:w-1/3">
              <div className="h-64 md:h-full bg-[#FBEFDD] flex items-center justify-center">
                {plant.image_url ? (
                  <img
                    src={plant.image_url}
                    alt={plant.name}
                    className="h-full w-auto object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling?.classList.remove(
                        "hidden"
                      );
                    }}
                  />
                ) : null}
                <div
                  className={`text-6xl text-gray-400 ${
                    plant.image_url ? "hidden" : ""
                  }`}
                >
                  🌿
                </div>
              </div>
            </div>

            {/* 식물 정보 */}
            <div className="md:w-2/3 p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {plant.name}
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    종류
                  </label>
                  <p className="text-gray-900">{plant.species || "미정"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    위치
                  </label>
                  <p className="text-gray-900">{plant.location}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    입양일
                  </label>
                  <p className="text-gray-900">
                    {plant.adopted_at ? formatDate(plant.adopted_at) : "미정"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    마지막 물주기
                  </label>
                  <p className="text-gray-900">
                    {formatDateTime(plant.last_watered_at)}
                  </p>
                </div>
                {plant.growth_status && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      성장 상태
                    </label>
                    <p className="text-gray-900">{plant.growth_status}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Todo 목록 - 있을 때만 표시 */}
        {pendingTodos.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📋</span>할 일 목록
            </h2>
            <div className="text-gray-500 mb-2">클릭해서 완료 표시하세요!</div>
            <div className="space-y-3">
              {pendingTodos
                .filter((t) => !t.is_done)
                .map((todo) => (
                  <div
                    key={todo.id}
                    className={`p-3 rounded-lg border cursor-pointer ${
                      todo.is_done
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                    onClick={() => handleTodoClick(todo)}
                  >
                    <div className="flex items-center justify-between gap-2 ">
                      <div className="flex w-full gap-4 bg-muted after:bg-primary/70 relative rounded-md p-2 pl-6 text-sm after:absolute after:inset-y-2 after:left-2 after:w-1 after:rounded-full">
                        <img
                          src={
                            taskTypeImageMap[todo.task_type!] ||
                            taskTypeImageMap["etc"]
                          }
                          className="w-10"
                        />
                        <div className="flex flex-col">
                          <p
                            className={`font-medium ${
                              todo.is_done
                                ? "text-green-700 line-through"
                                : "text-gray-900"
                            }`}
                          >
                            {todo.task_type}
                          </p>
                          <p className="text-sm text-gray-500">
                            마감일: {formatDate(todo.due_date)}
                          </p>
                        </div>
                      </div>
                      <i
                        className={`fa-regular ${
                          todo.is_done ? "fa-circle-check" : "fa-circle"
                        }`}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Diary 목록 - 식물 정보 하단에 세로로 배치 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">📝</span>
            활동 기록
          </h2>

          {completedItems.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📖</div>
              <p className="text-gray-600 mb-2">아직 다이어리가 없습니다.</p>
              <p className="text-sm text-gray-500">
                첫 번째 다이어리를 작성해보세요!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {completedItems.map((activity) => (
                <div
                  key={activity.id}
                  className="border-b border-gray-200 pb-6 last:border-b-0 cursor-pointer "
                >
                  {activity.type === "todo" ? (
                    <div
                      key={activity.id}
                      className={`p-3 rounded-lg border ${
                        activity.is_done
                          ? "bg-green-50 border-green-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                      onClick={() => handleTodoClick(activity)}
                    >
                      <div className="flex items-center justify-between gap-2 ">
                        <div className="flex w-full gap-4 bg-muted after:bg-primary/70 relative rounded-md p-2 pl-6 text-sm after:absolute after:inset-y-2 after:left-2 after:w-1 after:rounded-full">
                          <img
                            src={
                              taskTypeImageMap[activity.task_type!] ||
                              taskTypeImageMap["etc"]
                            }
                            className="w-10"
                          />
                          <div className="flex flex-col">
                            <p
                              className={`font-medium ${
                                activity.is_done
                                  ? "text-green-700 line-through"
                                  : "text-gray-900"
                              }`}
                            >
                              {activity.task_type}
                            </p>
                            <p className="text-sm text-gray-500">
                              완료일: {formatDateTime(activity.executed_at)}
                            </p>
                          </div>
                        </div>
                        <i
                          className={`fa-regular ${
                            activity.is_done ? "fa-circle-check" : "fa-circle"
                          }`}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start space-x-4">
                      {activity.image_url && (
                        <img
                          src={activity.image_url}
                          alt="다이어리 이미지"
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 whitespace-pre-wrap text-lg leading-relaxed">
                          {activity.note}
                        </p>
                        <p className="text-sm text-gray-500 mt-3">
                          {formatDateTime(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
