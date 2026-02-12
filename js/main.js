/**
 * 구독 서비스 손익분기 계산기 - 메인 로직 (v3)
 * UI 및 이벤트 핸들링
 */

// 전역 계산기 인스턴스
const calculator = new SubscriptionCalculator();

// ===== 전역 상수 =====
const TYPE_LABELS_EMOJI = {
  content: "📺 콘텐츠형",
  benefit: "🎁 혜택형",
  storage: "💾 용량형",
};

const TYPE_LABELS_SIMPLE = {
  content: "콘텐츠형",
  benefit: "혜택형",
  storage: "용량형",
};

const UTILIZATION_THRESHOLDS = {
  high: 100,
  medium: 50,
};

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
 * 구독 서비스 타입 라디오 버튼 변경 이벤트 핸들러
 */
const subscriptionTypeRadios = document.querySelectorAll(
  'input[name="subscriptionType"]',
);

subscriptionTypeRadios.forEach((radio) => {
  radio.addEventListener("change", function () {
    // 모든 입력 필드 초기화
    monthlyFeeInput.value = "";
    expectedHoursInput.value = "";
    expectedMinutesInput.value = "";
    actualHoursInput.value = "";
    actualMinutesInput.value = "";

    // 콘텐츠형이 아닌 경우 혜택형/용량형 필드도 초기화
    document.querySelectorAll('input[name="benefitType"]').forEach((cb) => {
      cb.checked = false;
    });
    document
      .querySelectorAll(
        '[id^="benefit"][id$="Count"], [id^="benefit"][id$="Fee"], [id^="benefit"][id$="Total"], [id^="benefit"][id$="Value"]',
      )
      .forEach((input) => {
        input.value = "";
      });

    document.getElementById("storageTotalCapacity").value = "";
    document.getElementById("storageUsedCapacity").value = "";

    // 월 구독료 입력 포커스
    monthlyFeeInput.focus();
  });
});

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
 * 폼 제출 이벤트 핸들러 (유형별 처리 추가)
 */
form.addEventListener("submit", function (e) {
  e.preventDefault();

  // 현재 선택된 구독 유형 확인
  const selectedType = document.querySelector(
    'input[name="subscriptionType"]:checked',
  ).value;

  // 월 구독료 확인
  const monthlyFee = parseFloat(monthlyFeeInput.value);
  if (isNaN(monthlyFee) || monthlyFee <= 0) {
    alert("월 구독료를 0보다 크게 입력해주세요.");
    return;
  }

  try {
    let result;

    if (selectedType === "content") {
      // 콘텐츠형 계산
      const expectedHours = parseFloat(expectedHoursInput.value) || 0;
      const expectedMinutes = parseFloat(expectedMinutesInput.value) || 0;
      let actualHours = parseFloat(actualHoursInput.value) || 0;
      let actualMinutes = parseFloat(actualMinutesInput.value) || 0;

      // 주간 입력일 경우 월간으로 변환 (X4)
      if (currentActualTimeMode === "weekly") {
        const totalActualMinutes = actualHours * 60 + actualMinutes;
        const convertedTotalMinutes = totalActualMinutes * 4;
        actualHours = Math.floor(convertedTotalMinutes / 60);
        actualMinutes = convertedTotalMinutes % 60;
      }

      // 유효성 검사
      if (expectedHours === 0 && expectedMinutes === 0) {
        alert("기대 사용 시간은 0보다 커야 합니다.");
        return;
      }

      if (
        expectedHours < 0 ||
        expectedMinutes < 0 ||
        actualHours < 0 ||
        actualMinutes < 0
      ) {
        alert("음수는 입력할 수 없습니다.");
        return;
      }

      if (expectedMinutes >= 60 || actualMinutes >= 60) {
        alert("분은 0-59 사이의 값으로 입력해주세요.");
        return;
      }

      result = calculator.calculateUtilization(
        monthlyFee,
        expectedHours,
        expectedMinutes,
        actualHours,
        actualMinutes,
      );
    } else if (selectedType === "benefit") {
      // 혜택형 계산
      const benefitTypes = {};
      const benefitCheckboxes = document.querySelectorAll(
        'input[name="benefitType"]:checked',
      );

      if (benefitCheckboxes.length === 0) {
        alert("적어도 하나의 혜택 유형을 선택해주세요.");
        return;
      }

      let hasValidInput = false;
      benefitCheckboxes.forEach((checkbox) => {
        const btype = checkbox.value;
        if (btype === "shipping") {
          const count =
            parseFloat(document.getElementById("benefitShippingCount").value) ||
            0;
          const fee =
            parseFloat(document.getElementById("benefitShippingFee").value) ||
            0;
          if (count > 0 && fee > 0) {
            benefitTypes.shipping = { count, fee };
            hasValidInput = true;
          }
        } else if (btype === "coupon") {
          const total =
            parseFloat(document.getElementById("benefitCouponTotal").value) ||
            0;
          if (total > 0) {
            benefitTypes.coupon = { total };
            hasValidInput = true;
          }
        } else if (btype === "memberDiscount") {
          const total =
            parseFloat(
              document.getElementById("benefitMemberDiscountTotal").value,
            ) || 0;
          if (total > 0) {
            benefitTypes.memberDiscount = { total };
            hasValidInput = true;
          }
        } else if (btype === "points") {
          const value =
            parseFloat(document.getElementById("benefitPointsValue").value) ||
            0;
          if (value > 0) {
            benefitTypes.points = { value };
            hasValidInput = true;
          }
        } else if (btype === "other") {
          const value =
            parseFloat(document.getElementById("benefitOtherValue").value) || 0;
          if (value > 0) {
            benefitTypes.other = { value };
            hasValidInput = true;
          }
        }
      });

      if (!hasValidInput) {
        alert("선택한 혜택의 값을 입력해주세요.");
        return;
      }

      const analyzer = new BenefitConsumptionAnalyzer(monthlyFee, benefitTypes);
      result = analyzer.getAnalysisResult();
    } else if (selectedType === "storage") {
      // 용량형 계산
      const totalCapacity =
        parseFloat(document.getElementById("storageTotalCapacity").value) || 0;
      const usedCapacity =
        parseFloat(document.getElementById("storageUsedCapacity").value) || 0;
      const totalUnit = document.getElementById(
        "storageTotalCapacityUnit",
      ).value;
      const usedUnit = document.getElementById("storageUsedCapacityUnit").value;

      if (totalCapacity <= 0) {
        alert("제공 용량을 0보다 크게 입력해주세요.");
        return;
      }

      if (usedCapacity < 0 || usedCapacity > totalCapacity) {
        alert("사용 중인 용량을 올바르게 입력해주세요.");
        return;
      }

      const analyzer = new StorageBasedAnalyzer(
        monthlyFee,
        totalCapacity,
        usedCapacity,
        totalUnit,
        usedUnit,
      );
      result = analyzer.getAnalysisResult();
    }

    if (result) {
      displayResults(result, selectedType);
    }
  } catch (error) {
    alert("계산 중 오류가 발생했습니다: " + error.message);
    console.error(error);
  }
});

/**
 * 계산 결과를 UI에 표시 (유형별 처리 포함)
 */
function displayResults(result, type) {
  // 계산 결과 저장 (생활소비 환산에 사용)
  lastCalculationResult = result;

  resultFeeElement.textContent = `${calculator.formatCurrency(result.monthlyFee)}원`;
  resultUtilizationRateElement.textContent = `${result.utilizationRate.toFixed(1)}%`;

  // 활용률에 따른 색상 적용
  if (result.utilizationRate >= 100) {
    resultUtilizationRateElement.style.color = "#28a745";
  } else if (result.utilizationRate >= 50) {
    resultUtilizationRateElement.style.color = "#ffc107";
  } else {
    resultUtilizationRateElement.style.color = "#dc3545";
  }

  // 유형별 결과 표시
  if (type === "content") {
    const expectedHoursInt = Math.floor(result.expectedTotalHours);
    const expectedMinutesVal = Math.round(
      (result.expectedTotalHours - expectedHoursInt) * 60,
    );
    const formattedExpectedHours = `${expectedHoursInt}시간 ${expectedMinutesVal}분`;

    const actualHoursInt = Math.floor(result.actualTotalHours);
    const actualMinutesVal = Math.round(
      (result.actualTotalHours - actualHoursInt) * 60,
    );
    const formattedActualHours = `${actualHoursInt}시간 ${actualMinutesVal}분`;

    if (resultExpectedHoursElement)
      resultExpectedHoursElement.textContent = formattedExpectedHours;
    if (resultActualHoursElement)
      resultActualHoursElement.textContent = formattedActualHours;
    if (resultCostPerHourElement)
      resultCostPerHourElement.textContent = `${calculator.formatCurrency(result.costPerHour)}원`;

    // 기존 결과 요소들 표시
    const basicInfoCard = document.querySelector(".result-card");
    if (basicInfoCard) basicInfoCard.style.display = "block";
  } else {
    // 콘텐츠형이 아닌 경우 상세 정보 숨김
    const basicInfoCard = document.querySelector(".result-card");
    if (basicInfoCard) basicInfoCard.style.display = "none";
  }

  // 공통 결과 메시지
  const typeLabel = TYPE_LABELS_SIMPLE[type] || "알 수 없음";

  // 미활용 비용 또는 초과 가치 표시
  let costMessage = "";
  if (result.unusedCost > 0) {
    costMessage = `<p>월 미활용 비용: ${calculator.formatCurrency(result.unusedCost)}원 (연 ${calculator.formatCurrency(result.annualUnusedCost)}원)</p>`;
  } else if (result.surplusValue > 0) {
    costMessage = `<p>월 초과 이득: ${calculator.formatCurrency(result.surplusValue)}원</p>`;
  } else {
    costMessage = `<p>💰 정확히 본전을 맞추셨습니다!</p>`;
  }

  const decisionMessage = `
    <strong>${typeLabel} 분석 결과</strong>
    <p>월 구독료: ${calculator.formatCurrency(result.monthlyFee)}원</p>
    <p>활용률: ${result.utilizationRate.toFixed(1)}%</p>
    ${costMessage}
  `;

  if (decisionMessageElement)
    decisionMessageElement.innerHTML = decisionMessage;
  if (unusedCostMessageElement) {
    unusedCostMessageElement.innerHTML = `
      <strong>손실 분석</strong>
      <p>이 구독을 ${result.utilizationRate >= 100 ? "최대한 활용하고 있습니다! ✅" : "충분히 활용하지 못하고 있습니다. ⚠️"}</p>
    `;
  }
  if (breakEvenMessageElement) {
    let breakEvenContent = `<strong>의사결정</strong>`;

    // 콘텐츠형인 경우 본전 회복까지 필요한 시간 표시
    if (
      type === "content" &&
      result.breakEvenHours !== undefined &&
      result.breakEvenHours > 0
    ) {
      breakEvenContent += `
        <p>⏱️ <strong>본전까지 추가 ${Math.ceil(result.breakEvenHours)}시간 필요</strong></p>
      `;
    }

    breakEvenContent += `
      <p>${result.utilizationRate >= 100 ? "계속 유지하세요 ✅" : result.utilizationRate >= 50 ? "현재 수준 유지 권고 ⚠️" : "구독 해제를 고려해보세요 ❌"}</p>
    `;

    breakEvenMessageElement.innerHTML = breakEvenContent;
  }

  // 활용률에 따른 스타일 적용
  applyUtilizationStyle(result.utilizationRate);

  // 생활소비 환산 메시지 초기화 (커피로 기본 설정)
  if (lifestyleEquivalenceMessageElement) {
    const selectedItem = lifestyleItemSelector.value || "coffee";
    const lifestyleEquivalenceMessage =
      calculator.generateLifestyleEquivalenceMessage(
        lastCalculationResult,
        selectedItem,
      );
    lifestyleEquivalenceMessageElement.innerHTML = lifestyleEquivalenceMessage;
  }

  // 결과 섹션 표시
  if (resultSection) resultSection.style.display = "block";

  // 결과 섹션으로 스크롤
  setTimeout(() => {
    if (resultSection)
      resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
}

/**
 * 활용률에 따른 의사결정 스타일 적용
 * @param {number} utilizationRate - 활용률 (%)
 */
function applyUtilizationStyle(utilizationRate) {
  if (!decisionMessageElement) return;

  const decisionSection = decisionMessageElement.parentElement;
  if (!decisionSection) return;

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

  // 단일 분석 탭 - 유형 선택 이벤트 설정
  setupTypeSelection();

  // 단일 분석 탭 - 혜택형 체크박스 이벤트 설정
  setupBenefitCheckboxes();

  // 복수 비교 탭 - 혜택형 체크박스 이벤트 설정
  setupComparisonBenefitCheckboxes();
});

/**
 * 단일 분석 - 혜택 유형 체크박스 이벤트 설정
 */
function setupBenefitCheckboxes() {
  const checkboxes = document.querySelectorAll('input[name="benefitType"]');

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      updateBenefitFields();
    });
  });
}

/**
 * 단일 분석 - 혜택 입력 필드 표시/숨김
 */
function updateBenefitFields() {
  const shippingField = document.getElementById("benefit-shipping-fields");
  const couponField = document.getElementById("benefit-coupon-fields");
  const memberDiscountField = document.getElementById(
    "benefit-member-discount-fields",
  );
  const pointsField = document.getElementById("benefit-points-fields");
  const otherField = document.getElementById("benefit-other-fields");

  // 모든 필드 숨김
  shippingField.style.display = "none";
  couponField.style.display = "none";
  memberDiscountField.style.display = "none";
  pointsField.style.display = "none";
  otherField.style.display = "none";

  // 선택된 체크박스에 맞는 필드만 표시
  const checkboxes = document.querySelectorAll(
    'input[name="benefitType"]:checked',
  );

  checkboxes.forEach((checkbox) => {
    if (checkbox.value === "shipping") {
      shippingField.style.display = "block";
    } else if (checkbox.value === "coupon") {
      couponField.style.display = "block";
    } else if (checkbox.value === "memberDiscount") {
      memberDiscountField.style.display = "block";
    } else if (checkbox.value === "points") {
      pointsField.style.display = "block";
    } else if (checkbox.value === "other") {
      otherField.style.display = "block";
    }
  });
}

/**
 * 복수 비교 - 혜택 유형 체크박스 이벤트 설정
 */
function setupComparisonBenefitCheckboxes() {
  const checkboxes = document.querySelectorAll(
    'input[name="comparisonBenefitType"]',
  );

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      updateComparisonBenefitFields();
    });
  });
}

/**
 * 복수 비교 - 혜택 입력 필드 표시/숨김
 */
function updateComparisonBenefitFields() {
  const shippingField = document.getElementById(
    "comparison-benefit-shipping-fields",
  );
  const couponField = document.getElementById(
    "comparison-benefit-coupon-fields",
  );
  const memberDiscountField = document.getElementById(
    "comparison-benefit-member-discount-fields",
  );
  const pointsField = document.getElementById(
    "comparison-benefit-points-fields",
  );
  const otherField = document.getElementById("comparison-benefit-other-fields");

  // 모든 필드 숨김
  shippingField.style.display = "none";
  couponField.style.display = "none";
  memberDiscountField.style.display = "none";
  pointsField.style.display = "none";
  otherField.style.display = "none";

  // 선택된 체크박스에 맞는 필드만 표시
  const checkboxes = document.querySelectorAll(
    'input[name="comparisonBenefitType"]:checked',
  );

  checkboxes.forEach((checkbox) => {
    if (checkbox.value === "shipping") {
      shippingField.style.display = "block";
    } else if (checkbox.value === "coupon") {
      couponField.style.display = "block";
    } else if (checkbox.value === "memberDiscount") {
      memberDiscountField.style.display = "block";
    } else if (checkbox.value === "points") {
      pointsField.style.display = "block";
    } else if (checkbox.value === "other") {
      otherField.style.display = "block";
    }
  });
}

/**
 * Helper: 입력 필드에 값 설정 후 포커스
 */
function setInputValueAndFocus(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.value = value;
    element.focus();
  }
}

/**
 * 단일 분석 - 무료배송 배송비 기본값 제안
 */
function suggestShippingFee() {
  setInputValueAndFocus("benefitShippingFee", "3000");
}

/**
 * 복수 비교 - 무료배송 배송비 기본값 제안
 */
function suggestComparisonShippingFee() {
  setInputValueAndFocus("comparisonBenefitShippingFee", "3000");
}

/**
 * Helper: 여러 입력 필드에 자동 선택 기능 추가
 */
function attachAutoSelectToInputs(inputs) {
  inputs.forEach((input) => {
    input.addEventListener("focus", function () {
      this.select();
    });
  });
}

/**
 * 입력 필드 포커스 시 자동 선택
 */
attachAutoSelectToInputs([
  monthlyFeeInput,
  expectedHoursInput,
  expectedMinutesInput,
  actualHoursInput,
  actualMinutesInput,
]);

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

// 복수 비교 - 현재 유형
let currentComparisonType = "content"; // "content", "benefit", "storage"

// 복수 비교 - 실제 사용시간 입력 모드
let comparisonActualTimeMode = "weekly"; // "weekly" 또는 "monthly"

// 복수 비교 라디오 버튼 참조
const comparisonSubscriptionTypeRadios = document.querySelectorAll(
  'input[name="comparisonSubscriptionType"]',
);
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

// 콘텐츠형 필드
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

// 혜택형 필드 (기존 - 삭제)
// const comparisonBenefitUsageCount ... (제거됨)
// const comparisonBenefitSavedPerUse ... (제거됨)

// 용량형 필드
const comparisonStorageTotalCapacity = document.getElementById(
  "comparisonStorageTotalCapacity",
);
const comparisonStorageTotalCapacityUnit = document.getElementById(
  "comparisonStorageTotalCapacityUnit",
);
const comparisonStorageUsedCapacity = document.getElementById(
  "comparisonStorageUsedCapacity",
);
const comparisonStorageUsedCapacityUnit = document.getElementById(
  "comparisonStorageUsedCapacityUnit",
);

// 유형별 필드 컨테이너
const comparisonContentFields = document.getElementById(
  "comparison-content-fields",
);
const comparisonBenefitFields = document.getElementById(
  "comparison-benefit-fields",
);
const comparisonStorageFields = document.getElementById(
  "comparison-storage-fields",
);

// 결과 표시 DOM
const comparisonResults = document.getElementById("comparisonResults");
const comparisonTableBody = document.getElementById("comparisonTableBody");
const utilizationBars = document.getElementById("utilizationBars");
const efficiencyAnalysis = document.getElementById("efficiencyAnalysis");
const emptyComparisonMessage = document.getElementById(
  "emptyComparisonMessage",
);

/**
 * 복수 비교 - 구독 유형 선택 이벤트
 */
comparisonSubscriptionTypeRadios.forEach((radio) => {
  radio.addEventListener("change", function () {
    currentComparisonType = this.value;

    // 모든 유형별 필드 숨기기
    comparisonContentFields.style.display = "none";
    comparisonBenefitFields.style.display = "none";
    comparisonStorageFields.style.display = "none";

    // 선택한 유형의 필드만 보이기
    if (this.value === "content") {
      comparisonContentFields.style.display = "block";
    } else if (this.value === "benefit") {
      comparisonBenefitFields.style.display = "block";
    } else if (this.value === "storage") {
      comparisonStorageFields.style.display = "block";
    }

    // 입력 필드 초기화
    clearComparisonTypeFields();
  });
});

/**
 * 유형별 입력 필드 초기화
 */
function clearComparisonTypeFields() {
  // 콘텐츠형
  comparisonExpectedHours.value = "";
  comparisonExpectedMinutes.value = "";
  comparisonActualHours.value = "";
  comparisonActualMinutes.value = "";

  // 혜택형 - 체크박스 해제
  document
    .querySelectorAll('input[name="comparisonBenefitType"]')
    .forEach((cb) => {
      cb.checked = false;
    });
  // 혜택형 필드 숨김
  updateComparisonBenefitFields();
  // 혜택형 입력값 초기화
  document.getElementById("comparisonBenefitShippingCount").value = "";
  document.getElementById("comparisonBenefitShippingFee").value = "";
  document.getElementById("comparisonBenefitCouponTotal").value = "";
  document.getElementById("comparisonBenefitMemberDiscountTotal").value = "";
  document.getElementById("comparisonBenefitPointsValue").value = "";
  document.getElementById("comparisonBenefitOtherValue").value = "";

  // 용량형
  comparisonStorageTotalCapacity.value = "";
  comparisonStorageTotalCapacityUnit.value = "gb";
  comparisonStorageUsedCapacity.value = "";
  comparisonStorageUsedCapacityUnit.value = "gb";
}

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
 * 복수 비교용 Analyzer 생성
 */
function createComparisonAnalyzer(type, monthlyFee) {
  switch (type) {
    case "content":
      const expectedHours = parseFloat(comparisonExpectedHours.value) || 0;
      const expectedMinutes = parseFloat(comparisonExpectedMinutes.value) || 0;
      const actualHours = parseFloat(comparisonActualHours.value) || 0;
      const actualMinutes = parseFloat(comparisonActualMinutes.value) || 0;
      return new ContentConsumptionAnalyzer(
        monthlyFee,
        expectedHours,
        actualHours,
        expectedMinutes,
        actualMinutes,
      );

    case "benefit":
      // 선택된 혜택 유형 수집
      const benefitTypesComp = {};
      const compBenefitCheckboxes = document.querySelectorAll(
        'input[name="comparisonBenefitType"]:checked',
      );

      compBenefitCheckboxes.forEach((checkbox) => {
        const btype = checkbox.value;
        if (btype === "shipping") {
          benefitTypesComp.shipping = {
            count:
              parseFloat(
                document.getElementById("comparisonBenefitShippingCount").value,
              ) || 0,
            fee:
              parseFloat(
                document.getElementById("comparisonBenefitShippingFee").value,
              ) || 0,
          };
        } else if (btype === "coupon") {
          benefitTypesComp.coupon = {
            total:
              parseFloat(
                document.getElementById("comparisonBenefitCouponTotal").value,
              ) || 0,
          };
        } else if (btype === "memberDiscount") {
          benefitTypesComp.memberDiscount = {
            total:
              parseFloat(
                document.getElementById("comparisonBenefitMemberDiscountTotal")
                  .value,
              ) || 0,
          };
        } else if (btype === "points") {
          benefitTypesComp.points = {
            value:
              parseFloat(
                document.getElementById("comparisonBenefitPointsValue").value,
              ) || 0,
          };
        } else if (btype === "other") {
          benefitTypesComp.other = {
            value:
              parseFloat(
                document.getElementById("comparisonBenefitOtherValue").value,
              ) || 0,
          };
        }
      });

      return new BenefitConsumptionAnalyzer(monthlyFee, benefitTypesComp);

    case "storage":
      const totalCapacity =
        parseFloat(comparisonStorageTotalCapacity.value) || 0;
      const usedCapacity = parseFloat(comparisonStorageUsedCapacity.value) || 0;
      const totalUnit = comparisonStorageTotalCapacityUnit.value;
      const usedUnit = comparisonStorageUsedCapacityUnit.value;
      return new StorageBasedAnalyzer(
        monthlyFee,
        totalCapacity,
        usedCapacity,
        totalUnit,
        usedUnit,
      );

    default:
      return null;
  }
}

/**
 * 복수 비교 - 입력값 유효성 검사
 */
function validateComparisonInput(serviceName, serviceFee, type) {
  if (!serviceName) {
    alert("서비스명을 입력해주세요.");
    comparisonServiceName.focus();
    return false;
  }

  if (isNaN(serviceFee) || serviceFee <= 0) {
    alert("월 구독료를 0보다 크게 입력해주세요.");
    comparisonServiceFee.focus();
    return false;
  }

  // 동일한 서비스명 확인
  if (
    comparisonSubscriptions.some(
      (sub) => sub.serviceName.toLowerCase() === serviceName.toLowerCase(),
    )
  ) {
    alert("이미 추가된 서비스입니다.");
    comparisonServiceName.focus();
    return false;
  }

  // 유형별 입력값 검사
  if (type === "content") {
    const expectedHours = parseFloat(comparisonExpectedHours.value) || 0;
    const expectedMinutes = parseFloat(comparisonExpectedMinutes.value) || 0;
    const expectedTotal = expectedHours + expectedMinutes / 60;
    const actualHours = parseFloat(comparisonActualHours.value) || 0;
    const actualMinutes = parseFloat(comparisonActualMinutes.value) || 0;
    const actualTotal = actualHours + actualMinutes / 60;

    if (expectedTotal <= 0) {
      alert("기대 사용시간을 0보다 크게 입력해주세요.");
      comparisonExpectedHours.focus();
      return false;
    }

    if (actualTotal < 0) {
      alert("실제 사용시간을 올바르게 입력해주세요.");
      comparisonActualHours.focus();
      return false;
    }
  } else if (type === "benefit") {
    // 적어도 하나의 혜택 유형이 선택되어야 함
    const selectedBenefits = document.querySelectorAll(
      'input[name="comparisonBenefitType"]:checked',
    );

    if (selectedBenefits.length === 0) {
      alert("적어도 하나의 혜택 유형을 선택해주세요.");
      return false;
    }

    // 선택된 혜택별 유효성 검사
    let hasValidInput = false;
    selectedBenefits.forEach((checkbox) => {
      const btype = checkbox.value;
      if (btype === "shipping") {
        const count =
          parseFloat(
            document.getElementById("comparisonBenefitShippingCount").value,
          ) || 0;
        const fee =
          parseFloat(
            document.getElementById("comparisonBenefitShippingFee").value,
          ) || 0;
        if (count > 0 && fee > 0) hasValidInput = true;
      } else if (btype === "coupon") {
        const total =
          parseFloat(
            document.getElementById("comparisonBenefitCouponTotal").value,
          ) || 0;
        if (total > 0) hasValidInput = true;
      } else if (btype === "memberDiscount") {
        const total =
          parseFloat(
            document.getElementById("comparisonBenefitMemberDiscountTotal")
              .value,
          ) || 0;
        if (total > 0) hasValidInput = true;
      } else if (btype === "points") {
        const value =
          parseFloat(
            document.getElementById("comparisonBenefitPointsValue").value,
          ) || 0;
        if (value > 0) hasValidInput = true;
      } else if (btype === "other") {
        const value =
          parseFloat(
            document.getElementById("comparisonBenefitOtherValue").value,
          ) || 0;
        if (value > 0) hasValidInput = true;
      }
    });

    if (!hasValidInput) {
      alert("선택한 혜택의 값을 입력해주세요.");
      return false;
    }
  } else if (type === "storage") {
    const totalCapacity = parseFloat(comparisonStorageTotalCapacity.value) || 0;
    const usedCapacity = parseFloat(comparisonStorageUsedCapacity.value) || 0;

    if (totalCapacity <= 0) {
      alert("제공 용량을 0보다 크게 입력해주세요.");
      comparisonStorageTotalCapacity.focus();
      return false;
    }

    if (usedCapacity < 0) {
      alert("사용 중인 용량을 올바르게 입력해주세요.");
      comparisonStorageUsedCapacity.focus();
      return false;
    }

    if (usedCapacity > totalCapacity) {
      alert("사용 중인 용량이 제공 용량보다 클 수 없습니다.");
      comparisonStorageUsedCapacity.focus();
      return false;
    }
  }

  return true;
}

/**
 * 구독 서비스 추가 이벤트
 */
/**
 * 구독 서비스 추가 이벤트
 */
btnAddSubscription.addEventListener("click", function () {
  const serviceName = comparisonServiceName.value.trim();
  const serviceFee = parseFloat(comparisonServiceFee.value);

  // 입력값 유효성 검사
  if (
    !validateComparisonInput(serviceName, serviceFee, currentComparisonType)
  ) {
    return;
  }

  try {
    // 선택한 유형의 Analyzer 생성
    const analyzer = createComparisonAnalyzer(
      currentComparisonType,
      serviceFee,
    );

    if (!analyzer) {
      alert("알 수 없는 유형입니다.");
      return;
    }

    // 분석 결과 도출 (활용률, 미활용 비용 등)
    const result = analyzer.getAnalysisResult();

    // 등급 부여 (활용률 기반)
    let grade = "C";
    if (result.utilizationRate >= 100) {
      grade = "A";
    } else if (result.utilizationRate >= 50) {
      grade = "B";
    }

    // 구독 데이터 추가 (type 필드 포함)
    // ...result를 먼저 spread한 후 type을 마지막에 배치하여 덮어쓰기
    const subscription = {
      id: Date.now(),
      serviceName,
      serviceFee,
      grade,
      ...result, // 유형별로 추가적인 정보 포함
      type: currentComparisonType, // 마지막에 배치하여 result.type 덮어쓰기
      utilizationRate: result.utilizationRate,
      unusedCost: result.unusedCost,
      annualUnusedCost: result.annualUnusedCost,
    };

    comparisonSubscriptions.push(subscription);

    // 입력 필드 초기화
    comparisonServiceName.value = "";
    comparisonServiceFee.value = "";
    clearComparisonTypeFields();
    comparisonServiceName.focus();

    // 결과 업데이트
    updateComparisonResults();
  } catch (error) {
    alert("계산 중 오류가 발생했습니다: " + error.message);
    console.error(error);
  }
});

/**
 * 복수 비교 - Enter 키로 서비스 추가 (유형별로 마지막 필드에서)
 */
// 콘텐츠형 Enter 키
comparisonActualMinutes.addEventListener("keypress", function (e) {
  if (e.key === "Enter" && currentComparisonType === "content") {
    btnAddSubscription.click();
  }
});

// 용량형 Enter 키
comparisonStorageUsedCapacity.addEventListener("keypress", function (e) {
  if (e.key === "Enter" && currentComparisonType === "storage") {
    btnAddSubscription.click();
  }
});

// 혜택형 - 마지막 선택된 혜택 필드에서 Enter 키 처리는 동적으로 됨
document.addEventListener("keypress", function (e) {
  if (
    e.key === "Enter" &&
    currentComparisonType === "benefit" &&
    (e.target.id.startsWith("comparisonBenefit") ||
      e.target.id.startsWith("comparison-benefit"))
  ) {
    btnAddSubscription.click();
  }
});

/**
 * 복수 비교 결과 업데이트 (정렬 기능 추가)
 */
function updateComparisonResults() {
  if (comparisonSubscriptions.length === 0) {
    comparisonResults.style.display = "none";
    emptyComparisonMessage.style.display = "block";
    return;
  }

  comparisonResults.style.display = "block";
  emptyComparisonMessage.style.display = "none";

  // 1차 정렬: 활용률 오름차순 (낮을수록 비효율)
  // 2차 정렬: 미활용 비용 내림차순
  comparisonSubscriptions.sort((a, b) => {
    if (a.utilizationRate !== b.utilizationRate) {
      return a.utilizationRate - b.utilizationRate;
    }
    return b.unusedCost - a.unusedCost;
  });

  // 테이블 업데이트
  updateComparisonTable();

  // 막대 그래프 업데이트
  updateUtilizationBars();

  // 비효율 분석 업데이트
  updateEfficiencyAnalysis();
}

/**
 * 비교 테이블 업데이트 (유형 컬럼 추가)
 */
function updateComparisonTable() {
  comparisonTableBody.innerHTML = comparisonSubscriptions
    .map((sub, index) => {
      const gradeClass = `grade-${sub.grade.toLowerCase()}`;
      return `
        <tr>
          <td>${sub.serviceName}</td>
          <td>${TYPE_LABELS_EMOJI[sub.type] || sub.type}</td>
          <td>${sub.utilizationRate.toFixed(1)}%</td>
          <td>${calculator.formatCurrency(sub.unusedCost)}원</td>
          <td>
            <span class="${gradeClass}">${sub.grade}</span>
          </td>
          <td>
            <button
              class="btn-delete-service"
              onclick="deleteSubscription(${sub.id})"
            >
              삭제
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

/**
 * 활용률 막대 그래프 업데이트 (정렬된 순서 반영)
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
          <div class="bar-wrapper">
            <div class="bar-container">
              <div class="${barClass}" style="width: ${percentage}%"></div>
            </div>
            <div class="bar-percentage">${sub.utilizationRate.toFixed(1)}%</div>
          </div>
        </div>
      `;
    })
    .join("");
}

/**
 * 비효율 분석 업데이트 (강화된 버전)
 */
function updateEfficiencyAnalysis() {
  if (comparisonSubscriptions.length === 0) {
    return;
  }

  // 가장 낮은 활용률 찾기 (가장 비효율적)
  const leastEfficient = comparisonSubscriptions[0]; // 이미 정렬되어 있음

  // 평균 활용률 계산
  const avgUtilization =
    comparisonSubscriptions.reduce((sum, sub) => sum + sub.utilizationRate, 0) /
    comparisonSubscriptions.length;

  // 전체 미활용 비용
  const totalUnusedCost = comparisonSubscriptions.reduce(
    (sum, sub) => sum + sub.unusedCost,
    0,
  );

  efficiencyAnalysis.innerHTML = `
    <h4>⚠️ 비효율성 분석</h4>
    <div class="efficiency-summary">
      <p><strong>가장 비효율적인 구독:</strong> ${leastEfficient.serviceName}</p>
      <p class="efficiency-detail">유형: ${TYPE_LABELS_EMOJI[leastEfficient.type] || "알 수 없음"} | 활용률: ${leastEfficient.utilizationRate.toFixed(1)}%</p>
      <p class="efficiency-highlight">월 손실: <strong>${calculator.formatCurrency(leastEfficient.unusedCost)}원</strong></p>
      <p class="efficiency-highlight">연간 손실: <strong>${calculator.formatCurrency(leastEfficient.annualUnusedCost)}원</strong></p>
    </div>
    <div class="efficiency-stats">
      <p>📊 평균 활용률: ${avgUtilization.toFixed(1)}%</p>
      <p>💰 전체 월 손실: ${calculator.formatCurrency(totalUnusedCost)}원</p>
      <p>📅 전체 연 손실: ${calculator.formatCurrency(totalUnusedCost * 12)}원</p>
    </div>
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
