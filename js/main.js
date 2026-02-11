/**
 * 구독 서비스 손익분기 계산기 - 메인 로직 (v3)
 * UI 및 이벤트 핸들링
 */

// 전역 계산기 인스턴스
const calculator = new SubscriptionCalculator();

// DOM 요소들 (입력)
const form = document.getElementById("calculatorForm");
const monthlyFeeInput = document.getElementById("monthlyFee");
const expectedHoursInput = document.getElementById("expectedHours");
const expectedMinutesInput = document.getElementById("expectedMinutes");
const actualHoursInput = document.getElementById("actualHours");
const actualMinutesInput = document.getElementById("actualMinutes");
const resultSection = document.getElementById("resultSection");

// DOM 요소들 (결과)
const resultFeeElement = document.getElementById("resultFee");
const resultExpectedHoursElement = document.getElementById(
  "resultExpectedHours",
);
const resultActualHoursElement = document.getElementById("resultActualHours");
const resultUtilizationRateElement = document.getElementById(
  "resultUtilizationRate",
);
const resultCostPerHourElement = document.getElementById("resultCostPerHour");
const decisionMessageElement = document.getElementById("decisionMessage");

// v3 추가: DOM 요소들 (v3 결과)
const unusedCostMessageElement = document.getElementById("unusedCostMessage");
const breakEvenMessageElement = document.getElementById("breakEvenMessage");

// v4 추가: DOM 요소들 (생활소비 환산)
const lifestyleItemSelector = document.getElementById("lifestyleItem");
const lifestyleEquivalenceMessageElement = document.getElementById(
  "lifestyleEquivalenceMessage",
);

// 전역 계산 결과 저장 (드롭다운 변경 시 사용)
let lastCalculationResult = null;

/**
 * 폼 제출 이벤트 핸들러
 */
form.addEventListener("submit", function (e) {
  e.preventDefault();

  // 입력값 가져오기
  const monthlyFee = parseFloat(monthlyFeeInput.value);
  const expectedHours = parseFloat(expectedHoursInput.value) || 0;
  const expectedMinutes = parseFloat(expectedMinutesInput.value) || 0;
  const actualHours = parseFloat(actualHoursInput.value) || 0;
  const actualMinutes = parseFloat(actualMinutesInput.value) || 0;

  // 유효성 검사
  if (isNaN(monthlyFee)) {
    alert("월 구독료를 올바르게 입력해주세요.");
    return;
  }

  if (
    monthlyFee < 0 ||
    expectedHours < 0 ||
    expectedMinutes < 0 ||
    actualHours < 0 ||
    actualMinutes < 0
  ) {
    alert("음수는 입력할 수 없습니다.");
    return;
  }

  // 분이 0-59 범위인지 확인
  if (expectedMinutes >= 60 || actualMinutes >= 60) {
    alert("분은 0-59 사이의 값으로 입력해주세요.");
    return;
  }

  // 기대 사용 시간 검증
  if (expectedHours === 0 && expectedMinutes === 0) {
    alert("기대 사용 시간은 0보다 커야 합니다.");
    return;
  }

  try {
    // 계산 수행
    const result = calculator.calculateUtilization(
      monthlyFee,
      expectedHours,
      expectedMinutes,
      actualHours,
      actualMinutes,
    );

    // 결과 표시
    displayResults(result);

    // 결과 저장
    calculator.saveResult(result);
  } catch (error) {
    alert("계산 중 오류가 발생했습니다: " + error.message);
  }
});

/**
 * 계산 결과를 UI에 표시 (v2)
 * @param {object} result - calculateUtilization 결과
 */
function displayResults(result) {
  // 기대 사용 시간을 시간:분 형식으로 변환
  const expectedHoursInt = Math.floor(result.expectedTotalHours);
  const expectedMinutesVal = Math.round(
    (result.expectedTotalHours - expectedHoursInt) * 60,
  );
  const formattedExpectedHours = `${expectedHoursInt}시간 ${expectedMinutesVal}분`;

  // 실제 사용 시간을 시간:분 형식으로 변환
  const actualHoursInt = Math.floor(result.actualTotalHours);
  const actualMinutesVal = Math.round(
    (result.actualTotalHours - actualHoursInt) * 60,
  );
  const formattedActualHours = `${actualHoursInt}시간 ${actualMinutesVal}분`;

  // 결과 요소 업데이트
  resultFeeElement.textContent = `${calculator.formatCurrency(result.monthlyFee)}원`;
  resultExpectedHoursElement.textContent = formattedExpectedHours;
  resultActualHoursElement.textContent = formattedActualHours;
  resultUtilizationRateElement.textContent = `${result.utilizationRate.toFixed(1)}%`;
  resultCostPerHourElement.textContent = `${calculator.formatCurrency(result.costPerHour)}원`;

  // 활용률에 따른 색상 적용
  if (result.utilizationRate >= 100) {
    resultUtilizationRateElement.style.color = "#28a745";
  } else if (result.utilizationRate >= 50) {
    resultUtilizationRateElement.style.color = "#ffc107";
  } else {
    resultUtilizationRateElement.style.color = "#dc3545";
  }

  // 의사결정 메시지 생성 및 표시
  const decisionMessage = calculator.generateDecisionMessage(result);
  decisionMessageElement.innerHTML = decisionMessage;

  // v3 추가: 미활용 비용 메시지 생성 및 표시
  const unusedCostMessage = calculator.generateUnusedCostMessage(result);
  unusedCostMessageElement.innerHTML = unusedCostMessage;

  // v3 추가: 본전 회복 시뮬레이터 메시지 생성 및 표시
  const breakEvenMessage = calculator.generateBreakEvenSimulator(result);
  breakEvenMessageElement.innerHTML = breakEvenMessage;

  // v4 추가: 생활소비 환산 메시지 생성 및 표시
  lastCalculationResult = result;
  const selectedItem = lifestyleItemSelector.value || "coffee";
  const lifestyleEquivalenceMessage =
    calculator.generateLifestyleEquivalenceMessage(result, selectedItem);
  lifestyleEquivalenceMessageElement.innerHTML = lifestyleEquivalenceMessage;

  // 활용률에 따른 스타일 적용
  applyUtilizationStyle(result.utilizationRate);

  // 결과 섹션 표시
  resultSection.style.display = "block";

  // 결과 섹션으로 스크롤
  setTimeout(() => {
    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
}

/**
 * 활용률에 따른 의사결정 스타일 적용 (v2)
 * @param {number} utilizationRate - 활용률 (%)
 */
function applyUtilizationStyle(utilizationRate) {
  const decisionSection = decisionMessageElement.parentElement;

  // 기존 스타일 제거
  decisionSection.style.background = "";
  decisionSection.style.borderLeft = "";

  // 활용률에 따른 새로운 스타일 적용
  if (utilizationRate >= 100) {
    decisionSection.style.background = "#d4edda";
    decisionSection.style.borderLeft = "4px solid #28a745";
  } else if (utilizationRate >= 50) {
    decisionSection.style.background = "#fff3cd";
    decisionSection.style.borderLeft = "4px solid #ffc107";
  } else {
    decisionSection.style.background = "#f8d7da";
    decisionSection.style.borderLeft = "4px solid #dc3545";
  }
}

/**
 * 페이지 로드 시 초기화
 */
document.addEventListener("DOMContentLoaded", function () {
  // 초기 포커스 설정
  monthlyFeeInput.focus();
});

/**
 * 입력 필드 포커스 시 자동 선택
 */
monthlyFeeInput.addEventListener("focus", function () {
  this.select();
});

expectedHoursInput.addEventListener("focus", function () {
  this.select();
});

expectedMinutesInput.addEventListener("focus", function () {
  this.select();
});

actualHoursInput.addEventListener("focus", function () {
  this.select();
});

actualMinutesInput.addEventListener("focus", function () {
  this.select();
});

/**
 * Enter 키로도 계산 가능하도록
 */
actualMinutesInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    form.dispatchEvent(new Event("submit"));
  }
});

/**
 * v4: 생활소비 환산 항목 선택 이벤트
 */
lifestyleItemSelector.addEventListener("change", function () {
  if (lastCalculationResult) {
    const selectedItem = this.value;
    const lifestyleEquivalenceMessage =
      calculator.generateLifestyleEquivalenceMessage(
        lastCalculationResult,
        selectedItem,
      );
    lifestyleEquivalenceMessageElement.innerHTML = lifestyleEquivalenceMessage;
  }
});
