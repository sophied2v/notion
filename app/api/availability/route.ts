import { NextRequest, NextResponse } from "next/server";
import { getBookedTimes } from "@/lib/notion";

/**
 * 영업 시간 설정 (상수)
 */
const BUSINESS_HOURS = {
  start: 10, // 10시
  end: 20, // 20시
  interval: 60, // 1시간 단위 (분)
};

/**
 * GET /api/availability?date=YYYY-MM-DD
 * 특정 날짜의 예약 가능한 시간 목록 반환
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "date 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    // 날짜 형식 검증 (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        {
          error:
            "날짜 형식이 올바르지 않습니다. YYYY-MM-DD 형식을 사용해주세요.",
        },
        { status: 400 }
      );
    }

    // 예약된 시간 목록 조회
    const bookedTimes = await getBookedTimes(date);

    // 전체 영업 시간 슬롯 생성
    const allTimeSlots: string[] = [];
    for (let hour = BUSINESS_HOURS.start; hour < BUSINESS_HOURS.end; hour++) {
      const timeString = `${hour.toString().padStart(2, "0")}:00`;
      allTimeSlots.push(timeString);
    }

    // 예약 가능한 시간 계산
    const availableTimes = allTimeSlots.filter(
      (time) => !bookedTimes.includes(time)
    );

    return NextResponse.json({
      date,
      bookedTimes,
      availableTimes,
      businessHours: {
        start: `${BUSINESS_HOURS.start.toString().padStart(2, "0")}:00`,
        end: `${BUSINESS_HOURS.end.toString().padStart(2, "0")}:00`,
      },
    });
  } catch (error) {
    console.error("예약 가능 시간 조회 오류:", error);
    return NextResponse.json(
      { error: "예약 가능 시간을 조회하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}





