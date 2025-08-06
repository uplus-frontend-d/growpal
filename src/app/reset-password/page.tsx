import ResetPasswordForm from "../components/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 상단 식물 이미지 섹션 */}
      <div className="w-full h-64 bg-amber-50 flex items-center justify-center">
        <div className="w-80 h-48 bg-amber-100 p-2 rounded-lg shadow-lg">
          <div className="w-full h-full bg-amber-50 rounded-md overflow-hidden">
            <img
              src="/plant-image.jpg"
              alt="Plant Care"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 섹션 */}
      <div className="px-6 py-8 pb-24 flex flex-col items-center">
        {/* 타이틀 섹션 */}
        <div className="text-center mb-8 w-80">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            새 비밀번호 설정
          </h1>
          <p className="text-gray-600 text-base">
            새로운 비밀번호를 입력해주세요.
          </p>
        </div>

        {/* 비밀번호 재설정 폼 섹션 */}
        <div className="w-80">
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}
