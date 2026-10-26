import { useState, useMemo } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import {
  COMBAT_CONFIG,
  KARMA_CONFIG,
  NEGOTIATION_CONFIG,
  PIRATE_CREDIT_DEMAND_CONFIG,
  EVENT_NAMES,
} from '../../game/constants.js';
import {
  getConditionClass,
  formatCargoDisplayName as formatModifierName,
  josaIga,
} from '../../game/utils/string-utils.js';

/**
 * PirateEncounterPanel - React component for pirate encounter resolution
 *
 * Displays pirate threat level and ship status, shows tactical options
 * (fight, flee, negotiate, surrender) with clear success probabilities
 * and consequences for each option.
 *
 * Architecture: danger-system
 * Validates: Requirements 2.2, 2.11, 2.12, 12.1, 12.2, 12.4, 12.5
 *
 * @param {Object} props
 * @param {Object} props.encounter - The pirate encounter object
 * @param {Function} props.onChoice - Callback when player makes a choice
 * @param {Function} props.onClose - Callback to close the panel
 */
// Tactical option display labels for the confirm button (values stay English for logic)
const CONFIRM_OPTION_KO = {
  fight: '교전',
  flee: '도주',
  negotiate: '협상',
  surrender: '항복',
};

export function PirateEncounterPanel({
  encounter,
  onChoice,
  onClose: _onClose,
  escalated = false,
}) {
  // Subscribe to relevant game events for ship status display
  const hull = useGameEvent(EVENT_NAMES.HULL_CHANGED);
  const engine = useGameEvent(EVENT_NAMES.ENGINE_CHANGED);
  const fuel = useGameEvent(EVENT_NAMES.FUEL_CHANGED);
  const lifeSupport = useGameEvent(EVENT_NAMES.LIFE_SUPPORT_CHANGED);
  const cargo = useGameEvent(EVENT_NAMES.CARGO_CHANGED);
  const upgrades = useGameEvent(EVENT_NAMES.UPGRADES_CHANGED);
  const quirks = useGameEvent(EVENT_NAMES.QUIRKS_CHANGED);
  const karma = useGameEvent(EVENT_NAMES.KARMA_CHANGED);
  const factions = useGameEvent(EVENT_NAMES.FACTION_REP_CHANGED);

  // Determine if ship has trade cargo for pirate tribute
  const hasTradeCargo = cargo?.some((item) => item.qty > 0) || false;

  // Local state for selected tactical option
  const [selectedOption, setSelectedOption] = useState(null);

  // Calculate success probabilities for each tactical option
  const probabilities = useMemo(
    () =>
      calculateTacticalProbabilities(
        encounter,
        hull,
        engine,
        fuel,
        lifeSupport,
        upgrades,
        quirks,
        karma,
        factions
      ),
    [
      encounter,
      hull,
      engine,
      fuel,
      lifeSupport,
      upgrades,
      quirks,
      karma,
      factions,
    ]
  );

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

  // Determine threat level display
  const threatLevel = encounter.threatLevel || 'moderate';
  const threatColor = getThreatLevelColor(threatLevel);

  return (
    <div
      id="pirate-encounter-panel"
      className="panel-base visible"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pirate-encounter-title"
    >
      <button
        className="close-btn"
        onClick={() => onChoice('flee')}
        aria-label="조우 이탈"
      >
        ×
      </button>
      <h2 id="pirate-encounter-title">해적 조우</h2>

      <div className="encounter-content">
        {/* Threat Assessment Section */}
        <div className="encounter-section threat-assessment">
          <h3>위협 평가</h3>
          <div className="threat-info">
            <div className="threat-level">
              <span className="threat-label">위협 수준:</span>
              <span
                className={`threat-value ${threatLevel}`}
                style={{ color: threatColor }}
              >
                {threatLevel.charAt(0).toUpperCase() + threatLevel.slice(1)}
              </span>
            </div>
            <div className="pirate-description">
              {encounter.description ||
                `${encounter.name || '해적'}${josaIga(encounter.name || '해적')} 화물의 ${encounter.demandPercent ?? PIRATE_CREDIT_DEMAND_CONFIG.CARGO_DEMAND_PERCENT}%를 공물로 요구하고 있습니다.`}
            </div>
          </div>
        </div>

        {/* Ship Status Section */}
        <div className="encounter-section ship-status">
          <h3>함선 상태</h3>
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">선체:</span>
              <span className={`status-value ${getConditionClass(hull)}`}>
                {Math.round(hull ?? 100)}%
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">엔진:</span>
              <span className={`status-value ${getConditionClass(engine)}`}>
                {Math.round(engine ?? 100)}%
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">연료:</span>
              <span className={`status-value ${getConditionClass(fuel)}`}>
                {Math.round(fuel ?? 100)}%
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">생명 유지:</span>
              <span
                className={`status-value ${getConditionClass(lifeSupport)}`}
              >
                {Math.round(lifeSupport ?? 100)}%
              </span>
            </div>
          </div>

          {/* Active Modifiers Display */}
          {(upgrades?.length > 0 || quirks?.length > 0) && (
            <div className="active-modifiers">
              <h4>적용 중인 보정</h4>
              <div className="modifiers-list">
                {upgrades?.map((upgrade) => (
                  <span key={upgrade} className="modifier upgrade">
                    {formatModifierName(upgrade)}
                  </span>
                ))}
                {quirks?.map((quirk) => (
                  <span key={quirk} className="modifier quirk">
                    {formatModifierName(quirk)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tactical Options Section */}
        <div className="encounter-section tactical-options">
          <h3>전술 선택지</h3>
          <div className="options-list">
            {/* Fight Option */}
            <button
              className={`tactical-option ${selectedOption === 'fight' ? 'selected' : ''}`}
              onClick={() => handleOptionSelect('fight')}
            >
              <div className="option-header">
                <span className="option-name">교전</span>
                <span className="option-type">전투</span>
              </div>
              <div className="option-description">
                함선의 무기로 해적과 정면 교전합니다.
              </div>
              <div className="option-probabilities">
                <div className="probability-item">
                  <span className="prob-label">응사 성공률:</span>
                  <span className="prob-value">
                    {Math.round(probabilities.returnFire * 100)}%
                  </span>
                </div>
              </div>
              <div className="option-consequences">
                <div className="consequence success">
                  성공: 경미한 선체 피해(-10%), 해적 격퇴, 무법자 평판 +5
                </div>
                <div className="consequence failure">
                  실패: 심각한 선체 피해(-30%), 모든 화물과 ₡500 손실
                </div>
              </div>
            </button>

            {/* Flee Option */}
            <button
              className={`tactical-option ${selectedOption === 'flee' ? 'selected' : ''}`}
              onClick={() => handleOptionSelect('flee')}
            >
              <div className="option-header">
                <span className="option-name">도주</span>
                <span className="option-type">회피</span>
              </div>
              <div className="option-description">
                회피 기동과 엔진 출력으로 탈출을 시도합니다.
              </div>
              <div className="option-probabilities">
                <div className="probability-item">
                  <span className="prob-label">회피 성공률:</span>
                  <span className="prob-value">
                    {Math.round(probabilities.evasive * 100)}%
                  </span>
                </div>
              </div>
              <div className="option-consequences">
                <div className="consequence success">
                  성공: 안전하게 탈출, 연료 -15%, 엔진 상태 -5%
                </div>
                <div className="consequence failure">
                  실패: 선체 피해(-20%), 전투 계속
                </div>
              </div>
            </button>

            {/* Negotiate Option */}
            <button
              className={`tactical-option ${selectedOption === 'negotiate' ? 'selected' : ''} ${escalated ? 'disabled' : ''}`}
              disabled={escalated}
              onClick={() => handleOptionSelect('negotiate')}
            >
              <div className="option-header">
                <span className="option-name">협상</span>
                <span className="option-type">대화</span>
              </div>
              <div className="option-description">
                대화와 흥정으로 상황을 해결해 봅니다.
              </div>
              <div className="option-probabilities">
                <div className="probability-item">
                  <span className="prob-label">역제안:</span>
                  <span className="prob-value">
                    {Math.round(probabilities.counterProposal * 100)}%
                  </span>
                </div>
                {cargo?.some((item) => item.good === 'medicine') && (
                  <div className="probability-item">
                    <span className="prob-label">의약품 동정:</span>
                    <span className="prob-value">
                      {Math.round(probabilities.medicineClaim * 100)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="option-consequences">
                <div className="consequence success">
                  {hasTradeCargo
                    ? `성공: 지불액 감소 (원래 ${encounter.demandPercent ?? PIRATE_CREDIT_DEMAND_CONFIG.CARGO_DEMAND_PERCENT}% 대신 화물 10%)`
                    : `성공: 크레딧 요구 감소 (₡${Math.round(PIRATE_CREDIT_DEMAND_CONFIG.MIN_CREDIT_DEMAND * PIRATE_CREDIT_DEMAND_CONFIG.COUNTER_PROPOSAL_DISCOUNT)})`}
                </div>
                <div className="consequence failure">
                  실패: 해적이 더 공격적으로 변함 (전투력 +10%)
                </div>
              </div>
              {escalated && (
                <div className="option-disabled-reason">
                  그들은 이미 대화를 끝냈습니다.
                </div>
              )}
            </button>

            {/* Surrender Option */}
            <button
              className={`tactical-option ${selectedOption === 'surrender' ? 'selected' : ''}`}
              onClick={() => handleOptionSelect('surrender')}
            >
              <div className="option-header">
                <span className="option-name">항복</span>
                <span className="option-type">순응</span>
              </div>
              <div className="option-description">
                {hasTradeCargo
                  ? "해적의 요구를 받아들이고 공물을 내 안전하게 통과합니다."
                  : '거래용 화물이 없습니다. 해적이 대신 크레딧을 요구합니다.'}
              </div>
              <div className="option-probabilities">
                <div className="probability-item">
                  <span className="prob-label">성공률:</span>
                  <span className="prob-value">
                    {hasTradeCargo ? '100%' : '변동'}
                  </span>
                </div>
              </div>
              <div className="option-consequences">
                {hasTradeCargo ? (
                  <div className="consequence guaranteed">
                    확정: 지불{' '}
                    {encounter.demandPercent ??
                      PIRATE_CREDIT_DEMAND_CONFIG.CARGO_DEMAND_PERCENT}
                    % 화물, 안전 통과
                  </div>
                ) : (
                  <>
                    <div className="consequence guaranteed">
                      크레딧 요구: ₡
                      {PIRATE_CREDIT_DEMAND_CONFIG.MIN_CREDIT_DEMAND}-₡
                      {PIRATE_CREDIT_DEMAND_CONFIG.MAX_CREDIT_DEMAND}
                    </div>
                    <div className="consequence failure">
                      낼 수 없는 경우: 해적이 승객을 납치하거나 함선을 손상시킬 수 있습니다
                    </div>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="encounter-actions">
          {selectedOption && (
            <>
              <button className="encounter-btn primary" onClick={handleConfirm}>
                확정{' '}
                {CONFIRM_OPTION_KO[selectedOption] || selectedOption}
              </button>
              <button
                className="encounter-btn secondary"
                onClick={handleCancel}
              >
                선택 변경
              </button>
            </>
          )}
          {!selectedOption && (
            <div className="selection-prompt">
              진행할 전술 선택지를 고르세요
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Calculate success probabilities for all tactical options
 *
 * @param {Object} encounter - The pirate encounter
 * @param {number} hull - Current hull condition
 * @param {number} engine - Current engine condition
 * @param {number} fuel - Current fuel level
 * @param {number} lifeSupport - Current life support condition
 * @param {Array} upgrades - Active ship upgrades
 * @param {Array} quirks - Active ship quirks
 * @param {number} karma - Current karma value
 * @param {Object} factions - Current faction reputation
 * @returns {Object} Probability values for each option
 */
function calculateTacticalProbabilities(
  encounter,
  hull,
  engine,
  fuel,
  lifeSupport,
  upgrades = [],
  quirks = [],
  karma = 0,
  _factions = {}
) {
  // Calculate karma modifier
  const karmaModifier = karma * KARMA_CONFIG.SUCCESS_RATE_SCALE;

  // Calculate evasive maneuvers probability
  let evasiveChance = COMBAT_CONFIG.EVASIVE.BASE_CHANCE;

  // Apply engine condition modifier
  if (engine < COMBAT_CONFIG.ENGINE_PENALTY_THRESHOLD) {
    evasiveChance += COMBAT_CONFIG.ENGINE_PENALTY_VALUE;
  }

  // Apply hot_thruster quirk bonus
  if (quirks.includes('hot_thruster')) {
    evasiveChance += COMBAT_CONFIG.MODIFIERS.hot_thruster.evasiveBonus;
  }

  // Apply efficient_drive upgrade bonus
  if (upgrades.includes('efficient_drive')) {
    evasiveChance += COMBAT_CONFIG.MODIFIERS.efficient_drive.fleeBonus;
  }

  // Apply karma modifier
  evasiveChance += karmaModifier;

  // Clamp to [0, 1]
  evasiveChance = Math.max(0, Math.min(1, evasiveChance));

  // Calculate return fire probability
  let returnFireChance = COMBAT_CONFIG.RETURN_FIRE.BASE_CHANCE;

  // Apply karma modifier
  returnFireChance += karmaModifier;

  // Clamp to [0, 1]
  returnFireChance = Math.max(0, Math.min(1, returnFireChance));

  // Calculate negotiation probabilities
  let counterProposalChance = NEGOTIATION_CONFIG.COUNTER_PROPOSAL.BASE_CHANCE;
  counterProposalChance += karmaModifier;
  counterProposalChance = Math.max(0, Math.min(1, counterProposalChance));

  let medicineClaimChance = NEGOTIATION_CONFIG.MEDICINE_CLAIM.SYMPATHY_CHANCE;
  medicineClaimChance += karmaModifier;
  medicineClaimChance = Math.max(0, Math.min(1, medicineClaimChance));

  return {
    evasive: evasiveChance,
    returnFire: returnFireChance,
    counterProposal: counterProposalChance,
    medicineClaim: medicineClaimChance,
  };
}

/**
 * Get color for threat level display based on pirate encounter strength.
 * Colors follow the game's danger hierarchy to provide immediate visual feedback.
 *
 * @param {string} threatLevel - The threat level (weak, moderate, strong, dangerous)
 * @returns {string} CSS color value for the threat level
 */
function getThreatLevelColor(threatLevel) {
  switch (threatLevel) {
    case 'weak':
      return '#00ff88'; // Green - easy encounter
    case 'moderate':
      return '#ffaa00'; // Orange - standard threat
    case 'strong':
      return '#ff6b6b'; // Red - serious danger
    case 'dangerous':
      return '#ff0000'; // Bright red - extreme threat
    default:
      return '#ffffff'; // White - unknown threat
  }
}
