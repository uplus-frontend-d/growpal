"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserPlants, deletePlant, type Plant } from "@/lib/api";
import Layout from "@/app/components/Layout";
import { useUserStore } from "@/app/lib/userStore";

export default function PlantsPage() {
  const router = useRouter();
  const { user } = useUserStore();

  // 실제 로그인한 사용자 ID 사용 (없으면 테스트용 UUID)
  // const userId = user?.id || "00000000-0000-0000-0000-000000000000";

  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    plantId: string;
    plantName: string;
  }>({
    show: false,
    plantId: "",
    plantName: "",
  });

  // 식물 목록 불러오기
  const loadPlants = async () => {
    try {
      setLoading(true);
      const data = await getUserPlants(user?.id);
      setPlants(data);
      setError(null);
    } catch (err) {
      setError("식물 목록을 불러오는데 실패했습니다.");
      console.error("Failed to load plants:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadPlants();
    }
  }, [user?.id]);

  // 식물 삭제 처리
  const handleDeletePlant = async () => {
    try {
      await deletePlant(deleteConfirm.plantId);
      setDeleteConfirm({ show: false, plantId: "", plantName: "" });
      // 삭제 후 목록 새로고침
      loadPlants();
    } catch (err) {
      setError("식물 삭제에 실패했습니다.");
      console.error("Failed to delete plant:", err);
    }
  };

  // 삭제 확인 팝업 열기
  const openDeleteConfirm = (plantId: string, plantName: string) => {
    setDeleteConfirm({ show: true, plantId, plantName });
  };

  // 삭제 확인 팝업 닫기
  const closeDeleteConfirm = () => {
    setDeleteConfirm({ show: false, plantId: "", plantName: "" });
  };

  return (
    <Layout subtitle="테스트 유저의 식물 목록입니다">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* 식물 목록 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-2 text-gray-600">식물 목록을 불러오는 중...</p>
          </div>
        ) : plants.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🌱</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              아직 등록된 식물이 없습니다
            </h3>
            <p className="text-gray-600 mb-4">첫 번째 식물을 추가해보세요!</p>
            <button
              onClick={() => (window.location.href = "/plants/add")}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              첫 식물 추가하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plants.map((plant) => (
              <div
                key={plant.id}
                className="bg-white rounded-lg shadow-md overflow-hidden relative cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/plants/${plant.id}`)}
              >
                {/* 삭제 버튼 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteConfirm(plant.id, plant.name);
                  }}
                  className="absolute top-2 right-2 z-10 w-6 h-6 bg-red-300 hover:bg-red-400 text-white rounded-full flex items-center justify-center transition-colors"
                  title="식물 삭제"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                {/* 식물 이미지 */}
                <div className="h-48 bg-[#FBEFDD] flex items-center justify-center">
                  {plant.image_url ? (
                    <img
                      src={plant.image_url}
                      alt={plant.name}
                      className="h-full w-auto object-contain"
                      onError={(e) => {
                        console.error("Image failed to load:", plant.image_url);
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextElementSibling?.classList.remove(
                          "hidden"
                        );
                      }}
                    />
                  ) : null}
                  <div
                    className={`text-4xl text-gray-400 ${
                      plant.image_url ? "hidden" : ""
                    }`}
                  >
                    🌿
                  </div>
                </div>

                {/* 식물 정보 */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {plant.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 삭제 확인 팝업 */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <div className="text-red-500 mr-3">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  식물 삭제
                </h3>
              </div>

              <p className="text-gray-600 mb-6">
                <strong>"{deleteConfirm.plantName}"</strong> 식물을
                삭제하시겠습니까?
                <br />이 작업은 되돌릴 수 없습니다.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleDeletePlant}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  삭제
                </button>
                <button
                  onClick={closeDeleteConfirm}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
