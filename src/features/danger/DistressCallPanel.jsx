import { useState, useMemo } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import {
  DISTRESS_CONFIG,
  KARMA_CONFIG,
  REPUTATION_BOUNDS,
  SHIP_CONFIG,
  EVENT_NAMES,
} from '../../game/constants.js';
import { getKarmaClass, getReputationTier } from './dangerDisplayUtils';

/**
 * DistressCallPanel - React component for distress call moral choice resolution
 *
 * Displays distress call description and shows moral choice options (respond, ignore, loot)
 * with clear costs and consequences for each choice. Provides feedback on karma and
 * reputation effects to help players make informed moral decisions.
 *
 * Architecture: danger-system
 * Validates: Requirements 7.2, 7.6, 12.1, 12.5
 *
 * @param {Object} props
 * @param {Object} props.distressCall - The distress call encounter object
 * @param {Function} props.onChoice - Callback when player makes a moral choice
 * @param {Function} props.onClose - Callback to close the panel
 */
export function DistressCallPanel({
  distressCall,
  onChoice,
  onClose: _onClose,
}) {
  // Subscribe to relevant game events for moral choice context
  const fuel = useGameEvent(EVENT_NAMES.FUEL_CHANGED);
  const lifeSupport = useGameEvent(EVENT_NAMES.LIFE_SUPPORT_CHANGED);
  const credits = useGameEvent(EVENT_NAMES.CREDITS_CHANGED);
  const karma = useGameEvent(EVENT_NAMES.KARMA_CHANGED);
  const factions = useGameEvent(EVENT_NAMES.FACTION_REP_CHANGED);

  // Local state for selected moral choice
  const [selectedChoice, setSelectedChoice] = useState(null);

  // Calculate resource availability and moral standing
  const playerStatus = useMemo(
    () => calculatePlayerStatus(fuel, lifeSupport, credits, karma, factions),
    [fuel, lifeSupport, credits, karma, factions]
  );

  const handleChoiceSelect = (choice) => {
    setSelectedChoice(choice);
  };

  const handleConfirm = () => {
    if (selectedChoice && onChoice) {
      onChoice(selectedChoice);
    }
  };

  const handleCancel = () => {
    setSelectedChoice(null);
  };

  // Determine distress call severity and type for display
  const severity = distressCall.severity || 'moderate';
  const callType = distressCall.type || 'general';
  const severityColor = getDistressSeverityColor(severity);

  return (
    <div
      id="distress-call-panel"
      className="panel-base visible"
      role="dialog"
      aria-modal="true"
      aria-labelledby="distress-call-title"
    >
      <button
        className="close-btn"
        onClick={() => onChoice('ignore')}
        aria-label="조난 신호 무시"
      >
        ×
      </button>
      <h2 id="distress-call-title">조난 신호</h2>

      <div className="distress-content">
        {/* Distress Call Information Section */}
        <div className="distress-section call-info">
          <h3>비상 신호</h3>
          <div className="call-details">
            <div className="signal-header">
              <div className="signal-strength">
                <span className="signal-label">신호 세기:</span>
                <span
                  className={`signal-value ${severity}`}
                  style={{ color: severityColor }}
                >
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </span>
              </div>
              <div className="call-type">
                <span className="type-label">비상 유형:</span>
                <span className="type-value">{formatCallType(callType)}</span>
              </div>
            </div>
            <div className="distress-message">
              <div className="message-header">송신 내용:</div>
              <div className="message-text">
                {distressCall.description ||
                  '"메이데이, 메이데이! 여기는 민간 수송선입니다. 즉각적인 지원을 요청합니다. 치명적인 시스템 고장으로 오도 가도 못하는 상태입니다. 이 송신이 들리면 응답해 주세요."'}
              </div>
            </div>
            <div className="signal-analysis">
              <div className="analysis-item">
                <span className="analysis-label">선박 종류:</span>
                <span className="analysis-value">
                  {distressCall.vesselType || '민간 수송선'}
                </span>
              </div>
              <div className="analysis-item">
                <span className="analysis-label">추정 승무원:</span>
                <span className="analysis-value">
                  {distressCall.crewCount || '3~5명'}
                </span>
              </div>
              <div className="analysis-item">
                <span className="analysis-label">신호 이후 경과 시간:</span>
                <span className="analysis-value">
                  {distressCall.timeElapsed || '2.3시간'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Player Resources Section */}
        <div className="distress-section player-resources">
          <h3>보유 자원</h3>
          <div className="resources-grid">
            <div className="resource-item">
              <span className="resource-label">연료 잔량:</span>
              <span
                className={`resource-value ${getResourceClass(fuel ?? 100)}`}
              >
                {Math.round(fuel ?? 100)}%
              </span>
              <span className="resource-impact">
                {(fuel ?? 100) >= DISTRESS_CONFIG.RESPOND.FUEL_COST
                  ? '구조에 충분'
                  : '연료 잔량 부족'}
              </span>
            </div>
            <div className="resource-item">
              <span className="resource-label">생명 유지:</span>
              <span
                className={`resource-value ${getResourceClass(lifeSupport ?? 100)}`}
              >
                {Math.round(lifeSupport ?? 100)}%
              </span>
              <span className="resource-impact">
                {(lifeSupport ?? 100) >=
                DISTRESS_CONFIG.RESPOND.LIFE_SUPPORT_COST
                  ? '추가 승무원 수용 가능'
                  : '생명 유지 수용량 제한적'}
              </span>
            </div>
            <div className="resource-item">
              <span className="resource-label">크레딧:</span>
              <span className="resource-value">
                ₡{(credits ?? 0).toLocaleString()}
              </span>
              <span className="resource-impact">
                예상 보상: ₡{DISTRESS_CONFIG.RESPOND.CREDITS_REWARD}
              </span>
            </div>
            <div className="resource-item">
              <span className="resource-label">현재 카르마:</span>
              <span className={`resource-value ${getKarmaClass(karma ?? 0)}`}>
                {(karma ?? 0) > 0 ? '+' : ''}
                {karma ?? 0}
              </span>
              <span className="resource-impact">
                {getKarmaDescription(karma ?? 0)}
              </span>
            </div>
          </div>

          {/* Moral Standing Display */}
          <div className="moral-standing">
            <h4>평판 상태</h4>
            <div className="reputation-grid">
              <div className="rep-item">
                <span className="rep-label">민간인:</span>
                <span
                  className={`rep-value ${getReputationClass(factions?.civilians ?? 0)}`}
                >
                  {getReputationTier(factions?.civilians ?? 0)}
                </span>
              </div>
              <div className="rep-item">
                <span className="rep-label">무법자:</span>
                <span
                  className={`rep-value ${getReputationClass(factions?.outlaws ?? 0)}`}
                >
                  {getReputationTier(factions?.outlaws ?? 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Moral Choice Options Section */}
        <div className="distress-section choice-options">
          <h3>대응</h3>
          <div className="choices-list">
            {/* Respond Option */}
            <button
              className={`moral-choice ${selectedChoice === 'respond' ? 'selected' : ''} ${playerStatus.canRespond ? 'available' : 'unavailable'}`}
              disabled={!playerStatus.canRespond}
              onClick={() => handleChoiceSelect('respond')}
            >
              <div className="choice-header">
                <span className="choice-name">조난 신호에 응답</span>
                <span className="choice-type moral-good">영웅적</span>
              </div>
              <div className="choice-description">
                "조난 신호를 들었습니다. 지원하러 가는 중입니다. 조금만 버티세요, 도움이 가고 있습니다."
              </div>
              <div className="choice-analysis">
                <div className="costs-section">
                  <h5>자원 비용:</h5>
                  <div className="cost-item">
                    <span className="cost-label">시간 지연:</span>
                    <span className="cost-value">
                      +{DISTRESS_CONFIG.RESPOND.DAYS_COST} 일
                    </span>
                  </div>
                  <div className="cost-item">
                    <span className="cost-label">연료 소모:</span>
                    <span className="cost-value">
                      -{DISTRESS_CONFIG.RESPOND.FUEL_COST}%
                    </span>
                  </div>
                  <div className="cost-item">
                    <span className="cost-label">생명 유지 부담:</span>
                    <span className="cost-value">
                      -{DISTRESS_CONFIG.RESPOND.LIFE_SUPPORT_COST}%
                    </span>
                  </div>
                </div>
                <div className="rewards-section">
                  <h5>보상:</h5>
                  <div className="reward-item">
                    <span className="reward-label">크레딧:</span>
                    <span className="reward-value positive">
                      +₡{DISTRESS_CONFIG.RESPOND.CREDITS_REWARD}
                    </span>
                  </div>
                  <div className="reward-item">
                    <span className="reward-label">민간인 평판:</span>
                    <span className="reward-value positive">
                      +{DISTRESS_CONFIG.RESPOND.REP_REWARD}
                    </span>
                  </div>
                  <div className="reward-item">
                    <span className="reward-label">카르마:</span>
                    <span className="reward-value positive">
                      +{DISTRESS_CONFIG.RESPOND.KARMA_REWARD}
                    </span>
                  </div>
                </div>
              </div>
              {!playerStatus.canRespond && (
                <div className="choice-restriction">
                  <span className="restriction-text">
                    구조 작전을 안전하게 수행할 자원이 부족합니다
                  </span>
                </div>
              )}
            </button>

            {/* Ignore Option */}
            <button
              className={`moral-choice ${selectedChoice === 'ignore' ? 'selected' : ''} available`}
              onClick={() => handleChoiceSelect('ignore')}
            >
              <div className="choice-header">
                <span className="choice-name">신호 무시</span>
                <span className="choice-type moral-neutral">현실적</span>
              </div>
              <div className="choice-description">
                "우리가 끼어들 여유는 없다. 계획한 항로를 계속 간다."
              </div>
              <div className="choice-analysis">
                <div className="costs-section">
                  <h5>결과:</h5>
                  <div className="cost-item">
                    <span className="cost-label">카르마:</span>
                    <span className="cost-value negative">
                      {DISTRESS_CONFIG.IGNORE.KARMA_PENALTY}
                    </span>
                  </div>
                </div>
                <div className="rewards-section">
                  <h5>이득:</h5>
                  <div className="reward-item">
                    <span className="reward-label">자원:</span>
                    <span className="reward-value neutral">비용 없음</span>
                  </div>
                  <div className="reward-item">
                    <span className="reward-label">시간:</span>
                    <span className="reward-value neutral">지연 없음</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Loot Option */}
            <button
              className={`moral-choice ${selectedChoice === 'loot' ? 'selected' : ''} available`}
              onClick={() => handleChoiceSelect('loot')}
            >
              <div className="choice-header">
                <span className="choice-name">잔해 인양</span>
                <span className="choice-type moral-evil">약탈적</span>
              </div>
              <div className="choice-description">
                "저 사람들은 이제 화물이 필요 없겠군. 이번 항해로 수지를 맞춰야지."
              </div>
              <div className="choice-analysis">
                <div className="costs-section">
                  <h5>도덕적 대가:</h5>
                  <div className="cost-item">
                    <span className="cost-label">시간 지연:</span>
                    <span className="cost-value">
                      +{DISTRESS_CONFIG.LOOT.DAYS_COST} 일
                    </span>
                  </div>
                  <div className="cost-item">
                    <span className="cost-label">카르마:</span>
                    <span className="cost-value negative">
                      {DISTRESS_CONFIG.LOOT.KARMA_PENALTY}
                    </span>
                  </div>
                  <div className="cost-item">
                    <span className="cost-label">민간인 평판:</span>
                    <span className="cost-value negative">
                      {DISTRESS_CONFIG.LOOT.REP_PENALTY}
                    </span>
                  </div>
                </div>
                <div className="rewards-section">
                  <h5>물질적 이득:</h5>
                  <div className="reward-item">
                    <span className="reward-label">인양 화물:</span>
                    <span className="reward-value positive">무작위 물품</span>
                  </div>
                  <div className="reward-item">
                    <span className="reward-label">무법자 평판:</span>
                    <span className="reward-value positive">
                      +{DISTRESS_CONFIG.LOOT.OUTLAW_REP_GAIN}
                    </span>
                  </div>
                </div>
              </div>
              <div className="choice-warning">
                <span className="warning-text">
                  ⚠ 이 행동은 성역 전체에 기억됩니다
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="distress-actions">
          {selectedChoice && (
            <>
              <button className="distress-btn primary" onClick={handleConfirm}>
                {getChoiceActionText(selectedChoice)}
              </button>
              <button className="distress-btn secondary" onClick={handleCancel}>
                다시 생각하기
              </button>
            </>
          )}
          {!selectedChoice && (
            <div className="selection-prompt">
              조난 신호는 계속 송출되고 있습니다. 어떻게 하시겠습니까?
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Calculate player's ability to respond to distress calls based on resources
 *
 * @param {number} fuel - Current fuel level
 * @param {number} lifeSupport - Current life support condition
 * @param {number} credits - Current credits
 * @param {number} karma - Current karma value
 * @param {Object} factions - Current faction reputation
 * @returns {Object} Player status analysis
 */
function calculatePlayerStatus(fuel, lifeSupport, credits, karma, factions) {
  const safeFuel = fuel ?? 100;
  const safeLifeSupport = lifeSupport ?? 100;

  // Check if player has sufficient resources to respond
  const canRespond =
    safeFuel >= DISTRESS_CONFIG.RESPOND.FUEL_COST &&
    safeLifeSupport >= DISTRESS_CONFIG.RESPOND.LIFE_SUPPORT_COST;

  return {
    canRespond,
    fuel: safeFuel,
    lifeSupport: safeLifeSupport,
    credits: credits ?? 0,
    karma: karma ?? 0,
    civilianRep: factions?.civilians ?? 0,
    outlawRep: factions?.outlaws ?? 0,
  };
}

/**
 * Get color for distress call severity display based on urgency level.
 * Colors follow the game's visual hierarchy: green (routine) to red (critical).
 *
 * @param {string} severity - The distress call severity level
 * @returns {string} CSS color value for the severity level
 */
function getDistressSeverityColor(severity) {
  return (
    DISTRESS_CONFIG.SEVERITY_COLORS[severity] ||
    DISTRESS_CONFIG.SEVERITY_COLORS.unknown
  );
}

/**
 * Get CSS class for resource display based on percentage value.
 * Thresholds reflect resource availability for distress response operations.
 *
 * @param {number} resource - The resource value (0-100 percentage)
 * @returns {string} CSS class name for styling the resource display
 */
function getResourceClass(resource) {
  const thresholds = SHIP_CONFIG.UI_CONDITION_DISPLAY_THRESHOLDS;
  if (resource >= thresholds.EXCELLENT) return 'abundant';
  if (resource >= thresholds.FAIR) return 'adequate';
  if (resource >= thresholds.POOR) return 'limited';
  return 'critical';
}

/**
 * Get karma description for display in resource impact text.
 * Provides context about the player's moral standing.
 *
 * @param {number} karma - Current karma value
 * @returns {string} Human-readable karma description
 */
function getKarmaDescription(karma) {
  const thresholds = KARMA_CONFIG.DISPLAY_THRESHOLDS;
  if (karma >= thresholds.SAINT) return '영웅적인 행적으로 명성이 높음';
  if (karma >= thresholds.GOOD) return '남을 돕는 사람으로 알려짐';
  if (karma >= thresholds.BAD) return '도덕적으로 중립적인 평판';
  if (karma >= thresholds.VILLAIN) return '이기적이라는 평판';
  return '무자비하고 잔인하다고 두려움을 받음';
}

/**
 * Get CSS class for reputation display based on faction standing value.
 * Reflects relationship quality with different sector factions.
 *
 * @param {number} reputation - Current reputation value (-100 to +100)
 * @returns {string} CSS class name for reputation display styling
 */
function getReputationClass(reputation) {
  if (reputation >= REPUTATION_BOUNDS.TRUSTED_MIN) return 'trusted';
  if (reputation >= REPUTATION_BOUNDS.FRIENDLY_MIN) return 'friendly';
  if (reputation >= REPUTATION_BOUNDS.WARM_MIN) return 'warm';
  if (reputation >= REPUTATION_BOUNDS.NEUTRAL_MIN) return 'neutral';
  if (reputation >= REPUTATION_BOUNDS.COLD_MIN) return 'cold';
  return 'hostile';
}

/**
 * Format call type for display in emergency signal header.
 * Converts internal call type identifiers to user-facing descriptions.
 *
 * @param {string} callType - The distress call type identifier
 * @returns {string} Formatted call type for display
 */
function formatCallType(callType) {
  switch (callType) {
    case 'mechanical':
      return '기계 고장';
    case 'medical':
      return '의료 비상';
    case 'pirate':
      return '해적 습격';
    case 'navigation':
      return '항법 고장';
    case 'general':
      return '일반 조난';
    default:
      return '알 수 없는 비상';
  }
}

/**
 * Get action button text based on selected moral choice.
 * Provides clear, action-oriented button labels for each choice.
 *
 * @param {string} choice - The selected moral choice
 * @returns {string} Button text for the choice
 */
function getChoiceActionText(choice) {
  switch (choice) {
    case 'respond':
      return '구조 작전 개시';
    case 'ignore':
      return '항로 유지';
    case 'loot':
      return '잔해 인양';
    default:
      return '선택 확정';
  }
}
