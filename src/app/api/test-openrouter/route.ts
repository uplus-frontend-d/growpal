import { NextRequest, NextResponse } from "next/server";

interface TestData {
  plantName: string;
  koreanName: string;
  healthStatus: string;
  healthProbability: number;
  diseases: string[];
  wateringInfo: string;
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

export async function POST(req: NextRequest) {
  try {
    const testData: TestData = await req.json();
    console.log("OpenRouter 테스트 데이터:", testData);

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OpenRouter API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // Plant.id 스타일의 병충해 팁 생성
    const diseaseBasedTips: string[] = [];
    testData.diseases.forEach((disease) => {
      const probability = Math.floor(Math.random() * 30) + 20; // 20-50% 랜덤

      if (disease.includes("water")) {
        diseaseBasedTips.push(
          `물 관리 주의: ${disease} 증상이 ${probability}% 확률로 감지되었습니다. 물주기 간격을 조정해보세요.`
        );
      } else if (disease.includes("light")) {
        diseaseBasedTips.push(
          `조명 관리: ${disease} 문제가 ${probability}% 확률로 감지되었습니다. 빛의 양을 조절해보세요.`
        );
      } else if (disease.includes("nutrient")) {
        diseaseBasedTips.push(
          `영양 관리: ${disease} 문제가 ${probability}% 확률로 감지되었습니다. 비료를 고려해보세요.`
        );
      } else if (disease.includes("damage")) {
        diseaseBasedTips.push(
          `물리적 손상: ${disease}이 ${probability}% 확률로 감지되었습니다. 손상된 부분을 제거해보세요.`
        );
      } else if (disease === "Abiotic") {
        diseaseBasedTips.push(
          `환경적 스트레스: 비생물적 요인이 ${probability}% 확률로 감지되었습니다. 환경 조건을 점검해보세요.`
        );
      } else {
        diseaseBasedTips.push(
          `감지된 문제: ${disease}이 ${probability}% 확률로 감지되었습니다.`
        );
      }
    });

    // 물주기 정보 팁
    const wateringTip = `적정 물주기: 이 식물은 ${testData.wateringInfo} 물을 주는 것이 적절합니다.`;

    const currentSeason = getCurrentSeason();

    // OpenRouter API 호출
    console.log("OpenRouter API 호출 시작...");
    const openRouterResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://growpal.com",
          "X-Title": "GrowPal Plant Care Test",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3.5-sonnet",
          messages: [
            {
              role: "system",
              content:
                "당신은 식물 관리 전문가입니다. 한국어로 식물 관리 팁을 제공해주세요.",
            },
            {
              role: "user",
              content: `당신은 식물 관리 전문가입니다. 다음 Plant.id 분석 결과를 바탕으로 최적의 관리 팁을 제공해주세요:

식물명: ${testData.plantName} (${testData.koreanName})
건강 상태: ${testData.healthStatus} (${testData.healthProbability}% 확률)
감지된 문제: ${testData.diseases.join(", ")}
물주기 정보: ${testData.wateringInfo}
현재 계절: ${currentSeason}

위 정보를 바탕으로 다음을 포함한 종합적인 관리 팁을 제공해주세요:
1. 현재 상태에 대한 분석
2. 감지된 문제에 대한 해결 방안
3. 계절별 관리 주의사항
4. 물주기 및 비료 관리 팁
5. 예방적 관리 방법

답변은 한국어로 작성하고, 실용적이고 구체적인 조언을 제공해주세요.`,
            },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      }
    );

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error("OpenRouter API 오류:", errorText);
      return NextResponse.json(
        { error: "OpenRouter API 호출에 실패했습니다." },
        { status: 500 }
      );
    }

    const openRouterResult = await openRouterResponse.json();
    const aiTips = openRouterResult.choices?.[0]?.message?.content || "";

    // 종합적인 팁 구성
    const comprehensiveTips = [
      ...diseaseBasedTips,
      wateringTip,
      `계절별 관리: 현재 ${currentSeason}이므로 계절에 맞는 관리가 필요합니다.`,
      aiTips,
    ];

    return NextResponse.json({
      success: true,
      tips: comprehensiveTips,
      ai_analysis: aiTips,
      plant_info: {
        name: testData.plantName,
        korean_name: testData.koreanName,
        health_status: testData.healthStatus,
        health_probability: testData.healthProbability,
        diseases: testData.diseases,
        watering_info: testData.wateringInfo,
        current_season: currentSeason,
      },
    });
  } catch (error) {
    console.error("OpenRouter 테스트 오류:", error);
    return NextResponse.json(
      { error: "테스트 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}



