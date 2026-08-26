import { NextResponse } from "next/server";
import { aladinFetch } from "@/lib/aladin";

export const runtime = "nodejs";

/**
 * ISBN으로 상세 정보를 가져온다.
 *
 * 총 페이지 수(subInfo.itemPage)는 검색 API(ItemSearch)가 주지 않고
 * 상세조회(ItemLookUp)에서만 오기 때문에, 사용자가 검색 결과를 고른 뒤
 * 그 한 권에 대해서만 추가로 호출한다. (일일 5,000회 제한을 아끼려는 목적도 있다)
 */
export async function GET(request: Request) {
  const isbn = new URL(request.url).searchParams.get("isbn")?.trim();
  if (!isbn) {
    return NextResponse.json({ error: "isbn이 필요합니다." }, { status: 400 });
  }

  const result = await aladinFetch("ItemLookUp.aspx", {
    itemIdType: isbn.length === 13 ? "ISBN13" : "ISBN",
    ItemId: isbn,
    // subInfo(쪽수 포함)를 받으려면 OptResult를 지정해야 한다
    OptResult: "packing",
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const item = result.items[0];
  return NextResponse.json({
    totalPages: item?.subInfo?.itemPage ?? null,
  });
}
