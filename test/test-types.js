/**
 * 유형별 구독 분석기 테스트
 * ContentConsumptionAnalyzer, BenefitConsumptionAnalyzer, StorageBasedAnalyzer
 */

const ContentConsumptionAnalyzer = require("../js/ContentConsumptionAnalyzer.js");
const BenefitConsumptionAnalyzer = require("../js/BenefitConsumptionAnalyzer.js");
const StorageBasedAnalyzer = require("../js/StorageBasedAnalyzer.js");

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

console.log("========== 유형별 분석기 테스트 ==========\n");

// ===== 콘텐츠 소비형 =====
console.log("📺 콘텐츠 소비형 (ContentConsumptionAnalyzer)");

test("Netflix 분석: 14900원, 기대 20시간, 실제 6시간", () => {
  const analyzer = new ContentConsumptionAnalyzer(14900, 20, 6);
  const result = analyzer.getAnalysisResult();

  assert(result.monthlyFee === 14900, "구독료 불일치");
  assert(Math.abs(result.utilizationRate - 0.3) < 0.01, "활용률 불일치");
  assert(result.costPerHour > 0, "시간당 비용 계산 오류");
});

test("100% 활용: 활용률 100%, 낭비액 0", () => {
  const analyzer = new ContentConsumptionAnalyzer(10000, 10, 10);
  const result = analyzer.getAnalysisResult();

  assert(result.utilizationRate === 1.0, "활용률이 1.0이 아님");
  assert(result.unusedCost === 0, "낭비액이 0이 아님");
});

test("본전 회복 시뮬레이터: 필요 시간 계산", () => {
  const analyzer = new ContentConsumptionAnalyzer(10000, 20, 10);
  const result = analyzer.getAnalysisResult();

  assert(result.breakEvenHours === 10, "필요 시간 계산 오류");
});

test("0시간 사용: 시간당 비용 계산 불가", () => {
  const analyzer = new ContentConsumptionAnalyzer(10000, 10, 0);
  const result = analyzer.getAnalysisResult();

  assert(result.costPerHour === 0, "0시간 사용 시 시간당 비용이 0이 아님");
});

// ===== 혜택 소비형 =====
console.log("\n🎁 혜택 소비형 (BenefitConsumptionAnalyzer)");

test("Coupang WOW: 9900원, 5회 사용, 1회 5000원 절약", () => {
  const analyzer = new BenefitConsumptionAnalyzer(9900, 5, 5000);
  const result = analyzer.getAnalysisResult();

  assert(result.actualValue === 25000, "획득 가치 계산 오류");
  assert(result.utilizationRate > 2.5, "활용률 2.5 이상이어야 함");
  assert(result.unusedCost === 0, "초과 이득이므로 낭비액 0");
});

test("멤버십 저활용: 9900원, 1회, 3000원 절약", () => {
  const analyzer = new BenefitConsumptionAnalyzer(9900, 1, 3000);
  const result = analyzer.getAnalysisResult();

  assert(result.actualValue === 3000, "획득 가치가 3000이 아님");
  assert(Math.abs(result.utilizationRate - 0.303) < 0.01, "활용률 약 30.3%");
  assert(result.breakEvenUsage > 0, "추가 필요 횟수 계산 오류");
});

test("미사용 혜택: 0회 사용", () => {
  const analyzer = new BenefitConsumptionAnalyzer(10000, 0, 5000);
  const result = analyzer.getAnalysisResult();

  assert(result.actualValue === 0, "획득 가치가 0이 아님");
  assert(result.utilizationRate === 0, "활용률이 0이 아님");
  assert(result.unusedCost === 10000, "모두 낭비되어야 함");
});

// ===== 용량 기반형 =====
console.log("\n💾 용량 기반형 (StorageBasedAnalyzer)");

test("Google Drive: 100원, 100GB 제공, 30GB 사용", () => {
  const analyzer = new StorageBasedAnalyzer(100, 100, 30);
  const result = analyzer.getAnalysisResult();

  assert(result.utilizationRate === 0.3, "활용률이 30%가 아님");
  assert(result.remainingCapacity === 70, "남은 용량이 70GB가 아님");
  assert(result.costPerGB > 0, "1GB당 비용 계산 오류");
});

test("클라우드 저장소 활용도 낮음: 50% 활용", () => {
  const analyzer = new StorageBasedAnalyzer(5000, 200, 100);
  const result = analyzer.getAnalysisResult();

  assert(result.utilizationRate === 0.5, "활용률이 50%가 아님");
  assert(result.decision.level === "adequate", "50% 활용은 적절 수준");
});

test("클라우드 완전 활용: 100% 활용", () => {
  const analyzer = new StorageBasedAnalyzer(5000, 100, 100);
  const result = analyzer.getAnalysisResult();

  assert(result.utilizationRate === 1.0, "활용률이 100%가 아님");
  assert(result.decision.level === "perfect", "100% 활용은 완벽");
  assert(result.remainingCapacity === 0, "남은 용량 0");
});

// ===== 공통 기능 테스트 =====
console.log("\n🎯 공통 기능");

test("모든 타입 의사결정 메시지 반환", () => {
  const content = new ContentConsumptionAnalyzer(10000, 10, 3);
  const benefit = new BenefitConsumptionAnalyzer(10000, 0, 5000);
  const storage = new StorageBasedAnalyzer(10000, 100, 20);

  const contentMsg = content.generateDecisionMessage();
  const benefitMsg = benefit.generateDecisionMessage();
  const storageMsg = storage.generateDecisionMessage();

  assert(contentMsg.icon && contentMsg.text, "콘텐츠형 메시지 오류");
  assert(benefitMsg.icon && benefitMsg.text, "혜택형 메시지 오류");
  assert(storageMsg.icon && storageMsg.text, "용량형 메시지 오류");
});

test("생활 소비 단위 환산 (커피)", () => {
  const analyzer = new ContentConsumptionAnalyzer(14900, 10, 2);
  const unused = analyzer.calculateUnusedCost();
  const coffee = analyzer.calculateLifestyleEquivalence("coffee");

  assert(coffee > 0, "커피 환산 0개 이상");
  assert(
    coffee === Math.round((unused / 3500) * 100) / 100,
    "커피 환산 계산 오류",
  );
});

test("통화 포맷팅", () => {
  const analyzer = new ContentConsumptionAnalyzer(14900, 10, 5);
  const formatted = analyzer.formatCurrency(126408);

  assert(formatted === "126,408", `포맷 오류: ${formatted}`);
});

// ===== 결과 출력 =====
console.log(`\n========== 테스트 결과 ==========`);
console.log(`통과: ${passCount}/${testCount}`);
if (passCount === testCount) {
  console.log("✓ 모든 테스트 통과!");
} else {
  console.log(`✗ ${testCount - passCount}개 테스트 실패`);
}
