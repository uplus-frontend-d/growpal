"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlantAnalysis {
  plant_species: string;
  growth_status: string;
  health_score: number;
  care_tips: string[];
  watering_frequency: string;
  confidence: number;
  detailed_analysis: string;
}

export default function TestPlant() {
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PlantAnalysis | null>(null);
  const [error, setError] = useState("");

  // analysis 상태 변경 시 로그 출력
  console.log("현재 analysis 상태:", analysis);

  const handleAnalyze = async () => {
    if (!imageUrl.trim()) {
      setError("이미지 URL을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const response = await fetch("/api/test-plant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "분석 중 오류가 발생했습니다.");
      }

      console.log("API 응답 전체:", data);
      console.log("분석 데이터:", data.analysis);

      setAnalysis(data.analysis);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Plant.id 식물 분석 테스트</h1>
        <p className="text-gray-600">
          이미지 URL을 입력하면 Plant.id AI가 식물을 분석하고 관리 팁을
          제공합니다.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>이미지 분석</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label
              htmlFor="imageUrl"
              className="block text-sm font-medium mb-2"
            >
              이미지 URL
            </label>
            <input
              id="imageUrl"
              type="url"
              placeholder="https://example.com/plant-image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "분석 중..." : "Plant.id로 식물 분석하기"}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {analysis && (
        <div className="space-y-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>식물 기본 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold">식물 종류:</span>
                  <p className="text-lg">
                    {analysis.plant_species || "알 수 없음"}
                  </p>
                </div>
                <div>
                  <span className="font-semibold">성장 상태:</span>
                  <p className="text-lg">
                    {analysis.growth_status || "알 수 없음"}
                  </p>
                </div>
                <div>
                  <span className="font-semibold">건강 점수:</span>
                  <p className="text-lg">{analysis.health_score || 0}/10</p>
                </div>
                <div>
                  <span className="font-semibold">분석 신뢰도:</span>
                  <p className="text-lg">{analysis.confidence || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 상세 분석 */}
          <Card>
            <CardHeader>
              <CardTitle>AI 상세 분석</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={
                  analysis.detailed_analysis ||
                  "상세 분석을 불러올 수 없습니다."
                }
                readOnly
                className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md resize-none bg-gray-50"
              />
            </CardContent>
          </Card>

          {/* 관리 팁 */}
          <Card>
            <CardHeader>
              <CardTitle>관리 팁</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.care_tips && Array.isArray(analysis.care_tips) ? (
                  analysis.care_tips.map((tip, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700">{tip}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">관리 팁을 불러올 수 없습니다.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 관리 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>물주기 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">
                {analysis.watering_frequency || "알 수 없음"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
