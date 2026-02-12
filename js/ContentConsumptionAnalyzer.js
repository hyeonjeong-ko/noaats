/**
 * 콘텐츠 소비형 분석 (OTT, 음악, 유튜브)
 * 예: Netflix, Spotify, YouTube Premium
 *
 * 입력: 월 구독료, 실제 사용 시간, 기대 사용 시간
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

  class ContentConsumptionAnalyzer extends SubscriptionAnalyzer {
    /**
     * @param {number} monthlyFee - 월 구독료 (원)
     * @param {number} expectedHours - 기대 사용 시간
     * @param {number} actualHours - 실제 사용 시간
     * @param {number} expectedMinutes - 기대 사용 분 (선택)
     * @param {number} actualMinutes - 실제 사용 분 (선택)
     */
    constructor(
      monthlyFee,
      expectedHours,
      actualHours,
      expectedMinutes = 0,
      actualMinutes = 0,
    ) {
      super();
      this.monthlyFee = monthlyFee;

      // 시간과 분을 통합
      this.expectedHours = expectedHours + expectedMinutes / 60;
      this.actualHours = actualHours + actualMinutes / 60;

      // 입력값 검증
      if (monthlyFee < 0 || this.expectedHours <= 0 || this.actualHours < 0) {
        throw new Error("올바른 형식의 입력값이 필요합니다");
      }
    }

    /**
     * 활용률 = 실제 사용 시간 / 기대 사용 시간
     */
    calculateUtilization() {
      if (this.expectedHours === 0) return 0;
      return this.actualHours / this.expectedHours;
    }

    /**
     * 시간당 비용 = 월 구독료 / 실제 사용 시간
     */
    calculateCostPerHour() {
      if (this.actualHours === 0) return 0;
      return Math.round((this.monthlyFee / this.actualHours) * 100) / 100;
    }

    /**
     * 본전 회복 필요 시간 = 기대 사용 시간 - 실제 사용 시간
     */
    calculateBreakevenHours() {
      return Math.max(0, this.expectedHours - this.actualHours);
    }

    /**
     * 최종 결과 (콘텐츠형 특화)
     */
    getAnalysisResult() {
      const base = super.getAnalysisResult();

      return {
        ...base,
        expectedHours: this.expectedHours,
        actualHours: this.actualHours,
        costPerHour: this.calculateCostPerHour(),
        breakEvenHours: this.calculateBreakevenHours(),
      };
    }
  }

  // IIFE 내부에서 window에 등록
  if (typeof window !== "undefined") {
    window.ContentConsumptionAnalyzer = ContentConsumptionAnalyzer;
  }

  // Node.js 환경
  if (typeof module !== "undefined" && module.exports) {
    module.exports = ContentConsumptionAnalyzer;
  }
})();
