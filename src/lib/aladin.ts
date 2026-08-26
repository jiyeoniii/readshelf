import "server-only";

/** 알라딘 응답에서 우리가 읽는 필드만 */
export interface AladinItem {
  title?: string;
  author?: string;
  publisher?: string;
  cover?: string;
  isbn13?: string;
  isbn?: string;
  subInfo?: { itemPage?: number };
}

type AladinResult =
  | { items: AladinItem[] }
  | { error: string; status: number };

/**
 * 알라딘은 output=js로도 뒤에 세미콜론이 붙거나 제어문자가 섞여 오는 경우가 있어
 * 텍스트로 받아 정리한 뒤 파싱한다.
 */
function parseAladin(text: string): {
  item?: AladinItem[];
  errorMessage?: string;
} {
  const cleaned = text
    .trim()
    .replace(/;\s*$/, "")
    // 문자열 안에 그대로 들어온 제어문자는 JSON.parse가 거부한다
    .replace(/[\u0000-\u001F]/g, " ");
  return JSON.parse(cleaned);
}

/**
 * 알라딘 OpenAPI 호출 공통부.
 * 호출 한도가 1일 5,000회라 같은 요청은 하루 동안 재사용한다.
 */
export async function aladinFetch(
  path: "ItemSearch.aspx" | "ItemLookUp.aspx",
  params: Record<string, string>,
): Promise<AladinResult> {
  const key = process.env.ALADIN_TTB_KEY;
  if (!key) {
    return {
      error:
        "ALADIN_TTB_KEY가 설정되지 않았습니다. .env.local 또는 Vercel 환경 변수에 추가해주세요.",
      status: 500,
    };
  }

  const endpoint = new URL(`https://www.aladin.co.kr/ttb/api/${path}`);
  endpoint.searchParams.set("ttbkey", key);
  endpoint.searchParams.set("output", "js");
  endpoint.searchParams.set("Version", "20131101");
  for (const [k, v] of Object.entries(params)) {
    endpoint.searchParams.set(k, v);
  }

  try {
    const res = await fetch(endpoint, { next: { revalidate: 86400 } });

    if (!res.ok) {
      return {
        error: `알라딘 서버가 응답하지 않았어요. (${res.status})`,
        status: 502,
      };
    }

    const parsed = parseAladin(await res.text());

    if (parsed.errorMessage) {
      // 키가 틀렸거나 URL 등록이 안 된 경우 여기로 온다
      return { error: `알라딘: ${parsed.errorMessage}`, status: 502 };
    }

    return { items: parsed.item ?? [] };
  } catch (error) {
    console.error(`[aladin] ${path} 실패`, error);
    return {
      error: "책 정보를 가져오지 못했어요. 잠시 후 다시 시도해주세요.",
      status: 502,
    };
  }
}
