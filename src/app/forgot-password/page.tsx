import ForgotPasswordForm from "../components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
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
            비밀번호 찾기
          </h1>
          <p className="text-gray-600 text-base">
            가입하신 이메일 주소를 입력하시면
          </p>
          <p className="text-gray-600 text-base">
            비밀번호 재설정 링크를 보내드립니다.
          </p>
        </div>

        {/* 비밀번호 찾기 폼 섹션 */}
        <div className="w-80">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
