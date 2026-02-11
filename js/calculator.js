/**
 * 구독 서비스 손익분기 계산기
 * v2 - 활용률 기반 손익분기 의사결정 모델
 */

class SubscriptionCalculator {
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

    return {
      monthlyFee: monthlyFee,
      expectedTotalHours: expectedTotalHours,
      actualTotalHours: actualTotalHours,
      utilizationRate: utilizationRate,
      costPerHour: costPerHour,
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

  /**
   * 계산 결과 저장 (localStorage)
   * @param {object} result - 계산 결과
   */
  saveResult(result) {
    try {
      const history = this.getHistory();
      history.push(result);
      localStorage.setItem("subscriptionHistory", JSON.stringify(history));
    } catch (e) {
      console.warn("로컬 저장소 사용 불가:", e);
    }
  }

  /**
   * 계산 이력 조회
   * @returns {array} 계산 이력
   */
  getHistory() {
    try {
      const history = localStorage.getItem("subscriptionHistory");
      return history ? JSON.parse(history) : [];
    } catch (e) {
      console.warn("로컬 저장소 접근 불가:", e);
      return [];
    }
  }
}
