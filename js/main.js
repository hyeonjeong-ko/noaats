/**
 * 구독 서비스 손익분기 계산기 - 메인 로직 (v3)
 * UI 및 이벤트 핸들링
 */

// 전역 계산기 인스턴스
const calculator = new SubscriptionCalculator();

// ===== 탭 관련 =====
const tabButtons = document.querySelectorAll(".tab-button");
const tabContents = document.querySelectorAll(".tab-content");

// 탭 네비게이션 이벤트 리스너
tabButtons.forEach((button) => {
  button.addEventListener("click", function () {
    const targetTab = this.getAttribute("data-tab");

    // 모든 탭 버튼과 콘텐츠에서 active 제거
    tabButtons.forEach((btn) => btn.classList.remove("active"));
    tabContents.forEach((content) => content.classList.remove("active"));

    // 선택한 탭에 active 추가
    this.classList.add("active");
    document.getElementById(`${targetTab}-tab`).classList.add("active");
  });
});

// DOM 요소들 (입력)
const form = document.getElementById("calculatorForm");
const monthlyFeeInput = document.getElementById("monthlyFee");
const expectedHoursInput = document.getElementById("expectedHours");
const expectedMinutesInput = document.getElementById("expectedMinutes");
const actualHoursInput = document.getElementById("actualHours");
const actualMinutesInput = document.getElementById("actualMinutes");
const resultSection = document.getElementById("resultSection");

// 실제 사용 시간 입력 방식 라디오 버튼 참조
const actualTimeInputModeRadios = document.querySelectorAll(
  'input[name="actualTimeInputMode"]',
);
const actualTimeSubLabel = document.getElementById("actualTimeSubLabel");
const actualHoursUnit = document.getElementById("actualHoursUnit");

// 현재 입력 방식 상태
let currentActualTimeMode = "weekly"; // "weekly" 또는 "monthly"

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
 * 실제 사용 시간 입력 방식 변경 이벤트 핸들러
 */
actualTimeInputModeRadios.forEach((radio) => {
  radio.addEventListener("change", function () {
    currentActualTimeMode = this.value;

    if (this.value === "weekly") {
      actualTimeSubLabel.textContent =
        "디지털웰빙에서 본 주간 사용 시간 (자동으로 X4 계산됩니다)";
      actualHoursInput.max = "999";
      actualHoursInput.placeholder = "0";
    } else {
      actualTimeSubLabel.textContent =
        "지난 한 달, 실제로 이 서비스를 얼마나 사용했나요?";
      actualHoursInput.max = "999";
      actualHoursInput.placeholder = "0";
    }

    // 입력값 초기화
    actualHoursInput.value = "";
    actualMinutesInput.value = "";
  });
});

/**
 * 폼 제출 이벤트 핸들러
 */
form.addEventListener("submit", function (e) {
  e.preventDefault();

  // 입력값 가져오기
  const monthlyFee = parseFloat(monthlyFeeInput.value);
  const expectedHours = parseFloat(expectedHoursInput.value) || 0;
  const expectedMinutes = parseFloat(expectedMinutesInput.value) || 0;
  let actualHours = parseFloat(actualHoursInput.value) || 0;
  let actualMinutes = parseFloat(actualMinutesInput.value) || 0;

  // 주간 입력일 경우 월간으로 변환 (X4)
  if (currentActualTimeMode === "weekly") {
    // 총 분 단위로 변환
    const totalActualMinutes = actualHours * 60 + actualMinutes;
    // X4 계산
    const convertedTotalMinutes = totalActualMinutes * 4;
    // 다시 시간과 분으로 변환
    actualHours = Math.floor(convertedTotalMinutes / 60);
    actualMinutes = convertedTotalMinutes % 60;
  }

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

// ===== 복수 비교 탭 관련 =====
// 복수 비교 데이터 저장소
let comparisonSubscriptions = [];

// 복수 비교 - 실제 사용시간 입력 모드
let comparisonActualTimeMode = "weekly"; // "weekly" 또는 "monthly"

// 복수 비교 라디오 버튼 참조
const comparisonActualTimeInputModeRadios = document.querySelectorAll(
  'input[name="comparisonActualTimeInputMode"]',
);
const comparisonActualTimeSubLabel = document.getElementById(
  "comparisonActualTimeSubLabel",
);

// DOM 요소들 (복수 비교)
const btnAddSubscription = document.getElementById("btnAddSubscription");
const comparisonServiceName = document.getElementById("comparisonServiceName");
const comparisonServiceFee = document.getElementById("comparisonServiceFee");
const comparisonExpectedHours = document.getElementById(
  "comparisonExpectedHours",
);
const comparisonExpectedMinutes = document.getElementById(
  "comparisonExpectedMinutes",
);
const comparisonActualHours = document.getElementById("comparisonActualHours");
const comparisonActualMinutes = document.getElementById(
  "comparisonActualMinutes",
);
const comparisonResults = document.getElementById("comparisonResults");
const comparisonTableBody = document.getElementById("comparisonTableBody");
const utilizationBars = document.getElementById("utilizationBars");
const efficiencyAnalysis = document.getElementById("efficiencyAnalysis");
const emptyComparisonMessage = document.getElementById(
  "emptyComparisonMessage",
);

/**
 * 복수 비교 - 실제 사용시간 입력 모드 변경 이벤트
 */
comparisonActualTimeInputModeRadios.forEach((radio) => {
  radio.addEventListener("change", function () {
    comparisonActualTimeMode = this.value;

    if (this.value === "weekly") {
      comparisonActualTimeSubLabel.textContent =
        "디지털웰빙에서 본 주간 사용 시간 (자동으로 X4 계산됩니다)";
      comparisonActualHours.max = "999";
    } else {
      comparisonActualTimeSubLabel.textContent =
        "지난 한 달, 실제로 이 서비스를 얼마나 사용했나요?";
      comparisonActualHours.max = "999";
    }

    // 입력값 초기화
    comparisonActualHours.value = "";
    comparisonActualMinutes.value = "";
  });
});

/**
 * 구독 서비스 추가 이벤트
 */
btnAddSubscription.addEventListener("click", function () {
  const serviceName = comparisonServiceName.value.trim();
  const serviceFee = parseFloat(comparisonServiceFee.value);
  const expectedHours = parseFloat(comparisonExpectedHours.value) || 0;
  const expectedMinutes = parseFloat(comparisonExpectedMinutes.value) || 0;
  const actualHours = parseFloat(comparisonActualHours.value) || 0;
  const actualMinutes = parseFloat(comparisonActualMinutes.value) || 0;

  // 분을 시간으로 변환
  const expectedTotalHours = expectedHours + expectedMinutes / 60;
  let actualTotalHours = actualHours + actualMinutes / 60;

  // 주간 입력일 경우 월간으로 변환 (X4)
  if (comparisonActualTimeMode === "weekly") {
    actualTotalHours = actualTotalHours * 4;
  }

  // 유효성 검사
  if (!serviceName) {
    alert("서비스명을 입력해주세요.");
    return;
  }

  if (isNaN(serviceFee) || serviceFee < 0) {
    alert("월 구독료를 올바르게 입력해주세요.");
    return;
  }

  if (expectedTotalHours <= 0) {
    alert("기대 사용시간을 0보다 크게 입력해주세요.");
    return;
  }

  if (actualTotalHours < 0) {
    alert("실제 사용시간을 올바르게 입력해주세요.");
    return;
  }

  // 동일한 서비스명 확인
  if (
    comparisonSubscriptions.some(
      (sub) => sub.serviceName.toLowerCase() === serviceName.toLowerCase(),
    )
  ) {
    alert("이미 추가된 서비스입니다.");
    comparisonServiceName.focus();
    return;
  }

  // 활용률 계산
  const utilizationRate = (actualTotalHours / expectedTotalHours) * 100;
  const unusedCost = Math.max(
    serviceFee * (1 - utilizationRate / 100),
    0,
  ).toFixed(0);

  // 등급 부여
  let grade = "C";
  if (utilizationRate >= 100) {
    grade = "A";
  } else if (utilizationRate >= 50) {
    grade = "B";
  }

  // 구독 데이터 추가
  const subscription = {
    id: Date.now(),
    serviceName,
    serviceFee,
    expectedTotalHours,
    actualTotalHours,
    utilizationRate: parseFloat(utilizationRate.toFixed(1)),
    unusedCost: parseInt(unusedCost),
    grade,
  };

  comparisonSubscriptions.push(subscription);

  // 입력 필드 초기화
  comparisonServiceName.value = "";
  comparisonServiceFee.value = "";
  comparisonExpectedHours.value = "";
  comparisonExpectedMinutes.value = "";
  comparisonActualHours.value = "";
  comparisonActualMinutes.value = "";
  comparisonServiceName.focus();

  // 결과 업데이트
  updateComparisonResults();
});

/**
 * 복수 비교 - Enter 키로 서비스 추가
 */
comparisonActualMinutes.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    btnAddSubscription.click();
  }
});

/**
 * 복수 비교 결과 업데이트
 */
function updateComparisonResults() {
  if (comparisonSubscriptions.length === 0) {
    comparisonResults.style.display = "none";
    emptyComparisonMessage.style.display = "block";
    return;
  }

  comparisonResults.style.display = "block";
  emptyComparisonMessage.style.display = "none";

  // 테이블 업데이트
  updateComparisonTable();

  // 막대 그래프 업데이트
  updateUtilizationBars();

  // 비효율 분석 업데이트
  updateEfficiencyAnalysis();
}

/**
 * 비교 테이블 업데이트
 */
function updateComparisonTable() {
  comparisonTableBody.innerHTML = comparisonSubscriptions
    .map((sub) => {
      const gradeClass = `grade-${sub.grade.toLowerCase()}`;
      return `
        <tr>
          <td>${sub.serviceName}</td>
          <td>${sub.utilizationRate.toFixed(1)}%</td>
          <td>${calculator.formatCurrency(sub.unusedCost)}원</td>
          <td><span class="${gradeClass}">${sub.grade}</span></td>
          <td>
            <button class="btn-delete-service" onclick="deleteSubscription(${sub.id})">
              삭제
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

/**
 * 활용률 막대 그래프 업데이트
 */
function updateUtilizationBars() {
  const maxUtilization = Math.max(
    ...comparisonSubscriptions.map((s) => s.utilizationRate),
    100,
  );

  utilizationBars.innerHTML = comparisonSubscriptions
    .map((sub) => {
      const percentage = (sub.utilizationRate / maxUtilization) * 100;
      let barClass = "bar-fill low";
      if (sub.utilizationRate >= 100) {
        barClass = "bar-fill high";
      } else if (sub.utilizationRate >= 50) {
        barClass = "bar-fill medium";
      }

      return `
        <div class="utilization-bar-item">
          <div class="service-label">${sub.serviceName}</div>
          <div class="bar-container">
            <div class="${barClass}" style="width: ${percentage}%">
              ${sub.utilizationRate.toFixed(1)}%
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

/**
 * 비효율 분석 업데이트
 */
function updateEfficiencyAnalysis() {
  // 가장 비효율적인 서비스 찾기
  const leastEfficient = comparisonSubscriptions.reduce((prev, current) => {
    return prev.utilizationRate < current.utilizationRate ? prev : current;
  });

  const annualUnusedCost = leastEfficient.unusedCost * 12;

  efficiencyAnalysis.innerHTML = `
    <h4>⚠️ 가장 비효율적인 구독</h4>
    <p><strong>${leastEfficient.serviceName}</strong></p>
    <p>활용률: ${leastEfficient.utilizationRate.toFixed(1)}%</p>
    <p>월 낭비: ${calculator.formatCurrency(leastEfficient.unusedCost)}원</p>
    <p>연간 낭비: ${calculator.formatCurrency(annualUnusedCost)}원</p>
  `;
}

/**
 * 구독 서비스 삭제
 */
function deleteSubscription(id) {
  comparisonSubscriptions = comparisonSubscriptions.filter(
    (sub) => sub.id !== id,
  );
  updateComparisonResults();
}
