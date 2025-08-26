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

    // Plant.id API v3로 기본 식별 수행
    const plantIdResponse = await fetch(
      "https://plant.id/api/v3/identification",
      {
        method: "POST",
        headers: {
          "Api-Key": process.env.PLANT_ID_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          images: [`data:image/jpeg;base64,${base64Image}`],
          health: "all", // 건강 상태 평가 포함
          similar_images: true, // 유사한 이미지 포함
          symptoms: true, // 증상 히트맵 및 심각도 점수 포함
          classification_level: "species", // 종 수준까지 식별
        }),
      }
    );

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

  // 한국어 이름 찾기 (v3에서는 common_names가 제한적일 수 있음)
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

  // 건강 상태 분석 (v3 구조에 맞게 수정)
  if (result.is_healthy !== undefined) {
    const healthProbability = result.is_healthy.probability || 0;
    healthScore = Math.max(1, Math.min(10, Math.round(healthProbability * 10)));
    growthStatus = determineGrowthStatus(healthScore);

    // 질병 정보 추출 (v3 구조에 맞게 수정)
    if (result.disease && result.disease.suggestions) {
      const significantDiseases = result.disease.suggestions
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

  // 식물 종류 카테고리 판단
  const plantCategory = getPlantCategory(plantName, koreanName);

  // 관리 팁 생성 (v3 구조에 맞게 수정)
  const careTips = generateCareTips(plantName, koreanName, healthScore);

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
    plant_category: plantCategory, // 식물 종류 카테고리 추가
    growth_status: growthStatus,
    health_score: healthScore,
    care_tips: {
      plant_details: careTips,
      detected_diseases: detectedDiseases,
    },
    confidence: confidence,
    detailed_analysis: detailedAnalysis,
    health_details: healthDetails, // v3 새로운 기능
  };

  console.log("v3 최종 응답 완성:", {
    plant_name: finalResponse.plant_species,
    korean_name: finalResponse.korean_name,
    plant_category: finalResponse.plant_category,
    health_score: finalResponse.health_score,
    care_tips_count: finalResponse.care_tips.plant_details.length,
    detected_diseases_count: finalResponse.care_tips.detected_diseases.length,
  });

  return finalResponse;
}

// 관리 팁 생성 (v3 구조에 맞게 수정)
function generateCareTips(
  plantName: string,
  koreanName: string,
  healthScore: number
) {
  const tips: string[] = [];

  // 식물 종류와 건강 상태에 따른 동적 팁 생성
  const plantType = getPlantCategory(plantName, koreanName);

  // 첫 번째 팁: 식물종 + 건강 + 물주기
  if (plantType === "선인장류" || plantType === "다육식물") {
    tips.push(
      `💧 ${koreanName}는 건조한 환경을 좋아합니다. 토양이 완전히 마를 때까지 기다린 후 물을 주세요.`
    );
  } else if (plantType === "야자류" || plantType === "관엽식물") {
    tips.push(
      `💧 ${koreanName}는 적당한 습도를 유지해야 합니다. 토양이 약간 마르면 물을 주세요.`
    );
  } else {
    tips.push(
      `💧 ${koreanName}는 정기적인 물주기가 필요합니다. 토양 상태를 확인하여 적절한 시기에 물을 주세요.`
    );
  }

  // 두 번째 팁: 건강 + 질병
  if (healthScore < 4) {
    tips.push(
      `⚠️ ${koreanName}의 건강 상태가 좋지 않습니다. 질병이나 해충이 있는지 자세히 관찰해주세요.`
    );
  } else if (healthScore < 6) {
    tips.push(
      `🌱 ${koreanName}의 건강 상태를 개선하기 위해 적절한 환경 조건을 제공해주세요.`
    );
  } else {
    tips.push(
      `✅ ${koreanName}의 건강 상태가 양호합니다. 현재 관리 방법을 유지해주세요.`
    );
  }

  // 세 번째 팁: 건강 + 계절
  const currentMonth = new Date().getMonth() + 1;
  if (currentMonth >= 3 && currentMonth <= 5) {
    tips.push(
      `🌸 봄철 ${koreanName}는 성장기입니다. 적절한 비료와 물을 제공해주세요.`
    );
  } else if (currentMonth >= 6 && currentMonth <= 8) {
    tips.push(
      `☀️ 여름철 ${koreanName}는 더위에 주의해야 합니다. 통풍과 적절한 그늘을 제공해주세요.`
    );
  } else if (currentMonth >= 9 && currentMonth <= 11) {
    tips.push(
      `🍂 가을철 ${koreanName}는 성장이 둔화됩니다. 물주기를 줄이고 겨울 준비를 해주세요.`
    );
  } else {
    tips.push(
      `❄️ 겨울철 ${koreanName}는 휴면기입니다. 물주기를 최소화하고 따뜻한 곳에 보관해주세요.`
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

// 식물 종류 카테고리 매핑 함수 (도트 이미지와 연계)
function getPlantCategory(plantName: string, koreanName: string): string {
  const lowerPlantName = plantName.toLowerCase();
  const lowerKoreanName = koreanName.toLowerCase();

  // 선인장류
  if (
    lowerPlantName.includes("cactus") ||
    lowerPlantName.includes("cereus") ||
    lowerPlantName.includes("echinopsis") ||
    lowerPlantName.includes("carnegiea") ||
    lowerPlantName.includes("cephalocereus") ||
    lowerPlantName.includes("polylophus") ||
    lowerPlantName.includes("tetetzo") ||
    lowerPlantName.includes("oxygona") ||
    lowerPlantName.includes("gigantea") ||
    lowerKoreanName.includes("선인장")
  ) {
    return "선인장류";
  }

  // 야자류
  if (
    lowerPlantName.includes("palm") ||
    lowerPlantName.includes("chamaedorea") ||
    lowerPlantName.includes("howea") ||
    lowerPlantName.includes("dracaena") ||
    lowerPlantName.includes("reflexa") ||
    lowerPlantName.includes("fragrans") ||
    lowerPlantName.includes("elegans") ||
    lowerPlantName.includes("forsteriana") ||
    lowerPlantName.includes("indivisa") ||
    lowerPlantName.includes("australis") ||
    lowerKoreanName.includes("야자")
  ) {
    return "야자류";
  }

  // 다육식물
  if (
    lowerPlantName.includes("succulent") ||
    lowerPlantName.includes("adenium") ||
    lowerPlantName.includes("crassula") ||
    lowerPlantName.includes("echeveria") ||
    lowerPlantName.includes("obesum") ||
    lowerPlantName.includes("roseus") ||
    lowerPlantName.includes("guatemalensis") ||
    lowerKoreanName.includes("다육")
  ) {
    return "다육식물";
  }

  // 허브류
  if (
    lowerPlantName.includes("salvia") ||
    lowerPlantName.includes("rosemary") ||
    lowerPlantName.includes("thyme") ||
    lowerPlantName.includes("basil") ||
    lowerPlantName.includes("officinalis") ||
    lowerPlantName.includes("syriaca") ||
    lowerPlantName.includes("hypogaea") ||
    lowerKoreanName.includes("허브") ||
    lowerKoreanName.includes("살비아")
  ) {
    return "허브류";
  }

  // 고사리류
  if (
    lowerPlantName.includes("fern") ||
    lowerPlantName.includes("asplenium") ||
    lowerPlantName.includes("nephrolepis") ||
    lowerKoreanName.includes("고사리")
  ) {
    return "고사리류";
  }

  // 관엽식물
  if (
    lowerPlantName.includes("philodendron") ||
    lowerPlantName.includes("monstera") ||
    lowerPlantName.includes("ficus") ||
    lowerPlantName.includes("calathea") ||
    lowerPlantName.includes("actinophyllum") ||
    lowerPlantName.includes("zamiifolia") ||
    lowerPlantName.includes("comosum") ||
    lowerPlantName.includes("australis") ||
    lowerKoreanName.includes("관엽")
  ) {
    return "관엽식물";
  }

  // 기타 (수생식물류 포함)
  return "기타";
}

// 기본 분석 생성
function generateDefaultAnalysis(plantName: string, confidence: number) {
  return {
    plant_species: plantName,
    korean_name: plantName,
    plant_category: "기타", // 기본 카테고리 추가
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
