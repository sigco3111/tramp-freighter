import { useState } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import {
  FAILURE_CONFIG,
  SHIP_CONFIG,
  EVENT_NAMES,
} from '../../game/constants.js';
import { getConditionClass } from '../../game/utils/string-utils.js';

/**
 * MechanicalFailurePanel - React component for mechanical failure resolution
 *
 * Displays failure type and severity, shows repair options with success rates
 * and costs. Provides clear feedback on potential outcomes and resource costs.
 *
 * Architecture: danger-system
 * Validates: Requirements 6.6, 6.11, 12.1, 12.5
 *
 * @param {Object} props
 * @param {Object} props.failure - The mechanical failure object
 * @param {Function} props.onChoice - Callback when player makes a repair choice
 * @param {Function} props.onClose - Callback to close the panel
 */
export function MechanicalFailurePanel({ failure, onChoice, onClose }) {
  // Subscribe to relevant game events for repair context
  const hull = useGameEvent(EVENT_NAMES.HULL_CHANGED);
  const engine = useGameEvent(EVENT_NAMES.ENGINE_CHANGED);
  const lifeSupport = useGameEvent(EVENT_NAMES.LIFE_SUPPORT_CHANGED);
  const credits = useGameEvent(EVENT_NAMES.CREDITS_CHANGED);

  // Local state for selected repair option
  const [selectedOption, setSelectedOption] = useState(null);

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
  };

  const handleConfirm = () => {
    if (selectedOption && onChoice) {
      onChoice(selectedOption);
    }
  };

  const handleCancel = () => {
    setSelectedOption(null);
  };

  // Determine failure severity for display
  const severity = getFailureSeverity(failure.type, failure.severity);
  const severityColor = getFailureSeverityColor(severity);

  return (
    <div
      id="mechanical-failure-panel"
      className="panel-base visible"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mechanical-failure-title"
    >
      <button className="close-btn" onClick={onClose} aria-label="닫기">
        ×
      </button>
      <h2 id="mechanical-failure-title">기계 고장</h2>

      <div className="failure-content">
        {/* Failure Status Section */}
        <div className="failure-section failure-status">
          <h3>시스템 고장</h3>
          <div className="failure-info">
            <div className="failure-type">
              <span className="type-label">고장 유형:</span>
              <span className="type-value">
                {formatFailureType(failure.type)}
              </span>
            </div>
            <div className="failure-severity">
              <span className="severity-label">심각도:</span>
              <span
                className={`severity-value ${severity}`}
                style={{ color: severityColor }}
              >
                {SEVERITY_LABEL_KO[severity] ||
                  severity.charAt(0).toUpperCase() + severity.slice(1)}
              </span>
            </div>
            <div className="failure-description">
              {getFailureDescription(failure.type)}
            </div>
            <div className="system-alert">{getSystemAlert(failure.type)}</div>
          </div>
        </div>

        {/* Ship Status Section */}
        <div className="failure-section ship-status">
          <h3>함선 상태</h3>
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">선체 무결성:</span>
              <span className={`status-value ${getConditionClass(hull)}`}>
                {Math.round(hull ?? 100)}%
              </span>
              <span className="status-impact">
                {(hull ?? 100) < SHIP_CONFIG.CONDITION_WARNING_THRESHOLDS.HULL
                  ? '구조적 약화 감지'
                  : '선체 안정'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">엔진 상태:</span>
              <span className={`status-value ${getConditionClass(engine)}`}>
                {Math.round(engine ?? 100)}%
              </span>
              <span className="status-impact">
                {(engine ?? 100) <
                SHIP_CONFIG.CONDITION_WARNING_THRESHOLDS.ENGINE
                  ? '엔진 상태 위급'
                  : '엔진 정상 작동'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">생명 유지:</span>
              <span
                className={`status-value ${getConditionClass(lifeSupport)}`}
              >
                {Math.round(lifeSupport ?? 100)}%
              </span>
              <span className="status-impact">
                {(lifeSupport ?? 100) <
                SHIP_CONFIG.CONDITION_WARNING_THRESHOLDS.LIFE_SUPPORT
                  ? '생명 유지 장치 고장 중'
                  : '환경 안정'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">보유 크레딧:</span>
              <span className="status-value">
                ₡{(credits || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Repair Options Section */}
        <div className="failure-section repair-options">
          <h3>수리 선택지</h3>
          <div className="options-list">
            {/* Engine Failure Specific Options */}
            {failure.type === 'engine_failure' && (
              <>
                {/* Emergency Restart Option */}
                <button
                  className={`repair-option ${selectedOption === 'emergency_restart' ? 'selected' : ''}`}
                  onClick={() => handleOptionSelect('emergency_restart')}
                >
                  <div className="option-header">
                    <span className="option-name">긴급 재시동</span>
                    <span className="option-type">응급 처치</span>
                  </div>
                  <div className="option-description">
                    비상 프로토콜로 엔진 재시동을 시도합니다. 위험하지만 빠릅니다.
                  </div>
                  <div className="option-analysis">
                    <div className="probability-display">
                      <span className="prob-label">성공률:</span>
                      <span className="prob-value">
                        {Math.round(
                          FAILURE_CONFIG.ENGINE_FAILURE.EMERGENCY_RESTART
                            .CHANCE * 100
                        )}
                        %
                      </span>
                    </div>
                    <div className="cost-display">
                      <span className="cost-label">엔진 마모:</span>
                      <span className="cost-value">
                        -
                        {
                          FAILURE_CONFIG.ENGINE_FAILURE.EMERGENCY_RESTART
                            .ENGINE_COST
                        }
                        %
                      </span>
                    </div>
                  </div>
                  <div className="option-outcomes">
                    <div className="outcome success">
                      <span className="outcome-label">성공:</span>
                      <span className="outcome-text">
                        엔진 재시동, -
                        {
                          FAILURE_CONFIG.ENGINE_FAILURE.EMERGENCY_RESTART
                            .ENGINE_COST
                        }
                        % 엔진 상태
                      </span>
                    </div>
                    <div className="outcome failure">
                      <span className="outcome-label">실패:</span>
                      <span className="outcome-text">
                        엔진 여전히 고장, -
                        {
                          FAILURE_CONFIG.ENGINE_FAILURE.EMERGENCY_RESTART
                            .ENGINE_COST
                        }
                        % 엔진 상태
                      </span>
                    </div>
                  </div>
                </button>

                {/* Call for Help Option */}
                <button
                  className={`repair-option ${selectedOption === 'call_for_help' ? 'selected' : ''} ${credits < FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.CREDITS_COST ? 'disabled' : ''}`}
                  disabled={
                    credits <
                    FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.CREDITS_COST
                  }
                  onClick={() => handleOptionSelect('call_for_help')}
                >
                  <div className="option-header">
                    <span className="option-name">도움 요청</span>
                    <span className="option-type">전문 수리</span>
                  </div>
                  <div className="option-description">
                    긴급 서비스에 연락해 전문 수리 지원을 받습니다.
                  </div>
                  <div className="option-analysis">
                    <div className="guaranteed-success">
                      <span className="prob-label">성공률:</span>
                      <span className="prob-value guaranteed">100%</span>
                    </div>
                    <div className="cost-display">
                      <span className="cost-label">서비스 비용:</span>
                      <span className="cost-value">
                        ₡
                        {FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.CREDITS_COST.toLocaleString()}
                      </span>
                    </div>
                    <div className="delay-display">
                      <span className="delay-label">시간 지연:</span>
                      <span className="delay-value">
                        {FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.DAYS_DELAY}{' '}
                        일
                      </span>
                    </div>
                    {credits <
                      FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP
                        .CREDITS_COST && (
                      <div className="insufficient-funds">
                        <span className="error-text">크레딧 부족</span>
                      </div>
                    )}
                  </div>
                  <div className="option-outcomes">
                    <div className="outcome guaranteed">
                      <span className="outcome-label">확정:</span>
                      <span className="outcome-text">
                        엔진 완전 수리, +
                        {FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.DAYS_DELAY}{' '}
                        일 지연, -₡
                        {FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.CREDITS_COST.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Jury-Rig Repair Option */}
                <button
                  className={`repair-option ${selectedOption === 'jury_rig' ? 'selected' : ''}`}
                  onClick={() => handleOptionSelect('jury_rig')}
                >
                  <div className="option-header">
                    <span className="option-name">임시 수리</span>
                    <span className="option-type">현장 수리</span>
                  </div>
                  <div className="option-description">
                    가진 부품과 도구로 임시 수리를 시도합니다.
                  </div>
                  <div className="option-analysis">
                    <div className="probability-display">
                      <span className="prob-label">성공률:</span>
                      <span className="prob-value">
                        {Math.round(
                          FAILURE_CONFIG.ENGINE_FAILURE.JURY_RIG.CHANCE * 100
                        )}
                        %
                      </span>
                    </div>
                    <div className="cost-display">
                      <span className="cost-label">엔진 마모:</span>
                      <span className="cost-value">
                        -{FAILURE_CONFIG.ENGINE_FAILURE.JURY_RIG.ENGINE_COST}%
                      </span>
                    </div>
                  </div>
                  <div className="option-outcomes">
                    <div className="outcome success">
                      <span className="outcome-label">성공:</span>
                      <span className="outcome-text">
                        엔진 작동, -
                        {FAILURE_CONFIG.ENGINE_FAILURE.JURY_RIG.ENGINE_COST}% 엔진 상태
                      </span>
                    </div>
                    <div className="outcome failure">
                      <span className="outcome-label">실패:</span>
                      <span className="outcome-text">
                        수리 실패, -
                        {FAILURE_CONFIG.ENGINE_FAILURE.JURY_RIG.ENGINE_COST}% 엔진 상태
                      </span>
                    </div>
                  </div>
                </button>
              </>
            )}

            {/* Hull Breach - No repair options, just consequences */}
            {failure.type === 'hull_breach' && (
              <div className="repair-option hull-breach-info">
                <div className="option-header">
                  <span className="option-name">선체 파손 피해</span>
                  <span className="option-type">자동</span>
                </div>
                <div className="option-description">
                  선체 파손으로 즉각적인 피해와 화물 손실이 발생했습니다.
                </div>
                <div className="option-outcomes">
                  <div className="outcome damage">
                    <span className="outcome-label">즉각적인 영향:</span>
                    <span className="outcome-text">
                      -{FAILURE_CONFIG.HULL_BREACH.HULL_DAMAGE}% 선체 무결성, 일부 화물이 우주로 유실
                    </span>
                  </div>
                  <div className="outcome warning">
                    <span className="outcome-label">권고:</span>
                    <span className="outcome-text">
                      더 악화되기 전에 가장 가까운 정거장에서 수리를 받으세요
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Life Support Emergency - No repair options, just consequences */}
            {failure.type === 'life_support' && (
              <div className="repair-option life-support-info">
                <div className="option-header">
                  <span className="option-name">생명 유지 비상</span>
                  <span className="option-type">위급</span>
                </div>
                <div className="option-description">
                  생명 유지 시스템이 고장 나고 있습니다. 비상 프로토콜이 가동되었습니다.
                </div>
                <div className="option-outcomes">
                  <div className="outcome critical">
                    <span className="outcome-label">
                      즉각 조치 필요:
                    </span>
                    <span className="outcome-text">
                      생명 유지 장치 수리를 위해 즉시 가장 가까운 정거장으로 향하세요
                    </span>
                  </div>
                  <div className="outcome warning">
                    <span className="outcome-label">위험:</span>
                    <span className="outcome-text">
                      수리 없이 계속 운항하면 승무원 사상자가 발생할 수 있습니다
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="failure-actions">
          {failure.type === 'engine_failure' && selectedOption && (
            <>
              <button
                className="failure-btn primary"
                onClick={handleConfirm}
                disabled={
                  selectedOption === 'call_for_help' &&
                  credits <
                    FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.CREDITS_COST
                }
              >
                {getActionButtonText(selectedOption)}
              </button>
              <button className="failure-btn secondary" onClick={handleCancel}>
                다시 생각하기
              </button>
            </>
          )}
          {failure.type === 'engine_failure' && !selectedOption && (
            <div className="selection-prompt">
              엔진 고장을 해결할 수리 방법을 고르세요
            </div>
          )}
          {(failure.type === 'hull_breach' ||
            failure.type === 'life_support') && (
            <button
              className="failure-btn primary"
              onClick={() => onChoice('acknowledge')}
            >
              확인
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Get failure severity based on type and severity value
 *
 * @param {string} failureType - Type of failure
 * @param {number} severity - Severity value (if provided)
 * @returns {string} Severity level
 */
function getFailureSeverity(failureType, severity) {
  if (typeof severity === 'string') return severity;

  switch (failureType) {
    case 'hull_breach':
      return 'serious';
    case 'engine_failure':
      return 'critical';
    case 'life_support':
      return 'emergency';
    default:
      return 'moderate';
  }
}

/**
 * Get color for failure severity display
 *
 * @param {string} severity - The failure severity level
 * @returns {string} CSS color value
 */
function getFailureSeverityColor(severity) {
  switch (severity) {
    case 'minor':
      return '#ffaa00'; // Orange - manageable issue
    case 'moderate':
      return '#ff6b6b'; // Red - significant problem
    case 'serious':
      return '#ff4444'; // Bright red - major concern
    case 'critical':
      return '#ff0000'; // Bright red - system failure
    case 'emergency':
      return '#ff0000'; // Bright red - life threatening
    default:
      return '#ffffff'; // White - unknown
  }
}

/**
 * Format failure type for display
 *
 * @param {string} failureType - The failure type
 * @returns {string} Formatted display name
 */
const SEVERITY_LABEL_KO = {
  critical: '위급',
  serious: '심각',
  emergency: '비상',
  moderate: '보통',
};

function formatFailureType(failureType) {
  switch (failureType) {
    case 'hull_breach':
      return '선체 파손';
    case 'engine_failure':
      return '엔진 고장';
    case 'life_support':
      return '생명 유지 비상';
    default:
      return '시스템 오작동';
  }
}

/**
 * Get failure description based on type
 *
 * @param {string} failureType - The failure type
 * @returns {string} Description of the failure
 */
function getFailureDescription(failureType) {
  switch (failureType) {
    case 'hull_breach':
      return '선체 파손이 감지되었습니다. 구조 무결성이 손상되었고 화물이 우주로 유실될 수 있습니다.';
    case 'engine_failure':
      return '주 엔진이 치명적으로 고장 나 더는 작동하지 않습니다. 수리가 끝날 때까지 함선은 움직일 수 없습니다.';
    case 'life_support':
      return '생명 유지 시스템에 치명적인 고장이 발생했습니다. 대기 정화와 환경 제어가 실패하고 있습니다.';
    default:
      return '원인 불명의 시스템 오작동이 발생했습니다.';
  }
}

/**
 * Get system alert message based on failure type
 *
 * @param {string} failureType - The failure type
 * @returns {string} Alert message
 */
function getSystemAlert(failureType) {
  switch (failureType) {
    case 'hull_breach':
      return '경보: 선체 파손 감지. 비상 격벽 가동.';
    case 'engine_failure':
      return '경보: 주 엔진 정지. 함선 추진 시스템 작동 불능.';
    case 'life_support':
      return '경보: 생명 유지 위급. 비상 산소 비축분 가동.';
    default:
      return '경보: 시스템 오작동 감지.';
  }
}

/**
 * Get action button text based on selected repair option
 *
 * @param {string} optionName - The selected repair option name
 * @returns {string} Button text
 */
function getActionButtonText(optionName) {
  switch (optionName) {
    case 'emergency_restart':
      return '긴급 재시동 시도';
    case 'call_for_help':
      return '전문가 도움 요청';
    case 'jury_rig':
      return '임시 수리 시도';
    default:
      return '진행';
  }
}
