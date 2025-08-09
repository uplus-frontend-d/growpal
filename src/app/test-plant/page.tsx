"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TestData {
  plantName: string;
  koreanName: string;
  healthStatus: string;
  healthProbability: number;
  diseases: string[];
  wateringInfo: string;
}

interface OpenRouterTips {
  additional_care_tips: string[];
}

export default function TestPlant() {
  const [isLoading, setIsLoading] = useState(false);
  const [tips, setTips] = useState<string[]>([]);
  const [error, setError] = useState("");

  // 테스트 데이터 상태
  const [testData, setTestData] = useState<TestData>({
    plantName: "Monstera deliciosa",
    koreanName: "몬스테라",
    healthStatus: "healthy",
    healthProbability: 80,
    diseases: [],
    wateringInfo: "주 2회",
  });

  // 드롭다운 옵션들
  const plantOptions = [
    {
      value: "Monstera deliciosa",
      label: "몬스테라 (Monstera deliciosa)",
      korean: "몬스테라",
    },
    {
      value: "Spathiphyllum wallisii",
      label: "스파티필럼 (Peace Lily)",
      korean: "평화백합",
    },
    {
      value: "Syngonium podophyllum",
      label: "싱고니움 (Arrowhead vine)",
      korean: "화살촉덩굴",
    },
    {
      value: "Ficus elastica",
      label: "고무나무 (Rubber Plant)",
      korean: "고무나무",
    },
    { value: "Pothos", label: "포토스 (Devil's Ivy)", korean: "포토스" },
    {
      value: "Sansevieria",
      label: "산세베리아 (Snake Plant)",
      korean: "산세베리아",
    },
    {
      value: "Echeveria",
      label: "에케베리아 (Echeveria)",
      korean: "다육식물",
    },
    {
      value: "Gymnocalycium",
      label: "비모란 (Moon Cactus)",
      korean: "선인장",
    },
  ];

  const healthOptions = [
    { value: "healthy", label: "건강함 (80-100%)", probability: 90 },
    { value: "mild_issues", label: "경미한 문제 (60-80%)", probability: 70 },
    { value: "moderate_issues", label: "보통 문제 (40-60%)", probability: 50 },
    { value: "severe_issues", label: "심각한 문제 (20-40%)", probability: 30 },
    { value: "critical", label: "위험 상태 (0-20%)", probability: 10 },
  ];

  const diseaseOptions = [
    "water-related issue",
    "light-related issue",
    "nutrient deficiency",
    "mechanical damage",
    "Abiotic",
    "Bacteria",
    "Fungi",
    "dead plant",
    "pest damage",
  ];

  const wateringOptions = [
    "주 1회",
    "주 2회",
    "주 3회",
    "주 1-2회",
    "주 2-3회",
    "2주에 1회",
    "월 1회",
    "월 2회",
    "계절에 따라",
  ];

  const handlePlantChange = (plantValue: string) => {
    const selected = plantOptions.find((p) => p.value === plantValue);
    setTestData((prev) => ({
      ...prev,
      plantName: plantValue,
      koreanName: selected?.korean || plantValue,
    }));
  };

  const handleHealthChange = (healthValue: string) => {
    const selected = healthOptions.find((h) => h.value === healthValue);
    setTestData((prev) => ({
      ...prev,
      healthStatus: healthValue,
      healthProbability: selected?.probability || 50,
    }));
  };

  const handleDiseaseToggle = (disease: string) => {
    setTestData((prev) => ({
      ...prev,
      diseases: prev.diseases.includes(disease)
        ? prev.diseases.filter((d) => d !== disease)
        : [...prev.diseases, disease],
    }));
  };

  const handleTest = async () => {
    setIsLoading(true);
    setError("");
    setTips([]);

    try {
      // OpenRouter API 직접 테스트
      const response = await fetch("/api/test-openrouter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      });

      if (!response.ok) {
        throw new Error("API 호출 실패");
      }

      const result: OpenRouterTips = await response.json();
      setTips(result.additional_care_tips || []);
    } catch (error) {
      console.error("OpenRouter 테스트 실패:", error);
      setError("OpenRouter 테스트 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🤖 OpenRouter AI 테스트
          </h1>
          <p className="text-gray-600">
            다양한 식물과 상태를 시뮬레이션하여 OpenRouter AI의 관리 팁을
            테스트해보세요
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 테스트 설정 패널 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                ⚙️ 테스트 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 식물 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  식물 종류
                </label>
                <select
                  value={testData.plantName}
                  onChange={(e) => handlePlantChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {plantOptions.map((plant) => (
                    <option key={plant.value} value={plant.value}>
                      {plant.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 건강 상태 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  건강 상태
                </label>
                <select
                  value={testData.healthStatus}
                  onChange={(e) => handleHealthChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {healthOptions.map((health) => (
                    <option key={health.value} value={health.value}>
                      {health.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 물주기 정보 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  적정 물주기
                </label>
                <select
                  value={testData.wateringInfo}
                  onChange={(e) =>
                    setTestData((prev) => ({
                      ...prev,
                      wateringInfo: e.target.value,
                    }))
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {wateringOptions.map((watering) => (
                    <option key={watering} value={watering}>
                      {watering}
                    </option>
                  ))}
                </select>
              </div>

              {/* 병충해 정보 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  감지된 문제점 (다중 선택 가능)
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                  {diseaseOptions.map((disease) => (
                    <label key={disease} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={testData.diseases.includes(disease)}
                        onChange={() => handleDiseaseToggle(disease)}
                        className="mr-2"
                      />
                      <span className="text-sm">{disease}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 테스트 버튼 */}
              <Button
                onClick={handleTest}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? "테스트 중..." : "🤖 OpenRouter AI 테스트"}
              </Button>

              {error && <div className="text-red-600 text-sm">{error}</div>}
            </CardContent>
          </Card>

          {/* 테스트 결과 패널 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                📋 테스트 결과
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* 현재 설정 요약 */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-gray-900 mb-2">현재 설정</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>🌱 식물: {testData.koreanName}</div>
                  <div>💪 건강도: {testData.healthProbability}%</div>
                  <div>💧 물주기: {testData.wateringInfo}</div>
                  <div>
                    ⚠️ 문제점:{" "}
                    {testData.diseases.length > 0
                      ? testData.diseases.join(", ")
                      : "없음"}
                  </div>
                </div>
              </div>

              {/* AI 관리 팁 결과 */}
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-3 text-gray-600">AI가 분석 중...</span>
                </div>
              )}

              {tips.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    🤖 OpenRouter AI 관리 팁
                    <span className="text-xs text-purple-500 bg-purple-50 px-2 py-1 rounded-full border border-purple-200 ml-2">
                      맞춤형 분석
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {tips.map((tip, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {tip}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isLoading && tips.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  위 설정으로 테스트를 시작해보세요!
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
