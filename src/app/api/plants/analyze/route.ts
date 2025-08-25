import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabaseClient";

const BUCKET_NAME = "plant-diary-images";

export async function POST(req: NextRequest) {
  try {
    // 환경 변수 디버깅
    console.log("=== Plant ID AI 분석 API 환경 변수 디버깅 ===");
    console.log(
      "PLANT_ID_API_KEY:",
      process.env.PLANT_ID_API_KEY ? "있음" : "없음"
    );
    console.log(
      "OPENROUTER_API_KEY:",
      process.env.OPENROUTER_API_KEY ? "있음" : "없음"
    );
    console.log("========================");

    // API 키 확인
    if (!process.env.PLANT_ID_API_KEY) {
      return NextResponse.json(
        { error: "Plant.id API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    let imageUrl: string;
    let imageBuffer: ArrayBuffer;

    // Content-Type에 따라 처리 방식 결정
    const contentType = req.headers.get("content-type");

    if (contentType?.includes("multipart/form-data")) {
      // FormData로 전송된 경우 (파일 업로드)
      const formData = await req.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json(
          { error: "파일이 필요합니다." },
          { status: 400 }
        );
      }

      // 파일 타입 검증
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "이미지 파일만 업로드 가능합니다." },
          { status: 400 }
        );
      }

      // 파일 크기 검증 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "파일 크기는 5MB 이하여야 합니다." },
          { status: 400 }
        );
      }

      // Supabase Storage에 업로드
      const normalizeFilename = (filename: string): string => {
        return filename.normalize("NFC").replace(/[^a-zA-Z0-9.\-_]/g, "_");
      };

      const fileName = `plant-diary-${Date.now()}-${normalizeFilename(
        file.name
      )}`;
      imageBuffer = await file.arrayBuffer();

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, imageBuffer, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError.message);
        return NextResponse.json(
          { error: "파일 업로드 실패", detail: uploadError.message },
          { status: 500 }
        );
      }

      // 업로드된 파일의 공개 URL 가져오기
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(uploadData.path);

      imageUrl = urlData.publicUrl;
      console.log("이미지 업로드 완료, URL:", imageUrl);
    } else {
      // JSON으로 전송된 경우 (기존 방식)
      const body = await req.json();
      imageUrl = body.imageUrl;

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

      imageBuffer = await imageResponse.arrayBuffer();
      console.log("이미지 다운로드 완료, 크기:", imageBuffer.byteLength);
    }

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
        modifiers: ["health_all"], // disease_similar_images, crop_fast 제거
        plant_details: [
          "common_names",
          "watering",
          "scientific_name",
          "structured_name",
        ], // care_instructions, treatment, description 제거
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
      uploaded_image_url: contentType?.includes("multipart/form-data")
        ? imageUrl
        : undefined,
    });
  } catch (error) {
    console.error("이미지 분석 중 오류 발생:", error);

    // 에러 타입별로 다른 메시지 제공
    let errorMessage = "이미지 분석 중 오류가 발생했습니다.";
    let errorDetail = "";

    if (error instanceof Error) {
      if (error.message.includes("Plant.id API 오류")) {
        errorMessage = "Plant.id API 호출 중 오류가 발생했습니다.";
        errorDetail = error.message;
      } else if (error.message.includes("fetch")) {
        errorMessage = "이미지 다운로드 중 오류가 발생했습니다.";
        errorDetail = error.message;
      } else {
        errorDetail = error.message;
      }
    }

    console.error("에러 상세 정보:", { errorMessage, errorDetail });

    return NextResponse.json(
      {
        error: errorMessage,
        detail: errorDetail,
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
      (name: string) =>
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
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 10)
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
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 10)
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
        // 물주기 정보는 별도 필드로 제공 (관리 팁에는 추가하지 않음)
        console.log("물주기 정보 설정:", plantIdWatering);
      }
    }
  } else {
    console.log("watering 정보가 없습니다");
  }

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

  let healthScore = 50; // 기본값 (100점 만점)

  if (healthAssessment) {
    // Plant.id의 건강 점수 사용 (is_healthy_probability 기반)
    const healthProbability = healthAssessment.is_healthy_probability || 0;
    healthScore = Math.max(
      0,
      Math.min(100, Math.round(healthProbability * 100))
    );
    console.log(
      `Plant.id 건강 확률: ${(healthProbability * 100).toFixed(
        1
      )}% → ${healthScore}/100`
    );
  } else {
    // 건강 상태 분석이 없는 경우 신뢰도 기반으로 폴백
    healthScore = Math.min(100, Math.max(0, Math.round(confidence)));
    console.log(`건강 상태 분석 없음, 신뢰도 기반 폴백: ${healthScore}/100`);
  }

  // 상세 분석 생성 (합쳐진 팁 사용)
  const combinedTips = {
    plant_id_tips: plantIdTips,
    openrouter_tips: openRouterTips.additional_care_tips || [],
  };

  // Plant.id 분석 결과를 기존 species 타입에 매핑
  const { mappedSpecies } = mapPlantIdToSpecies(
    plantIdCare,
    plantName,
    koreanName
  );

  const finalResponse = {
    plant_species: plantName,
    korean_name: koreanName,
    mapped_species: mappedSpecies, // 기존 species 타입으로 매핑된 결과
    health_score: healthScore,
    care_tips: {
      plant_id_tips: plantIdTips,
      openrouter_tips: openRouterTips.additional_care_tips || [],
    },
    watering_frequency: plantIdWatering,
    confidence: confidence,
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

// Plant.id 분석 결과를 기존 species 타입에 매핑하는 함수
function mapPlantIdToSpecies(
  plantDetails: any,
  plantName: string,
  koreanName: string
): {
  mappedSpecies: string;
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
  const commonNames = plantDetails?.common_names || [];

  console.log("식물 분류 정보:", {
    classification,
    family,
    genus,
    plantName,
    koreanName,
    commonNames,
  });

  // 1. 한국어 이름 기반 매핑 (포괄적 검색)
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
    };

    for (const [korean, species] of Object.entries(koreanMapping)) {
      if (koreanName.includes(korean) || korean.includes(koreanName)) {
        console.log(`한국어 이름 기반 매핑: ${koreanName} → ${species}`);
        return { mappedSpecies: species };
      }
    }
  }

  // 2. Common Names 기반 매핑 (포괄적 검색)
  if (commonNames && Array.isArray(commonNames)) {
    const commonNameMapping: { [key: string]: string } = {
      // 몬스테라 계열
      monstera: "몬스테라",
      "swiss cheese": "몬스테라",
      "split leaf": "몬스테라",
      "cheese plant": "몬스테라",

      // 필로덴드론 계열
      philodendron: "필로덴드론",
      "heart leaf": "필로덴드론",
      "elephant ear": "필로덴드론",

      // 스킨답서스 계열
      scindapsus: "스킨답서스",
      silver: "스킨답서스",
      satin: "스킨답서스",

      // 산세베리아 계열
      sansevieria: "산세베리아",
      "snake plant": "산세베리아",
      "mother in law": "산세베리아",

      // 다육식물 계열
      succulent: "다육식물",
      jade: "다육식물",
      aloe: "다육식물",
      echeveria: "다육식물",
      sedum: "다육식물",

      // 선인장 계열
      cactus: "선인장",
      cacti: "선인장",
      prickly: "선인장",

      // 허브 계열
      herb: "허브",
      mint: "허브",
      basil: "허브",
      rosemary: "허브",
      thyme: "허브",
      oregano: "허브",
      sage: "허브",
      parsley: "허브",

      // 관엽식물 계열 (포괄적)
      leaf: "관엽식물",
      foliage: "관엽식물",
      green: "관엽식물",
      houseplant: "관엽식물",
      indoor: "관엽식물",
      palm: "관엽식물", // 야자수 계열 추가
      "parlor palm": "관엽식물", // 파리야자 추가
      chamaedorea: "관엽식물", // 차마에도레아 속 추가
    };

    for (const commonName of commonNames) {
      const lowerCommonName = commonName.toLowerCase();

      for (const [pattern, species] of Object.entries(commonNameMapping)) {
        if (lowerCommonName.includes(pattern.toLowerCase())) {
          console.log(`Common Name 기반 매핑: ${commonName} → ${species}`);
          return { mappedSpecies: species };
        }
      }
    }
  }

  // 3. 영문 이름 기반 매핑 (포괄적 검색)
  const englishMapping: { [key: string]: string } = {
    monstera: "몬스테라",
    philodendron: "필로덴드론",
    scindapsus: "스킨답서스",
    sansevieria: "산세베리아",
    succulent: "다육식물",
    cactus: "선인장",
    herb: "허브",
    foliage: "관엽식물",
    // 추가 포괄적 매핑
    "split leaf": "몬스테라",
    "swiss cheese": "몬스테라",
    "heart leaf": "필로덴드론",
    "snake plant": "산세베리아",
    "jade plant": "다육식물",
    "aloe vera": "다육식물",
  };

  const lowerPlantName = plantName.toLowerCase();
  for (const [english, species] of Object.entries(englishMapping)) {
    if (lowerPlantName.includes(english)) {
      console.log(`영문 이름 기반 매핑: ${plantName} → ${species}`);
      return { mappedSpecies: species };
    }
  }

  // 4. 식물과(family) 기반 매핑 (확장)
  if (family) {
    const familyMapping: { [key: string]: string } = {
      Araceae: "관엽식물", // 천남성과 (몬스테라, 필로덴드론, 스킨답서스 등)
      Asparagaceae: "산세베리아", // 아스파라거스과
      Crassulaceae: "다육식물", // 돌나물과
      Cactaceae: "선인장", // 선인장과
      Lamiaceae: "허브", // 꿀풀과
      Apiaceae: "허브", // 산형과
      // 추가 식물과
      Euphorbiaceae: "다육식물", // 대극과
      Asphodelaceae: "다육식물", // 아스포델루스과
      Piperaceae: "허브", // 후추과
      Rutaceae: "허브", // 운향과
    };

    const lowerFamily = family.toLowerCase();
    for (const [familyName, species] of Object.entries(familyMapping)) {
      if (lowerFamily.includes(familyName.toLowerCase())) {
        console.log(`식물과 기반 매핑: ${family} → ${species}`);
        return { mappedSpecies: species };
      }
    }
  }

  // 5. Genus 기반 매핑 (새로 추가)
  if (genus) {
    const genusMapping: { [key: string]: string } = {
      Monstera: "몬스테라",
      Philodendron: "필로덴드론",
      Scindapsus: "스킨답서스",
      Sansevieria: "산세베리아",
      Echeveria: "다육식물",
      Sedum: "다육식물",
      Aloe: "다육식물",
      Crassula: "다육식물",
      Cactus: "선인장",
      Opuntia: "선인장",
      Mentha: "허브",
      Ocimum: "허브",
      Rosmarinus: "허브",
      Thymus: "허브",
    };

    const lowerGenus = genus.toLowerCase();
    for (const [genusName, species] of Object.entries(genusMapping)) {
      if (lowerGenus.includes(genusName.toLowerCase())) {
        console.log(`Genus 기반 매핑: ${genus} → ${species}`);
        return { mappedSpecies: species };
      }
    }
  }

  // 매핑할 수 없는 경우 "기타"로 분류
  console.log(`매핑 실패, 기타로 분류: ${plantName} → 기타`);
  return {
    mappedSpecies: "기타",
  };
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

  // Plant.id 분석 결과를 바탕으로 OpenRouter에서 맞춤형 팁 생성
  console.log(
    "Plant.id 분석 결과를 OpenRouter에 전달하여 맞춤형 관리 팁을 생성합니다."
  );

  if (!process.env.OPENROUTER_API_KEY) {
    console.log("OpenRouter API 키가 없어서 기본 팁을 사용합니다.");
    return {
      additional_care_tips: ["OpenRouter API 키가 설정되지 않았습니다"],
    };
  }

  try {
    console.log("OpenRouter API 호출 시작...");
    console.log(
      "환경변수 OPENROUTER_API_KEY 값:",
      process.env.OPENROUTER_API_KEY ? "설정됨" : "설정되지 않음"
    );
    console.log("환경변수 길이:", process.env.OPENROUTER_API_KEY?.length || 0);

    // 타임아웃 설정 (30초)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

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
          model: "openai/gpt-3.5-turbo", // OpenAI GPT-3.5 Turbo (확실한 모델)
          messages: [
            {
              role: "system",
              content:
                "당신은 식물 관리 전문가입니다. 한국어로 식물 관리 팁을 제공해주세요.",
            },
            {
              role: "user",
              content: `식물 관리 전문가로서 Plant.id 분석 결과를 바탕으로 관리 팁 3개를 제공해주세요.

식물: ${plantName}
물주기: ${wateringInfo || "정보 없음"}
건강상태: ${Math.round(healthAssessment?.is_healthy_probability * 100)}%
계절: ${currentSeason}

현재 계절에 맞는 실용적인 관리 팁 3개를 JSON으로 응답:
{"additional_care_tips": ["팁1", "팁2", "팁3"]}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
        signal: controller.signal,
      }
    );

    // 타임아웃 클리어
    clearTimeout(timeoutId);

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

    // 타임아웃 에러 처리
    if (error instanceof Error && error.name === "AbortError") {
      console.log("OpenRouter API 타임아웃 (30초)");
      return {
        additional_care_tips: [
          "API 응답 시간 초과로 인해 기본 팁을 제공합니다",
        ],
      };
    }

    // 기타 에러 처리
    return {
      additional_care_tips: ["OpenRouter API 호출 중 오류가 발생했습니다"],
    };
  }
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
