/**
 * 구독 서비스 분석 - 타입별 처리 모듈
 * ContentConsumptionAnalyzer, BenefitConsumptionAnalyzer, StorageBasedAnalyzer 통합
 */

// 타입별 필드 관리
function setupTypeSelection() {
  const typeRadios = document.querySelectorAll(
    'input[name="subscriptionType"]',
  );
  const contentFields = document.getElementById("content-fields");
  const benefitFields = document.getElementById("benefit-fields");
  const storageFields = document.getElementById("storage-fields");

  typeRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      // 모든 필드 숨김
      contentFields.style.display = "none";
      benefitFields.style.display = "none";
      storageFields.style.display = "none";

      // 선택된 타입의 필드만 표시
      if (this.value === "content") {
        contentFields.style.display = "block";
      } else if (this.value === "benefit") {
        benefitFields.style.display = "block";
      } else if (this.value === "storage") {
        storageFields.style.display = "block";
      }
    });
  });
}

/**
 * 선택된 타입에 따른 분석기 생성
 */
function createAnalyzer(type, monthlyFee) {
  switch (type) {
    case "content":
      const expectedHours =
        parseFloat(document.getElementById("expectedHours").value) || 0;
      const expectedMinutes =
        parseFloat(document.getElementById("expectedMinutes").value) || 0;
      const actualHours =
        parseFloat(document.getElementById("actualHours").value) || 0;
      const actualMinutes =
        parseFloat(document.getElementById("actualMinutes").value) || 0;

      return new ContentConsumptionAnalyzer(
        monthlyFee,
        expectedHours,
        actualHours,
        expectedMinutes,
        actualMinutes,
      );

    case "benefit":
      // 선택된 혜택 유형 수집
      const benefitTypes = {};
      const betypCheckboxes = document.querySelectorAll(
        'input[name="benefitType"]:checked',
      );

      betypCheckboxes.forEach((checkbox) => {
        const type = checkbox.value;
        if (type === "shipping") {
          benefitTypes.shipping = {
            count:
              parseFloat(
                document.getElementById("benefitShippingCount").value,
              ) || 0,
            fee:
              parseFloat(document.getElementById("benefitShippingFee").value) ||
              0,
          };
        } else if (type === "coupon") {
          benefitTypes.coupon = {
            total:
              parseFloat(document.getElementById("benefitCouponTotal").value) ||
              0,
          };
        } else if (type === "memberDiscount") {
          benefitTypes.memberDiscount = {
            total:
              parseFloat(
                document.getElementById("benefitMemberDiscountTotal").value,
              ) || 0,
          };
        } else if (type === "points") {
          benefitTypes.points = {
            value:
              parseFloat(document.getElementById("benefitPointsValue").value) ||
              0,
          };
        } else if (type === "other") {
          benefitTypes.other = {
            value:
              parseFloat(document.getElementById("benefitOtherValue").value) ||
              0,
          };
        }
      });

      return new BenefitConsumptionAnalyzer(monthlyFee, benefitTypes);

    case "storage":
      const totalCapacityValue =
        parseFloat(document.getElementById("storageTotalCapacity").value) || 0;
      const usedCapacityValue =
        parseFloat(document.getElementById("storageUsedCapacity").value) || 0;
      const totalUnit = document.getElementById(
        "storageTotalCapacityUnit",
      ).value;
      const usedUnit = document.getElementById("storageUsedCapacityUnit").value;

      return new StorageBasedAnalyzer(
        monthlyFee,
        totalCapacityValue,
        usedCapacityValue,
        totalUnit,
        usedUnit,
      );

    default:
      throw new Error("지원하지 않는 타입입니다");
  }
}

/**
 * 타입별 결과 표시
 */
function displayTypeResults(type, result) {
  const resultFeeElement = document.getElementById("resultFee");
  const resultUtilizationRateElement = document.getElementById(
    "resultUtilizationRate",
  );
  const decisionMessageElement = document.getElementById("decisionMessage");
  const unusedCostMessageElement = document.getElementById("unusedCostMessage");
  const breakEvenMessageElement = document.getElementById("breakEvenMessage");

  // 공통 정보
  resultFeeElement.textContent = `${Math.round(result.monthlyFee).toLocaleString("ko-KR")}원`;
  resultUtilizationRateElement.textContent = `${result.utilizationRate.toFixed(1)}%`;
  decisionMessageElement.innerHTML = `
    <span style="font-size: 20px; margin-right: 8px;">${result.decision.icon}</span>
    ${result.decision.text}
  `;

  unusedCostMessageElement.innerHTML = `
    <strong>월 낭비액:</strong> ${Math.round(result.unusedCost).toLocaleString("ko-KR")}원<br>
    <strong>연간 낭비액:</strong> ${Math.round(result.annualUnusedCost).toLocaleString("ko-KR")}원
  `;

  // 타입별 추가 정보
  if (type === "content") {
    const costPerHour = result.costPerHour;
    const breakEvenHours = result.breakEvenHours;
    breakEvenMessageElement.innerHTML = `
      <strong>시간당 비용:</strong> ${costPerHour.toLocaleString("ko-KR")}원<br>
      <strong>본전 회복 필요 시간:</strong> ${Math.ceil(breakEvenHours)}시간
    `;
  } else if (type === "benefit") {
    const actualValue = result.actualValue;
    const breakEvenUsage = result.breakEvenUsage;
    breakEvenMessageElement.innerHTML = `
      <strong>현재 획득 가치:</strong> ${Math.round(actualValue).toLocaleString("ko-KR")}원<br>
      <strong>본전 회복 필요 횟수:</strong> ${breakEvenUsage}회
    `;
  } else if (type === "storage") {
    const costPerGB = result.costPerGB;
    const remainingCapacity = result.remainingCapacity;
    const remainingCapacityGB = result.remainingCapacityGB;
    const totalUnit = result.totalUnit.toUpperCase();

    breakEvenMessageElement.innerHTML = `
      <strong>GB당 비용:</strong> ${costPerGB.toLocaleString("ko-KR")}원<br>
      <strong>남은 용량:</strong> ${remainingCapacity.toFixed(2)}${totalUnit} (${remainingCapacityGB.toFixed(2)}GB)<br>
      <strong>활용률:</strong> ${(result.utilizationRate * 100).toFixed(1)}%
    `;
  }
}

// DOM 준비 시 초기화
document.addEventListener("DOMContentLoaded", function () {
  setupTypeSelection();
});
