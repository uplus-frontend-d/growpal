import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
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

    // 실제 프로덕션에서는 여기서 Supabase Storage나 다른 클라우드 스토리지에 업로드
    // 현재는 임시로 파일 정보만 반환
    const fileName = `${Date.now()}-${file.name}`;

    // TODO: 실제 파일 업로드 로직 구현
    // const { data, error } = await supabase.storage
    //   .from('plant-images')
    //   .upload(fileName, file);

    return NextResponse.json({
      success: true,
      fileName,
      message: "파일 업로드가 완료되었습니다. (개발 모드: 실제 업로드 미구현)",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "파일 업로드에 실패했습니다." },
      { status: 500 }
    );
  }
}
