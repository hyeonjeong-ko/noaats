/**
 * 구독 서비스 손익분기 계산기 - 메인 로직
 * UI 및 이벤트 핸들링
 */

// 전역 계산기 인스턴스
const calculator = new SubscriptionCalculator();

// DOM 요소들
const form = document.getElementById('calculatorForm');
const monthlyFeeInput = document.getElementById('monthlyFee');
const weeklyHoursInput = document.getElementById('weeklyHours');
const resultSection = document.getElementById('resultSection');

// 결과 요소들
const resultFeeElement = document.getElementById('resultFee');
const resultTotalHoursElement = document.getElementById('resultTotalHours');
const resultHourlyRateElement = document.getElementById('resultHourlyRate');
const decisionMessageElement = document.getElementById('decisionMessage');

/**
 * 폼 제출 이벤트 핸들러
 */
form.addEventListener('submit', function(e) {
    e.preventDefault();

    // 입력값 가져오기
    const monthlyFee = parseFloat(monthlyFeeInput.value);
    const weeklyHours = parseFloat(weeklyHoursInput.value);

    // 유효성 검사
    if (isNaN(monthlyFee) || isNaN(weeklyHours)) {
        alert('올바른 숫자를 입력해주세요.');
        return;
    }

    if (monthlyFee < 0 || weeklyHours < 0) {
        alert('음수는 입력할 수 없습니다.');
        return;
    }

    try {
        // 계산 수행
        const result = calculator.calculateBreakEven(monthlyFee, weeklyHours);

        // 결과 표시
        displayResults(result);

        // 결과 저장
        calculator.saveResult(result);

    } catch (error) {
        alert('계산 중 오류가 발생했습니다: ' + error.message);
    }
});

/**
 * 계산 결과를 UI에 표시
 * @param {object} result - 계산 결과
 */
function displayResults(result) {
    // 결과 요소 업데이트
    resultFeeElement.textContent = `${calculator.formatCurrency(result.monthlyFee)}원`;
    resultTotalHoursElement.textContent = calculator.formatHours(result.monthlyHours);
    resultHourlyRateElement.textContent = `${calculator.formatCurrency(result.hourlyRate)}원`;

    // 의사결정 메시지 생성 및 표시
    const decisionMessage = calculator.generateDecisionMessage(result);
    decisionMessageElement.innerHTML = decisionMessage;

    // 시간당 비용에 따른 스타일 적용
    applyDecisionStyle(result.hourlyRate);

    // 결과 섹션 표시
    resultSection.style.display = 'block';

    // 결과 섹션으로 스크롤
    setTimeout(() => {
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

/**
 * 시간당 비용에 따른 의사결정 스타일 적용
 * @param {number} hourlyRate - 시간당 비용
 */
function applyDecisionStyle(hourlyRate) {
    const decisionMsg = decisionMessageElement;

    // 기존 클래스 제거
    decisionMsg.classList.remove('good', 'warning', 'poor');

    // 새로운 클래스 추가
    if (hourlyRate < 1000) {
        decisionMsg.classList.add('good');
        decisionMessageElement.parentElement.style.background = '#d4edda';
        decisionMessageElement.parentElement.style.borderLeft = '4px solid #28a745';
    } else if (hourlyRate < 3000) {
        decisionMsg.classList.add('good');
        decisionMessageElement.parentElement.style.background = '#fff3cd';
        decisionMessageElement.parentElement.style.borderLeft = '4px solid #ffc107';
    } else if (hourlyRate < 5000) {
        decisionMsg.classList.add('warning');
        decisionMessageElement.parentElement.style.background = '#fff3cd';
        decisionMessageElement.parentElement.style.borderLeft = '4px solid #ffc107';
    } else {
        decisionMsg.classList.add('poor');
        decisionMessageElement.parentElement.style.background = '#f8d7da';
        decisionMessageElement.parentElement.style.borderLeft = '4px solid #dc3545';
    }
}

/**
 * 페이지 로드 시 초기화
 */
document.addEventListener('DOMContentLoaded', function() {
    // 초기 포커스 설정
    monthlyFeeInput.focus();

    // 개발 환경에서 기본값 설정 (선택사항)
    // monthlyFeeInput.value = '9900';
    // weeklyHoursInput.value = '10';
});

/**
 * 입력 필드 포커스 시 자동 선택
 */
monthlyFeeInput.addEventListener('focus', function() {
    this.select();
});

weeklyHoursInput.addEventListener('focus', function() {
    this.select();
});

/**
 * Enter 키로도 계산 가능하도록
 */
weeklyHoursInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        form.dispatchEvent(new Event('submit'));
    }
});