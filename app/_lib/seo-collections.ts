import type { Part } from "./types";

export type SeoLocale = "en" | "ko";
export type CollectionKind = "brand" | "category";

type LocalizedText = Record<SeoLocale, string>;

export interface SeoCollection {
  kind: CollectionKind;
  slug: string;
  title: LocalizedText;
  metaDescription: LocalizedText;
  intro: Record<SeoLocale, string[]>;
  faq: Record<SeoLocale, Array<{ question: string; answer: string }>>;
  matches: (part: Part) => boolean;
  catalogHref: string;
}

const brandFaq = (brand: string): SeoCollection["faq"] => ({
  en: [
    {
      question: `How do I identify the correct ${brand} part?`,
      answer:
        "Use the complete part number from the unit label. Include revision, suffix, controller, and robot model when available so compatibility can be checked before quoting.",
    },
    {
      question: `Are ${brand} parts tested before shipment?`,
      answer:
        "Testing status is confirmed for the exact unit during the quotation process. Available checks depend on the component type and the test equipment required.",
    },
    {
      question: `Can nodibot source a ${brand} part that is not listed?`,
      answer:
        "Yes. Send the exact part number through the RFQ or WhatsApp channel. The sourcing desk can check secondary-market availability beyond the published catalog.",
    },
  ],
  ko: [
    {
      question: `정확한 ${brand} 부품은 어떻게 식별하나요?`,
      answer:
        "제품 라벨의 전체 부품 번호를 사용하세요. 가능하면 리비전, 접미사, 컨트롤러와 로봇 모델을 함께 보내 주시면 견적 전에 호환성을 확인할 수 있습니다.",
    },
    {
      question: `${brand} 부품은 출고 전에 테스트하나요?`,
      answer:
        "견적 과정에서 해당 유닛의 테스트 상태를 확인합니다. 가능한 검사는 부품 유형과 필요한 테스트 장비에 따라 달라집니다.",
    },
    {
      question: `카탈로그에 없는 ${brand} 부품도 소싱할 수 있나요?`,
      answer:
        "가능합니다. RFQ 또는 WhatsApp으로 정확한 부품 번호를 보내 주세요. 공개 카탈로그 외의 세컨더리 마켓 재고도 확인합니다.",
    },
  ],
});

function brandCollection(
  slug: string,
  hostId: string,
  brand: string,
  systems: string,
): SeoCollection {
  return {
    kind: "brand",
    slug,
    title: {
      en: `${brand} automation parts`,
      ko: `${brand} 자동화 부품`,
    },
    metaDescription: {
      en: `Search ${brand} industrial automation parts for ${systems}. Check part numbers, compatibility, testing status, availability, and request a sourcing quote.`,
      ko: `${systems}용 ${brand} 산업 자동화 부품을 검색하고 부품 번호, 호환성, 테스트 상태와 재고를 확인해 견적을 요청하세요.`,
    },
    intro: {
      en: [
        `Find ${brand} industrial automation parts by exact part number for systems including ${systems}. This page groups matching controllers, drives, operator interfaces, robot components, and supporting modules from the nodibot catalog so maintenance teams can move from identification to a checked sourcing request without searching unrelated inventory.`,
        `Legacy automation hardware often has similar model names, revisions, and connector variants. Confirm the complete label, suffix, controller generation, and machine or robot model before ordering. Each product page exposes the available compatibility and lifecycle data; the sourcing team verifies the exact unit, testing status, lead time, and warranty terms during the quotation process.`,
        `Published inventory is only part of the available secondary market. If the required ${brand} part is not shown, send its part number and a label photo through the bulk RFQ or WhatsApp channel. Line-down requests can be flagged for urgent review, and approved orders can be arranged for international delivery.`,
      ],
      ko: [
        `${systems}를 포함한 시스템용 ${brand} 산업 자동화 부품을 정확한 부품 번호로 찾아보세요. 컨트롤러, 드라이브, 조작 패널, 로봇 구성품과 관련 모듈을 한곳에 모아 유지보수 담당자가 불필요한 재고를 검색하지 않고 소싱 요청으로 이동할 수 있습니다.`,
        `레거시 자동화 부품은 비슷한 모델명, 리비전과 커넥터 변형이 많습니다. 주문 전에 전체 라벨, 접미사, 컨트롤러 세대와 장비 또는 로봇 모델을 확인하세요. 제품 페이지의 호환성·수명주기 데이터를 바탕으로 견적 단계에서 실제 유닛, 테스트 상태, 리드타임과 보증 조건을 확인합니다.`,
        `공개 재고는 세컨더리 마켓의 일부입니다. 필요한 ${brand} 부품이 보이지 않으면 부품 번호와 라벨 사진을 RFQ 또는 WhatsApp으로 보내 주세요. 라인 다운 요청은 긴급 검토할 수 있으며 승인된 주문은 해외 배송을 준비합니다.`,
      ],
    },
    faq: brandFaq(brand),
    matches: (part) => part.hosts.includes(hostId),
    catalogHref: `/catalog?host=${encodeURIComponent(hostId)}`,
  };
}

export const BRAND_COLLECTIONS: SeoCollection[] = [
  brandCollection("fanuc", "fanuc", "FANUC", "R-J3, R-30iA and R-30iB"),
  brandCollection("abb", "abb", "ABB", "S4C+, IRC5 and OmniCore"),
  brandCollection("siemens", "siemens", "Siemens", "S7-300, S7-1500 and SINAMICS"),
  brandCollection("yaskawa", "yaskawa", "Yaskawa / Motoman", "NX100, DX100, DX200 and YRC1000"),
  brandCollection("allen-bradley", "ab", "Allen-Bradley", "ControlLogix, CompactLogix and PanelView"),
  brandCollection("kuka", "kuka", "KUKA", "KRC2 and KRC4"),
  brandCollection("mitsubishi", "mitsubishi", "Mitsubishi", "CR, FR and MELFA"),
];

const pendantPattern = /pendant|teach|teaching/i;

export const CATEGORY_COLLECTIONS: SeoCollection[] = [
  {
    kind: "category",
    slug: "servo-drives",
    title: { en: "Industrial servo drives and amplifiers", ko: "산업용 서보 드라이브 및 앰프" },
    metaDescription: {
      en: "Search industrial servo drives, servo amplifiers, inverters, and motion-control parts by exact part number. Request testing, compatibility, and availability checks.",
      ko: "산업용 서보 드라이브, 서보 앰프, 인버터와 모션 제어 부품을 정확한 부품 번호로 검색하고 테스트·호환성·재고 확인을 요청하세요.",
    },
    intro: {
      en: [
        "Search industrial servo drives, servo amplifiers, inverters, and motion-control hardware by the exact number printed on the unit. These components connect closely to motor ratings, controller generations, feedback devices, firmware, and machine configuration, so a visually similar drive is not automatically a safe substitute.",
        "Use the product data to compare manufacturer, series, lifecycle, condition, compatible controllers, and currently known availability. Before a quotation is approved, provide the complete model and suffix plus a photo of the label when possible. The sourcing desk can then check the offered unit, testing status, lead time, and any known replacement or cross-compatibility constraints.",
        "The listed products cover current stock and commonly requested secondary-market models. If a discontinued drive is not published, submit its part number and equipment context through the RFQ channel. This is especially important for line-down replacements where an incorrect revision can extend downtime.",
      ],
      ko: [
        "유닛에 표시된 정확한 번호로 산업용 서보 드라이브, 서보 앰프, 인버터와 모션 제어 하드웨어를 검색하세요. 이 부품은 모터 정격, 컨트롤러 세대, 피드백 장치, 펌웨어와 장비 설정에 밀접하게 연결되므로 외형이 비슷하다고 안전한 대체품은 아닙니다.",
        "제품 데이터에서 제조사, 시리즈, 수명주기, 상태, 호환 컨트롤러와 확인된 재고를 비교할 수 있습니다. 견적 승인 전에 전체 모델과 접미사, 가능한 경우 라벨 사진을 제공해 주세요. 제안 유닛, 테스트 상태, 리드타임과 대체 호환성 제약을 확인합니다.",
        "게시된 제품은 현재 재고와 자주 요청되는 세컨더리 마켓 모델을 포함합니다. 단종 드라이브가 보이지 않으면 부품 번호와 장비 정보를 RFQ로 보내 주세요.",
      ],
    },
    faq: brandFaq("servo drive"),
    matches: (part) => part.cat === "motion",
    catalogHref: "/catalog?cat=motion",
  },
  {
    kind: "category",
    slug: "plcs",
    title: { en: "Industrial PLCs and controller modules", ko: "산업용 PLC 및 컨트롤러 모듈" },
    metaDescription: {
      en: "Search PLC CPUs, controller cards, communication modules, and industrial computing parts from major automation platforms by exact part number.",
      ko: "주요 자동화 플랫폼의 PLC CPU, 컨트롤러 카드, 통신 모듈과 산업용 컴퓨팅 부품을 정확한 부품 번호로 검색하세요.",
    },
    intro: {
      en: [
        "Find industrial PLC CPUs, controller cards, communication modules, power supplies, and automation computing hardware by exact part number. Controller families can share a physical format while differing in memory, firmware, communication protocol, safety approval, or rack compatibility, making the full manufacturer code essential.",
        "Product pages collect the available manufacturer, series, category, lifecycle, condition, and compatibility details. Match the existing module label and note the rack, controller generation, firmware requirement, and connected network before requesting a replacement. The quotation process confirms the offered unit, current availability, testing status, lead time, and warranty terms.",
        "Use this collection for planned spares as well as urgent failed-controller replacement. If the needed PLC or processor is not listed, send a BOM or exact part number to the sourcing desk. Secondary-market availability changes frequently, so unlisted and discontinued modules can still be checked through the supplier network.",
      ],
      ko: [
        "정확한 부품 번호로 산업용 PLC CPU, 컨트롤러 카드, 통신 모듈, 전원 공급 장치와 자동화 컴퓨팅 하드웨어를 찾으세요. 같은 외형의 컨트롤러도 메모리, 펌웨어, 통신 프로토콜, 안전 인증 또는 랙 호환성이 다를 수 있어 전체 제조사 코드가 중요합니다.",
        "제품 페이지에서 제조사, 시리즈, 카테고리, 수명주기, 상태와 호환성 정보를 확인할 수 있습니다. 교체 요청 전에 기존 모듈 라벨과 랙, 컨트롤러 세대, 펌웨어 요구 사항, 연결 네트워크를 확인하세요.",
        "계획 예비품과 긴급 컨트롤러 교체 모두에 사용할 수 있습니다. 필요한 PLC가 없으면 BOM 또는 정확한 부품 번호를 소싱 데스크에 보내 주세요.",
      ],
    },
    faq: brandFaq("PLC"),
    matches: (part) => part.cat === "controllers",
    catalogHref: "/catalog?cat=controllers",
  },
  {
    kind: "category",
    slug: "hmi-panels",
    title: { en: "Industrial HMIs and operator panels", ko: "산업용 HMI 및 오퍼레이터 패널" },
    metaDescription: {
      en: "Search industrial HMIs, touchscreens, displays, and operator panels by exact part number for legacy and current automation systems.",
      ko: "레거시 및 현행 자동화 시스템용 산업 HMI, 터치스크린, 디스플레이와 오퍼레이터 패널을 정확한 부품 번호로 검색하세요.",
    },
    intro: {
      en: [
        "Search industrial HMIs, touchscreens, displays, and operator panels by the complete manufacturer part number. Screen size alone does not determine compatibility: communication ports, firmware, application storage, resolution, bezel dimensions, and controller support can differ between otherwise similar panels.",
        "Review the available series, equipment type, lifecycle, condition, lead time, and compatibility details before requesting a quote. Include a label photo and the machine or controller model when possible. The sourcing review confirms the exact offered unit and whether testing, configuration transfer, or additional compatibility checks are required.",
        "This collection covers commonly requested secondary-market interfaces used on production equipment and automation cells. If the panel is obsolete, damaged beyond identification, or missing from the catalog, send the visible codes and equipment context to the sourcing desk for a broader availability check.",
      ],
      ko: [
        "전체 제조사 부품 번호로 산업용 HMI, 터치스크린, 디스플레이와 오퍼레이터 패널을 검색하세요. 화면 크기만으로 호환성을 판단할 수 없으며 통신 포트, 펌웨어, 애플리케이션 저장 장치, 해상도, 베젤 치수와 컨트롤러 지원이 다를 수 있습니다.",
        "견적 전에 시리즈, 장비 유형, 수명주기, 상태, 리드타임과 호환성 정보를 확인하세요. 가능하면 라벨 사진과 장비 또는 컨트롤러 모델을 함께 보내 주세요.",
        "카탈로그에 없거나 식별이 어려운 패널은 보이는 코드와 장비 정보를 소싱 데스크로 보내 더 넓은 재고 확인을 요청할 수 있습니다.",
      ],
    },
    faq: brandFaq("HMI"),
    matches: (part) =>
      part.cat === "hmi" &&
      !pendantPattern.test(`${part.name} ${part.equipmentType ?? ""} ${part.categoryL2 ?? ""}`),
    catalogHref: "/catalog?cat=hmi",
  },
  {
    kind: "category",
    slug: "robot-pendants",
    title: { en: "Industrial robot teach pendants", ko: "산업용 로봇 티치 펜던트" },
    metaDescription: {
      en: "Search robot teach pendants and programming panels for FANUC, ABB, Yaskawa, KUKA, and Mitsubishi systems by exact part number.",
      ko: "FANUC, ABB, Yaskawa, KUKA, Mitsubishi 시스템용 로봇 티치 펜던트와 프로그래밍 패널을 정확한 부품 번호로 검색하세요.",
    },
    intro: {
      en: [
        "Find industrial robot teach pendants and programming panels by exact part number for major robot controller families. Pendants that look alike may use different emergency-stop circuits, key switches, connectors, cables, firmware, or controller generations. Match the full label and controller model rather than relying on appearance.",
        "Each listing shows the available manufacturer, lifecycle, condition, series, and compatibility data. When requesting a quote, include the controller generation, robot model, connector or cable details, and a label photo. The sourcing team confirms the exact unit, testing status, lead time, and warranty terms before shipment.",
        "Published inventory focuses on commonly requested replacement pendants and operator interfaces. For an unlisted or damaged unit, send every readable code and photos of both the front and rear labels. The sourcing desk can check repairable, refurbished, and secondary-market supply options based on the urgency and required condition.",
      ],
      ko: [
        "주요 로봇 컨트롤러 제품군의 산업용 로봇 티치 펜던트와 프로그래밍 패널을 정확한 부품 번호로 찾으세요. 외형이 비슷해도 비상 정지 회로, 키 스위치, 커넥터, 케이블, 펌웨어 또는 컨트롤러 세대가 다를 수 있습니다.",
        "견적 요청 시 컨트롤러 세대, 로봇 모델, 커넥터 또는 케이블 정보와 라벨 사진을 포함해 주세요. 출고 전에 정확한 유닛, 테스트 상태, 리드타임과 보증 조건을 확인합니다.",
        "게시되지 않았거나 손상된 유닛은 읽을 수 있는 모든 코드와 앞뒤 라벨 사진을 보내 주세요. 긴급도와 필요한 상태에 따라 수리, 리퍼브 및 세컨더리 마켓 공급 옵션을 확인합니다.",
      ],
    },
    faq: brandFaq("robot teach pendant"),
    matches: (part) =>
      part.cat === "hmi" &&
      pendantPattern.test(`${part.name} ${part.equipmentType ?? ""} ${part.categoryL2 ?? ""}`),
    catalogHref: "/catalog?cat=hmi",
  },
];

export function getSeoCollection(kind: CollectionKind, slug: string): SeoCollection | undefined {
  const source = kind === "brand" ? BRAND_COLLECTIONS : CATEGORY_COLLECTIONS;
  return source.find((entry) => entry.slug === slug);
}

export function getSeoCollectionParts(collection: SeoCollection, parts: Part[]): Part[] {
  const matches = parts.filter(collection.matches);
  const selected =
    matches.length > 0 || collection.slug !== "robot-pendants"
      ? matches
      : parts.filter((part) => part.cat === "hmi");
  return [...selected].sort(
    (a, b) =>
      Number(b.stock === "in") - Number(a.stock === "in") ||
      b.views - a.views,
  );
}

export function getBrandCollectionForPart(part: Part): SeoCollection | undefined {
  return BRAND_COLLECTIONS.find((collection) => collection.matches(part));
}

export function getCategoryCollectionForPart(part: Part): SeoCollection | undefined {
  return CATEGORY_COLLECTIONS.find((collection) => collection.matches(part));
}
