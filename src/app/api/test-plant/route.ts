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
      "NEXT_PLANT_ID_API_KEY:",
      process.env.NEXT_PLANT_ID_API_KEY ? "있음" : "없음"
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
      console.log(
        "⚠️ Plant.id API 키가 설정되지 않았습니다. 테스트 모드로 실행합니다."
      );
      // 테스트 모드에서는 API 키 없이도 진행 (실제 API 호출은 실패하지만 에러는 발생하지 않음)
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
    if (!process.env.PLANT_ID_API_KEY) {
      throw new Error(
        "Plant.id API 키가 설정되지 않았습니다. .env.local 파일에 PLANT_ID_API_KEY를 설정해주세요."
      );
    }

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

    // 더 구체적인 에러 메시지 제공
    let errorMessage = "이미지 분석 중 오류가 발생했습니다.";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("API 키가 설정되지 않았습니다")) {
        errorMessage =
          "Plant.id API 키가 설정되지 않았습니다. .env.local 파일을 확인해주세요.";
        statusCode = 400;
      } else if (error.message.includes("Plant.id API 오류")) {
        errorMessage = `Plant.id API 오류: ${error.message}`;
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

async function analyzeAIResponse(response: any) {
  // Plant.id 응답 구조 확인
  console.log("Plant.id 응답 구조:", JSON.stringify(response, null, 2));

  if (
    !response ||
    !response.suggestions ||
    !Array.isArray(response.suggestions)
  ) {
    console.log(
      "analyzeAIResponse: Plant.id 응답이 유효하지 않습니다:",
      response
    );
    return generateDefaultAnalysis("알 수 없는 식물", 0);
  }

  const suggestions = response.suggestions;

  if (suggestions.length === 0) {
    console.log("식물 식별 결과가 없습니다.");
    return generateDefaultAnalysis("알 수 없는 식물", 0);
  }

  // 상위 3개 결과 분석
  const topResults = suggestions.slice(0, 3);
  const topResult = topResults[0];

  // Plant.id에서 식물명과 신뢰도 추출
  let plantName = topResult?.plant_name || "알 수 없는 식물";
  let confidence = Math.round((topResult?.probability || 0) * 100);

  // 한국어 이름 찾기
  let koreanName = plantName; // 기본값은 영문명
  if (
    topResult?.plant_details?.common_names &&
    Array.isArray(topResult.plant_details.common_names)
  ) {
    // 한국어 이름이 있는지 확인 (한글 포함된 이름 찾기)
    const koreanCommonName = topResult.plant_details.common_names.find(
      (name) =>
        /[가-힣]/.test(name) ||
        name.toLowerCase().includes("korean") ||
        name.toLowerCase().includes("korea")
    );

    if (koreanCommonName) {
      koreanName = koreanCommonName;
      console.log(`한국어 이름 발견: ${koreanName}`);
    } else {
      // 한국어 이름이 없으면 첫 번째 common_name 사용
      koreanName = topResult.plant_details.common_names[0] || plantName;
      console.log(`영문 common name 사용: ${koreanName}`);
    }
  }

  // Plant.id는 식물 전문이므로 화분 재분류 로직 제거
  console.log(
    `식물 식별: ${plantName} (${koreanName}), 신뢰도: ${confidence}%`
  );

  // Plant.id 건강 상태 분석 활용
  const healthAssessment = response.health_assessment;

  // Plant.id 기본 관리 정보 추출
  const plantIdCare = topResult?.plant_details;
  let plantIdTips = [];
  let plantIdWatering = "일주일에 1-2회";

  console.log("Plant.id care 정보:", plantIdCare);

  // care_instructions 파싱
  if (plantIdCare?.care_instructions) {
    console.log(
      "care_instructions 타입:",
      typeof plantIdCare.care_instructions
    );
    console.log("care_instructions 내용:", plantIdCare.care_instructions);

    if (typeof plantIdCare.care_instructions === "string") {
      const sentences = plantIdCare.care_instructions
        .split(/[.!?]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 10)
        .slice(0, 3);
      plantIdTips.push(...sentences);
    } else if (Array.isArray(plantIdCare.care_instructions)) {
      plantIdTips.push(...plantIdCare.care_instructions.slice(0, 3));
    } else if (typeof plantIdCare.care_instructions === "object") {
      // 객체 형태인 경우 값들을 추출
      const values = Object.values(plantIdCare.care_instructions).filter(
        (v) => typeof v === "string" && v.length > 10
      );
      plantIdTips.push(...values.slice(0, 3));
    }
  } else {
    console.log("care_instructions가 없습니다");
  }

  // treatment 파싱
  if (plantIdCare?.treatment) {
    console.log("treatment 타입:", typeof plantIdCare.treatment);
    console.log("treatment 내용:", plantIdCare.treatment);

    if (typeof plantIdCare.treatment === "string") {
      const sentences = plantIdCare.treatment
        .split(/[.!?]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 10)
        .slice(0, 2);
      plantIdTips.push(...sentences);
    } else if (Array.isArray(plantIdCare.treatment)) {
      plantIdTips.push(...plantIdCare.treatment.slice(0, 2));
    } else if (typeof plantIdCare.treatment === "object") {
      const values = Object.values(plantIdCare.treatment).filter(
        (v) => typeof v === "string" && v.length > 10
      );
      plantIdTips.push(...values.slice(0, 2));
    }
  } else {
    console.log("treatment가 없습니다");
  }

  // description 파싱 제거 - 실제 관리팁이 아닌 단순 설명이므로 제외
  console.log("description 파싱을 건너뛰고 전문 진단에 집중합니다");

  // 물주기 정보는 하드코딩 팁에서 처리하므로 여기서는 기본값만 설정
  plantIdWatering = "일주일에 1-2회";
  console.log("물주기 정보는 하드코딩 팁에서 처리됩니다");

  // Plant.id 건강상태 기반 팁 추가
  if (healthAssessment && healthAssessment.diseases) {
    const significantDiseases = healthAssessment.diseases
      .filter((disease: any) => disease.probability > 0.1) // 10% 이상 확률인 질병만
      .slice(0, 2); // 상위 2개만

    significantDiseases.forEach((disease: any) => {
      const diseaseName = disease.name;
      const probability = (disease.probability * 100).toFixed(1);

      // 하드코딩된 조치법이 있는 항목들
      if (diseaseName.includes("water")) {
        plantIdTips.push(
          `물 관리 주의: ${diseaseName} 증상이 ${probability}% 확률로 감지되었습니다. 물주기 간격을 조정해보세요.`
        );
      } else if (diseaseName.includes("light")) {
        plantIdTips.push(
          `조명 관리: ${diseaseName} 문제가 ${probability}% 확률로 감지되었습니다. 빛의 양을 조절해보세요.`
        );
      } else if (diseaseName.includes("nutrient")) {
        plantIdTips.push(
          `영양 관리: ${diseaseName} 문제가 ${probability}% 확률로 감지되었습니다. 비료를 고려해보세요.`
        );
      } else if (diseaseName.includes("damage")) {
        plantIdTips.push(
          `물리적 손상: ${diseaseName}이 ${probability}% 확률로 감지되었습니다. 손상된 부분을 제거해보세요.`
        );
      } else if (diseaseName === "Abiotic") {
        plantIdTips.push(
          `환경적 스트레스: 비생물적 요인이 ${probability}% 확률로 감지되었습니다. 환경 조건을 점검해보세요.`
        );
      } else {
        // 하드코딩되지 않은 항목들은 조치법 없이 알림만
        plantIdTips.push(
          `감지된 문제: ${diseaseName}이 ${probability}% 확률로 감지되었습니다.`
        );
      }
    });
  }

  console.log(`Plant.id 기본 팁 개수: ${plantIdTips.length}`);

  // Plant.id 팁이 3개 미만이면 하드코딩된 팁으로 보완
  const currentSeason = getCurrentSeason();
  console.log("현재 계절:", currentSeason);

  const hardcodedTips = generateHardcodedTips(
    plantName,
    koreanName,
    currentSeason,
    healthAssessment,
    plantIdCare
  );

  console.log("하드코딩 팁 상세:", {
    season: currentSeason,
    tips_count: hardcodedTips.length,
    tips: hardcodedTips,
  });

  // 최종 팁 구성: Plant.id 고유 팁 + 하드코딩 고정 3종류 (최대 6개까지)
  const finalTips = [...plantIdTips, ...hardcodedTips];

  console.log(`Plant.id 고유 팁 개수: ${plantIdTips.length}`);
  console.log(`하드코딩 고정 팁 개수: ${hardcodedTips.length}`);
  console.log(`최종 팁 개수: ${finalTips.length}`);

  let healthScore = 5; // 기본값
  let growthStatus = "보통";

  if (healthAssessment) {
    // Plant.id의 건강 점수 사용 (is_healthy_probability 기반)
    const healthProbability = healthAssessment.is_healthy_probability || 0;
    healthScore = Math.max(1, Math.min(10, Math.round(healthProbability * 10)));
    growthStatus = determineGrowthStatus(healthScore);
    console.log(
      `Plant.id 건강 확률: ${(healthProbability * 100).toFixed(
        1
      )}% → ${healthScore}/10`
    );
  } else {
    // 건강 상태 분석이 없는 경우 신뢰도 기반으로 폴백
    healthScore = Math.min(10, Math.max(1, Math.round(confidence / 10)));
    growthStatus = determineGrowthStatus(healthScore);
    console.log(`건강 상태 분석 없음, 신뢰도 기반 폴백: ${healthScore}/10`);
  }

  // 상세 분석 생성 (Plant.id + 하드코딩 팁 사용)
  const combinedTips = {
    plant_id_tips: finalTips,
    hardcoded_tips: hardcodedTips,
  };

  // Plant.id 분석 결과를 기존 species 타입에 매핑
  const { mappedSpecies, suggestedNewTypes } = mapPlantIdToSpecies(
    plantIdCare,
    plantName,
    koreanName
  );

  const detailedAnalysis = generateDetailedAnalysis(
    koreanName,
    confidence,
    topResults,
    combinedTips
  );

  const finalResponse = {
    plant_species: plantName,
    korean_name: koreanName,
    mapped_species: mappedSpecies, // 기존 species 타입으로 매핑된 결과
    suggested_new_types: suggestedNewTypes, // 새로운 타입 제안
    growth_status: growthStatus,
    health_score: healthScore,
    care_tips: {
      plant_id_tips: finalTips,
      hardcoded_tips: hardcodedTips,
    },
    confidence: confidence,
    detailed_analysis: detailedAnalysis,
  };

  console.log("최종 응답 구조:", {
    plant_id_tips_count: finalResponse.care_tips.plant_id_tips.length,
    hardcoded_tips_count: finalResponse.care_tips.hardcoded_tips.length,
    care_tips: finalResponse.care_tips,
  });

  return finalResponse;
}

// 식물 종류 이름 추출 함수
function getPlantTypeName(koreanName: string, plantName: string): string {
  const name = (koreanName || plantName).toLowerCase();

  if (name.includes("monstera") || name.includes("몬스테라")) {
    return "몬스테라";
  } else if (name.includes("philodendron") || name.includes("필로덴드론")) {
    return "필로덴드론";
  } else if (name.includes("scindapsus") || name.includes("스킨답서스")) {
    return "스킨답서스";
  } else if (name.includes("sansevieria") || name.includes("산세베리아")) {
    return "산세베리아";
  } else if (name.includes("succulent") || name.includes("다육")) {
    return "다육식물";
  } else if (name.includes("cactus") || name.includes("선인장")) {
    return "선인장";
  } else if (name.includes("herb") || name.includes("허브")) {
    return "허브";
  } else if (name.includes("palm") || name.includes("야자")) {
    return "야자수";
  } else {
    return "관엽식물";
  }
}

// 현재 계절 판단 함수
function getCurrentSeason(): string {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12

  if (month >= 3 && month <= 5) {
    return "봄";
  } else if (month >= 6 && month <= 8) {
    return "여름";
  } else if (month >= 9 && month <= 11) {
    return "가을";
  } else {
    return "겨울";
  }
}

// Plant.id 분석 결과를 기존 species 타입에 매핑하는 함수
function mapPlantIdToSpecies(
  plantDetails: any,
  plantName: string,
  koreanName: string
): {
  mappedSpecies: string;
  suggestedNewTypes: string[];
} {
  // 기존 species 타입들 (기타 포함)
  const existingSpecies = [
    "몬스테라",
    "스킨답서스",
    "필로덴드론",
    "산세베리아",
    "다육식물",
    "선인장",
    "허브",
    "관엽식물",
    "기타",
  ];

  // Plant.id 응답에서 식물 분류 정보 추출
  const classification = plantDetails?.classification;
  const family = plantDetails?.family;
  const genus = plantDetails?.genus;

  console.log("식물 분류 정보:", {
    classification,
    family,
    genus,
    plantName,
    koreanName,
  });

  // 1. 한국어 이름 기반 매핑
  if (koreanName && koreanName !== plantName) {
    const koreanMapping: { [key: string]: string } = {
      몬스테라: "몬스테라",
      스킨답서스: "스킨답서스",
      필로덴드론: "필로덴드론",
      산세베리아: "산세베리아",
      다육식물: "다육식물",
      선인장: "선인장",
      허브: "허브",
      관엽식물: "관엽식물",
      기타: "기타",
    };

    for (const [korean, species] of Object.entries(koreanMapping)) {
      if (koreanName.includes(korean) || korean.includes(koreanName)) {
        console.log(`한국어 이름 기반 매핑: ${koreanName} → ${species}`);
        return { mappedSpecies: species, suggestedNewTypes: [] };
      }
    }
  }

  // 2. 영문 이름 기반 매핑
  const englishMapping: { [key: string]: string } = {
    monstera: "몬스테라",
    philodendron: "필로덴드론",
    scindapsus: "스킨답서스",
    sansevieria: "산세베리아",
    succulent: "다육식물",
    cactus: "선인장",
    herb: "허브",
    foliage: "관엽식물",
  };

  const lowerPlantName = plantName.toLowerCase();
  for (const [english, species] of Object.entries(englishMapping)) {
    if (lowerPlantName.includes(english)) {
      console.log(`영문 이름 기반 매핑: ${plantName} → ${species}`);
      return { mappedSpecies: species, suggestedNewTypes: [] };
    }
  }

  // 3. 식물과(family) 기반 매핑
  if (family) {
    const familyMapping: { [key: string]: string } = {
      Araceae: "관엽식물", // 천남성과 (몬스테라, 필로덴드론, 스킨답서스 등)
      Asparagaceae: "산세베리아", // 아스파라거스과
      Crassulaceae: "다육식물", // 돌나물과
      Cactaceae: "선인장", // 선인장과
      Lamiaceae: "허브", // 꿀풀과
      Apiaceae: "허브", // 산형과
    };

    const lowerFamily = family.toLowerCase();
    for (const [familyName, species] of Object.entries(familyMapping)) {
      if (lowerFamily.includes(familyName.toLowerCase())) {
        console.log(`식물과 기반 매핑: ${family} → ${species}`);
        return { mappedSpecies: species, suggestedNewTypes: [] };
      }
    }
  }

  // 4. 매핑할 수 없는 경우 새로운 타입 제안
  const suggestedNewTypes: string[] = [];

  // Plant.id 응답에서 새로운 타입 추천
  if (classification) {
    if (
      classification.includes("succulent") ||
      classification.includes("cactus")
    ) {
      suggestedNewTypes.push("다육식물");
    } else if (
      classification.includes("herb") ||
      classification.includes("medicinal")
    ) {
      suggestedNewTypes.push("허브");
    } else if (
      classification.includes("tropical") ||
      classification.includes("indoor")
    ) {
      suggestedNewTypes.push("관엽식물");
    }
  }

  // 매핑할 수 없는 경우 "기타"로 분류
  console.log(`매핑 실패, 기타로 분류: ${plantName} → 기타`);
  return {
    mappedSpecies: "기타",
    suggestedNewTypes:
      suggestedNewTypes.length > 0 ? suggestedNewTypes : ["기타"],
  };
}

// OpenRouter 함수 제거됨 - 하드코딩된 팁으로 대체

function generateBasicCareTips(plantName: string, topResults: any[]) {
  // topResults가 undefined인 경우 안전하게 처리
  if (!topResults || !Array.isArray(topResults)) {
    console.log(
      "generateBasicCareTips: topResults가 유효하지 않습니다:",
      topResults
    );
    topResults = [];
  }

  const confidence = topResults[0]?.probability || 0;
  const alternativePlants = topResults
    .slice(1)
    .map(
      (result) =>
        `${result.plant_name} (${Math.round(result.probability * 100)}%)`
    )
    .join(", ");

  console.log(
    `식물 분석: ${plantName}, 신뢰도: ${Math.round(confidence * 100)}%`
  );
  if (confidence < 0.5) {
    console.log(`대안 식물: ${alternativePlants}`);
  }

  // 식물 이름에 따른 기본 관리 팁
  const name = plantName.toLowerCase();

  // 화분/용기 관련 라벨이 있는 경우
  if (
    name.includes("pot") ||
    name.includes("vase") ||
    name.includes("container") ||
    name.includes("flowerpot")
  ) {
    return {
      watering_frequency: "1주일에 1-2회",
      care_tips: [
        "토양이 마르면 물을 주세요",
        "밝은 간접광을 제공하세요",
        "잎을 정기적으로 닦아주세요",
        "통풍이 잘 되는 곳에 두세요",
      ],
    };
  }

  // 기본 관리 팁 (모든 식물에 적용)
  return {
    watering_frequency: "일주일에 1-2회",
    care_tips: [
      "정기적으로 물을 주세요",
      "적절한 햇빛을 제공하세요",
      "잎을 깨끗하게 유지하세요",
      "식물의 상태를 주기적으로 관찰하세요",
    ],
  };
}

function extractTipsFromText(text: string, plantName: string) {
  // 텍스트에서 팁 추출 로직
  const tips = [];
  const sentences = text.split(/[.!?]/).filter((s) => s.trim().length > 5);

  for (const sentence of sentences.slice(0, 4)) {
    const cleanTip = sentence.trim().replace(/^[•\-\*]\s*/, "");
    if (cleanTip.length > 3) {
      tips.push(cleanTip);
    }
  }

  // 기본 팁이 부족한 경우 추가
  while (tips.length < 4) {
    tips.push("식물의 상태를 주기적으로 관찰하세요");
  }

  return {
    watering_frequency: "일주일에 1-2회",
    care_tips: tips.slice(0, 4),
  };
}

function generateDetailedAnalysis(
  plantName: string,
  confidence: number,
  topResults: any[],
  characteristics: any
): string {
  // topResults가 undefined인 경우 안전하게 처리
  if (!topResults || !Array.isArray(topResults)) {
    console.log(
      "generateDetailedAnalysis: topResults가 유효하지 않습니다:",
      topResults
    );
    topResults = [];
  }

  const confidenceLevel =
    confidence >= 80
      ? "매우 높음"
      : confidence >= 60
      ? "높음"
      : confidence >= 40
      ? "보통"
      : "낮음";

  const alternativePlants = topResults
    .slice(1)
    .map(
      (result) =>
        `${result.plant_name} (${Math.round(result.probability * 100)}%)`
    )
    .join(", ");

  return `이 식물은 ${plantName}로 분석되었습니다. 분석 신뢰도는 ${confidence}% (${confidenceLevel})입니다.

${
  confidence < 50
    ? `⚠️ 주의: 분석 신뢰도가 낮습니다. 다음 식물일 가능성도 있습니다: ${alternativePlants}`
    : ""
}

💡 Plant.id 기본 관리법:
${
  characteristics.plant_id_tips?.map((tip: string) => `• ${tip}`).join("\n") ||
  "• 기본 관리 정보가 없습니다"
}

🤖 하드코딩 관리 팁:
${
  characteristics.hardcoded_tips?.map((tip: string) => `• ${tip}`).join("\n") ||
  "• 추가 관리 팁이 없습니다"
}

🔍 추가 관찰사항:
- 식물의 잎 상태를 정기적으로 확인하세요
- 계절에 따라 관리 방법을 조정하세요
- 질병이나 해충의 징후가 있는지 주의 깊게 관찰하세요
${
  confidence < 60
    ? "- 분석 결과가 불확실하므로 식물의 실제 상태를 더 주의 깊게 관찰하세요"
    : ""
}

이 분석 결과를 바탕으로 식물을 건강하게 키우실 수 있을 것입니다.`;
}

function determineGrowthStatus(healthScore: number): string {
  if (healthScore >= 8) return "매우 건강함";
  if (healthScore >= 6) return "건강함";
  if (healthScore >= 4) return "보통";
  if (healthScore >= 2) return "주의 필요";
  return "관리 필요";
}

// 하드코딩된 관리 팁 생성 함수 (고정 3종류)
function generateHardcodedTips(
  plantName: string,
  koreanName: string,
  season: string,
  healthAssessment: any,
  plantIdCare: any
): string[] {
  const tips: string[] = [];
  const healthProb = healthAssessment?.is_healthy_probability || 0.5;

  console.log("generateHardcodedTips 시작:", {
    plantName,
    koreanName,
    season,
    healthProb,
    hasDiseases: !!healthAssessment?.diseases,
    hasWatering: !!plantIdCare?.watering,
  });

  // 1. 질병 정보 + 건강도 조합 (고정 1개)
  if (healthAssessment?.diseases && healthAssessment.diseases.length > 0) {
    const topDisease = healthAssessment.diseases.reduce(
      (max: any, current: any) =>
        current.probability > max.probability ? current : max
    );

    if (topDisease.probability > 0.1) {
      const prob = topDisease.probability;
      const name = topDisease.name.toLowerCase();

      console.log("질병 정보 팁 추가:", {
        disease: topDisease.name,
        probability: prob,
      });

      if (name.includes("water") || name.includes("물")) {
        const urgency = healthProb < 0.6 ? "긴급" : "주의";
        tips.push(
          `💧 ${getPlantTypeName(
            koreanName,
            plantName
          )} 물 관리 ${urgency}: 물 관련 문제가 감지되었습니다. ${
            healthProb < 0.6 ? "즉시 조치" : "예방적 관리"
          }가 필요합니다`
        );
      } else if (name.includes("light") || name.includes("빛")) {
        const urgency = healthProb < 0.6 ? "긴급" : "주의";
        tips.push(
          `☀️ ${getPlantTypeName(
            koreanName,
            plantName
          )} 조명 관리 ${urgency}: 조명 문제가 감지되었습니다. ${
            healthProb < 0.6 ? "즉시 조치" : "예방적 관리"
          }가 필요합니다`
        );
      } else if (name.includes("nutrient") || name.includes("영양")) {
        const urgency = healthProb < 0.6 ? "긴급" : "주의";
        tips.push(
          `🌱 ${getPlantTypeName(
            koreanName,
            plantName
          )} 영양 관리 ${urgency}: 영양 결핍이 감지되었습니다. ${
            healthProb < 0.6 ? "즉시 조치" : "예방적 관리"
          }가 필요합니다`
        );
      } else if (name.includes("abiotic") || name.includes("환경")) {
        const urgency = healthProb < 0.6 ? "긴급" : "주의";
        tips.push(
          `🌡️ ${getPlantTypeName(
            koreanName,
            plantName
          )} 환경 관리 ${urgency}: 환경적 스트레스가 감지되었습니다. ${
            healthProb < 0.6 ? "즉시 조치" : "예방적 관리"
          }가 필요합니다`
        );
      } else if (name.includes("damage") || name.includes("손상")) {
        const urgency = healthProb < 0.6 ? "긴급" : "주의";
        tips.push(
          `🔧 ${getPlantTypeName(
            koreanName,
            plantName
          )} 손상 관리 ${urgency}: 물리적 손상이 감지되었습니다. ${
            healthProb < 0.6 ? "즉시 조치" : "예방적 관리"
          }가 필요합니다`
        );
      } else {
        // 기타 질병들
        const urgency = healthProb < 0.6 ? "긴급" : "주의";
        tips.push(
          `⚠️ ${getPlantTypeName(koreanName, plantName)} ${
            topDisease.name
          } ${urgency}: ${
            healthProb < 0.6 ? "즉시 조치" : "예방적 관리"
          }가 필요합니다`
        );
      }
    } else {
      // 질병이 있지만 확률이 낮은 경우 기본 건강 관리 팁
      if (healthProb < 0.6) {
        tips.push(
          `⚠️ ${getPlantTypeName(
            koreanName,
            plantName
          )} 건강 관리 주의: 식물의 건강 상태에 주의가 필요합니다. 정기적인 관찰과 관리가 중요합니다`
        );
      } else {
        tips.push(
          `✨ ${getPlantTypeName(
            koreanName,
            plantName
          )} 건강 관리: 식물의 건강 상태는 양호하지만 개선의 여지가 있습니다`
        );
      }
      console.log(
        "질병 확률 낮음 - 기본 건강 관리 팁 추가, 현재 팁 개수:",
        tips.length
      );
    }
  } else {
    // 질병이 없는 경우 기본 건강 관리 팁
    if (healthProb < 0.6) {
      tips.push(
        `⚠️ ${getPlantTypeName(
          koreanName,
          plantName
        )} 건강 관리 주의: 식물의 건강 상태에 주의가 필요합니다. 정기적인 관찰과 관리가 중요합니다`
      );
    } else {
      tips.push(
        `✨ ${getPlantTypeName(
          koreanName,
          plantName
        )} 건강 관리: 식물의 건강 상태는 양호하지만 개선의 여지가 있습니다`
      );
    }
  }

  // 2. 물주기 + 건강도 조합 (고정 1개)
  console.log("물주기 팁 생성 시작, 현재 팁 개수:", tips.length);
  if (plantIdCare?.watering) {
    const watering = plantIdCare.watering;
    if (typeof watering === "object" && watering.min && watering.max) {
      if (watering.min === watering.max) {
        if (healthProb < 0.6) {
          tips.push(
            `💧 ${getPlantTypeName(koreanName, plantName)} 권장 물주기: 주 ${
              watering.min
            }회 물을 주세요. 현재 건강도가 낮아 정확한 물주기가 중요합니다`
          );
        } else {
          tips.push(
            `💧 ${getPlantTypeName(koreanName, plantName)} 권장 물주기: 주 ${
              watering.min
            }회 물을 주세요. 토양이 마르면 즉시 물을 주되 과습을 피하세요`
          );
        }
      } else {
        if (healthProb < 0.6) {
          tips.push(
            `💧 ${getPlantTypeName(koreanName, plantName)} 권장 물주기: 주 ${
              watering.min
            }-${
              watering.max
            }회 물을 주세요. 건강도가 낮아 정확한 물주기가 중요합니다`
          );
        } else {
          tips.push(
            `💧 ${getPlantTypeName(koreanName, plantName)} 권장 물주기: 주 ${
              watering.min
            }-${watering.max}회 물을 주세요. 계절과 토양 상태에 따라 조정하세요`
          );
        }
      }
    } else if (typeof watering === "string") {
      if (healthProb < 0.6) {
        tips.push(
          `💧 ${getPlantTypeName(
            koreanName,
            plantName
          )} 권장 물주기: ${watering}. 현재 건강도가 낮아 정확한 물주기가 중요합니다`
        );
      } else {
        tips.push(
          `💧 ${getPlantTypeName(
            koreanName,
            plantName
          )} 권장 물주기: ${watering}. 식물의 실제 상태를 관찰하여 조정하세요`
        );
      }
    }
  } else {
    // 물주기 정보가 없는 경우 기본값 + 건강도
    if (healthProb < 0.6) {
      tips.push(
        `💧 ${getPlantTypeName(
          koreanName,
          plantName
        )} 기본 물주기: 일주일에 1-2회 물을 주세요. 현재 건강도가 낮아 정확한 물주기가 중요합니다`
      );
    } else {
      tips.push(
        `💧 ${getPlantTypeName(
          koreanName,
          plantName
        )} 기본 물주기: 일주일에 1-2회 물을 주세요. 토양이 마르면 즉시 물을 주되 과습을 피하세요`
      );
    }
  }

  // 3. 계절 + 건강도 + 식물종류 조합 (고정 1개)
  console.log("계절 팁 생성 시작, 현재 팁 개수:", tips.length, "계절:", season);
  if (season === "여름") {
    if (healthProb < 0.6) {
      tips.push(
        `🌞 ${getPlantTypeName(
          koreanName,
          plantName
        )} 여름철 건강 관리: 더운 날씨에 식물이 스트레스를 받고 있습니다. 그늘을 제공하고 물주기를 늘리세요`
      );
    } else {
      tips.push(
        `🌞 ${getPlantTypeName(
          koreanName,
          plantName
        )} 여름철 관리: 통풍을 원활하게 하고 직사광선을 피하여 식물이 건강하게 자랄 수 있도록 하세요`
      );
    }
  } else if (season === "겨울") {
    if (healthProb < 0.6) {
      tips.push(
        `❄️ ${getPlantTypeName(
          koreanName,
          plantName
        )} 겨울철 건강 관리: 추운 날씨에 식물이 약해져 있습니다. 따뜻한 곳에 두고 물주기를 줄이세요`
      );
    } else {
      tips.push(
        `❄️ ${getPlantTypeName(
          koreanName,
          plantName
        )} 겨울철 관리: 건조한 실내 공기를 가습기로 보습하고 창가에 두어 햇빛을 받도록 하세요`
      );
    }
  } else if (season === "봄") {
    if (healthProb < 0.6) {
      tips.push(
        `🌱 ${getPlantTypeName(
          koreanName,
          plantName
        )} 봄철 건강 관리: 성장기에 식물이 약해져 있습니다. 점진적으로 햇빛에 노출시키고 비료를 주세요`
      );
    } else {
      tips.push(
        `🌱 ${getPlantTypeName(
          koreanName,
          plantName
        )} 봄철 관리: 성장기에 맞춰 비료를 주고 새로운 잎이 나오는 시기이므로 정기적인 관찰이 필요합니다`
      );
    }
  } else if (season === "가을") {
    if (healthProb < 0.6) {
      tips.push(
        `🍂 ${getPlantTypeName(
          koreanName,
          plantName
        )} 가을철 건강 관리: 계절 변화에 식물이 스트레스를 받고 있습니다. 물주기를 줄이고 서늘한 곳에서 관리하세요`
      );
    } else {
      tips.push(
        `🍂 ${getPlantTypeName(
          koreanName,
          plantName
        )} 가을철 관리: 물주기를 줄이고 비료를 중단하여 겨울 준비를 하세요`
      );
    }
  }

  console.log("최종 하드코딩 팁 완성:", {
    tips_count: tips.length,
    tips: tips,
  });
  return tips; // 3개 고정 팁 반환
}

function generateDefaultAnalysis(plantName: string, confidence: number) {
  return {
    plant_species: plantName,
    korean_name: plantName,
    growth_status: "알 수 없음",
    health_score: 0,
    care_tips: [
      "식물을 정확히 식별할 수 없습니다. 더 명확한 사진을 제공해주세요.",
    ],
    confidence: confidence,
    detailed_analysis:
      "AI가 식물을 정확히 식별하지 못했습니다. 더 명확하고 선명한 사진을 제공해주세요.",
  };
}
