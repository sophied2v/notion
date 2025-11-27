import { Client } from "@notionhq/client";
import { format, parseISO } from "date-fns";
import type {
  PageObjectResponse,
  PartialPageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

/**
 * Notion API 클라이언트 초기화
 */
function getNotionClient() {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) {
    throw new Error("NOTION_API_KEY 환경 변수가 설정되지 않았습니다.");
  }
  return new Client({ auth: apiKey });
}

export const notion = getNotionClient();

/**
 * Notion Database ID 가져오기
 */
function getDatabaseId() {
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!databaseId) {
    throw new Error("NOTION_DATABASE_ID 환경 변수가 설정되지 않았습니다.");
  }
  return databaseId;
}

/**
 * 특정 날짜의 예약된 시간 목록 조회
 */
export async function getBookedTimes(date: string): Promise<string[]> {
  try {
    const databaseId = getDatabaseId();
    const startOfDay = new Date(`${date}T00:00:00+09:00`);
    const endOfDay = new Date(`${date}T23:59:59+09:00`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (notion.databases as any).query({
      database_id: databaseId,
      filter: {
        and: [
          {
            property: "예약일시",
            date: {
              on_or_after: startOfDay.toISOString(),
            },
          },
          {
            property: "예약일시",
            date: {
              on_or_before: endOfDay.toISOString(),
            },
          },
          {
            property: "선택",
            select: {
              does_not_equal: "취소",
            },
          },
        ],
      },
    });

    const bookedTimes = response.results
      .map((page: PageObjectResponse | PartialPageObjectResponse) => {
        if ("properties" in page) {
          const dateProperty = page.properties["예약일시"];
          if (
            dateProperty &&
            "date" in dateProperty &&
            dateProperty.date?.start
          ) {
            const dateTime = parseISO(dateProperty.date.start);
            return format(dateTime, "HH:mm");
          }
        }
        return null;
      })
      .filter((time: string | null): time is string => time !== null);

    return bookedTimes;
  } catch (error) {
    console.error("예약 시간 조회 중 오류:", error);
    throw error;
  }
}

/**
 * 특정 날짜와 시간에 예약이 이미 있는지 확인
 */
export async function isTimeSlotBooked(
  date: string,
  time: string
): Promise<boolean> {
  try {
    const databaseId = getDatabaseId();
    const dateTime = new Date(`${date}T${time}:00+09:00`);
    const startTime = new Date(dateTime);
    startTime.setMinutes(0);
    startTime.setSeconds(0);
    startTime.setMilliseconds(0);

    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (notion.databases as any).query({
      database_id: databaseId,
      filter: {
        and: [
          {
            property: "예약일시",
            date: {
              on_or_after: startTime.toISOString(),
            },
          },
          {
            property: "예약일시",
            date: {
              before: endTime.toISOString(),
            },
          },
          {
            property: "선택",
            select: {
              does_not_equal: "취소",
            },
          },
        ],
      },
    });

    return response.results.length > 0;
  } catch (error) {
    console.error("예약 확인 중 오류:", error);
    throw error;
  }
}

/**
 * 새로운 예약 생성
 */
export async function createReservation(data: {
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  note?: string;
  password?: string;
}): Promise<string> {
  try {
    const databaseId = getDatabaseId();
    const dateTime = new Date(`${data.date}T${data.time}:00+09:00`);

    const response = await notion.pages.create({
      parent: {
        database_id: databaseId,
      },
      properties: {
        예약자명: {
          title: [
            {
              text: {
                content: data.name,
              },
            },
          ],
        },
        예약일시: {
          date: {
            start: dateTime.toISOString(),
          },
        },
        연락처: {
          phone_number: data.phone,
        },
        인원수: {
          number: data.guests,
        },
        선택: {
          select: {
            name: "신청대기",
          },
        },
        요청사항: {
          rich_text: data.note
            ? [
                {
                  text: {
                    content: data.note,
                  },
                },
              ]
            : [],
        },
        비밀번호: {
          rich_text: data.password
            ? [
                {
                  text: {
                    content: data.password,
                  },
                },
              ]
            : [],
        },
      },
    });

    return response.id;
  } catch (error) {
    console.error("예약 생성 중 오류:", error);
    throw error;
  }
}





