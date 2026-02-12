/**
 * 혜택 소비형 분석 (쿠팡, 멤버십 할인형)
 * 예: Coupang WOW, 각종 멤버십 카드
 *
 * 입력: 월 구독료, 혜택별 세부 정보
 * 혜택 유형: 무료배송, 할인쿠폰, 멤버십 전용 할인, 포인트 적립, 기타
 */

// IIFE: 브라우저/Node.js 모두 호환
(function () {
  // Node.js 환경에서 SubscriptionAnalyzer 로드
  let SubscriptionAnalyzer;
  if (typeof require !== "undefined" && typeof module !== "undefined") {
    SubscriptionAnalyzer = require("./SubscriptionAnalyzer.js");
  } else if (typeof window !== "undefined") {
    // 브라우저 환경: window에서 참조
    SubscriptionAnalyzer = window.SubscriptionAnalyzer;
  }

  class BenefitConsumptionAnalyzer extends SubscriptionAnalyzer {
    /**
     * @param {number} monthlyFee - 월 구독료 (원)
     * @param {object} benefitTypes - 혜택 유형별 정보
     *   {
     *     shipping: { count: 12, fee: 3000 },
     *     coupon: { total: 15000 },
     *     memberDiscount: { total: 8000 },
     *     points: { value: 5000 },
     *     other: { value: 2000 }
     *   }
     */
    constructor(monthlyFee, benefitTypes) {
      super();
      this.monthlyFee = monthlyFee;
      this.benefitTypes = benefitTypes || {};

      // 기존 호환성 (오래된 형식)
      if (typeof benefitTypes === "number") {
        // 이전 버전 호환: (monthlyFee, usageCount, savedPerUse)
        const usageCount = benefitTypes;
        const savedPerUse = arguments[2] || 0;
        this.benefitTypes = {
          other: { value: usageCount * savedPerUse },
        };
      }

      // 입력값 검증
      if (monthlyFee < 0) {
        throw new Error("올바른 형식의 입력값이 필요합니다");
      }
    }

    /**
     * 각 혜택별 절약액 계산
     */
    calculateBenefitSavings() {
      let totalSavings = 0;
      const savings = {};

      // 무료배송
      if (this.benefitTypes.shipping) {
        const shippingSaving =
          (this.benefitTypes.shipping.count || 0) *
          (this.benefitTypes.shipping.fee || 0);
        savings.shipping = shippingSaving;
        totalSavings += shippingSaving;
      }

      // 할인 쿠폰
      if (this.benefitTypes.coupon) {
        const couponSaving = this.benefitTypes.coupon.total || 0;
        savings.coupon = couponSaving;
        totalSavings += couponSaving;
      }

      // 멤버십 전용 할인
      if (this.benefitTypes.memberDiscount) {
        const memberSaving = this.benefitTypes.memberDiscount.total || 0;
        savings.memberDiscount = memberSaving;
        totalSavings += memberSaving;
      }

      // 포인트 적립
      if (this.benefitTypes.points) {
        const pointsSaving = this.benefitTypes.points.value || 0;
        savings.points = pointsSaving;
        totalSavings += pointsSaving;
      }

      // 기타
      if (this.benefitTypes.other) {
        const otherSaving = this.benefitTypes.other.value || 0;
        savings.other = otherSaving;
        totalSavings += otherSaving;
      }

      return { savings, totalSavings };
    }

    /**
     * 실제 획득 가치 = 모든 혜택의 총 절약액
     */
    calculateActualValue() {
      return this.calculateBenefitSavings().totalSavings;
    }

    /**
     * 활용률 = 실제 획득 가치 / 구독료
     * (혜택형은 100%를 초과할 수 있음)
     */
    calculateUtilization() {
      if (this.monthlyFee === 0) return 0;
      const utilizationRate = this.calculateActualValue() / this.monthlyFee;
      return utilizationRate; // 상한선 없음
    }

    /**
     * 본전 회복 필요 절약액 = 구독료 - 현재 획득 가치 (0 이상만)
     */
    calculateBreakevenSavings() {
      const needed = this.monthlyFee - this.calculateActualValue();
      return Math.max(needed, 0);
    }

    /**
     * 초과 획득 가치 = 현재 획득 가치 - 구독료 (0 이상만)
     */
    calculateSurplusValue() {
      const surplus = this.calculateActualValue() - this.monthlyFee;
      return Math.max(surplus, 0);
    }

    /**
     * 최종 결과 (혜택형 특화)
     */
    getAnalysisResult() {
      const base = super.getAnalysisResult();
      const { savings } = this.calculateBenefitSavings();
      const actualValue = this.calculateActualValue();

      return {
        ...base,
        actualValue: actualValue,
        benefitTypes: this.benefitTypes,
        benefitSavings: savings,
        breakEvenSavings: this.calculateBreakevenSavings(),
        breakEvenUsage:
          this.calculateBreakevenSavings() > 0
            ? Math.ceil(
                this.calculateBreakevenSavings() /
                  (this.calculateActualValue() || 1),
              )
            : 0,
      };
    }
  }

  // IIFE 내부에서 window에 등록
  if (typeof window !== "undefined") {
    window.BenefitConsumptionAnalyzer = BenefitConsumptionAnalyzer;
  }

  // Node.js 환경
  if (typeof module !== "undefined" && module.exports) {
    module.exports = BenefitConsumptionAnalyzer;
  }
})();
