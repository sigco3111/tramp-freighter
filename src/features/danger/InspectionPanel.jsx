import { useMemo } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGame } from '../../context/GameContext.jsx';
import { calculateInspectionAnalysis } from './inspectionUtils.js';
import { formatCargoDisplayName } from '../../game/utils/string-utils.js';
import {
  INSPECTION_CONFIG,
  EVENT_NAMES,
  REPUTATION_BOUNDS,
} from '../../game/constants.js';
import { getReputationTier } from './dangerDisplayUtils';

/**
 * InspectionPanel - React component for customs inspection resolution
 *
 * Displays cargo manifest with restricted items marked, shows inspection options
 * (cooperate, bribe, flee) with clear costs and consequences for each option.
 * Provides detailed feedback on potential outcomes and reputation effects.
 *
 * Architecture: danger-system
 * Validates: Requirements 5.3, 5.13, 12.1, 12.5
 *
 * @param {Object} props
 * @param {Object} props.inspection - The inspection encounter object
 * @param {Function} props.onChoice - Callback when player makes an inspection choice
 * @param {Function} props.onClose - Callback to close the panel
 */
export function InspectionPanel({ inspection, onChoice, onClose: _onClose }) {
  // Subscribe to relevant game events for inspection context
  const game = useGame();
  const cargo = useGameEvent(EVENT_NAMES.CARGO_CHANGED);
  const hiddenCargo = useGameEvent(EVENT_NAMES.HIDDEN_CARGO_CHANGED);
  const credits = useGameEvent(EVENT_NAMES.CREDITS_CHANGED);
  const currentSystem = useGameEvent(EVENT_NAMES.CURRENT_SYSTEM_CHANGED);
  const factions = useGameEvent(EVENT_NAMES.FACTION_REP_CHANGED);

  // Get danger zone from the single source of truth
  const dangerZone = game.getDangerZone(currentSystem);

  // Calculate inspection analysis and restricted goods
  const inspectionAnalysis = useMemo(
    () =>
      calculateInspectionAnalysis(
        inspection,
        cargo,
        hiddenCargo,
        currentSystem,
        credits,
        dangerZone
      ),
    [inspection, cargo, hiddenCargo, currentSystem, credits, dangerZone]
  );

  // Determine inspection severity for display
  const severity = inspection.severity || 'routine';
  const severityColor = getInspectionSeverityColor(severity);

  return (
    <div
      id="inspection-panel"
      className="panel-base visible"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspection-panel-title"
    >
      <button
        className="close-btn"
        onClick={() => onChoice('flee')}
        aria-label="검문 회피"
      >
        ×
      </button>
      <h2 id="inspection-panel-title">세관 검문</h2>

      <div className="inspection-content">
        {/* Inspection Status Section */}
        <div className="inspection-section inspection-status">
          <h3>검문 상태</h3>
          <div className="inspection-info">
            <div className="inspection-severity">
              <span className="severity-label">검문 유형:</span>
              <span
                className={`severity-value ${severity}`}
                style={{ color: severityColor }}
              >
                {severity.charAt(0).toUpperCase() + severity.slice(1)}
              </span>
            </div>
            <div className="inspection-description">
              {inspection.description ||
                '세관 직원이 표준 화물 검사를 진행하고 있습니다. 협조가 요구됩니다.'}
            </div>
            <div className="inspector-dialogue">
              "검사를 위해 화물 목록을 준비하십시오. 제한 품목은 반드시 신고해야 합니다."
            </div>
          </div>
        </div>

        {/* Cargo Manifest Section */}
        <div className="inspection-section cargo-manifest">
          <h3>화물 목록</h3>
          <div className="manifest-content">
            {/* Regular Cargo Display */}
            <div className="regular-cargo">
              <h4>신고한 화물</h4>
              {cargo && cargo.length > 0 ? (
                <div className="cargo-list">
                  {cargo.map((item, index) => {
                    const isRestricted =
                      inspectionAnalysis.restrictedItems.includes(item.good);
                    return (
                      <div
                        key={`${item.good}-${item.qty}-${index}`}
                        className={`cargo-item ${isRestricted ? 'restricted' : 'legal'}`}
                      >
                        <div className="item-info">
                          <span className="item-name">
                            {formatCargoDisplayName(item.good)}
                          </span>
                          <span className="item-quantity">
                            {item.qty}  단위
                          </span>
                        </div>
                        <div className="item-status">
                          {isRestricted ? (
                            <span className="status-restricted">
                              제한 품목
                            </span>
                          ) : (
                            <span className="status-legal">합법</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-cargo">
                  <span className="empty-message">신고된 화물 없음</span>
                </div>
              )}
            </div>

            {/* Hidden Cargo Indicator (not shown to inspector) */}
            {hiddenCargo && hiddenCargo.length > 0 && (
              <div className="hidden-cargo-indicator">
                <div className="hidden-status">
                  <span className="hidden-label">은닉 공간:</span>
                  <span className="hidden-count">
                    {hiddenCargo.length}  은닉 물품
                    {hiddenCargo.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="discovery-risk">
                  <span className="risk-label">발각 위험:</span>
                  <span className="risk-value">
                    {Math.round(
                      inspectionAnalysis.hiddenCargoDiscoveryChance * 100
                    )}
                    %
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Inspection Summary */}
          <div className="inspection-summary">
            <div className="summary-item">
              <span className="summary-label">제한 품목:</span>
              <span
                className={`summary-value ${inspectionAnalysis.restrictedItems.length > 0 ? 'warning' : 'clear'}`}
              >
                {inspectionAnalysis.restrictedItems.length}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">보안 등급:</span>
              <span className="summary-value">
                {getSecurityLevelName(inspectionAnalysis.securityLevel)}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">당국 관계:</span>
              <span
                className={`summary-value ${getReputationClass(factions?.authorities)}`}
              >
                {getReputationTier(factions?.authorities || 0, 'authority')}
              </span>
            </div>
          </div>
        </div>

        {/* Inspection Options Section */}
        <div className="inspection-section inspection-options">
          <h3>대응 선택지</h3>
          <div className="options-list">
            {/* Cooperate Option */}
            <button
              className="inspection-option"
              onClick={() => onChoice('cooperate')}
            >
              <div className="option-header">
                <span className="option-name">협조</span>
                <span className="option-type">순응</span>
              </div>
              <div className="option-description">
                검사에 전적으로 응하고 모든 화물을 정직하게 신고합니다.
              </div>
              <div className="option-analysis">
                <div className="guaranteed-outcome">
                  <span className="outcome-label">결과:</span>
                  <span
                    className={`outcome-value ${inspectionAnalysis.restrictedItems.length > 0 ? 'warning' : 'guaranteed'}`}
                  >
                    {inspectionAnalysis.restrictedItems.length > 0
                      ? '순응 - 제한 품목에는 벌금이 부과됩니다'
                      : '성공 확정'}
                  </span>
                </div>
                {inspectionAnalysis.restrictedItems.length > 0 && (
                  <div className="violation-warning">
                    <span className="warning-label">
                      제한 품목 적발:
                    </span>
                    <span className="warning-text">
                      {inspectionAnalysis.restrictedItems
                        .map(formatCargoDisplayName)
                        .join(', ')}
                    </span>
                  </div>
                )}
                {hiddenCargo && hiddenCargo.length > 0 && (
                  <div className="hidden-risk">
                    <span className="risk-label">은닉 화물 발각:</span>
                    <span className="risk-value">
                      {Math.round(
                        inspectionAnalysis.hiddenCargoDiscoveryChance * 100
                      )}
                      % 확률
                    </span>
                  </div>
                )}
              </div>
              <div className="option-outcomes">
                <div className="outcome base">
                  <span className="outcome-label">기본 결과:</span>
                  <span className="outcome-text">
                    +{INSPECTION_CONFIG.COOPERATE.AUTHORITY_REP_GAIN}  당국 평판(협조 보상)
                  </span>
                </div>
                {inspectionAnalysis.restrictedItems.length > 0 && (
                  <div className="outcome penalty">
                    <span className="outcome-label">제한 품목:</span>
                    <span className="outcome-text">
                      ₡
                      {INSPECTION_CONFIG.COOPERATE.RESTRICTED_FINE.toLocaleString()}{' '}
                      벌금,
                      {
                        INSPECTION_CONFIG.REPUTATION_PENALTIES.RESTRICTED_GOODS
                      }{' '}
                      당국 평판
                    </span>
                  </div>
                )}
                {hiddenCargo && hiddenCargo.length > 0 && (
                  <div className="outcome risk">
                    <span className="outcome-label">
                      은닉 화물이 발견될 경우:
                    </span>
                    <span className="outcome-text">
                      ₡
                      {INSPECTION_CONFIG.COOPERATE.HIDDEN_FINE.toLocaleString()}{' '}
                      벌금,
                      {INSPECTION_CONFIG.REPUTATION_PENALTIES.HIDDEN_CARGO}{' '}
                      당국 평판, +
                      {
                        INSPECTION_CONFIG.REPUTATION_PENALTIES
                          .SMUGGLING_OUTLAW_BONUS
                      }{' '}
                      무법자 평판
                    </span>
                  </div>
                )}
              </div>
            </button>

            {/* Bribe Option */}
            <button
              className={`inspection-option ${credits < INSPECTION_CONFIG.BRIBE.COST ? 'disabled' : ''}`}
              disabled={credits < INSPECTION_CONFIG.BRIBE.COST}
              onClick={() => onChoice('bribe')}
            >
              <div className="option-header">
                <span className="option-name">뇌물 시도</span>
                <span className="option-type">부패</span>
              </div>
              <div className="option-description">
                철저한 검사를 피하려고 검사관에게 크레딧을 건넵니다.
              </div>
              <div className="option-analysis">
                <div className="probability-display">
                  <span className="prob-label">성공 확률:</span>
                  <span className="prob-value">
                    {Math.round(INSPECTION_CONFIG.BRIBE.BASE_CHANCE * 100)}%
                  </span>
                </div>
                <div className="cost-display">
                  <span className="cost-label">시도 비용:</span>
                  <span className="cost-value">
                    ₡{INSPECTION_CONFIG.BRIBE.COST.toLocaleString()}
                  </span>
                </div>
                {credits < INSPECTION_CONFIG.BRIBE.COST && (
                  <div className="insufficient-funds">
                    <span className="error-text">크레딧 부족</span>
                  </div>
                )}
              </div>
              <div className="option-outcomes">
                <div className="outcome success">
                  <span className="outcome-label">성공:</span>
                  <span className="outcome-text">
                    검사 회피, ₡
                    {INSPECTION_CONFIG.BRIBE.COST.toLocaleString()},
                    {INSPECTION_CONFIG.BRIBE.AUTHORITY_REP_PENALTY}  지불, 당국 평판
                  </span>
                </div>
                <div className="outcome failure">
                  <span className="outcome-label">실패:</span>
                  <span className="outcome-text">
                    ₡
                    {(
                      INSPECTION_CONFIG.BRIBE.COST +
                      INSPECTION_CONFIG.BRIBE.FAILURE_ADDITIONAL_FINE
                    ).toLocaleString()}
                     지불, 전체 검사 진행,{' '}
                    {INSPECTION_CONFIG.BRIBE.AUTHORITY_REP_PENALTY}  당국 평판
                  </span>
                </div>
              </div>
            </button>

            {/* Flee Option */}
            <button
              className="inspection-option"
              onClick={() => onChoice('flee')}
            >
              <div className="option-header">
                <span className="option-name">도주</span>
                <span className="option-type">회피</span>
              </div>
              <div className="option-description">
                현장을 벗어나 검문에서 도망칩니다.
              </div>
              <div className="option-analysis">
                <div className="consequence-warning">
                  <span className="warning-label">경고:</span>
                  <span className="warning-text">
                    순찰대 전투 조우 발생
                  </span>
                </div>
              </div>
              <div className="option-outcomes">
                <div className="outcome guaranteed">
                  <span className="outcome-label">즉각적인 결과:</span>
                  <span className="outcome-text">
                    {INSPECTION_CONFIG.FLEE.AUTHORITY_REP_PENALTY}  당국 평판(검문 저항 보상)
                  </span>
                </div>
                <div className="outcome combat">
                  <span className="outcome-label">전투 조우:</span>
                  <span className="outcome-text">
                    순찰선이 추격해 전투에 돌입합니다
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Get color for inspection severity display
 *
 * @param {string} severity - The inspection severity level
 * @returns {string} CSS color value
 */
function getInspectionSeverityColor(severity) {
  switch (severity) {
    case 'routine':
      return '#00ff88'; // Green - standard inspection
    case 'thorough':
      return '#ffaa00'; // Orange - detailed inspection
    case 'intensive':
      return '#ff6b6b'; // Red - comprehensive search
    default:
      return '#ffffff'; // White - unknown
  }
}

/**
 * Get security level name for display
 *
 * @param {number} securityLevel - Security level multiplier
 * @returns {string} Human-readable security level
 */
function getSecurityLevelName(securityLevel) {
  if (securityLevel >= 2.0) return '최고';
  if (securityLevel >= 1.5) return '높음';
  if (securityLevel >= 1.0) return '표준';
  if (securityLevel >= 0.5) return '최소';
  return 'Low';
}

/**
 * Get CSS class for reputation display based on value
 *
 * @param {number} reputation - Current reputation value
 * @returns {string} CSS class name
 */
function getReputationClass(reputation = 0) {
  if (reputation >= REPUTATION_BOUNDS.TRUSTED_MIN) return 'trusted';
  if (reputation >= REPUTATION_BOUNDS.FRIENDLY_MIN) return 'friendly';
  if (reputation >= REPUTATION_BOUNDS.WARM_MIN) return 'warm';
  if (reputation >= REPUTATION_BOUNDS.NEUTRAL_MIN) return 'neutral';
  if (reputation >= REPUTATION_BOUNDS.COLD_MIN) return 'cold';
  return 'hostile';
}
