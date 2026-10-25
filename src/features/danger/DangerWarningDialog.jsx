import { useGameEvent } from '../../hooks/useGameEvent';
import { useDangerZone } from '../../hooks/useDangerZone';
import { useEncounterProbabilities } from '../../hooks/useEncounterProbabilities';
import { EVENT_NAMES } from '../../game/constants.js';
import '../../../css/panel/danger-warning.css';

/**
 * DangerWarningDialog - React component for danger zone warnings
 *
 * Displays danger zone classification, pirate and inspection probabilities,
 * and provides proceed/cancel options for dangerous system jumps.
 *
 * Architecture: danger-system
 * Validates: Requirements 1.3, 12.3
 *
 * @param {Object} props
 * @param {number} props.destinationSystemId - The destination system ID
 * @param {string} props.destinationSystemName - The destination system name
 * @param {Function} props.onProceed - Callback when player chooses to proceed
 * @param {Function} props.onCancel - Callback when player chooses to cancel
 */
export function DangerWarningDialog({
  destinationSystemId,
  destinationSystemName,
  onProceed,
  onCancel,
}) {
  // Subscribe to relevant game events for probability calculations
  const cargo = useGameEvent(EVENT_NAMES.CARGO_CHANGED);
  const shipCondition = useGameEvent(EVENT_NAMES.SHIP_CONDITION_CHANGED);
  const upgrades = useGameEvent(EVENT_NAMES.UPGRADES_CHANGED);
  const factions = useGameEvent(EVENT_NAMES.FACTION_REP_CHANGED);

  // Get danger zone classification using Bridge Pattern
  const dangerZone = useDangerZone(destinationSystemId);

  // Build game state object for encounter calculations
  const gameStateForDanger = {
    player: {
      currentSystem: destinationSystemId,
      factions: factions || {
        authorities: 0,
        traders: 0,
        outlaws: 0,
        civilians: 0,
      },
    },
    ship: {
      cargo: cargo || [],
      engine: shipCondition?.engine ?? 100,
      upgrades: upgrades || [],
    },
  };

  // Calculate encounter probabilities using Bridge Pattern
  const { pirateChance, inspectionChance } = useEncounterProbabilities(
    destinationSystemId,
    gameStateForDanger
  );

  const handleProceedClick = () => {
    onProceed();
  };

  // Get zone display properties
  const zoneInfo = getZoneDisplayInfo(dangerZone);

  return (
    <div
      id="danger-warning-dialog"
      className="panel-base visible"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="danger-warning-title"
    >
      <button className="close-btn" onClick={onCancel} aria-label="닫기">
        ×
      </button>
      <h2 id="danger-warning-title">점프 경고</h2>

      <div className="warning-content">
        {/* Destination Info Section */}
        <div className="warning-section destination-info">
          <h3>목적지</h3>
          <div className="destination-details">
            <div className="destination-name">{destinationSystemName}</div>
            <div className="danger-classification">
              <span className="classification-label">보안 등급:</span>
              <span
                className={`classification-value ${dangerZone}`}
                style={{ color: zoneInfo.color }}
              >
                {zoneInfo.name}
              </span>
            </div>
            <div className="zone-description">{zoneInfo.description}</div>
          </div>
        </div>

        {/* Risk Assessment Section */}
        <div className="warning-section risk-assessment">
          <h3>위험 평가</h3>
          <div className="risk-grid">
            <div className="risk-item">
              <div className="risk-header">
                <span className="risk-label">해적 조우</span>
                <span className={`risk-value ${getRiskLevel(pirateChance)}`}>
                  {Math.round(pirateChance * 100)}%
                </span>
              </div>
              <div className="risk-description">
                점프 중 적대적인 해적과 마주칠 확률
              </div>
            </div>

            <div className="risk-item">
              <div className="risk-header">
                <span className="risk-label">세관 검문</span>
                <span
                  className={`risk-value ${getRiskLevel(inspectionChance)}`}
                >
                  {Math.round(inspectionChance * 100)}%
                </span>
              </div>
              <div className="risk-description">
                도착 시 세관 검문을 받을 확률
              </div>
            </div>
          </div>

          {/* Risk Factors */}
          {(cargo?.length > 0 ||
            (shipCondition?.engine && shipCondition.engine < 50) ||
            upgrades?.includes('advanced_sensors') ||
            (factions?.authorities && factions.authorities !== 0) ||
            (factions?.outlaws && factions.outlaws !== 0)) && (
            <div className="risk-factors">
              <h4>위험 보정 요인</h4>
              <div className="factors-list">
                {cargo?.length > 0 && (
                  <div className="factor">
                    <span className="factor-icon">📦</span>
                    <span className="factor-text">
                      화물 가치가 해적 조우 확률에 영향을 줍니다
                    </span>
                  </div>
                )}
                {shipCondition?.engine != null && shipCondition.engine < 50 && (
                  <div className="factor warning">
                    <span className="factor-icon">⚠️</span>
                    <span className="factor-text">
                      엔진 상태가 나쁘면 해적 위험이 커집니다
                    </span>
                  </div>
                )}
                {upgrades?.includes('advanced_sensors') && (
                  <div className="factor positive">
                    <span className="factor-icon">📡</span>
                    <span className="factor-text">
                      고급 센서는 해적 탐지 확률을 낮춥니다
                    </span>
                  </div>
                )}
                {factions?.authorities > 0 && (
                  <div className="factor positive">
                    <span className="factor-icon">🛡️</span>
                    <span className="factor-text">
                      당국과의 관계가 좋으면 검문 위험이 줄어듭니다
                    </span>
                  </div>
                )}
                {factions?.authorities < 0 && (
                  <div className="factor warning">
                    <span className="factor-icon">🛡️</span>
                    <span className="factor-text">
                      당국과의 관계가 나쁘면 검문 위험이 커집니다
                    </span>
                  </div>
                )}
                {factions?.outlaws > 0 && (
                  <div className="factor positive">
                    <span className="factor-icon">🏴‍☠️</span>
                    <span className="factor-text">
                      무법자 평판이 일부 해적을 물러서게 할 수 있습니다
                    </span>
                  </div>
                )}
                {factions?.outlaws < 0 && (
                  <div className="factor warning">
                    <span className="factor-icon">🏴‍☠️</span>
                    <span className="factor-text">
                      무법자 평판이 낮으면 해적이 더 공격적입니다
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Safety Recommendations */}
        {dangerZone !== 'safe' && (
          <div className="warning-section safety-recommendations">
            <h3>안전 권고</h3>
            <div className="recommendations-list">
              {dangerZone === 'dangerous' && (
                <>
                  <div className="recommendation critical">
                    <span className="rec-icon">⚠️</span>
                    <span className="rec-text">
                      위험 지대 - 해적 활동이 활발할 것으로 예상됩니다
                    </span>
                  </div>
                  <div className="recommendation">
                    <span className="rec-icon">🔧</span>
                    <span className="rec-text">
                      함선 시스템 상태를 양호하게 유지하세요
                    </span>
                  </div>
                </>
              )}
              {dangerZone === 'contested' && (
                <div className="recommendation warning">
                  <span className="rec-icon">⚠️</span>
                  <span className="rec-text">
                    분쟁 지대 - 조우 위험이 중간 수준입니다
                  </span>
                </div>
              )}
              <div className="recommendation">
                <span className="rec-icon">💰</span>
                <span className="rec-text">
                  화물 가치와 위험 감수 수준을 비교해 보세요
                </span>
              </div>
              <div className="recommendation">
                <span className="rec-icon">🛣️</span>
                <span className="rec-text">
                  더 안전한 항성계를 거치는 대체 경로가 있을 수 있습니다
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="warning-actions">
        <button className="warning-btn primary" onClick={handleProceedClick}>
          {dangerZone === 'dangerous' ? '위험을 감수하고 진행' : '진행'}
        </button>
        <button className="warning-btn secondary" onClick={onCancel}>
          점프 취소
        </button>
      </div>
    </div>
  );
}

/**
 * Get display information for a danger zone classification.
 * Provides consistent naming, colors, and descriptions for each zone type.
 * Used to inform players about the risk level of their destination.
 *
 * @param {string} dangerZone - The danger zone type (safe, contested, dangerous)
 * @returns {Object} Display info with name, color, and description properties
 */
function getZoneDisplayInfo(dangerZone) {
  switch (dangerZone) {
    case 'safe':
      return {
        name: '안전',
        color: '#00ff88',
        description:
          '법 집행이 강력하고 해적 활동이 거의 없는 핵심 항성계.',
      };
    case 'contested':
      return {
        name: '분쟁',
        color: '#ffaa00',
        description:
          '통제권이 뒤섞여 있고 해적 활동이 보통이며 순찰이 잦은 항성계.',
      };
    case 'dangerous':
      return {
        name: '위험',
        color: '#ff6b6b',
        description:
          '해적 활동이 활발하고 법 집행이 부족한 변경 항성계.',
      };
    default:
      return {
        name: '알 수 없음',
        color: '#ffffff',
        description: '분류되지 않은 항성계.',
      };
  }
}

/**
 * Get risk level classification for probability display.
 * Converts numeric probabilities to categorical risk levels for better UX.
 * Thresholds are tuned to provide meaningful risk assessment to players.
 *
 * @param {number} probability - The probability value (0-1 range)
 * @returns {string} Risk level class name for CSS styling
 */
function getRiskLevel(probability) {
  if (probability >= 0.3) return 'high'; // 30%+ = high risk
  if (probability >= 0.15) return 'moderate'; // 15-29% = moderate risk
  if (probability >= 0.05) return 'low'; // 5-14% = low risk
  return 'minimal'; // <5% = minimal risk
}
