"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getPlant,
  getPlantTodos,
  getPlantDiaries,
  type Plant,
  type PlantTodo,
  type PlantDiary,
} from "@/lib/api";
import Layout from "@/app/components/Layout";
import { useUserStore } from "@/app/lib/userStore";

export default function PlantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUserStore();
  const plantId = params.plant_id as string;

  const [plant, setPlant] = useState<Plant | null>(null);
  const [todos, setTodos] = useState<PlantTodo[]>([]);
  const [diaries, setDiaries] = useState<PlantDiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setTodos(todosData);
      setDiaries(diariesData);
      setError(null);
    } catch (err) {
      setError("식물 정보를 불러오는데 실패했습니다.");
      console.error("Failed to load plant data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (plantId) {
      loadPlantData();
    }
  }, [plantId]);

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
        {todos.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📋</span>할 일 목록
            </h2>

            <div className="space-y-3">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className={`p-3 rounded-lg border ${
                    todo.is_done
                      ? "bg-green-50 border-green-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
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
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        todo.is_done
                          ? "bg-green-500 border-green-500"
                          : "border-gray-300"
                      }`}
                    >
                      {todo.is_done && (
                        <svg
                          className="w-full h-full text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
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
            다이어리
          </h2>

          {diaries.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📖</div>
              <p className="text-gray-600 mb-2">아직 다이어리가 없습니다.</p>
              <p className="text-sm text-gray-500">
                첫 번째 다이어리를 작성해보세요!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {diaries.map((diary) => (
                <div
                  key={diary.id}
                  className="border-b border-gray-200 pb-6 last:border-b-0"
                >
                  <div className="flex items-start space-x-4">
                    {diary.image_url && (
                      <img
                        src={diary.image_url}
                        alt="다이어리 이미지"
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 whitespace-pre-wrap text-lg leading-relaxed">
                        {diary.note}
                      </p>
                      <p className="text-sm text-gray-500 mt-3">
                        {formatDateTime(diary.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
