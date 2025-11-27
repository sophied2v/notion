/**
 * 예약 관련 타입 정의
 */

export interface ReservationFormData {
  name: string;
  phone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  guests: number;
  note?: string;
  password?: string;
}

export interface AvailabilityResponse {
  date: string;
  bookedTimes: string[]; // ["10:00", "14:00", ...]
  availableTimes: string[]; // 예약 가능한 시간 목록
}

export interface ReservationResponse {
  success: boolean;
  message: string;
  reservationId?: string;
}

export type ReservationStatus = "신청대기" | "예약확정" | "취소" | "방문완료";

export interface NotionReservation {
  id: string;
  name: string;
  dateTime: string; // ISO 8601 형식
  phone: string;
  guests: number;
  status: ReservationStatus;
  note?: string;
  password?: string;
}
