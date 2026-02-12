/**
 * SubscriptionCalculator 테스트 (구 버전 레거시 호환성)
 * 기본 계산, 엣지 케이스, 포맷팅 검증
 * Node.js에서 실행: node test/test-calculator.js
 */

const SubscriptionCalculator = require("../js/calculator.js");

const calculator = new SubscriptionCalculator();
let testCount = 0;
let passCount = 0;

function test(name, fn) {
  testCount++;
  try {
    fn();
    console.log(`✓ ${name}`);
    passCount++;
  } catch (e) {
    console.log(`✗ ${name}`);
    console.log(`  → ${e.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

console.log("========== SubscriptionCalculator 테스트 ==========\n");

// ===== 기본 계산 =====
console.log("📊 기본 계산");

test("정상: 14900원, 기대 20시간, 실제 6시간 → 30% 활용률", () => {
  const result = calculator.calculateUtilization(14900, 20, 0, 6, 0);
  assert(result.monthlyFee === 14900, "구독료 불일치");
  assert(Math.abs(result.utilizationRate - 30) < 1, "활용률 불일치");
  assert(result.costPerHour > 0, "시간당 비용 오류");
});

test("분 단위 입력: 시간과 분 모두 입력", () => {
  const result = calculator.calculateUtilization(10000, 10, 30, 5, 15);
  assert(result.expectedTotalHours > 10, "기대시간 계산 오류");
  assert(result.actualTotalHours > 5, "실제시간 계산 오류");
});

test("높은 활용률: 기대보다 많이 사용", () => {
  const result = calculator.calculateUtilization(10000, 5, 0, 8, 0);
  assert(result.utilizationRate > 100, "활용률 160% 미만");
  assert(Math.abs(result.utilizationRate - 160) < 1, "활용률 160% 아님");
});

// ===== 엣지 케이스: 경계값 =====
console.log("\n🔧 엣지 케이스: 경계값");

test("0% 활용: 전혀 사용 안 함", () => {
  const result = calculator.calculateUtilization(10000, 10, 0, 0, 0);
  assert(result.utilizationRate === 0, "활용률이 0이 아님");
  assert(result.unusedCost === 10000, "미활용비용 계산 오류");
});

test("100% 활용: 정확히 기대량만 사용", () => {
  const result = calculator.calculateUtilization(10000, 10, 0, 10, 0);
  assert(result.utilizationRate === 100, "활용률이 100이 아님");
  assert(result.unusedCost === 0, "미활용비용이 0이 아님");
});

test("1원 구독료: 최소값 테스트", () => {
  const result = calculator.calculateUtilization(1, 10, 0, 5, 0);
  assert(result.monthlyFee === 1, "구독료 불일치");
  assert(result.costPerHour > 0, "시간당 비용 계산 오류");
});

// ===== 엣지 케이스: 큰 숫자 =====
console.log("\n🔧 엣지 케이스: 큰 숫자");

test("매우 높은 구독료: 999,999원", () => {
  const result = calculator.calculateUtilization(999999, 100, 0, 30, 0);
  assert(result.monthlyFee === 999999, "구독료 불일치");
  assert(result.utilizationRate > 0, "활용률 계산 오류");
});

test("매우 많은 시간: 999시간", () => {
  const result = calculator.calculateUtilization(10000, 10, 0, 999, 0);
  assert(result.actualTotalHours === 999, "실제시간 불일치");
  assert(result.utilizationRate > 100, "초과 활용률 오류");
});

test("분 단위 큰 값: 5999분 입력", () => {
  const result = calculator.calculateUtilization(10000, 10, 0, 0, 5999);
  assert(
    result.actualTotalHours === Math.floor(5999 / 60) + (5999 % 60) / 60,
    "분 변환 오류",
  );
});

// ===== 엣지 케이스: 에러 =====
console.log("\n🔧 엣지 케이스: 에러 처리");

test("입력 에러: 음수 구독료", () => {
  try {
    calculator.calculateUtilization(-10000, 10, 0, 5, 0);
    throw new Error("에러가 발생하지 않음");
  } catch (e) {
    if (!e.message.includes("0 이상")) throw e;
  }
});

test("입력 에러: 음수 시간", () => {
  try {
    calculator.calculateUtilization(10000, -10, 0, 5, 0);
    throw new Error("에러가 발생하지 않음");
  } catch (e) {
    if (!e.message.includes("0 이상")) throw e;
  }
});

test("입력 에러: 기대 시간이 0", () => {
  try {
    calculator.calculateUtilization(10000, 0, 0, 5, 0);
    throw new Error("에러가 발생하지 않음");
  } catch (e) {
    if (!e.message.includes("0보다 커야")) throw e;
  }
});

// ===== 포맷팅 =====
console.log("\n💰 포맷팅");

test("통화 포맷: 1500 → '1,500'", () => {
  const formatted = calculator.formatCurrency(1500);
  assert(formatted === "1,500", "포맷 불일치");
});

test("통화 포맷: 1000000 → '1,000,000'", () => {
  const formatted = calculator.formatCurrency(1000000);
  assert(formatted === "1,000,000", "포맷 불일치");
});

test("통화 포맷: 0 → '0'", () => {
  const formatted = calculator.formatCurrency(0);
  assert(formatted === "0", "포맷 불일치");
});

// ===== 메시지 생성 =====
console.log("\n📝 메시지 생성");

test("의사결정 메시지: 30% 활용 → 저효율", () => {
  const result = calculator.calculateUtilization(10000, 10, 0, 3, 0);
  const message = calculator.generateDecisionMessage(result);
  assert(typeof message === "string", "메시지가 문자열이 아님");
  assert(message.length > 0, "메시지가 비어있음");
  assert(message.includes("30"), "활용률 수치 포함 필요");
});

test("의사결정 메시지: 100% 활용 → 기대 달성", () => {
  const result = calculator.calculateUtilization(10000, 10, 0, 10, 0);
  const message = calculator.generateDecisionMessage(result);
  assert(message.includes("✅") || message.includes("충족"), "성공 표시 필요");
});

test("의사결정 메시지: 150% 활용 → 초과 달성", () => {
  const result = calculator.calculateUtilization(10000, 10, 0, 15, 0);
  const message = calculator.generateDecisionMessage(result);
  assert(message.includes("150"), "활용률 수치 포함 필요");
});

test("미활용 비용 메시지: 생성 가능", () => {
  const result = calculator.calculateUtilization(10000, 10, 0, 3, 0);
  const message = calculator.generateUnusedCostMessage(result);
  assert(typeof message === "string", "메시지가 문자열이 아님");
  assert(message.length > 0, "메시지가 비어있음");
});

// ===== 생활소비 환산 =====
console.log("\n☕ 생활소비 환산");

test("커피 환산: 미활용비용이 있을 때", () => {
  const items = calculator.getLifestyleItems();
  assert(items.coffee !== undefined, "커피 항목 없음");
  assert(items.coffee.price === 3500, "커피 가격 오류");
});

test("생활소비 환산 메시지: 정상 생성", () => {
  const result = calculator.calculateUtilization(14900, 20, 0, 6, 0);
  const message = calculator.generateLifestyleEquivalenceMessage(
    result,
    "coffee",
  );
  assert(typeof message === "string", "메시지가 문자열이 아님");
  assert(message.length > 0, "메시지가 비어있음");
});

test("생활소비 환산: 모든 항목 검증", () => {
  const items = calculator.getLifestyleItems();
  assert(items.coffee !== undefined, "커피 없음");
  assert(items.lunch !== undefined, "점심 없음");
  assert(items.subway !== undefined, "지하철 없음");
  assert(items.movie !== undefined, "영화 없음");
  assert(items.chicken !== undefined, "치킨 없음");
});

// ===== 소수점 정확도 =====
console.log("\n🔢 소수점 정확도");

test("소수점 반올림: 시간당 비용", () => {
  const result = calculator.calculateUtilization(10000, 10, 0, 3, 0);
  const costPerHour = result.costPerHour;
  assert(Number.isFinite(costPerHour), "시간당 비용이 유효한 숫자 아님");
  assert(costPerHour > 0, "시간당 비용이 양수가 아님");
});

test("미활용 비용 정확도: 소수점 반올림", () => {
  const result = calculator.calculateUtilization(15000, 10, 0, 4, 45);
  assert(Number.isFinite(result.unusedCost), "미활용비용이 유효한 숫자 아님");
  assert(result.unusedCost >= 0, "미활용비용이 음수");
});

// ===== 테스트 결과 =====
console.log(`\n========== 테스트 결과 ==========`);
console.log(`통과: ${passCount}/${testCount}`);
if (passCount === testCount) {
  console.log("✅ 모든 테스트 통과!");
  process.exit(0);
} else {
  console.log(`❌ ${testCount - passCount}개 테스트 실패`);
  process.exit(1);
}
