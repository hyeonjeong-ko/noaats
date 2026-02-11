/**
 * 구독 서비스 손익분기 계산기
 * v3 - 생활소비 환산 모델 (커피 잔 수 기준)
 */

class SubscriptionCalculator {
  // 생활소비 기준가 (다중 항목)
  COFFEE_PRICE = 3500;
  CHICKEN_PRICE = 21000;
  MOVIE_PRICE = 13000;
  LUNCH_PRICE = 9500;
  SUBWAY_PRICE = 1500;
  /**
   * 활용률 기반 손익분기 계산 (v2)
   * 공식: 활용률 = 실제 사용 시간 ÷ 기대 사용 시간 × 100%
   *
   * @param {number} monthlyFee - 월 구독료 (원)
   * @param {number} expectedHours - 기대 사용 시간 (시간)
   * @param {number} expectedMinutes - 기대 사용 시간 (분)
   * @param {number} actualHours - 실제 사용 시간 (시간)
   * @param {number} actualMinutes - 실제 사용 시간 (분)
   * @returns {object} 계산 결과
   */
  calculateUtilization(
    monthlyFee,
    expectedHours,
    expectedMinutes = 0,
    actualHours,
    actualMinutes = 0,
  ) {
    // 입력값 검증
    if (
      monthlyFee < 0 ||
      expectedHours < 0 ||
      expectedMinutes < 0 ||
      actualHours < 0 ||
      actualMinutes < 0
    ) {
      throw new Error("입력값은 0 이상이어야 합니다.");
    }

    // 시간 단위로 통합 (분을 시간으로 변환)
    const expectedTotalHours = expectedHours + expectedMinutes / 60;
    const actualTotalHours = actualHours + actualMinutes / 60;

    // 기대 사용 시간이 0이면 예외 처리
    if (expectedTotalHours === 0) {
      throw new Error("기대 사용 시간은 0보다 커야 합니다.");
    }

    // 실제 사용 시간이 0인 경우 처리
    if (actualTotalHours === 0) {
      return {
        monthlyFee: monthlyFee,
        expectedTotalHours: expectedTotalHours,
        actualTotalHours: actualTotalHours,
        utilizationRate: 0,
        costPerHour: 0,
        timestamp: new Date(),
      };
    }

    // 활용률 계산 (%)
    const utilizationRate =
      Math.round((actualTotalHours / expectedTotalHours) * 10000) / 100;

    // 시간당 비용 계산
    const costPerHour = Math.round((monthlyFee / actualTotalHours) * 100) / 100;

    // v3 추가: 미활용 비용 = 월 구독료 × (1 - 활용률%)
    const unusedCost =
      Math.round(monthlyFee * (1 - utilizationRate / 100) * 100) / 100;

    // v3 추가: 연간 누적 손실 = 미활용 비용 × 12
    const annualUnusedCost = Math.round(unusedCost * 12 * 100) / 100;

    // v3 추가: 남은 사용 시간 = 기대 사용 시간 - 실제 사용 시간
    const remainingHours = Math.max(0, expectedTotalHours - actualTotalHours);

    // v4 추가: 커피 잔 수 환산
    const coffeeEquivalent = monthlyFee / this.COFFEE_PRICE;
    const unusedCoffeeCups = unusedCost / this.COFFEE_PRICE;

    return {
      monthlyFee: monthlyFee,
      expectedTotalHours: expectedTotalHours,
      actualTotalHours: actualTotalHours,
      utilizationRate: utilizationRate,
      costPerHour: costPerHour,
      unusedCost: unusedCost,
      annualUnusedCost: annualUnusedCost,
      remainingHours: remainingHours,
      coffeeEquivalent: coffeeEquivalent,
      unusedCoffeeCups: unusedCoffeeCups,
      timestamp: new Date(),
    };
  }

  /**
   * 활용률 기반 의사결정 메시지 생성
   * @param {object} result - calculateUtilization 결과
   * @returns {string} 의사결정 메시지
   */
  generateDecisionMessage(result) {
    const { utilizationRate, expectedTotalHours, actualTotalHours } = result;

    if (actualTotalHours === 0) {
      return `
        <strong style="color: #dc3545;">🔴 사용 시간이 0입니다.</strong>
        <br><br>
        기대했던 ${this.formatHours(expectedTotalHours)}의 사용이 전혀 이루어지지 않았습니다.
        <br>구독 서비스의 해지를 검토하는 것을 강력히 권장합니다.
      `;
    }

    if (utilizationRate >= 100) {
      return `
        <strong style="color: #28a745;">✅ 기대 수준 이상으로 충족했습니다.</strong>
        <br><br>
        예상했던 사용량${this.formatHours(expectedTotalHours)}을(를) ${utilizationRate.toFixed(0)}% 달성하신 상태입니다.
        <br>현재 사용 패턴을 유지하시는 것을 권장합니다.
      `;
    }

    if (utilizationRate >= 50) {
      return `
        <strong style="color: #ffc107;">🟡 양호하지만 개선 여지가 있습니다.</strong>
        <br><br>
        기대 사용량의 ${utilizationRate.toFixed(0)}%만 달성한 상태입니다.
        <br>앞으로 ${this.formatHours(expectedTotalHours - actualTotalHours)}를 더 활용하면 구독 가치를 더욱 높일 수 있습니다.
      `;
    }

    return `
      <strong style="color: #dc3545;">🔴 사용량이 기대 수준 이하입니다.</strong>
      <br><br>
      기대 사용량의 겨우 ${utilizationRate.toFixed(0)}%만 사용 중입니다.
      <br>구독 해지를 검토하거나, 향후 사용 계획을 재검토하기를 강력히 권장합니다.
    `;
  }

  /**
   * v3: 미활용 비용 및 손실 정보 메시지 생성
   * @param {object} result - calculateUtilization 결과
   * @returns {string} 미활용 비용 관련 메시지
   */
  generateUnusedCostMessage(result) {
    const { monthlyFee, unusedCost, annualUnusedCost, utilizationRate } =
      result;

    if (utilizationRate >= 100) {
      return `
        <strong style="color: #28a745;">💚 미활용 비용이 없습니다!</strong>
        <br><br>
        기대 수준 이상으로 활용하고 있어 추가 충고는 불필요합니다.
      `;
    }

    return `
      <strong>이번 달 미활용 비용:</strong> ${this.formatCurrency(unusedCost)}원
      <br>
      <strong>1년 누적 손실:</strong> ${this.formatCurrency(annualUnusedCost)}원
      <br><br>
      <em>이번 달 약 ${this.formatCurrency(unusedCost)}원의 가치가 충분히 활용되지 않았습니다.<br>
      1년 유지 시 약 ${this.formatCurrency(annualUnusedCost)}원의 미활용 비용이 발생할 수 있습니다.</em>
    `;
  }

  /**
   * v3: 본전 회복 시뮬레이터 메시지 생성
   * @param {object} result - calculateUtilization 결과
   * @returns {string} 본전 회복 시뮬레이터 메시지
   */
  generateBreakEvenSimulator(result) {
    const { remainingHours, utilizationRate } = result;

    if (utilizationRate >= 100) {
      return `
        <strong style="color: #28a745;">✅ 이미 본전을 넘었습니다!</strong><br>
        추가 사용이 필요없습니다.
      `;
    }

    if (remainingHours <= 0) {
      return `
        <strong style="color: #28a745;">✅ 이미 본전을 넘었습니다!</strong>
      `;
    }

    // 남은 사용 시간 계산
    const remainingHoursFull = Math.floor(remainingHours);
    const remainingMinutes = Math.round(
      (remainingHours - remainingHoursFull) * 60,
    );

    // 일일 권장 사용량 (20분)을 기준으로 필요 일수 계산
    const dailyUsageMinutes = 20;
    const requiredDays = Math.ceil(
      (remainingHoursFull * 60 + remainingMinutes) / dailyUsageMinutes,
    );

    return `
      <strong>기대 기준까지 남은 사용:</strong> ${this.formatHours(remainingHours)}
      <br>
      <strong>일일 20분 사용 시:</strong> ${requiredDays}일 후 본전 도달
      <br><br>
      <em>하루 20분씩 ${requiredDays}일 더 사용하면 기대 기준에 도달합니다.</em>
    `;
  }

  /**
   * v4: 생활소비 항목 목록 반환
   * @returns {object} 생활소비 항목과 가격
   */
  getLifestyleItems() {
    return {
      coffee: { name: "☕ 커피 1잔", price: this.COFFEE_PRICE },
      chicken: { name: "🍗 치킨 1마리", price: this.CHICKEN_PRICE },
      movie: { name: "🎬 영화 티켓", price: this.MOVIE_PRICE },
      lunch: { name: "🍜 점심 한 끼", price: this.LUNCH_PRICE },
      subway: { name: "🚇 지하철 1회", price: this.SUBWAY_PRICE },
    };
  }

  /**
   * v4: 선택된 생활소비 항목으로 환산 메시지 생성
   * @param {object} result - calculateUtilization 결과
   * @param {string} itemKey - 선택된 항목 키 (coffee, chicken, movie, lunch, subway)
   * @returns {string} 생활소비 환산 메시지
   */
  generateLifestyleEquivalenceMessage(result, itemKey = "coffee") {
    const items = this.getLifestyleItems();
    const item = items[itemKey];

    if (!item) {
      return "<em>항목을 선택해주세요.</em>";
    }

    const monthlyEquivalent = result.monthlyFee / item.price;
    const unusedEquivalent = result.unusedCost / item.price;

    // 이모지와 상품명 분리
    const parts = item.name.split(" ");
    const emoji = parts[0];
    const product = parts[1];

    return `
      <strong>월 구독료 환산:</strong> ${emoji} ${product} <strong>${monthlyEquivalent.toFixed(1)}개</strong>
      <br>
      <strong>낭비된 가치:</strong> ${emoji} ${product} <strong>${unusedEquivalent.toFixed(1)}개</strong>
      <br><br>
      <em>이 구독은 매달 ${emoji} ${product} 약 ${monthlyEquivalent.toFixed(1)}개의 가치입니다.<br>
      이번 달 낭비한 것은 ${emoji} ${product} 약 ${unusedEquivalent.toFixed(1)}개입니다.</em>
    `;
  }

  /**
   * v4: 커피 환산 메시지 생성 (하위호환성)
   * @param {object} result - calculateUtilization 결과
   * @returns {string} 커피 환산 메시지
   */
  generateCoffeeEquivalenceMessage(result) {
    return this.generateLifestyleEquivalenceMessage(result, "coffee");
  }

  /**
   * 숫자를 한국 원화 형식으로 포맷
   * @param {number} value - 숫자값
   * @returns {string} 포맷된 문자열
   */
  formatCurrency(value) {
    return `${Math.round(value).toLocaleString("ko-KR")}`;
  }

  /**
   * 시간을 포맷 (시간:분 형식)
   * @param {number} hours - 시간 (소수점 포함 가능)
   * @returns {string} 포맷된 문자열 "X시간 Y분"
   */
  formatHours(hours) {
    if (hours === 0) return "0시간";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) return `${h}시간`;
    return `${h}시간 ${m}분`;
  }
}

// Node.js 환경 (Jest 테스트)에서 export
if (typeof module !== "undefined" && module.exports) {
  module.exports = SubscriptionCalculator;
}
