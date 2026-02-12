/**
 * 구독 서비스 분석 - 기본 인터페이스 (추상 클래스)
 * 모든 구독 유형이 따르는 공통 구조
 */

class SubscriptionAnalyzer {
  // 공통 상수
  COFFEE_PRICE = 3500;
  LUNCH_PRICE = 9500;
  SUBWAY_PRICE = 1500;
  MOVIE_PRICE = 13000;
  CHICKEN_PRICE = 21000;

  /**
   * 활용률 계산 (0 ~ 1.0+)
   * 활용률 = 실제 가치 / 구독료
   * @returns {number} 0 이상의 숫자 (1.0 = 100%)
   */
  calculateUtilization() {
    throw new Error("calculateUtilization() 반드시 구현");
  }

  /**
   * 미활용 비용 계산 (0 이상만)
   * 활용률 < 100%일 때만 값 존재
   * @returns {number} 0 이상의 숫자
   */
  calculateUnusedCost() {
    const utilization = this.calculateUtilization();
    if (utilization >= 1.0) return 0; // 100% 이상이면 미활용 비용 없음
    const unused = this.monthlyFee * (1 - utilization);
    return Math.round(unused * 100) / 100;
  }

  /**
   * 초과 가치 계산 (0 이상만)
   * 활용률 > 100%일 때만 값 존재
   * @returns {number} 0 이상의 숫자
   */
  calculateSurplusValue() {
    const utilization = this.calculateUtilization();
    if (utilization < 1.0) return 0; // 100% 미만이면 초과 가치 없음
    const surplus = this.monthlyFee * (utilization - 1.0);
    return Math.round(surplus * 100) / 100;
  }

  /**
   * 연간 미활용 비용
   */
  calculateAnnualUnusedCost() {
    return Math.round(this.calculateUnusedCost() * 12 * 100) / 100;
  }

  /**
   * 의사결정 메시지
   */
  generateDecisionMessage() {
    const utilization = this.calculateUtilization();

    if (utilization >= 1.0) {
      return {
        level: "perfect",
        icon: "✅",
        text: `기대 수준 이상으로 충족했습니다. (${(utilization * 100).toFixed(0)}%)`,
      };
    } else if (utilization >= 0.5) {
      return {
        level: "adequate",
        icon: "△",
        text: `적절한 활용 수준입니다. (${(utilization * 100).toFixed(0)}%)`,
      };
    } else {
      return {
        level: "poor",
        icon: "✕",
        text: `활용도가 낮습니다. 구독 필요성을 재검토하세요. (${(utilization * 100).toFixed(0)}%)`,
      };
    }
  }

  /**
   * 생활 소비 단위 환산
   */
  calculateLifestyleEquivalence(item = "coffee") {
    const prices = {
      coffee: this.COFFEE_PRICE,
      lunch: this.LUNCH_PRICE,
      subway: this.SUBWAY_PRICE,
      movie: this.MOVIE_PRICE,
      chicken: this.CHICKEN_PRICE,
    };

    const price = prices[item] || this.COFFEE_PRICE;
    const unused = this.calculateUnusedCost();
    return Math.round((unused / price) * 100) / 100;
  }

  /**
   * 통화 포맷팅
   */
  formatCurrency(value) {
    return Math.round(value).toLocaleString("ko-KR");
  }

  /**
   * 최종 결과 객체 (공통 포맷)
   */
  getAnalysisResult() {
    const utilization = this.calculateUtilization();
    const unused = this.calculateUnusedCost();
    const surplus = this.calculateSurplusValue();

    return {
      type: this.constructor.name,
      monthlyFee: this.monthlyFee,
      utilizationRate: Math.round(utilization * 10000) / 100, // 퍼센트 형태 (0-100)
      unusedCost: unused,
      surplusValue: surplus,
      annualUnusedCost: this.calculateAnnualUnusedCost(),
      decision: this.generateDecisionMessage(),
      equivalence: this.calculateLifestyleEquivalence("coffee"),
      timestamp: new Date().toISOString(),
    };
  }
}

// ===== 타입 내보내기 =====
if (typeof window !== "undefined") {
  window.SubscriptionAnalyzer = SubscriptionAnalyzer;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = SubscriptionAnalyzer;
}
