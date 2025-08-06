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
        modifiers: ["health_all", "disease_similar_images"],
        plant_details: [
          "common_names",
          "url",
          "wiki_description",
          "care_instructions",
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

  // Plant.id는 식물 전문이므로 화분 재분류 로직 제거
  console.log(`식물 식별: ${plantName}, 신뢰도: ${confidence}%`);

  // Plant.id 관리 지침과 OpenRouter 관리 팁 결합
  const plantIdCare = topResult?.plant_details;
  const plantCharacteristics = await generateOpenRouterCareTips(
    plantName,
    topResults,
    plantIdCare
  );

  // Plant.id 건강 상태 분석 활용
  const healthAssessment = response.health_assessment;
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

  // 상세 분석 생성
  const detailedAnalysis = generateDetailedAnalysis(
    plantName,
    confidence,
    topResults,
    plantCharacteristics
  );

  return {
    plant_species: plantName,
    growth_status: growthStatus,
    health_score: healthScore,
    care_tips: plantCharacteristics.care_tips,
    watering_frequency: plantCharacteristics.watering_frequency,
    confidence: confidence,
    detailed_analysis: detailedAnalysis,
  };
}

async function generateOpenRouterCareTips(
  plantName: string,
  topResults: any[],
  plantIdCare?: any
) {
  // topResults가 undefined인 경우 안전하게 처리
  if (!topResults || !Array.isArray(topResults)) {
    console.log("topResults가 유효하지 않습니다:", topResults);
    return generateBasicCareTips(plantName, []);
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

  // Plant.id 관리 지침이 있으면 우선 사용
  if (plantIdCare) {
    console.log("Plant.id 관리 지침 사용:", plantIdCare);
    return {
      watering_frequency: plantIdCare.watering || "일주일에 1-2회",
      care_tips: [
        plantIdCare.light
          ? `조도: ${plantIdCare.light}`
          : "적절한 조도를 제공하세요",
        plantIdCare.temperature
          ? `온도: ${plantIdCare.temperature}`
          : "적절한 온도를 유지하세요",
        plantIdCare.fertilizer
          ? `비료: ${plantIdCare.fertilizer}`
          : "정기적으로 비료를 주세요",
        "식물의 상태를 주기적으로 관찰하세요",
      ],
    };
  }

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

  if (!process.env.OPENROUTER_API_KEY) {
    console.log("OpenRouter API 키가 없어서 기본 팁을 사용합니다.");
    return generateBasicCareTips(plantName, topResults);
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
              content: `다음 식물에 대한 관리 팁을 한국어로 제공해주세요:

식물 이름: ${plantName}
분석 신뢰도: ${Math.round(confidence * 100)}%
${confidence < 0.5 ? `대안 식물: ${alternativePlants}` : ""}

다음 형식으로 JSON 응답을 제공해주세요:
{
  "watering_frequency": "물주기 빈도 (예: 일주일에 1-2회)",
  "care_tips": ["팁1", "팁2", "팁3", "팁4"]
}

주의사항:
- 신뢰도가 낮은 경우 일반적인 식물 관리 팁을 제공하세요
- 실제적인 관리 방법을 제시하세요
- 한국어로 응답하세요
- JSON 형식만 응답하세요
- 다른 설명은 포함하지 마세요`,
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
      return generateBasicCareTips(plantName, topResults);
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
        return {
          watering_frequency:
            parsedResponse.watering_frequency || "일주일에 1-2회",
          care_tips: parsedResponse.care_tips || [
            "식물 관리 팁을 생성할 수 없습니다",
          ],
        };
      } else {
        console.log("JSON 매치를 찾을 수 없음");
      }
    } catch (parseError) {
      console.error("JSON 파싱 오류:", parseError);
    }

    // JSON 파싱 실패 시 텍스트에서 팁 추출
    console.log("JSON 파싱 실패, 텍스트에서 팁 추출 시도...");
    return extractTipsFromText(generatedText, plantName);
  } catch (error) {
    console.error("OpenRouter API 호출 실패:", error);
    console.log("기본 팁으로 폴백...");
    return generateBasicCareTips(plantName, topResults);
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

💡 관리 팁:
${characteristics.care_tips.map((tip: string) => `• ${tip}`).join("\n")}

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
