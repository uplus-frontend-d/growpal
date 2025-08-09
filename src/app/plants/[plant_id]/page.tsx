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
import AddTodoModal from "@/app/components/AddTodoModal";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [plantIdAnalysis, setPlantIdAnalysis] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [lastAnalyzedImageUrl, setLastAnalyzedImageUrl] = useState<
    string | null
  >(null);

  const { activities, setActivities } = useActivityStore();

  // localStorage에서 분석 결과 조회
  const getCachedAnalysis = (imageUrl: string) => {
    try {
      const cacheKey = `plant_analysis_${plantId}_${btoa(imageUrl).slice(
        0,
        20
      )}`;
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("캐시 조회 실패:", error);
      return null;
    }
  };

  // localStorage에 분석 결과 저장
  const setCachedAnalysis = (imageUrl: string, analysis: any) => {
    try {
      const cacheKey = `plant_analysis_${plantId}_${btoa(imageUrl).slice(
        0,
        20
      )}`;
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          analysis,
          timestamp: Date.now(),
          imageUrl,
        })
      );
    } catch (error) {
      console.error("캐시 저장 실패:", error);
    }
  };

  // Plant.id 분석 함수
  const analyzeWithPlantId = async (imageUrl: string) => {
    // 먼저 캐시에서 확인
    const cachedResult = getCachedAnalysis(imageUrl);
    if (cachedResult) {
      console.log("캐시된 분석 결과 사용:", imageUrl);
      setPlantIdAnalysis(cachedResult.analysis);
      setLastAnalyzedImageUrl(imageUrl);
      return;
    }

    try {
      // 새 분석 시작 시 기존 결과 초기화
      setPlantIdAnalysis(null);
      setAnalysisLoading(true);
      console.log("새로운 Plant.id 분석 시작:", imageUrl);

      const response = await fetch("/api/test-plant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        throw new Error("분석 실패");
      }

      const result = await response.json();
      setPlantIdAnalysis(result.analysis);
      setLastAnalyzedImageUrl(imageUrl);

      // 분석 결과 캐시에 저장
      setCachedAnalysis(imageUrl, result.analysis);
    } catch (error) {
      console.error("Plant.id 분석 실패:", error);
    } finally {
      setAnalysisLoading(false);
    }
  };

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

  // 가장 최근 diary 이미지로 Plant.id 분석 실행
  useEffect(() => {
    const diaryActivities = activities.filter(
      (a) => a.type === "diary" && a.plant_id === plantId && a.image_url
    );

    if (diaryActivities.length > 0) {
      // 가장 최근 diary 찾기
      const latestDiary = diaryActivities.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      // 새로운 이미지일 때만 분석 실행
      if (
        latestDiary.image_url &&
        latestDiary.image_url !== lastAnalyzedImageUrl
      ) {
        analyzeWithPlantId(latestDiary.image_url);
      }
    }
  }, [activities, plantId, lastAnalyzedImageUrl]);

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

              {/* Plant.id 분석 정보 */}
              {(plantIdAnalysis || analysisLoading) && (
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">🔬</span>
                    AI 건강 분석 정보
                    <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded-full border border-blue-200 ml-2">
                      Plant.id
                    </span>
                  </h3>

                  {analysisLoading && (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">분석 중...</span>
                    </div>
                  )}

                  {plantIdAnalysis && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 종 정보 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          종 정보
                        </label>
                        <p className="text-gray-900">
                          {plantIdAnalysis.korean_name ||
                            plantIdAnalysis.plant_species ||
                            "분석 중"}
                        </p>
                      </div>

                      {/* 건강도 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          건강도
                        </label>
                        <div className="flex items-center">
                          <div className="w-16 h-3 bg-gray-200 rounded-full mr-3">
                            <div
                              className="h-3 bg-green-500 rounded-full transition-all duration-300"
                              style={{
                                width: `${
                                  plantIdAnalysis.health_score
                                    ? (plantIdAnalysis.health_score / 10) * 100
                                    : 0
                                }%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-gray-900 font-medium">
                            {plantIdAnalysis.health_score
                              ? Math.round(
                                  (plantIdAnalysis.health_score / 10) * 100
                                )
                              : 0}
                            점
                            <span className="text-gray-500 text-sm ml-1">
                              (
                              {(plantIdAnalysis.confidence || 0) >= 50
                                ? `${plantIdAnalysis.confidence}% 신뢰도`
                                : "낮은 신뢰도"}
                              )
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* 병충해 정보 */}
                      {plantIdAnalysis.care_tips?.plant_id_tips &&
                        plantIdAnalysis.care_tips.plant_id_tips.length > 0 && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-500 mb-2">
                              감지된 문제점
                            </label>
                            <div className="space-y-2">
                              {plantIdAnalysis.care_tips.plant_id_tips
                                .slice(0, 2)
                                .map((tip: string, index: number) => (
                                  <div
                                    key={index}
                                    className="flex items-start space-x-2 text-sm"
                                  >
                                    <div className="w-2 h-2 bg-orange-400 rounded-full mt-1.5 flex-shrink-0"></div>
                                    <p className="text-gray-700">{tip}</p>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                      {/* Plant.id 추가 관리 팁 */}
                      {plantIdAnalysis.care_tips?.plant_id_tips &&
                        plantIdAnalysis.care_tips.plant_id_tips.length > 2 && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-500 mb-2">
                              Plant.id 전문 관리 팁
                              <span className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded-full border border-blue-200 ml-2">
                                🔬 과학적 분석
                              </span>
                            </label>
                            <div className="space-y-2">
                              {plantIdAnalysis.care_tips.plant_id_tips
                                .slice(2, 4)
                                .map((tip: string, index: number) => (
                                  <div
                                    key={index}
                                    className="flex items-start space-x-2 text-sm"
                                  >
                                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></div>
                                    <p className="text-gray-700">{tip}</p>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                      {/* OpenRouter AI 맞춤 관리 팁 */}
                      {plantIdAnalysis.care_tips?.openrouter_tips &&
                        plantIdAnalysis.care_tips.openrouter_tips.length >
                          0 && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-500 mb-2">
                              AI 맞춤 관리 팁
                              <span className="text-xs text-purple-500 bg-purple-50 px-2 py-1 rounded-full border border-purple-200 ml-2">
                                🤖 OpenRouter AI
                              </span>
                            </label>
                            <div className="space-y-2">
                              {plantIdAnalysis.care_tips.openrouter_tips
                                .slice(0, 3)
                                .map((tip: string, index: number) => (
                                  <div
                                    key={index}
                                    className="flex items-start space-x-2 text-sm"
                                  >
                                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-1.5 flex-shrink-0"></div>
                                    <p className="text-gray-700">{tip}</p>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 활동 추가 버튼 */}
        <div className="text-center mb-8">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-lg font-medium flex items-center space-x-2 transition-colors mx-auto shadow-md"
          >
            <span className="text-xl">+</span>
            <span>활동 추가</span>
          </button>
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

      {/* AddTodoModal */}
      {isModalOpen && (
        <AddTodoModal
          date={new Date()}
          preselectedPlantId={plantId}
          onClose={() => {
            setIsModalOpen(false);
            // 모달 닫힌 후 데이터 새로고침
            loadPlantData();
          }}
        />
      )}
    </Layout>
  );
}
