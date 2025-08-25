/**
 * API 호출 함수 모음 및 타입 정의
 *
 * 개발자가 타입 안전성을 보장받으면서 쉽게 API를 호출할 수 있도록 제공합니다.
 * 모든 함수는 TypeScript 타입을 사용하여 컴파일 타임에 오류를 방지합니다.
 */

// ============================================================================
// PLANTS API
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

/**
 * 특정 유저의 식물 목록 조회
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
// PLANT DIARIES API
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

/**
 * 특정 식물의 활동 로그 조회
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
// PLANT TODOS API
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

export interface GetUserTodosByExactDateRequest {
  user_id: string;
  date: string; // YYYY-MM-DD 형식
}

export type GetUserTodosByExactDateResponse = PlantTodo[];

// ============================================================================
// USER DIARIES BY EXACT DATE API 타입 정의
// ============================================================================

export interface GetUserDiariesByExactDateRequest {
  user_id: string;
  date: string; // YYYY-MM-DD 형식
}

export type GetUserDiariesByExactDateResponse = PlantDiary[];

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
  plant_updated?: {
    id: string;
    last_watered_at: string;
  };
}

export interface DeletePlantTodoRequest {
  todo_id: string;
}

export interface DeletePlantTodoResponse {
  message: string;
}

/**
 * 특정 식물의 작업 목록 조회
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
 * 특정 날짜와 정확히 일치하는 due_date를 가진 todo를 조회
 */
export async function getUserTodosByExactDate(
  data: GetUserTodosByExactDateRequest
): Promise<GetUserTodosByExactDateResponse> {
  const response = await fetch(
    `/api/users/${data.user_id}/todos/exact-date?date=${data.date}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch user todos by exact date: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * 특정 날짜와 정확히 일치하는 created_at을 가진 diary를 조회
 */
export async function getUserDiariesByExactDate(
  data: GetUserDiariesByExactDateRequest
): Promise<GetUserDiariesByExactDateResponse> {
  const response = await fetch(
    `/api/users/${data.user_id}/diaries/exact-date?date=${data.date}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch user diaries by exact date: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * 식물 작업 등록
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
// PLANT ACTIVITIES API (Diary + Todo 통합 조회)
// ============================================================================

export interface GetPlantActivitiesRequest {
  plant_id: string;
}

export interface PlantActivities {
  diaries: PlantDiary[];
  todos: PlantTodo[];
}

export type GetPlantActivitiesResponse = PlantActivities;

/**
 * 특정 식물의 모든 활동 조회 (Diary + Todo)
 */
export async function getPlantActivities(
  plantId: string
): Promise<GetPlantActivitiesResponse> {
  const response = await fetch(`/api/plants/${plantId}/activities`);

  if (!response.ok) {
    throw new Error(`Failed to fetch plant activities: ${response.statusText}`);
  }

  return response.json();
}

// ============================================================================
// USER ACTIVITIES API (특정 유저의 모든 Diary + Todo 통합 조회)
// ============================================================================

export interface GetUserActivitiesRequest {
  user_id: string;
}

export interface UserActivities {
  diaries: PlantDiary[];
  todos: PlantTodo[];
}

export type GetUserActivitiesResponse = UserActivities;

/**
 * 특정 유저의 모든 활동 조회 (Diary + Todo)
 */
export async function getUserActivities(
  userId: string
): Promise<GetUserActivitiesResponse> {
  const response = await fetch(`/api/users/${userId}/activities`);

  if (!response.ok) {
    throw new Error(`Failed to fetch user activities: ${response.statusText}`);
  }

  return response.json();
}

// ============================================================================
// UPLOAD API
// ============================================================================

export interface UploadImageRequest {
  file: File;
}

export interface UploadImageResponse {
  success: boolean;
  fileName: string;
  message: string;
}

/**
 * 이미지 업로드
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
// AUTH API
// ============================================================================

export interface User {
  id: string;
  email: string;
  provider: string; // 쉼표로 구분된 provider 문자열 (예: "google,github")
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

export interface SignUpErrorResponse {
  error: string;
  provider?: string;
  code?: string;
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

/**
 * 로그인
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
