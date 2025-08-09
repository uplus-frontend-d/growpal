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

  if (plantIdCare?.watering) {
    console.log("watering 정보:", plantIdCare.watering);

    if (typeof plantIdCare.watering === "string") {
      plantIdWatering = plantIdCare.watering;
      console.log("문자열 형태 watering:", plantIdWatering);
    } else if (
      typeof plantIdCare.watering === "object" &&
      plantIdCare.watering
    ) {
      const { min, max } = plantIdCare.watering;
      console.log("객체 형태 watering - min:", min, "max:", max);

      if (min && max) {
        if (min === max) {
          plantIdWatering = `주 ${min}회`;
        } else {
          plantIdWatering = `주 ${min}-${max}회`;
        }
        // 물주기 정보를 관리 팁에 추가
        plantIdTips.push(
          `적정 물주기: 이 식물은 ${plantIdWatering} 물을 주는 것이 적절합니다.`
        );
        console.log("물주기 관리 팁 추가:", plantIdWatering);
      }
    }
  } else {
    console.log("watering 정보가 없습니다");
  }

  // Plant.id 건강상태 기반 팁 추가
  if (healthAssessment && healthAssessment.diseases) {
    const significantDiseases = healthAssessment.diseases
      .filter((disease: any) => disease.probability > 0.2) // 20% 이상 확률인 질병만
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

  // OpenRouter로 Plant.id 정보 기반 맞춤형 팁 생성
  const openRouterTips = await generateAdditionalCareTips(
    plantName,
    koreanName,
    healthAssessment,
    topResults,
    plantIdWatering,
    plantIdTips
  );

  console.log(
    `OpenRouter 추가 팁 개수: ${
      openRouterTips.additional_care_tips?.length || 0
    }`
  );
  console.log("OpenRouter 팁 내용:", openRouterTips.additional_care_tips);

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

  // 상세 분석 생성 (합쳐진 팁 사용)
  const combinedTips = {
    plant_id_tips: plantIdTips,
    openrouter_tips: openRouterTips.additional_care_tips || [],
  };

  const detailedAnalysis = generateDetailedAnalysis(
    koreanName,
    confidence,
    topResults,
    combinedTips
  );

  const finalResponse = {
    plant_species: plantName,
    korean_name: koreanName,
    growth_status: growthStatus,
    health_score: healthScore,
    care_tips: {
      plant_id_tips: plantIdTips,
      openrouter_tips: openRouterTips.additional_care_tips || [],
    },
    watering_frequency: plantIdWatering,
    confidence: confidence,
    detailed_analysis: detailedAnalysis,
  };

  console.log("최종 응답 구조:", {
    plant_id_tips_count: finalResponse.care_tips.plant_id_tips.length,
    openrouter_tips_count: finalResponse.care_tips.openrouter_tips.length,
    care_tips: finalResponse.care_tips,
  });

  return finalResponse;
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

async function generateAdditionalCareTips(
  plantName: string,
  koreanName: string,
  healthAssessment: any,
  topResults: any[],
  wateringInfo: string,
  plantIdTips: string[]
) {
  // topResults가 undefined인 경우 안전하게 처리
  if (!topResults || !Array.isArray(topResults)) {
    console.log("topResults가 유효하지 않습니다:", topResults);
    return {
      additional_care_tips: ["식물의 현재 상태를 더 자세히 관찰해주세요"],
    };
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

  // 순수하게 OpenRouter로 건강상태 기반 추가 팁만 생성
  const currentSeason = getCurrentSeason();
  console.log(`현재 계절: ${currentSeason}`);

  // OpenRouter API 키 확인
  console.log(
    "OpenRouter API 키 확인:",
    process.env.OPENROUTER_API_KEY ? "있음" : "없음"
  );
  console.log(
    "OpenRouter API 키 값 (처음 10자):",
    process.env.OPENROUTER_API_KEY
      ? process.env.OPENROUTER_API_KEY.substring(0, 10) + "..."
      : "없음"
  );
  console.log(
    "모든 환경 변수 키들:",
    Object.keys(process.env).filter((key) => key.includes("OPENROUTER"))
  );

  // Plant.id 분석 결과를 바탕으로 OpenRouter에서 맞춤형 팁 생성
  console.log(
    "Plant.id 분석 결과를 OpenRouter에 전달하여 맞춤형 관리 팁을 생성합니다."
  );
  console.log("전달되는 정보:", {
    plantName,
    koreanName,
    wateringInfo,
    plantIdTipsCount: plantIdTips.length,
    healthStatus: healthAssessment?.is_healthy ? "건강함" : "주의 필요",
  });

  if (!process.env.OPENROUTER_API_KEY) {
    console.log("OpenRouter API 키가 없어서 기본 팁을 사용합니다.");
    return {
      additional_care_tips: ["OpenRouter API 키가 설정되지 않았습니다"],
    };
  }

  try {
    console.log("OpenRouter API 호출 시작...");
    // OpenRouter API 호출
    const openRouterResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://growpal.com", // OpenRouter 요구사항
          "X-Title": "GrowPal Plant Care", // OpenRouter 요구사항
        },
        body: JSON.stringify({
          model: "anthropic/claude-3.5-sonnet", // Claude 3.5 Sonnet 사용
          messages: [
            {
              role: "system",
              content:
                "당신은 식물 관리 전문가입니다. 한국어로 식물 관리 팁을 제공해주세요.",
            },
            {
              role: "user",
              content: `당신은 식물 관리 전문가입니다. Plant.id의 과학적 분석 결과를 바탕으로 최적의 관리 팁을 제공해주세요:

🌱 **식물 기본 정보**
- 식물 이름: ${plantName}
- 한국어 이름: ${koreanName || plantName}
- 분석 신뢰도: ${Math.round(confidence * 100)}%

💧 **Plant.id 물주기 정보**
- 적정 물주기: ${wateringInfo || "정보 없음"}

🏥 **Plant.id 건강 진단**
- 건강 상태: ${healthAssessment?.is_healthy ? "건강함" : "주의 필요"}
- 건강 확률: ${
                healthAssessment?.is_healthy_probability
                  ? Math.round(healthAssessment.is_healthy_probability * 100)
                  : 0
              }%

🔍 **Plant.id 감지된 문제점**
${
  plantIdTips.length > 0
    ? plantIdTips.map((tip) => `- ${tip}`).join("\n")
    : "- 특별한 문제점 없음"
}

🌸 **현재 계절**: ${currentSeason}

위의 Plant.id 과학적 분석 결과를 종합하여, 현재 계절(${currentSeason})에 맞는 **실용적이고 구체적인** 관리 팁 3개를 제공해주세요.

다음 형식으로 JSON 응답해주세요:
{
  "additional_care_tips": ["구체적 실행 팁1", "계절별 맞춤 팁2", "문제 해결 팁3"]
}

**중요 원칙**:
✅ Plant.id 진단 결과를 반드시 반영하세요
✅ 현재 계절(${currentSeason})에 특화된 관리법 포함
✅ 건강 문제가 있다면 우선적으로 해결 방안 제시
✅ 물주기 정보를 고려한 수분 관리 조언
✅ 실행 가능하고 구체적인 방법만 제시
✅ 정확히 3개의 팁만 제공
✅ 한국어로 응답
✅ JSON 형식만 응답`,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      }
    );

    console.log(
      "OpenRouter 응답 상태:",
      openRouterResponse.status,
      openRouterResponse.statusText
    );
    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.log(
        `OpenRouter API 오류: ${openRouterResponse.status} - ${errorText}`
      );
      return {
        additional_care_tips: ["OpenRouter API 키가 설정되지 않았습니다"],
      };
    }

    const response = await openRouterResponse.json();
    console.log("OpenRouter 응답 전체:", JSON.stringify(response, null, 2));

    const generatedText = response.choices?.[0]?.message?.content || "";
    console.log("생성된 텍스트:", generatedText);

    // JSON 파싱 시도
    try {
      console.log("JSON 파싱 시도 중...");
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log("JSON 매치 발견:", jsonMatch[0]);
        const parsedResponse = JSON.parse(jsonMatch[0]);
        console.log("파싱된 JSON:", parsedResponse);
        const tips = parsedResponse.additional_care_tips || [
          "식물의 현재 상태를 더 자세히 관찰해주세요",
        ];
        return {
          additional_care_tips: tips.slice(0, 3), // 최대 3개로 제한
        };
      } else {
        console.log("JSON 매치를 찾을 수 없음");
      }
    } catch (parseError) {
      console.error("JSON 파싱 오류:", parseError);
    }

    // JSON 파싱 실패 시 기본 팁 반환
    console.log("JSON 파싱 실패, 기본 팁 반환...");
    return { additional_care_tips: ["건강 상태를 정기적으로 관찰해주세요"] };
  } catch (error) {
    console.error("OpenRouter API 호출 실패:", error);
    console.log("기본 팁으로 폴백...");
    return {
      additional_care_tips: ["OpenRouter API 호출 중 오류가 발생했습니다"],
    };
  }
}

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

🤖 AI 맞춤 관리 팁:
${
  characteristics.openrouter_tips
    ?.map((tip: string) => `• ${tip}`)
    .join("\n") || "• 추가 관리 팁이 없습니다"
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

function generateDefaultAnalysis(plantName: string, confidence: number) {
  return {
    plant_species: plantName,
    korean_name: plantName,
    growth_status: "알 수 없음",
    health_score: 0,
    care_tips: [
      "식물을 정확히 식별할 수 없습니다. 더 명확한 사진을 제공해주세요.",
    ],
    watering_frequency: "알 수 없음",
    confidence: confidence,
    detailed_analysis:
      "AI가 식물을 정확히 식별하지 못했습니다. 더 명확하고 선명한 사진을 제공해주세요.",
  };
}
