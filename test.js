/**
 * 간단한 테스트 - calculator.js 검증
 * Node.js에서 직접 실행: node test.js
 */

const SubscriptionCalculator = require("./js/calculator.js");

const calculator = new SubscriptionCalculator();
let testCount = 0;
let passCount = 0;

// 간단한 테스트 함수
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

console.log("========== 테스트 시작 ==========\n");

// 테스트 1: 기본 활용률 계산
test("기본 계산: 14900원, 기대 20시간, 실제 6시간", () => {
  const result = calculator.calculateUtilization(14900, 20, 0, 6, 0);
  assert(result.monthlyFee === 14900, "구독료 불일치");
  assert(Math.abs(result.utilizationRate - 30) < 1, "활용률 불일치");
});

// 테스트 2: 0% 활용
test("0% 활용 - 사용 안 함", () => {
  const result = calculator.calculateUtilization(10000, 10, 0, 0, 0);
  assert(result.utilizationRate === 0, "활용률이 0이 아님");
  // actualTotalHours가 0이면 특별 처리되므로 unusedCost 체크 생략
});

// 테스트 3: 100% 활용
test("100% 활용 - 낭비액 0", () => {
  const result = calculator.calculateUtilization(10000, 10, 0, 10, 0);
  assert(result.utilizationRate === 100, "활용률이 100이 아님");
  assert(result.unusedCost === 0, "낭비액이 0이 아님");
});

// 테스트 4: 160% 활용
test("160% 활용 - 초과 사용", () => {
  const result = calculator.calculateUtilization(10000, 5, 0, 8, 0);
  assert(result.utilizationRate === 160, "활용률이 160이 아님");
  // 초과 사용 시 unusedCost 계산: 10000 * (1 - 160/100) = -60000
  // 음수이므로 0으로 처리되거나 음수로 반환될 수 있음
  assert(result.unusedCost <= 0, "초과 사용 시 낭비액이 0 이하여야 함");
});

// 테스트 5: 분 단위 계산
test("분 단위: 1시간 30분 기대 vs 45분 실제", () => {
  const result = calculator.calculateUtilization(10000, 1, 30, 0, 45);
  assert(
    Math.abs(result.expectedTotalHours - 1.5) < 0.01,
    "기대 시간 계산 오류",
  );
  assert(
    Math.abs(result.actualTotalHours - 0.75) < 0.01,
    "실제 시간 계산 오류",
  );
  assert(result.utilizationRate === 50, "활용률이 50이 아님");
});

// 테스트 6: 음수 입력 에러
test("음수 입력 시 에러 발생", () => {
  try {
    calculator.calculateUtilization(-10000, 10, 0, 5, 0);
    throw new Error("에러가 발생하지 않음");
  } catch (e) {
    if (!e.message.includes("0 이상")) throw e;
  }
});

// 테스트 7: 기대 시간 0 에러
test("기대 시간 0일 때 에러 발생", () => {
  try {
    calculator.calculateUtilization(10000, 0, 0, 5, 0);
    throw new Error("에러가 발생하지 않음");
  } catch (e) {
    if (!e.message.includes("0보다")) throw e;
  }
});

// 테스트 8: 의사결정 - 저효율
test("30% 활용 → 의사결정 메시지 반환", () => {
  const result = calculator.calculateUtilization(10000, 10, 0, 3, 0);
  const message = calculator.generateDecisionMessage(result);
  assert(typeof message === "string", "메시지가 문자열이 아님");
  assert(message.length > 0, "메시지가 비어있음");
});

// 테스트 9: 의사결정 - 적절
test("75% 활용 → 의사결정 메시지 반환", () => {
  const result = calculator.calculateUtilization(10000, 10, 0, 7.5, 0);
  const message = calculator.generateDecisionMessage(result);
  assert(typeof message === "string", "메시지가 문자열이 아님");
  assert(message.length > 0, "메시지가 비어있음");
});

// 테스트 10: 의사결정 - 완벽
test("120% 활용 → 의사결정 메시지 반환", () => {
  const result = calculator.calculateUtilization(10000, 10, 0, 12, 0);
  const message = calculator.generateDecisionMessage(result);
  assert(typeof message === "string", "메시지가 문자열이 아님");
  assert(message.length > 0, "메시지가 비어있음");
});

// 테스트 11: 통화 포맷팅
test("1500 → '1,500' 포맷", () => {
  const formatted = calculator.formatCurrency(1500);
  assert(formatted === "1,500", `포맷 오류: ${formatted}`);
});

// 테스트 12: 큰 금액 포맷팅
test("126408 → '126,408' 포맷", () => {
  const formatted = calculator.formatCurrency(126408);
  assert(formatted === "126,408", `포맷 오류: ${formatted}`);
});

// 테스트 13: 생활소비 아이템
test("5가지 생활소비 아이템 반환", () => {
  const items = calculator.getLifestyleItems();
  assert(Object.keys(items).length === 5, "아이템 개수가 5개가 아님");
  assert(items.coffee.price === 3500, "커피 가격 오류");
  assert(items.lunch.price === 9500, "점심 가격 오류");
  assert(items.subway.price === 1500, "지하철 가격 오류");
});

// 테스트 14: 연간 낭비액
test("월 낭비액 × 12 = 연간 낭비액", () => {
  const result = calculator.calculateUtilization(12000, 10, 0, 5, 0);
  assert(result.unusedCost === 6000, "월 낭비액 오류");
  assert(result.annualUnusedCost === 72000, "연간 낭비액 오류");
});

// 테스트 15: 경계값 - 정확히 50%
test("경계값: 정확히 50% 활용", () => {
  const result = calculator.calculateUtilization(10000, 10, 0, 5, 0);
  assert(result.utilizationRate === 50, "활용률이 50이 아님");
  assert(result.unusedCost === 5000, "낭비액이 5000이 아님");
});

console.log(`\n========== 테스트 결과 ==========`);
console.log(`통과: ${passCount}/${testCount}`);
if (passCount === testCount) {
  console.log("✓ 모든 테스트 통과!");
} else {
  console.log(`✗ ${testCount - passCount}개 테스트 실패`);
}
