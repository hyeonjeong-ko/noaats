/**
 * 용량 기반형 분석 (클라우드 저장소)
 * 예: Google Drive, OneDrive, iCloud
 *
 * 입력: 월 구독료, 제공 용량, 사용 용량 (단위: KB, MB, GB, TB)
 */

class StorageBasedAnalyzer extends SubscriptionAnalyzer {
  /**
   * @param {number} monthlyFee - 월 구독료 (원)
   * @param {number} totalCapacity - 제공 용량
   * @param {number} usedCapacity - 사용 용량
   * @param {string} totalUnit - 제공 용량 단위 (kb, mb, gb, tb)
   * @param {string} usedUnit - 사용 용량 단위 (kb, mb, gb, tb)
   */
  constructor(
    monthlyFee,
    totalCapacity,
    usedCapacity,
    totalUnit = "gb",
    usedUnit = "gb",
  ) {
    super();
    this.monthlyFee = monthlyFee;
    this.originalTotalCapacity = totalCapacity;
    this.originalUsedCapacity = usedCapacity;
    this.totalUnit = totalUnit.toLowerCase();
    this.usedUnit = usedUnit.toLowerCase();

    // GB로 통일 변환
    this.totalCapacityGB = this.convertToGB(totalCapacity, this.totalUnit);
    this.usedCapacityGB = this.convertToGB(usedCapacity, this.usedUnit);

    // 입력값 검증
    if (
      monthlyFee < 0 ||
      this.totalCapacityGB <= 0 ||
      this.usedCapacityGB < 0 ||
      this.usedCapacityGB > this.totalCapacityGB
    ) {
      throw new Error("올바른 형식의 입력값이 필요합니다");
    }
  }

  /**
   * 각 단위를 GB로 변환
   * @param {number} value - 변환할 값
   * @param {string} unit - 단위 (kb, mb, gb, tb)
   * @returns {number} GB 단위로 변환된 값
   */
  convertToGB(value, unit) {
    const conversionTable = {
      kb: value / (1024 * 1024), // 1KB = 1/1048576 GB
      mb: value / 1024, // 1MB = 1/1024 GB
      gb: value, // 1GB = 1 GB
      tb: value * 1024, // 1TB = 1024 GB
    };

    return conversionTable[unit] || value;
  }

  /**
   * GB에서 원래 단위로 역변환
   */
  convertFromGB(valueGB, unit) {
    const reverseTable = {
      kb: valueGB * 1024 * 1024,
      mb: valueGB * 1024,
      gb: valueGB,
      tb: valueGB / 1024,
    };

    return Math.round(reverseTable[unit] * 100) / 100;
  }

  /**
   * 활용률 = 사용 용량 / 제공 용량
   */
  calculateUtilization() {
    return this.usedCapacityGB / this.totalCapacityGB;
  }

  /**
   * 남은 용량 (GB)
   */
  calculateRemainingCapacityGB() {
    return this.totalCapacityGB - this.usedCapacityGB;
  }

  /**
   * 남은 용량을 원래 단위로 표시
   */
  calculateRemainingCapacity() {
    return this.convertFromGB(
      this.calculateRemainingCapacityGB(),
      this.totalUnit,
    );
  }

  /**
   * 1GB당 비용
   */
  calculateCostPerGB() {
    if (this.totalCapacityGB === 0) return 0;
    return Math.round((this.monthlyFee / this.totalCapacityGB) * 100) / 100;
  }

  /**
   * 본전 회복 필요 용량 (GB 기준)
   */
  calculateBreakevenCapacityGB() {
    return Math.max(0, this.totalCapacityGB - this.usedCapacityGB);
  }

  /**
   * 본전 회복 필요 용량 (원래 단위)
   */
  calculateBreakevenCapacity() {
    return this.convertFromGB(
      this.calculateBreakevenCapacityGB(),
      this.totalUnit,
    );
  }

  /**
   * 최종 결과 (용량형 특화)
   */
  getAnalysisResult() {
    const base = super.getAnalysisResult();

    return {
      ...base,
      totalCapacity: this.originalTotalCapacity,
      totalCapacityGB: this.totalCapacityGB,
      totalUnit: this.totalUnit,
      usedCapacity: this.originalUsedCapacity,
      usedCapacityGB: this.usedCapacityGB,
      usedUnit: this.usedUnit,
      remainingCapacity: this.calculateRemainingCapacity(),
      remainingCapacityGB: this.calculateRemainingCapacityGB(),
      costPerGB: this.calculateCostPerGB(),
      breakEvenCapacity: this.calculateBreakevenCapacity(),
      breakEvenCapacityGB: this.calculateBreakevenCapacityGB(),
    };
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = StorageBasedAnalyzer;
}
