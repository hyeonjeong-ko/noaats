/**
 * 구독 서비스 손익분기 계산기
 * v1 - 기본 비용 대비 사용 시간 계산
 */

class SubscriptionCalculator {
  /**
   * 월 구독료 기반 시간당 비용 계산
   * @param {number} monthlyFee - 월 구독료 (원)
   * @param {number} weeklyHours - 주간 사용 시간
   * @returns {object} 계산 결과
   */
  calculateBreakEven(monthlyFee, weeklyHours) {
    // 입력값 검증
    if (monthlyFee < 0 || weeklyHours < 0) {
      throw new Error("입력값은 0 이상이어야 합니다.");
    }

    // 월 총 사용 시간 계산 (4주 기준)
    const monthlyHours = weeklyHours * 4;

    // 시간당 비용 계산
    const hourlyRate =
      monthlyHours > 0
        ? Math.round((monthlyFee / monthlyHours) * 100) / 100
        : 0;

    return {
      monthlyFee: monthlyFee,
      weeklyHours: weeklyHours,
      monthlyHours: monthlyHours,
      hourlyRate: hourlyRate,
      timestamp: new Date(),
    };
  }

  /**
   * 의사결정 메시지 생성
   * @param {object} result - 계산 결과
   * @returns {string} 의사결정 지원 메시지
   */
  generateDecisionMessage(result) {
    const { monthlyFee, monthlyHours, hourlyRate } = result;

    // 사용 시간이 0일 경우
    if (monthlyHours === 0) {
      return `
                <strong>사용 시간이 0입니다.</strong>
                <br>월 ${monthlyFee.toLocaleString()}원을 지출하고 있지만 사용하지 않고 있습니다.
                <br>구독을 취소하는 것을 추천합니다.
            `;
    }

    let message = `
            <strong>월 ${monthlyFee.toLocaleString()}원 구독 분석</strong>
            <br><br>
            <strong>📊 시간당 비용: ${hourlyRate.toLocaleString()}원/시간</strong>
            <br>
        `;

    // 시간당 비용에 따른 의사결정
    if (hourlyRate < 1000) {
      message += `
                ✅ <strong>매우 경제적입니다.</strong>
                <br>시간당 1,000원 미만으로 매우 저렴한 가격대입니다.
                <br>현재 사용 패턴을 유지하면 가치 있는 구독입니다.
            `;
    } else if (hourlyRate < 3000) {
      message += `
                🟢 <strong>경제적입니다.</strong>
                <br>시간당 3,000원 미만으로 일반적인 가격대입니다.
                <br>사용 시간을 조금 더 늘릴 수 있으면 더욱 가치 있습니다.
            `;
    } else if (hourlyRate < 5000) {
      message += `
                🟡 <strong>보통입니다.</strong>
                <br>시간당 5,000원 미만이지만 사용 효율을 고려해야 합니다.
                <br>월간 사용 시간을 늘릴 수 있는지 검토하세요.
            `;
    } else {
      message += `
                🔴 <strong>시간당 비용이 높습니다.</strong>
                <br>시간당 ${hourlyRate.toLocaleString()}원으로 비용 효율이 낮습니다.
                <br>사용 시간을 더 늘리거나 구독 취소를 고려하세요.
            `;
    }

    return message;
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

  /**
   * 숫자를 한국 원화 형식으로 포맷
   * @param {number} value - 숫자값
   * @returns {string} 포맷된 문자열
   */
  formatCurrency(value) {
    return `${Math.round(value).toLocaleString("ko-KR")}`;
  }

  /**
   * 시간을 포맷 (소수점 처리)
   * @param {number} hours - 시간
   * @returns {string} 포맷된 문자열
   */
  formatHours(hours) {
    return hours % 1 === 0 ? hours.toString() : hours.toFixed(1);
  }
}
