"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPlant, type CreatePlantRequest } from "@/lib/api";
import { useUserStore } from "@/app/lib/userStore";
import Layout from "@/app/components/Layout";

export default function AddPlantPage() {
  const router = useRouter();
  const { user } = useUserStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    location: "",
    image_url: "",
    adopted_at: "",
  });

  // 식물 종류별 이미지 매핑
  const plantImages = {
    몬스테라: "/images/plants/Monsstera.png",
    스킨답서스: "/images/plants/Scindastus.png",
    필로덴드론: "/images/plants/Foliage.png",
    산세베리아: "/images/plants/Sansevlros.png",
    다육식물: "/images/plants/Miscell.png",
    선인장: "/images/plants/Cactus.png",
    허브: "/images/plants/Herb.png",
    관엽식물: "/images/plants/Foliage.png",
  };

  // 실제 로그인한 사용자 ID 사용 (없으면 테스트용 UUID)
  const userId = user?.id || "00000000-0000-0000-0000-000000000000";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("식물 이름을 입력해주세요.");
      return;
    }

    if (!formData.species.trim()) {
      setError("식물 종류를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const imageUrl = formData.image_url.trim() || undefined;

      const plantData: CreatePlantRequest = {
        user_id: userId,
        name: formData.name.trim(),
        species: formData.species.trim(),
        location: formData.location.trim() || "내방", // 기본값
        image_url: imageUrl,
        adopted_at: formData.adopted_at || undefined,
      };

      await createPlant(plantData);

      // 성공 시 식물 목록 페이지로 이동
      router.push("/plants");
    } catch (err) {
      setError("식물 추가에 실패했습니다.");
      console.error("Failed to create plant:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/plants");
  };

  return (
    <Layout subtitle="새 식물 추가하기">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🌱 새 식물 추가
          </h1>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  식물 이름 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400"
                  placeholder="예: 몬스테라, 스킨답서스"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  식물 종류 *
                </label>
                <select
                  value={formData.species}
                  onChange={(e) => {
                    const selectedSpecies = e.target.value;
                    setFormData({
                      ...formData,
                      species: selectedSpecies,
                      image_url: selectedSpecies
                        ? plantImages[
                            selectedSpecies as keyof typeof plantImages
                          ] || ""
                        : "",
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  required
                >
                  <option value="">식물 종류를 선택하세요</option>
                  <option value="몬스테라">몬스테라</option>
                  <option value="스킨답서스">스킨답서스</option>
                  <option value="필로덴드론">필로덴드론</option>
                  <option value="산세베리아">산세베리아</option>
                  <option value="다육식물">다육식물</option>
                  <option value="선인장">선인장</option>
                  <option value="허브">허브</option>
                  <option value="관엽식물">관엽식물</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  위치
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400"
                  placeholder="예: 내방, 거실, 베란다"
                />
                <p className="text-sm text-gray-500 mt-1">
                  비워두면 "내방"으로 설정됩니다.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  입양일
                </label>
                <input
                  type="date"
                  value={formData.adopted_at}
                  onChange={(e) =>
                    setFormData({ ...formData, adopted_at: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                />
                <p className="text-sm text-gray-500 mt-1">
                  식물을 입양한 날짜입니다.
                </p>
              </div>
            </div>

            {/* 선택된 식물 이미지 미리보기 */}
            {formData.species && formData.image_url && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  선택된 식물 이미지
                </label>
                <div className="flex items-center space-x-4">
                  <img
                    src={formData.image_url}
                    alt={formData.species}
                    className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                    onError={(e) => {
                      console.error(
                        "Image failed to load:",
                        formData.image_url
                      );
                      // 에러 시 기본 이미지로 대체
                      e.currentTarget.src = "/images/plants/Miscell.png";
                      e.currentTarget.onerror = null; // 무한 루프 방지
                    }}
                    onLoad={() => {
                      console.log(
                        "Image loaded successfully:",
                        formData.image_url
                      );
                    }}
                  />
                  <div className="text-sm text-gray-600">
                    <p>
                      <strong>{formData.species}</strong>
                    </p>
                    <p>종류 선택 시 자동으로 이미지가 설정됩니다.</p>
                    <p className="text-xs text-gray-400">
                      경로: {formData.image_url}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                {loading ? "추가 중..." : "식물 추가하기"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
