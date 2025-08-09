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

🌱 **식물 기본 정보**
- 식물 이름: ${testData.plantName}
- 한국어 이름: ${testData.koreanName}

💧 **Plant.id 물주기 정보**
- 적정 물주기: ${testData.wateringInfo}

🏥 **Plant.id 건강 진단**
- 건강 상태: ${testData.healthStatus === "healthy" ? "건강함" : "주의 필요"}
- 건강 확률: ${testData.healthProbability}%

🔍 **Plant.id 감지된 문제점**
${
  diseaseBasedTips.length > 0
    ? diseaseBasedTips.map((tip) => `- ${tip}`).join("\n")
    : "- 특별한 문제점 없음"
}
- ${wateringTip}

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
      console.error("OpenRouter API 오류:", errorText);
      throw new Error(`OpenRouter API 오류: ${openRouterResponse.status}`);
    }

    const openRouterData = await openRouterResponse.json();
    console.log("OpenRouter 응답 전체:", openRouterData);

    const generatedText = openRouterData.choices[0]?.message?.content || "";
    console.log("생성된 텍스트:", generatedText);

    // JSON 파싱
    let parsedResult;
    try {
      console.log("JSON 파싱 시도 중...");
      // JSON 블록을 찾기 위한 정규식
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log("JSON 매치 발견:", jsonMatch[0]);
        parsedResult = JSON.parse(jsonMatch[0]);
        console.log("파싱된 JSON:", parsedResult);
      } else {
        throw new Error("JSON 형식을 찾을 수 없습니다");
      }
    } catch (parseError) {
      console.error("JSON 파싱 실패:", parseError);
      // 파싱 실패 시 기본 응답
      parsedResult = {
        additional_care_tips: [
          "OpenRouter 응답 파싱에 실패했습니다",
          "기본 관리법을 따라주세요",
          "전문가의 조언을 구해보세요",
        ],
      };
    }

    // 최대 3개로 제한
    if (parsedResult.additional_care_tips) {
      parsedResult.additional_care_tips =
        parsedResult.additional_care_tips.slice(0, 3);
    }

    console.log("최종 OpenRouter 팁:", parsedResult.additional_care_tips);

    return NextResponse.json({
      additional_care_tips: parsedResult.additional_care_tips || [],
    });
  } catch (error) {
    console.error("OpenRouter 테스트 중 오류 발생:", error);
    return NextResponse.json(
      {
        error: "OpenRouter 테스트 중 오류가 발생했습니다.",
        additional_care_tips: [],
      },
      { status: 500 }
    );
  }
}
