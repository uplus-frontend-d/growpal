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
    {
      value: "Unknown Plant",
      label: "기타 (Unknown Plant)",
      korean: "기타",
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
    "매일",
    "2-3일에 한 번",
    "주 2회",
    "주 1회",
    "10일에 한 번",
    "2주에 한 번",
    "월 1회",
    "거의 필요 없음",
  ];

  // 테스트 실행 함수
  const runTest = async () => {
    setIsLoading(true);
    setError("");
    setTips([]);

    try {
      const response = await fetch("/api/test-openrouter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      });

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
      }

      const result = await response.json();
      setTips(result.tips || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">식물 관리 테스트</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 테스트 데이터 입력 폼 */}
        <Card>
          <CardHeader>
            <CardTitle>테스트 데이터 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 식물 종류 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                식물 종류
              </label>
              <select
                value={testData.plantName}
                onChange={(e) => {
                  const selected = plantOptions.find(
                    (opt) => opt.value === e.target.value
                  );
                  setTestData({
                    ...testData,
                    plantName: e.target.value,
                    koreanName: selected?.korean || "",
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {plantOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 건강 상태 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                건강 상태
              </label>
              <select
                value={testData.healthStatus}
                onChange={(e) => {
                  const selected = healthOptions.find(
                    (opt) => opt.value === e.target.value
                  );
                  setTestData({
                    ...testData,
                    healthStatus: e.target.value,
                    healthProbability: selected?.probability || 80,
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {healthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 질병 선택 (다중 선택) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                감지된 질병/문제
              </label>
              <div className="grid grid-cols-2 gap-2">
                {diseaseOptions.map((disease) => (
                  <label key={disease} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={testData.diseases.includes(disease)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTestData({
                            ...testData,
                            diseases: [...testData.diseases, disease],
                          });
                        } else {
                          setTestData({
                            ...testData,
                            diseases: testData.diseases.filter(
                              (d) => d !== disease
                            ),
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">{disease}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 물주기 정보 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                물주기 정보
              </label>
              <select
                value={testData.wateringInfo}
                onChange={(e) =>
                  setTestData({ ...testData, wateringInfo: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {wateringOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* 테스트 실행 버튼 */}
            <Button
              onClick={runTest}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400"
            >
              {isLoading ? "테스트 실행 중..." : "OpenRouter 테스트 실행"}
            </Button>
          </CardContent>
        </Card>

        {/* 테스트 결과 표시 */}
        <Card>
          <CardHeader>
            <CardTitle>테스트 결과</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {tips.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-gray-800">
                  생성된 관리 팁 ({tips.length}개)
                </h3>
                {tips.map((tip, index) => (
                  <div
                    key={index}
                    className="p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <p className="text-sm text-gray-700">{tip}</p>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && !error && tips.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                테스트를 실행하면 여기에 결과가 표시됩니다.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 현재 설정된 테스트 데이터 표시 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>현재 테스트 데이터</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">식물명:</span> {testData.plantName}
            </div>
            <div>
              <span className="font-medium">한국어명:</span>{" "}
              {testData.koreanName}
            </div>
            <div>
              <span className="font-medium">건강상태:</span>{" "}
              {testData.healthStatus} ({testData.healthProbability}%)
            </div>
            <div>
              <span className="font-medium">감지된 질병:</span>{" "}
              {testData.diseases.length > 0
                ? testData.diseases.join(", ")
                : "없음"}
            </div>
            <div>
              <span className="font-medium">물주기:</span>{" "}
              {testData.wateringInfo}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

