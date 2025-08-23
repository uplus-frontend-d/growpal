import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // 환경 변수 디버깅
    console.log("=== 환경 변수 디버깅 ===");
    console.log(
      "PLANT_ID_API_KEY:",
      process.env.PLANT_ID_API_KEY ? "있음" : "없음"
    );
    console.log(
      "OPENROUTER_API_KEY:",
      process.env.OPENROUTER_API_KEY ? "있음" : "없음"
    );
    console.log(
      "모든 환경 변수 키들:",
      Object.keys(process.env).filter((key) => key.includes("API"))
    );
    console.log("========================");

    // API 키 확인
    if (!process.env.PLANT_ID_API_KEY) {
      return NextResponse.json(
        { error: "Plant.id API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const { imageUrl } = await req.json();
    console.log("받은 이미지 URL:", imageUrl);

    if (!imageUrl) {
      return NextResponse.json(
        { error: "이미지 URL이 필요합니다." },
        { status: 400 }
      );
    }

    // 이미지 URL에서 이미지 데이터 다운로드
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: "이미지를 다운로드할 수 없습니다." },
        { status: 400 }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    console.log("이미지 다운로드 완료, 크기:", imageBuffer.byteLength);

    // 이미지를 Base64로 인코딩
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    console.log("Base64 인코딩 완료");

    // Plant.id API로 식물 분석
    const plantIdResponse = await fetch("https://api.plant.id/v2/identify", {
      method: "POST",
      headers: {
        "Api-Key": process.env.PLANT_ID_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        images: [`data:image/jpeg;base64,${base64Image}`],
        modifiers: ["health_all", "disease_similar_images", "crop_fast"],
        plant_details: [
          "common_names",
          "care_instructions",
          "watering",
          "treatment",
          "description",
        ],
      }),
    });

    if (!plantIdResponse.ok) {
      const errorText = await plantIdResponse.text();
      throw new Error(
        `Plant.id API 오류: ${plantIdResponse.status} - ${errorText}`
      );
    }

    const response = await plantIdResponse.json();
    console.log("Plant.id 분석 결과:", response);

    // AI 응답 분석
    const analysis = await analyzeAIResponse(response);

    return NextResponse.json({
      success: true,
      analysis: analysis,
    });
  } catch (error) {
    console.error("이미지 분석 중 오류 발생:", error);
    return NextResponse.json(
      {
        error: "이미지 분석 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

// Plant.id API 응답을 분석하여 구조화된 데이터로 변환
async function analyzeAIResponse(plantIdResponse: any) {
  try {
    const suggestions = plantIdResponse.suggestions || [];
    if (suggestions.length === 0) {
      return {
        error: "식물을 식별할 수 없습니다.",
        suggestions: [],
      };
    }

    const topSuggestion = suggestions[0];
    const plantName = topSuggestion.plant_name || "Unknown Plant";
    const koreanName = getKoreanName(plantName);
    const confidence = topSuggestion.probability || 0;

    // 건강 상태 분석
    const healthAnalysis = analyzeHealth(plantIdResponse.health);
    const diseaseAnalysis = analyzeDiseases(plantIdResponse.health);

    // 관리 정보 추출
    const careInfo = extractCareInfo(topSuggestion);

    return {
      plant_name: plantName,
      korean_name: koreanName,
      confidence: confidence,
      health: healthAnalysis,
      diseases: diseaseAnalysis,
      care_instructions: careInfo,
      raw_response: plantIdResponse,
    };
  } catch (error) {
    console.error("AI 응답 분석 오류:", error);
    return {
      error: "응답 분석 중 오류가 발생했습니다.",
      raw_response: plantIdResponse,
    };
  }
}

// 건강 상태 분석
function analyzeHealth(health: any) {
  if (!health || !health.is_healthy) {
    return {
      is_healthy: false,
      health_probability: 0,
      issues: health?.diseases || [],
    };
  }

  return {
    is_healthy: true,
    health_probability: health.probability || 100,
    issues: [],
  };
}

// 질병 분석
function analyzeDiseases(health: any) {
  if (!health || !health.diseases) {
    return [];
  }

  return health.diseases.map((disease: any) => ({
    name: disease.name || "Unknown Disease",
    probability: disease.probability || 0,
    similar_images: disease.similar_images || [],
  }));
}

// 관리 정보 추출
function extractCareInfo(suggestion: any) {
  const care = suggestion.plant_details || {};

  return {
    common_names: care.common_names || [],
    care_instructions: care.care_instructions || {},
    watering: care.watering || {},
    treatment: care.treatment || {},
    description: care.description || "",
  };
}

// 한국어 이름 매핑
function getKoreanName(englishName: string): string {
  const nameMap: { [key: string]: string } = {
    "Monstera deliciosa": "몬스테라",
    "Spathiphyllum wallisii": "스파티필럼",
    "Syngonium podophyllum": "싱고니움",
    "Ficus elastica": "고무나무",
    Pothos: "포토스",
    Sansevieria: "산세베리아",
    Echeveria: "에케베리아",
    Gymnocalycium: "비모란",
    Cactus: "선인장",
    Foliage: "관엽식물",
    Herb: "허브",
    Miscellaneous: "기타",
  };

  return nameMap[englishName] || englishName;
}



