import { NextRequest, NextResponse } from "next/server";
import { isTimeSlotBooked, createReservation } from "@/lib/notion";
import { ReservationFormData } from "@/types/reservation";

/**
 * POST /api/reservation
 * 새로운 예약 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body: ReservationFormData = await request.json();

    // 필수 필드 검증
    const { name, phone, date, time, guests } = body;

    if (!name || !phone || !date || !time || !guests) {
      return NextResponse.json(
        { success: false, message: "필수 입력 항목이 누락되었습니다." },
        { status: 400 }
      );
    }

    // 날짜 형식 검증
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { success: false, message: "날짜 형식이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    // 시간 형식 검증
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(time)) {
      return NextResponse.json(
        { success: false, message: "시간 형식이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    // 전화번호 형식 검증
    const phoneRegex = /^[\d\s\-+()]+$/;
    if (!phoneRegex.test(phone) || phone.replace(/\D/g, "").length < 10) {
      return NextResponse.json(
        { success: false, message: "전화번호 형식이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    // 인원수 검증
    if (typeof guests !== "number" || guests < 1 || guests > 100) {
      return NextResponse.json(
        { success: false, message: "인원수는 1명 이상 100명 이하여야 합니다." },
        { status: 400 }
      );
    }

    // 중복 예약 방지
    const isBooked = await isTimeSlotBooked(date, time);
    if (isBooked) {
      return NextResponse.json(
        {
          success: false,
          message: "이미 예약된 시간입니다. 다른 시간을 선택해주세요.",
        },
        { status: 409 }
      );
    }

    // 예약 생성
    const reservationId = await createReservation({
      name,
      phone,
      date,
      time,
      guests,
      note: body.note,
      password: body.password,
    });

    return NextResponse.json({
      success: true,
      message: "예약 신청이 접수되었습니다. 관리자 확인 후 확정됩니다.",
      reservationId,
    });
  } catch (error) {
    console.error("예약 생성 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: "예약 신청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}





