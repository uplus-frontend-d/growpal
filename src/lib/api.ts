/**
 * API 호출 함수 모음 및 타입 정의
 *
 * 개발자가 타입 안전성을 보장받으면서 쉽게 API를 호출할 수 있도록 제공합니다.
 * 모든 함수는 TypeScript 타입을 사용하여 컴파일 타임에 오류를 방지합니다.
 */

// ============================================================================
// PLANTS API 타입 정의
// ============================================================================

export interface GetUserPlantsRequest {
  user_id: string;
}

export interface Plant {
  id: string;
  user_id: string;
  name: string;
  location: string;
  last_watered_at: string;
  image_url: string;
  adopted_at: string; // YYYY-MM-DD 형식
  growth_status: string;
  species: string;
}

export type GetUserPlantsResponse = Plant[];

export interface CreatePlantRequest {
  user_id: string;
  name: string;
  location: string;
  image_url?: string;
  adopted_at?: string; // YYYY-MM-DD 형식
  growth_status?: string;
  species?: string;
}

export interface CreatePlantResponse {
  id: string;
  user_id: string;
  name: string;
  location: string;
  last_watered_at: string;
  image_url: string;
}

export interface UpdatePlantRequest {
  plant_id: string;
  name?: string;
  location?: string;
  image_url?: string;
  adopted_at?: string; // YYYY-MM-DD 형식
  growth_status?: string;
  species?: string;
}

export interface UpdatePlantResponse {
  id: string;
  user_id: string;
  name: string;
  location: string;
  last_watered_at: string;
  image_url: string;
}

export interface DeletePlantRequest {
  plant_id: string;
}

export interface DeletePlantResponse {
  message: string;
}

// ============================================================================
// PLANT DIARIES API 타입 정의 (기존 PLANT LOGS에서 변경)
// ============================================================================

export interface PlantDiary {
  id: string;
  plant_id: string;
  image_url: string;
  note: string;
  created_at: string;
}

export interface GetPlantDiariesRequest {
  plant_id: string;
}

export type GetPlantDiariesResponse = PlantDiary[];

export interface CreatePlantDiaryRequest {
  plant_id: string;
  image_url?: string;
  note: string;
}

export interface CreatePlantDiaryResponse {
  id: string;
  plant_id: string;
  image_url: string;
  note: string;
  created_at: string;
}

export interface UpdatePlantDiaryRequest {
  diary_id: string;
  image_url?: string;
  note?: string;
}

export interface UpdatePlantDiaryResponse {
  id: string;
  plant_id: string;
  image_url: string;
  note: string;
  created_at: string;
}

export interface DeletePlantDiaryRequest {
  diary_id: string;
}

export interface DeletePlantDiaryResponse {
  message: string;
}

// ============================================================================
// PLANT TODOS API 타입 정의 (기존 PLANT TASKS에서 변경)
// ============================================================================

export interface PlantTodo {
  id: string;
  plant_id: string;
  task_type: string;
  due_date: string; // YYYY-MM-DD 형식
  is_done: boolean;
  executed_at: string; // ISO8601 문자열
  created_at: string; // ISO8601 문자열
}

export interface GetPlantTodosRequest {
  plant_id: string;
}

export type GetPlantTodosResponse = PlantTodo[];

export interface GetUserTodosRequest {
  user_id: string;
}

export type GetUserTodosResponse = PlantTodo[];

export interface GetUserTodosByDateRequest {
  user_id: string;
  from_date: string; // YYYY-MM-DD 형식
}

export type GetUserTodosByDateResponse = PlantTodo[];

export interface CreatePlantTodoRequest {
  plant_id: string;
  task_type: string;
  due_date: string; // YYYY-MM-DD 형식
}

export interface CreatePlantTodoResponse {
  id: string;
  plant_id: string;
  task_type: string;
  due_date: string;
  is_done: boolean;
  executed_at: string;
  created_at: string;
}

export interface UpdatePlantTodoRequest {
  todo_id: string;
  is_done: boolean;
}

export interface UpdatePlantTodoResponse {
  id: string;
  plant_id: string;
  task_type: string;
  due_date: string;
  is_done: boolean;
  executed_at: string;
  created_at: string;
}

export interface DeletePlantTodoRequest {
  todo_id: string;
}

export interface DeletePlantTodoResponse {
  message: string;
}

// ============================================================================
// AUTH API 타입 정의
// ============================================================================

export interface User {
  id: string;
  email: string;
  provider: string;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  session: {
    access_token: string;
    refresh_token: string;
  };
}

export interface SignUpRequest {
  email: string;
  password: string;
}

export interface SignUpResponse {
  user: User;
  message: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface LogoutResponse {
  message: string;
}

// ============================================================================
// PLANTS API 함수들
// ============================================================================

/**
 * 특정 유저의 식물 목록 조회
 *
 * 사용법:
 * const plants = await getUserPlants('user-id-here');
 *
 * 타입:
 * - 파라미터: userId (string)
 * - 반환값: Plant[] (식물 목록 배열)
 */
export async function getUserPlants(
  userId: string
): Promise<GetUserPlantsResponse> {
  const response = await fetch(`/api/plants?user_id=${userId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch plants: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 특정 식물 정보 조회
 *
 * 사용법:
 * const plant = await getPlant('plant-id-here');
 *
 * 타입:
 * - 파라미터: plantId (string)
 * - 반환값: Plant (식물 정보)
 */
export async function getPlant(plantId: string): Promise<Plant> {
  const response = await fetch(`/api/plants/${plantId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch plant: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 식물 등록
 *
 * 사용법:
 * const newPlant = await createPlant({
 *   user_id: 'user-id',
 *   name: '몬스테라',
 *   location: '거실'
 * });
 *
 * 타입:
 * - 파라미터: CreatePlantRequest { user_id, name, location, image_url? }
 * - 반환값: CreatePlantResponse (생성된 식물 정보)
 */
export async function createPlant(
  data: CreatePlantRequest
): Promise<CreatePlantResponse> {
  const response = await fetch("/api/plants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create plant: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 식물 수정 (전체 교체)
 *
 * 사용법:
 * const updatedPlant = await updatePlant('plant-id', {
 *   name: '새로운 이름',
 *   location: '새로운 위치',
 *   image_url: '새로운 이미지'
 * });
 *
 * 타입:
 * - 파라미터: plantId (string), data (Omit<UpdatePlantRequest, 'plant_id'>)
 * - 반환값: UpdatePlantResponse (수정된 식물 정보)
 */
export async function updatePlant(
  plantId: string,
  data: Omit<UpdatePlantRequest, "plant_id">
): Promise<UpdatePlantResponse> {
  const response = await fetch(`/api/plants/${plantId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update plant: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 식물 부분 수정
 *
 * 사용법:
 * const updatedPlant = await patchPlant('plant-id', {
 *   name: '새로운 이름'  // 이 필드만 수정
 * });
 *
 * 타입:
 * - 파라미터: plantId (string), data (Omit<UpdatePlantRequest, 'plant_id'>)
 * - 반환값: UpdatePlantResponse (수정된 식물 정보)
 */
export async function patchPlant(
  plantId: string,
  data: Omit<UpdatePlantRequest, "plant_id">
): Promise<UpdatePlantResponse> {
  const response = await fetch(`/api/plants/${plantId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to patch plant: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 식물 삭제
 *
 * 사용법:
 * await deletePlant('plant-id');
 *
 * 타입:
 * - 파라미터: plantId (string)
 * - 반환값: DeletePlantResponse { message: string }
 */
export async function deletePlant(
  plantId: string
): Promise<DeletePlantResponse> {
  const response = await fetch(`/api/plants/${plantId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete plant: ${response.statusText}`);
  }

  return response.json();
}

// ============================================================================
// PLANT DIARIES API 함수들
// ============================================================================

/**
 * 특정 식물의 활동 로그 조회
 *
 * 사용법:
 * const logs = await getPlantDiaries('plant-id');
 *
 * 타입:
 * - 파라미터: plantId (string)
 * - 반환값: PlantDiary[] (로그 목록 배열, 최신순 정렬)
 */
export async function getPlantDiaries(
  plantId: string
): Promise<GetPlantDiariesResponse> {
  const response = await fetch(`/api/plants/${plantId}/diaries`);

  if (!response.ok) {
    throw new Error(`Failed to fetch plant diaries: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 식물 활동 로그 등록
 *
 * 사용법:
 * const newLog = await createPlantDiary('plant-id', {
 *   note: '오늘 물을 주었습니다!',
 *   image_url: 'https://example.com/photo.jpg'  // 선택사항
 * });
 *
 * 타입:
 * - 파라미터: plantId (string), data (Omit<CreatePlantDiaryRequest, 'plant_id'>)
 * - 반환값: CreatePlantDiaryResponse (생성된 로그 정보)
 */
export async function createPlantDiary(
  plantId: string,
  data: Omit<CreatePlantDiaryRequest, "plant_id">
): Promise<CreatePlantDiaryResponse> {
  const response = await fetch(`/api/plants/${plantId}/diaries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create plant diary: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 식물 활동 로그 수정 (전체 교체)
 *
 * 사용법:
 * const updatedLog = await updatePlantDiary('plant-id', 'log-id', {
 *   note: '새로운 메모',
 *   image_url: '새로운 이미지'
 * });
 *
 * 타입:
 * - 파라미터: plantId (string), logId (string), data (Omit<UpdatePlantDiaryRequest, 'diary_id'>)
 * - 반환값: UpdatePlantDiaryResponse (수정된 로그 정보)
 */
export async function updatePlantDiary(
  plantId: string,
  diaryId: string,
  data: Omit<UpdatePlantDiaryRequest, "diary_id">
): Promise<UpdatePlantDiaryResponse> {
  const response = await fetch(`/api/plants/${plantId}/diaries/${diaryId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update plant diary: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 식물 활동 로그 부분 수정
 *
 * 사용법:
 * const updatedLog = await patchPlantDiary('plant-id', 'log-id', {
 *   note: '수정된 메모'  // 이 필드만 수정
 * });
 *
 * 타입:
 * - 파라미터: plantId (string), logId (string), data (Omit<UpdatePlantDiaryRequest, 'diary_id'>)
 * - 반환값: UpdatePlantDiaryResponse (수정된 로그 정보)
 */
export async function patchPlantDiary(
  plantId: string,
  diaryId: string,
  data: Omit<UpdatePlantDiaryRequest, "diary_id">
): Promise<UpdatePlantDiaryResponse> {
  const response = await fetch(`/api/plants/${plantId}/diaries/${diaryId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to patch plant diary: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 식물 활동 로그 삭제
 *
 * 사용법:
 * await deletePlantDiary('plant-id', 'log-id');
 *
 * 타입:
 * - 파라미터: plantId (string), logId (string)
 * - 반환값: DeletePlantDiaryResponse { message: string }
 */
export async function deletePlantDiary(
  plantId: string,
  diaryId: string
): Promise<DeletePlantDiaryResponse> {
  const response = await fetch(`/api/plants/${plantId}/diaries/${diaryId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete plant diary: ${response.statusText}`);
  }

  return response.json();
}

// ============================================================================
// PLANT TODOS API 함수들
// ============================================================================

/**
 * 특정 식물의 작업 목록 조회
 *
 * 사용법:
 * const tasks = await getPlantTodos('plant-id');
 *
 * 타입:
 * - 파라미터: plantId (string)
 * - 반환값: PlantTodo[] (작업 목록 배열)
 */
export async function getPlantTodos(
  plantId: string
): Promise<GetPlantTodosResponse> {
  const response = await fetch(`/api/plants/${plantId}/todos`);

  if (!response.ok) {
    throw new Error(`Failed to fetch plant todos: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 특정 유저의 모든 작업 목록 조회
 *
 * 사용법:
 * const tasks = await getUserTodos('user-id');
 *
 * 타입:
 * - 파라미터: userId (string)
 * - 반환값: PlantTodo[] (유저의 모든 작업 목록 배열)
 */
export async function getUserTodos(
  userId: string
): Promise<GetUserTodosResponse> {
  const response = await fetch(`/api/users/${userId}/todos`);

  if (!response.ok) {
    throw new Error(`Failed to fetch user todos: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 특정 유저의 특정 날짜 이후 작업 목록 조회
 *
 * 사용법:
 * const tasks = await getUserTodosByDate('user-id', '2024-01-01');
 *
 * 타입:
 * - 파라미터: userId (string), fromDate (string)
 * - 반환값: PlantTodo[] (특정 날짜 이후 작업 목록 배열)
 */
export async function getUserTodosByDate(
  data: GetUserTodosByDateRequest
): Promise<GetUserTodosByDateResponse> {
  const response = await fetch(
    `/api/users/${data.user_id}/todos/date?from_date=${data.from_date}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch user todos by date: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * 식물 작업 등록
 *
 * 사용법:
 * const newTask = await createPlantTodo('plant-id', {
 *   task_type: '물주기',
 *   due_date: '2024-01-15',
 * });
 *
 * 타입:
 * - 파라미터: plantId (string), data (Omit<CreatePlantTodoRequest, 'plant_id'>)
 * - 반환값: CreatePlantTodoResponse (생성된 작업 정보)
 */
export async function createPlantTodo(
  plantId: string,
  data: Omit<CreatePlantTodoRequest, "plant_id">
): Promise<CreatePlantTodoResponse> {
  const response = await fetch(`/api/plants/${plantId}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create plant todo: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 식물 작업 완료 상태 수정
 *
 * 사용법:
 * const updatedTask = await updatePlantTodo('plant-id', 'task-id', {
 *   is_done: true  // 완료 상태로 변경
 * });
 *
 * 타입:
 * - 파라미터: plantId (string), taskId (string), data (Omit<UpdatePlantTodoRequest, 'todo_id'>)
 * - 반환값: UpdatePlantTodoResponse (수정된 작업 정보)
 */
export async function updatePlantTodo(
  plantId: string,
  todoId: string,
  data: Omit<UpdatePlantTodoRequest, "todo_id">
): Promise<UpdatePlantTodoResponse> {
  const response = await fetch(`/api/plants/${plantId}/todos/${todoId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update plant todo: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 식물 작업 삭제
 *
 * 사용법:
 * await deletePlantTodo('plant-id', 'task-id');
 *
 * 타입:
 * - 파라미터: plantId (string), taskId (string)
 * - 반환값: DeletePlantTodoResponse { message: string }
 */
export async function deletePlantTodo(
  plantId: string,
  todoId: string
): Promise<DeletePlantTodoResponse> {
  const response = await fetch(`/api/plants/${plantId}/todos/${todoId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete plant todo: ${response.statusText}`);
  }

  return response.json();
}

// ============================================================================
// UPLOAD API 타입 정의
// ============================================================================

export interface UploadImageRequest {
  file: File;
}

export interface UploadImageResponse {
  success: boolean;
  fileName: string;
  message: string;
}

// ============================================================================
// UPLOAD API 함수들
// ============================================================================

/**
 * 이미지 업로드
 *
 * 사용법:
 * const result = await uploadImage(file);
 *
 * 타입:
 * - 파라미터: file (File) - 업로드할 이미지 파일
 * - 반환값: UploadImageResponse { success, fileName, message }
 */
export async function uploadImage(file: File): Promise<UploadImageResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload image: ${response.statusText}`);
  }

  return response.json();
}

// ============================================================================
// AUTH API 함수들
// ============================================================================

/**
 * 로그인
 *
 * 사용법:
 * const result = await login({
 *   email: 'user@example.com',
 *   password: 'password123'
 * });
 *
 * 타입:
 * - 파라미터: LoginRequest { email, password }
 * - 반환값: LoginResponse { user, session }
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 회원가입
 *
 * 사용법:
 * const result = await signUp({
 *   email: 'user@example.com',
 *   password: 'password123'
 * });
 *
 * 타입:
 * - 파라미터: SignUpRequest { email, password }
 * - 반환값: SignUpResponse { user, message }
 */
export async function signUp(data: SignUpRequest): Promise<SignUpResponse> {
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Sign up failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 비밀번호 찾기 (이메일 전송)
 *
 * 사용법:
 * const result = await forgotPassword({
 *   email: 'user@example.com'
 * });
 *
 * 타입:
 * - 파라미터: ForgotPasswordRequest { email }
 * - 반환값: ForgotPasswordResponse { message }
 */
export async function forgotPassword(
  data: ForgotPasswordRequest
): Promise<ForgotPasswordResponse> {
  const response = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Forgot password failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 비밀번호 재설정
 *
 * 사용법:
 * const result = await resetPassword({
 *   password: 'newpassword123'
 * });
 *
 * 타입:
 * - 파라미터: ResetPasswordRequest { password }
 * - 반환값: ResetPasswordResponse { message }
 */
export async function resetPassword(
  data: ResetPasswordRequest
): Promise<ResetPasswordResponse> {
  const response = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Reset password failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 로그아웃
 *
 * 사용법:
 * const result = await logout();
 *
 * 타입:
 * - 파라미터: 없음
 * - 반환값: LogoutResponse { message }
 */
export async function logout(): Promise<LogoutResponse> {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Logout failed: ${response.statusText}`);
  }

  return response.json();
}
