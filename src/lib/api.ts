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
}

export type GetUserPlantsResponse = Plant[];

export interface CreatePlantRequest {
  user_id: string;
  name: string;
  location: string;
  image_url?: string;
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
// PLANT LOGS API 타입 정의
// ============================================================================

export interface PlantLog {
  id: string;
  plant_id: string;
  image_url: string;
  note: string;
  created_at: string;
}

export interface GetPlantLogsRequest {
  plant_id: string;
}

export type GetPlantLogsResponse = PlantLog[];

export interface CreatePlantLogRequest {
  plant_id: string;
  image_url?: string;
  note: string;
}

export interface CreatePlantLogResponse {
  id: string;
  plant_id: string;
  image_url: string;
  note: string;
  created_at: string;
}

export interface UpdatePlantLogRequest {
  log_id: string;
  image_url?: string;
  note?: string;
}

export interface UpdatePlantLogResponse {
  id: string;
  plant_id: string;
  image_url: string;
  note: string;
  created_at: string;
}

export interface DeletePlantLogRequest {
  log_id: string;
}

export interface DeletePlantLogResponse {
  message: string;
}

// ============================================================================
// PLANT TASKS API 타입 정의
// ============================================================================

export interface PlantTask {
  id: string;
  plant_id: string;
  task_type: string;
  due_date: string; // YYYY-MM-DD 형식
  is_done: boolean;
  icon: string;
}

export interface GetPlantTasksRequest {
  plant_id: string;
}

export type GetPlantTasksResponse = PlantTask[];

export interface GetUserTasksRequest {
  user_id: string;
}

export type GetUserTasksResponse = PlantTask[];

export interface GetUserTasksByDateRequest {
  user_id: string;
  from_date: string; // YYYY-MM-DD 형식
}

export type GetUserTasksByDateResponse = PlantTask[];

export interface CreatePlantTaskRequest {
  plant_id: string;
  task_type: string;
  due_date: string; // YYYY-MM-DD 형식
  icon?: string;
}

export interface CreatePlantTaskResponse {
  id: string;
  plant_id: string;
  task_type: string;
  due_date: string;
  is_done: boolean;
  icon: string;
}

export interface UpdatePlantTaskRequest {
  task_id: string;
  is_done: boolean;
}

export interface UpdatePlantTaskResponse {
  id: string;
  plant_id: string;
  task_type: string;
  due_date: string;
  is_done: boolean;
  icon: string;
}

export interface DeletePlantTaskRequest {
  task_id: string;
}

export interface DeletePlantTaskResponse {
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
  const response = await fetch(`/api/users/${userId}/plants`);

  if (!response.ok) {
    throw new Error(`Failed to fetch plants: ${response.statusText}`);
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
// PLANT LOGS API 함수들
// ============================================================================

/**
 * 특정 식물의 활동 로그 조회
 *
 * 사용법:
 * const logs = await getPlantLogs('plant-id');
 *
 * 타입:
 * - 파라미터: plantId (string)
 * - 반환값: PlantLog[] (로그 목록 배열, 최신순 정렬)
 */
export async function getPlantLogs(
  plantId: string
): Promise<GetPlantLogsResponse> {
  const response = await fetch(`/api/plants/${plantId}/logs`);

  if (!response.ok) {
    throw new Error(`Failed to fetch plant logs: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 식물 활동 로그 등록
 *
 * 사용법:
 * const newLog = await createPlantLog('plant-id', {
 *   note: '오늘 물을 주었습니다!',
 *   image_url: 'https://example.com/photo.jpg'  // 선택사항
 * });
 *
 * 타입:
 * - 파라미터: plantId (string), data (Omit<CreatePlantLogRequest, 'plant_id'>)
 * - 반환값: CreatePlantLogResponse (생성된 로그 정보)
 */
export async function createPlantLog(
  plantId: string,
  data: Omit<CreatePlantLogRequest, "plant_id">
): Promise<CreatePlantLogResponse> {
  const response = await fetch(`/api/plants/${plantId}/logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create plant log: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 식물 활동 로그 수정 (전체 교체)
 *
 * 사용법:
 * const updatedLog = await updatePlantLog('plant-id', 'log-id', {
 *   note: '새로운 메모',
 *   image_url: '새로운 이미지'
 * });
 *
 * 타입:
 * - 파라미터: plantId (string), logId (string), data (Omit<UpdatePlantLogRequest, 'log_id'>)
 * - 반환값: UpdatePlantLogResponse (수정된 로그 정보)
 */
export async function updatePlantLog(
  plantId: string,
  logId: string,
  data: Omit<UpdatePlantLogRequest, "log_id">
): Promise<UpdatePlantLogResponse> {
  const response = await fetch(`/api/plants/${plantId}/logs/${logId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update plant log: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 식물 활동 로그 부분 수정
 *
 * 사용법:
 * const updatedLog = await patchPlantLog('plant-id', 'log-id', {
 *   note: '수정된 메모'  // 이 필드만 수정
 * });
 *
 * 타입:
 * - 파라미터: plantId (string), logId (string), data (Omit<UpdatePlantLogRequest, 'log_id'>)
 * - 반환값: UpdatePlantLogResponse (수정된 로그 정보)
 */
export async function patchPlantLog(
  plantId: string,
  logId: string,
  data: Omit<UpdatePlantLogRequest, "log_id">
): Promise<UpdatePlantLogResponse> {
  const response = await fetch(`/api/plants/${plantId}/logs/${logId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to patch plant log: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 식물 활동 로그 삭제
 *
 * 사용법:
 * await deletePlantLog('plant-id', 'log-id');
 *
 * 타입:
 * - 파라미터: plantId (string), logId (string)
 * - 반환값: DeletePlantLogResponse { message: string }
 */
export async function deletePlantLog(
  plantId: string,
  logId: string
): Promise<DeletePlantLogResponse> {
  const response = await fetch(`/api/plants/${plantId}/logs/${logId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete plant log: ${response.statusText}`);
  }

  return response.json();
}

// ============================================================================
// PLANT TASKS API 함수들
// ============================================================================

/**
 * 특정 식물의 작업 목록 조회
 *
 * 사용법:
 * const tasks = await getPlantTasks('plant-id');
 *
 * 타입:
 * - 파라미터: plantId (string)
 * - 반환값: PlantTask[] (작업 목록 배열)
 */
export async function getPlantTasks(
  plantId: string
): Promise<GetPlantTasksResponse> {
  const response = await fetch(`/api/plants/${plantId}/tasks`);

  if (!response.ok) {
    throw new Error(`Failed to fetch plant tasks: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 특정 유저의 모든 작업 목록 조회
 *
 * 사용법:
 * const tasks = await getUserTasks('user-id');
 *
 * 타입:
 * - 파라미터: userId (string)
 * - 반환값: PlantTask[] (유저의 모든 작업 목록 배열)
 */
export async function getUserTasks(
  userId: string
): Promise<GetUserTasksResponse> {
  const response = await fetch(`/api/users/${userId}/tasks`);

  if (!response.ok) {
    throw new Error(`Failed to fetch user tasks: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 특정 유저의 특정 날짜 이후 작업 목록 조회
 *
 * 사용법:
 * const tasks = await getUserTasksByDate('user-id', '2024-01-01');
 *
 * 타입:
 * - 파라미터: userId (string), fromDate (string)
 * - 반환값: PlantTask[] (특정 날짜 이후 작업 목록 배열)
 */
export async function getUserTasksByDate(
  data: GetUserTasksByDateRequest
): Promise<GetUserTasksByDateResponse> {
  const response = await fetch(
    `/api/users/${data.user_id}/tasks/date?from_date=${data.from_date}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch user tasks by date: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * 식물 작업 등록
 *
 * 사용법:
 * const newTask = await createPlantTask('plant-id', {
 *   task_type: '물주기',
 *   due_date: '2024-01-15',
 *   icon: '💧'  // 선택사항
 * });
 *
 * 타입:
 * - 파라미터: plantId (string), data (Omit<CreatePlantTaskRequest, 'plant_id'>)
 * - 반환값: CreatePlantTaskResponse (생성된 작업 정보)
 */
export async function createPlantTask(
  plantId: string,
  data: Omit<CreatePlantTaskRequest, "plant_id">
): Promise<CreatePlantTaskResponse> {
  const response = await fetch(`/api/plants/${plantId}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create plant task: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 식물 작업 완료 상태 수정
 *
 * 사용법:
 * const updatedTask = await updatePlantTask('plant-id', 'task-id', {
 *   is_done: true  // 완료 상태로 변경
 * });
 *
 * 타입:
 * - 파라미터: plantId (string), taskId (string), data (Omit<UpdatePlantTaskRequest, 'task_id'>)
 * - 반환값: UpdatePlantTaskResponse (수정된 작업 정보)
 */
export async function updatePlantTask(
  plantId: string,
  taskId: string,
  data: Omit<UpdatePlantTaskRequest, "task_id">
): Promise<UpdatePlantTaskResponse> {
  const response = await fetch(`/api/plants/${plantId}/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update plant task: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 식물 작업 삭제
 *
 * 사용법:
 * await deletePlantTask('plant-id', 'task-id');
 *
 * 타입:
 * - 파라미터: plantId (string), taskId (string)
 * - 반환값: DeletePlantTaskResponse { message: string }
 */
export async function deletePlantTask(
  plantId: string,
  taskId: string
): Promise<DeletePlantTaskResponse> {
  const response = await fetch(`/api/plants/${plantId}/tasks/${taskId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete plant task: ${response.statusText}`);
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
