import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // 환경 변수 확인
    if (!process.env.PLANT_ID_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Plant.id API 키가 설정되지 않았습니다. .env.local 파일에 PLANT_ID_API_KEY를 설정해주세요.",
        },
        { status: 400 }
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

    // Plant.id API v3로 식물 분석
    const plantIdResponse = await fetch("https://api.plant.id/v3/identify", {
      method: "POST",
      headers: {
        "Api-Key": process.env.PLANT_ID_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        images: [`data:image/jpeg;base64,${base64Image}`],
        health: "all", // 건강 상태 평가 포함
        similar_images: true, // 유사한 이미지 포함
        plant_details: [
          "common_names",
          "url",
          "description",
          "description_gpt",
          "taxonomy",
          "image",
          "images",
          "synonyms",
          "edible_parts",
          "propagation_methods",
          "watering",
          "best_watering",
          "best_light_condition",
          "best_soil_type",
          "common_uses",
          "toxicity",
          "cultural_significance",
          "gpt",
        ],
        disease_details: [
          "local_name",
          "description",
          "url",
          "treatment",
          "classification",
          "common_names",
          "cause",
        ],
        symptoms: true, // 증상 히트맵 및 심각도 점수 포함
        classification_level: "species", // 종 수준까지 식별
      }),
    });

    if (!plantIdResponse.ok) {
      const errorText = await plantIdResponse.text();
      throw new Error(
        `Plant.id API v3 오류: ${plantIdResponse.status} - ${errorText}`
      );
    }

    const response = await plantIdResponse.json();
    console.log("Plant.id v3 분석 결과:", response);

    // v3 응답 구조에 맞춰 분석
    const analysis = await analyzeV3Response(response);

    return NextResponse.json({
      success: true,
      analysis: analysis,
    });
  } catch (error) {
    console.error("이미지 분석 중 오류 발생:", error);

    let errorMessage = "이미지 분석 중 오류가 발생했습니다.";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("API 키가 설정되지 않았습니다")) {
        errorMessage =
          "Plant.id API 키가 설정되지 않았습니다. .env.local 파일을 확인해주세요.";
        statusCode = 400;
      } else if (error.message.includes("Plant.id API v3 오류")) {
        errorMessage = `Plant.id API v3 오류: ${error.message}`;
        statusCode = 500;
      } else if (error.message.includes("이미지를 다운로드할 수 없습니다")) {
        errorMessage =
          "이미지 다운로드에 실패했습니다. 이미지 URL을 확인해주세요.";
        statusCode = 400;
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: statusCode }
    );
  }
}

async function analyzeV3Response(response: any) {
  console.log("Plant.id v3 응답 구조:", JSON.stringify(response, null, 2));

  // v3 응답 구조 확인
  if (!response || !response.result) {
    console.log(
      "analyzeV3Response: Plant.id v3 응답이 유효하지 않습니다:",
      response
    );
    return generateDefaultAnalysis("알 수 없는 식물", 0);
  }

  const { result } = response;

  // 식물인지 확인
  if (!result.is_plant || !result.is_plant.binary) {
    return generateDefaultAnalysis("식물이 아닙니다", 0);
  }

  // 식물 식별 결과
  if (!result.classification || !result.classification.suggestions) {
    return generateDefaultAnalysis("식물을 식별할 수 없습니다", 0);
  }

  const suggestions = result.classification.suggestions;
  if (suggestions.length === 0) {
    return generateDefaultAnalysis("식물을 식별할 수 없습니다", 0);
  }

  // 상위 결과 분석
  const topResults = suggestions.slice(0, 3);
  const topResult = topResults[0];

  // 식물명과 신뢰도 추출
  let plantName = topResult?.name || "알 수 없는 식물";
  let confidence = Math.round((topResult?.probability || 0) * 100);

  // 한국어 이름 찾기
  let koreanName = plantName;
  if (
    topResult?.details?.common_names &&
    Array.isArray(topResult.details.common_names)
  ) {
    const koreanCommonName = topResult.details.common_names.find(
      (name: string) => /[가-힣]/.test(name)
    );
    if (koreanCommonName) {
      koreanName = koreanCommonName;
    } else {
      koreanName = topResult.details.common_names[0] || plantName;
    }
  }

  // 건강 상태 분석
  let healthScore = 5;
  let growthStatus = "보통";
  let detectedDiseases: string[] = [];
  let healthDetails = null;

  if (result.health && result.health.is_healthy !== undefined) {
    const healthProbability = result.health.is_healthy.probability || 0;
    healthScore = Math.max(1, Math.min(10, Math.round(healthProbability * 10)));
    growthStatus = determineGrowthStatus(healthScore);

    // 질병 정보 추출
    if (result.health.disease && result.health.disease.suggestions) {
      const significantDiseases = result.health.disease.suggestions
        .filter((disease: any) => disease.probability > 0.1)
        .slice(0, 3);

      significantDiseases.forEach((disease: any) => {
        const diseaseName = disease.name;
        const probability = (disease.probability * 100).toFixed(1);
        const diseaseDescription = getDiseaseDescription(diseaseName);

        detectedDiseases.push(
          `${diseaseName} (${probability}% 확률): ${diseaseDescription}`
        );
      });
    }

    // 증상 히트맵 정보
    if (response.symptoms) {
      healthDetails = {
        symptoms: response.symptoms,
        overall_defect_score: response.overall_defect_score,
      };
    }
  }

  // 관리 팁 생성
  const plantDetails = topResult?.details;
  const careTips = generateCareTips(
    plantDetails,
    plantName,
    koreanName,
    healthScore
  );

  // 상세 분석 생성
  const detailedAnalysis = generateDetailedAnalysis(
    koreanName,
    confidence,
    topResults,
    careTips
  );

  // 최종 응답 (기존 UI 구조 유지)
  const finalResponse = {
    plant_species: plantName,
    korean_name: koreanName,
    growth_status: growthStatus,
    health_score: healthScore,
    care_tips: {
      plant_details: careTips,
      detected_diseases: detectedDiseases,
    },
    confidence: confidence,
    detailed_analysis: detailedAnalysis,
    health_details: healthDetails, // v3 새로운 기능
    plant_details: plantDetails, // 상세 식물 정보
  };

  console.log("v3 최종 응답 완성:", {
    plant_name: finalResponse.plant_species,
    korean_name: finalResponse.korean_name,
    health_score: finalResponse.health_score,
    care_tips_count: finalResponse.care_tips.plant_details.length,
    detected_diseases_count: finalResponse.care_tips.detected_diseases.length,
  });

  return finalResponse;
}

// 관리 팁 생성
function generateCareTips(
  plantDetails: any,
  plantName: string,
  koreanName: string,
  healthScore: number
) {
  const tips: string[] = [];

  // 물주기 정보
  if (plantDetails?.watering) {
    const watering = plantDetails.watering;
    if (
      typeof watering === "object" &&
      watering.min !== undefined &&
      watering.max !== undefined
    ) {
      tips.push(
        `💧 ${koreanName} 권장 물주기: 주 ${watering.min}-${watering.max}회`
      );
    } else if (typeof watering === "string") {
      tips.push(`💧 ${koreanName} 물주기: ${watering}`);
    }
  }

  // 조명 조건
  if (plantDetails?.best_light_condition) {
    tips.push(
      `🌞 ${koreanName} 조명 조건: ${plantDetails.best_light_condition}`
    );
  }

  // 토양 타입
  if (plantDetails?.best_soil_type) {
    tips.push(`🌱 ${koreanName} 토양: ${plantDetails.best_soil_type}`);
  }

  // 관리 팁이 부족하면 기본 팁 추가
  if (tips.length < 3) {
    tips.push(
      `🌿 ${koreanName}는 정기적인 관찰이 필요합니다. 잎의 색깔과 토양 상태를 확인하세요.`
    );
  }

  return tips.slice(0, 3);
}

// 질병 설명
function getDiseaseDescription(diseaseName: string): string {
  const lowerDiseaseName = diseaseName.toLowerCase();

  // 테스트에서 확인된 질병들
  if (
    lowerDiseaseName.includes("fungi") ||
    lowerDiseaseName.includes("곰팡이")
  ) {
    return "곰팡이 감염으로, 잎이나 줄기에 흰색, 회색, 검은색 곰팡이가 생기는 질병입니다.";
  } else if (
    lowerDiseaseName.includes("animalia") ||
    lowerDiseaseName.includes("해충")
  ) {
    return "해충 침입으로, 잎이나 줄기에 작은 벌레나 진딧물이 생기는 질병입니다.";
  } else if (
    lowerDiseaseName.includes("water excess") ||
    lowerDiseaseName.includes("과수분")
  ) {
    return "과도한 물주기로 인한 과습으로, 뿌리가 썩거나 잎이 노랗게 변하는 증상입니다.";
  } else if (lowerDiseaseName.includes("mechanical damage")) {
    return "물리적인 손상으로, 잎이 찢어지거나 구멍이 생긴 상태입니다.";
  } else if (lowerDiseaseName.includes("leaf spot")) {
    return "잎에 갈색이나 검은색 반점이 생기는 질병으로, 곰팡이나 세균에 의해 발생합니다.";
  } else if (lowerDiseaseName.includes("yellowing")) {
    return "잎이 노랗게 변하는 증상으로, 영양 부족이나 과습, 건조 등 다양한 원인이 있습니다.";
  } else if (lowerDiseaseName.includes("root rot")) {
    return "뿌리가 썩는 질병으로, 과습이나 배수 불량으로 인해 발생합니다.";
  } else if (lowerDiseaseName.includes("powdery mildew")) {
    return "흰가루병으로, 잎에 흰색 가루가 생기는 곰팡이 질병입니다.";
  } else {
    return "식물의 건강 상태에 영향을 주는 질병이나 증상입니다.";
  }
}

// 성장 상태 판단
function determineGrowthStatus(healthScore: number): string {
  if (healthScore >= 8) return "매우 좋음";
  if (healthScore >= 6) return "좋음";
  if (healthScore >= 4) return "보통";
  if (healthScore >= 2) return "나쁨";
  return "매우 나쁨";
}

// 상세 분석 생성
function generateDetailedAnalysis(
  koreanName: string,
  confidence: number,
  topResults: any[],
  careTips: string[]
): string {
  let analysis = `${koreanName} 식물을 ${confidence}%의 정확도로 식별했습니다. `;

  if (topResults.length > 1) {
    analysis += `다른 가능성으로는 ${topResults[1].name}(${Math.round(
      topResults[1].probability * 100
    )}%)이 있습니다. `;
  }

  if (careTips.length > 0) {
    analysis += `관리 팁: ${careTips[0].replace(/^[^\s]*\s/, "")} `;
  }

  return analysis;
}

// 기본 분석 생성
function generateDefaultAnalysis(plantName: string, confidence: number) {
  return {
    plant_species: plantName,
    korean_name: plantName,
    growth_status: "알 수 없음",
    health_score: 0,
    care_tips: {
      plant_details: [
        "식물을 정확히 식별할 수 없습니다. 더 명확한 사진을 제공해주세요.",
      ],
      detected_diseases: [],
    },
    confidence: confidence,
    detailed_analysis:
      "AI가 식물을 정확히 식별하지 못했습니다. 더 명확하고 선명한 사진을 제공해주세요.",
  };
}
