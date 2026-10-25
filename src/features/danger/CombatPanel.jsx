import { useState, useMemo } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import {
  COMBAT_CONFIG,
  KARMA_CONFIG,
  SHIP_CONFIG,
  EVENT_NAMES,
} from '../../game/constants.js';
import {
  getConditionClass,
  formatCargoDisplayName as formatModifierName,
} from '../../game/utils/string-utils.js';

/**
 * CombatPanel - React component for combat resolution
 *
 * Displays combat options (evasive, return fire, dump cargo, distress)
 * with current ship status affecting outcomes, success probabilities
 * with modifier breakdown, and potential outcomes for each choice.
 *
 * Architecture: danger-system
 * Validates: Requirements 3.1, 12.1, 12.2, 12.4, 12.5
 *
 * @param {Object} props
 * @param {Object} props.combat - The combat encounter object
 * @param {Function} props.onChoice - Callback when player makes a choice
 * @param {Function} props.onClose - Callback to close the panel
 */
export function CombatPanel({
  combat,
  onChoice,
  onClose: _onClose,
  fleeContext,
}) {
  // Subscribe to relevant game events for ship status and modifiers
  const hull = useGameEvent(EVENT_NAMES.HULL_CHANGED);
  const engine = useGameEvent(EVENT_NAMES.ENGINE_CHANGED);
  const fuel = useGameEvent(EVENT_NAMES.FUEL_CHANGED);
  const lifeSupport = useGameEvent(EVENT_NAMES.LIFE_SUPPORT_CHANGED);
  const cargo = useGameEvent(EVENT_NAMES.CARGO_CHANGED);
  const upgrades = useGameEvent(EVENT_NAMES.UPGRADES_CHANGED);
  const quirks = useGameEvent(EVENT_NAMES.QUIRKS_CHANGED);
  const karma = useGameEvent(EVENT_NAMES.KARMA_CHANGED);
  const factions = useGameEvent(EVENT_NAMES.FACTION_REP_CHANGED);

  // Local state for selected combat option
  const [selectedOption, setSelectedOption] = useState(null);

  // Calculate success probabilities and modifiers for each combat option
  const combatAnalysis = useMemo(
    () =>
      calculateCombatProbabilities(
        combat,
        hull,
        engine,
        fuel,
        lifeSupport,
        cargo,
        upgrades,
        quirks,
        karma,
        factions
      ),
    [
      combat,
      hull,
      engine,
      fuel,
      lifeSupport,
      cargo,
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

  // Determine combat intensity for display
  const intensity = combat.intensity || 'moderate';
  const intensityColor = getCombatIntensityColor(intensity);

  return (
    <div
      id="combat-panel"
      className="panel-base visible"
      role="dialog"
      aria-modal="true"
      aria-labelledby="combat-panel-title"
    >
      <button
        className="close-btn"
        onClick={() => onChoice('flee')}
        aria-label="전투 이탈"
      >
        ×
      </button>
      <h2 id="combat-panel-title">전투 결과</h2>

      <div className="combat-content">
        {/* Flee failed alert — shown when evasion was attempted and failed */}
        {fleeContext?.fleeAttemptFailed && (
          <div className="flee-failed-alert" role="alert">
            <div className="flee-failed-title">
              회피 실패 — 도주하지 못했습니다
            </div>
            <div className="flee-failed-body">
              <p>{fleeContext.description}</p>
              {fleeContext.hullDamage > 0 && (
                <p className="flee-failed-damage">
                  선체가  <strong>-{fleeContext.hullDamage}%</strong>  피해를 입었습니다. 도주를 시도하다 실패했습니다. 아직 교전 중입니다. 어떻게 맞설지 선택하세요.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Combat Status Section */}
        <div className="combat-section combat-status">
          <h3>전투 상황</h3>
          <div className="combat-info">
            <div className="combat-intensity">
              <span className="intensity-label">전투 강도:</span>
              <span
                className={`intensity-value ${intensity}`}
                style={{ color: intensityColor }}
              >
                {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
              </span>
            </div>
            <div className="combat-description">
              {combat.description ||
                '교전 중입니다. 전술 대응을 신중하게 선택하세요.'}
            </div>
          </div>
        </div>

        {/* Ship Condition Section */}
        <div className="combat-section ship-condition">
          <h3>함선 상태</h3>
          <div className="condition-grid">
            <div className="condition-item">
              <span className="condition-label">선체 무결성:</span>
              <span className={`condition-value ${getConditionClass(hull)}`}>
                {Math.round(hull ?? 100)}%
              </span>
              <span className="condition-impact">
                {(hull ?? 100) < SHIP_CONFIG.CONDITION_WARNING_THRESHOLDS.HULL
                  ? '기동성 저하'
                  : '정상 작동'}
              </span>
            </div>
            <div className="condition-item">
              <span className="condition-label">엔진 상태:</span>
              <span className={`condition-value ${getConditionClass(engine)}`}>
                {Math.round(engine ?? 100)}%
              </span>
              <span className="condition-impact">
                {(engine ?? 100) < COMBAT_CONFIG.ENGINE_PENALTY_THRESHOLD
                  ? '회피 능력 저하'
                  : '최대 출력 가능'}
              </span>
            </div>
            <div className="condition-item">
              <span className="condition-label">연료 잔량:</span>
              <span className={`condition-value ${getConditionClass(fuel)}`}>
                {Math.round(fuel ?? 100)}%
              </span>
              <span className="condition-impact">
                {fuel < COMBAT_CONFIG.DISPLAY_THRESHOLDS.LOW_FUEL
                  ? '기동 제한'
                  : '전투에 충분'}
              </span>
            </div>
            <div className="condition-item">
              <span className="condition-label">생명 유지:</span>
              <span
                className={`condition-value ${getConditionClass(lifeSupport)}`}
              >
                {Math.round(lifeSupport ?? 100)}%
              </span>
              <span className="condition-impact">
                {lifeSupport < COMBAT_CONFIG.DISPLAY_THRESHOLDS.LOW_LIFE_SUPPORT
                  ? '비상 프로토콜 가동'
                  : '안정적인 환경'}
              </span>
            </div>
          </div>

          {/* Combat Modifiers Display */}
          {(upgrades?.length > 0 || quirks?.length > 0) && (
            <div className="combat-modifiers">
              <h4>전투 보정</h4>
              <div className="modifiers-grid">
                {upgrades?.map((upgrade) => {
                  const modifier = COMBAT_CONFIG.MODIFIERS[upgrade];
                  if (!modifier) return null;
                  return (
                    <div key={upgrade} className="modifier-item upgrade">
                      <span className="modifier-name">
                        {formatModifierName(upgrade)}
                      </span>
                      <span className="modifier-effects">
                        {getModifierEffectsText(upgrade, modifier)}
                      </span>
                    </div>
                  );
                })}
                {quirks?.map((quirk) => {
                  const modifier = COMBAT_CONFIG.MODIFIERS[quirk];
                  if (!modifier) return null;
                  return (
                    <div key={quirk} className="modifier-item quirk">
                      <span className="modifier-name">
                        {formatModifierName(quirk)}
                      </span>
                      <span className="modifier-effects">
                        {getModifierEffectsText(quirk, modifier)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Combat Options Section */}
        <div className="combat-section combat-options">
          <h3>전투 선택지</h3>
          <div className="options-list">
            {/* Evasive Maneuvers Option */}
            <button
              className={`combat-option ${selectedOption === 'evasive' ? 'selected' : ''}`}
              onClick={() => handleOptionSelect('evasive')}
            >
              <div className="option-header">
                <span className="option-name">회피 기동</span>
                <span className="option-type">방어</span>
              </div>
              <div className="option-description">
                함선의 민첩성과 엔진 출력을 이용해 적의 사격을 피하고 탈출합니다.
              </div>
              <div className="option-analysis">
                <div className="probability-breakdown">
                  <div className="base-chance">
                    <span className="breakdown-label">기본 성공률:</span>
                    <span className="breakdown-value">
                      {Math.round(COMBAT_CONFIG.EVASIVE.BASE_CHANCE * 100)}%
                    </span>
                  </div>
                  {combatAnalysis.evasive.modifiers.map((mod) => (
                    <div
                      key={mod.name}
                      className={`modifier-breakdown ${mod.type}`}
                    >
                      <span className="breakdown-label">{mod.name}:</span>
                      <span className="breakdown-value">
                        {mod.value > 0 ? '+' : ''}
                        {Math.round(mod.value * 100)}%
                      </span>
                    </div>
                  ))}
                  <div className="final-chance">
                    <span className="breakdown-label">최종 성공률:</span>
                    <span className="breakdown-value final">
                      {Math.round(combatAnalysis.evasive.finalChance * 100)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="option-outcomes">
                <div className="outcome success">
                  <span className="outcome-label">성공:</span>
                  <span className="outcome-text">
                    전투 이탈, 연료 -15%, 엔진 상태 -5%
                  </span>
                </div>
                <div className="outcome failure">
                  <span className="outcome-label">실패:</span>
                  <span className="outcome-text">
                    선체 피해(-20%), 전투 계속
                  </span>
                </div>
              </div>
            </button>

            {/* Return Fire Option */}
            <button
              className={`combat-option ${selectedOption === 'return_fire' ? 'selected' : ''}`}
              onClick={() => handleOptionSelect('return_fire')}
            >
              <div className="option-header">
                <span className="option-name">응사</span>
                <span className="option-type">공격</span>
              </div>
              <div className="option-description">
                함선의 무기 체계로 적을 정면으로 공격합니다.
              </div>
              <div className="option-analysis">
                <div className="probability-breakdown">
                  <div className="base-chance">
                    <span className="breakdown-label">기본 성공률:</span>
                    <span className="breakdown-value">
                      {Math.round(COMBAT_CONFIG.RETURN_FIRE.BASE_CHANCE * 100)}%
                    </span>
                  </div>
                  {combatAnalysis.returnFire.modifiers.map((mod) => (
                    <div
                      key={mod.name}
                      className={`modifier-breakdown ${mod.type}`}
                    >
                      <span className="breakdown-label">{mod.name}:</span>
                      <span className="breakdown-value">
                        {mod.value > 0 ? '+' : ''}
                        {Math.round(mod.value * 100)}%
                      </span>
                    </div>
                  ))}
                  <div className="final-chance">
                    <span className="breakdown-label">최종 성공률:</span>
                    <span className="breakdown-value final">
                      {Math.round(combatAnalysis.returnFire.finalChance * 100)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="option-outcomes">
                <div className="outcome success">
                  <span className="outcome-label">성공:</span>
                  <span className="outcome-text">
                    적 격퇴, 선체 -10%, 무법자 평판 +5
                  </span>
                </div>
                <div className="outcome failure">
                  <span className="outcome-label">실패:</span>
                  <span className="outcome-text">
                    큰 피해(선체 -30%), 화물과 ₡500 손실
                  </span>
                </div>
              </div>
            </button>

            {/* Dump Cargo Option */}
            <button
              className={`combat-option ${selectedOption === 'dump_cargo' ? 'selected' : ''}`}
              onClick={() => handleOptionSelect('dump_cargo')}
            >
              <div className="option-header">
                <span className="option-name">화물 투하</span>
                <span className="option-type">희생</span>
              </div>
              <div className="option-description">
                화물을 버려 적의 주의를 돌리고 탈출을 돕습니다.
              </div>
              <div className="option-analysis">
                <div className="probability-breakdown">
                  <div className="guaranteed-success">
                    <span className="breakdown-label">성공률:</span>
                    <span className="breakdown-value guaranteed">100%</span>
                  </div>
                  <div className="cargo-cost">
                    <span className="breakdown-label">잃는 화물:</span>
                    <span className="breakdown-value">
                      {COMBAT_CONFIG.DUMP_CARGO.CARGO_LOSS_PERCENT}% 화물,{' '}
                      {COMBAT_CONFIG.DUMP_CARGO.FUEL_COST}% 연료
                    </span>
                  </div>
                </div>
              </div>
              <div className="option-outcomes">
                <div className="outcome guaranteed">
                  <span className="outcome-label">확정:</span>
                  <span className="outcome-text">
                    전투 이탈, 화물 {' '}
                    {COMBAT_CONFIG.DUMP_CARGO.CARGO_LOSS_PERCENT}% 손실, 선체 피해 없음
                  </span>
                </div>
              </div>
            </button>

            {/* Distress Call Option */}
            <button
              className={`combat-option ${selectedOption === 'distress_call' ? 'selected' : ''}`}
              onClick={() => handleOptionSelect('distress_call')}
            >
              <div className="option-header">
                <span className="option-name">조난 신호</span>
                <span className="option-type">비상</span>
              </div>
              <div className="option-description">
                구조나 개입을 바라며 비상 신호를 송출합니다.
              </div>
              <div className="option-analysis">
                <div className="probability-breakdown">
                  <div className="base-chance">
                    <span className="breakdown-label">기본 성공률:</span>
                    <span className="breakdown-value">
                      {Math.round(
                        COMBAT_CONFIG.DISTRESS_CALL.BASE_CHANCE * 100
                      )}
                      %
                    </span>
                  </div>
                  {combatAnalysis.distressCall.modifiers.map((mod) => (
                    <div
                      key={mod.name}
                      className={`modifier-breakdown ${mod.type}`}
                    >
                      <span className="breakdown-label">{mod.name}:</span>
                      <span className="breakdown-value">
                        {mod.value > 0 ? '+' : ''}
                        {Math.round(mod.value * 100)}%
                      </span>
                    </div>
                  ))}
                  <div className="final-chance">
                    <span className="breakdown-label">최종 성공률:</span>
                    <span className="breakdown-value final">
                      {Math.round(
                        combatAnalysis.distressCall.finalChance * 100
                      )}
                      %
                    </span>
                  </div>
                </div>
              </div>
              <div className="option-outcomes">
                <div className="outcome success">
                  <span className="outcome-label">성공:</span>
                  <span className="outcome-text">
                    구조대 도착, 전투 이탈, 당국 평판 +10
                  </span>
                </div>
                <div className="outcome failure">
                  <span className="outcome-label">실패:</span>
                  <span className="outcome-text">
                    응답 없음, 사기 -10%로 전투 계속
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="combat-actions">
          {selectedOption && (
            <>
              <button className="combat-btn primary" onClick={handleConfirm}>
                실행:  {formatOptionName(selectedOption)}
              </button>
              <button className="combat-btn secondary" onClick={handleCancel}>
                선택 변경
              </button>
            </>
          )}
          {!selectedOption && (
            <div className="selection-prompt">
              진행할 전투 선택지를 고르세요
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Calculate success probabilities and modifiers for all combat options
 *
 * @param {Object} combat - The combat encounter
 * @param {number} hull - Current hull condition
 * @param {number} engine - Current engine condition
 * @param {number} fuel - Current fuel level
 * @param {number} lifeSupport - Current life support condition
 * @param {Array} cargo - Current cargo
 * @param {Array} upgrades - Active ship upgrades
 * @param {Array} quirks - Active ship quirks
 * @param {number} karma - Current karma value
 * @param {Object} factions - Current faction reputation
 * @returns {Object} Analysis for each combat option
 */
function calculateCombatProbabilities(
  combat,
  _hull = 100,
  engine = 100,
  _fuel = 100,
  _lifeSupport = 100,
  _cargo = [],
  upgrades = [],
  quirks = [],
  karma = 0,
  _factions = {}
) {
  // Calculate karma modifier
  const karmaModifier = karma * KARMA_CONFIG.SUCCESS_RATE_SCALE;

  // Evasive Maneuvers Analysis
  const evasiveModifiers = [];
  let evasiveChance = COMBAT_CONFIG.EVASIVE.BASE_CHANCE;

  // Apply engine condition modifier
  if (engine < COMBAT_CONFIG.ENGINE_PENALTY_THRESHOLD) {
    evasiveChance += COMBAT_CONFIG.ENGINE_PENALTY_VALUE;
    evasiveModifiers.push({
      name: '엔진 상태 불량',
      value: COMBAT_CONFIG.ENGINE_PENALTY_VALUE,
      type: 'penalty',
    });
  }

  // Apply hot_thruster quirk bonus
  if (quirks.includes('hot_thruster')) {
    const hotThrusterBonus = COMBAT_CONFIG.MODIFIERS.hot_thruster.evasiveBonus;
    evasiveChance += hotThrusterBonus;
    evasiveModifiers.push({
      name: '뜨거운 추진기 버릇',
      value: hotThrusterBonus,
      type: 'bonus',
    });
  }

  // Apply efficient_drive upgrade bonus
  if (upgrades.includes('efficient_drive')) {
    const efficientDriveBonus =
      COMBAT_CONFIG.MODIFIERS.efficient_drive.fleeBonus;
    evasiveChance += efficientDriveBonus;
    evasiveModifiers.push({
      name: '고효율 구동 업그레이드',
      value: efficientDriveBonus,
      type: 'bonus',
    });
  }

  // Apply karma modifier
  if (Math.abs(karmaModifier) > 0.001) {
    evasiveChance += karmaModifier;
    evasiveModifiers.push({
      name: karma > 0 ? '선한 카르마' : '악한 카르마',
      value: karmaModifier,
      type: karma > 0 ? 'bonus' : 'penalty',
    });
  }

  evasiveChance = Math.max(0, Math.min(1, evasiveChance));

  // Return Fire Analysis
  const returnFireModifiers = [];
  let returnFireChance = COMBAT_CONFIG.RETURN_FIRE.BASE_CHANCE;

  // Apply karma modifier
  if (Math.abs(karmaModifier) > 0.001) {
    returnFireChance += karmaModifier;
    returnFireModifiers.push({
      name: karma > 0 ? '선한 카르마' : '악한 카르마',
      value: karmaModifier,
      type: karma > 0 ? 'bonus' : 'penalty',
    });
  }

  returnFireChance = Math.max(0, Math.min(1, returnFireChance));

  // Distress Call Analysis
  const distressCallModifiers = [];
  let distressCallChance = COMBAT_CONFIG.DISTRESS_CALL.BASE_CHANCE;

  // Apply karma modifier
  if (Math.abs(karmaModifier) > 0.001) {
    distressCallChance += karmaModifier;
    distressCallModifiers.push({
      name: karma > 0 ? '선한 카르마' : '악한 카르마',
      value: karmaModifier,
      type: karma > 0 ? 'bonus' : 'penalty',
    });
  }

  distressCallChance = Math.max(0, Math.min(1, distressCallChance));

  return {
    evasive: {
      finalChance: evasiveChance,
      modifiers: evasiveModifiers,
    },
    returnFire: {
      finalChance: returnFireChance,
      modifiers: returnFireModifiers,
    },
    distressCall: {
      finalChance: distressCallChance,
      modifiers: distressCallModifiers,
    },
  };
}

/**
 * Get color for combat intensity display based on threat level.
 * Colors follow the game's visual hierarchy: green (safe) to red (critical).
 *
 * @param {string} intensity - The combat intensity level
 * @returns {string} CSS color value for the intensity level
 */
function getCombatIntensityColor(intensity) {
  switch (intensity) {
    case 'light':
      return '#00ff88'; // Green - minimal threat
    case 'moderate':
      return '#ffaa00'; // Orange - standard engagement
    case 'heavy':
      return '#ff6b6b'; // Red - serious threat
    case 'intense':
      return '#ff0000'; // Bright red - maximum danger
    default:
      return '#ffffff'; // White - unknown/default
  }
}

/**
 * Format option names from snake_case to human-readable format for button labels.
 * Converts internal action identifiers to user-facing text.
 *
 * @param {string} optionName - The option name in snake_case format
 * @returns {string} Formatted display name for UI buttons
 */
function formatOptionName(optionName) {
  return optionName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get modifier effects text for display in the combat modifiers section.
 * Translates numeric bonuses into human-readable descriptions.
 * Shows percentage bonuses for different combat actions (evasion, combat, flee).
 *
 * @param {string} modifierName - The modifier identifier (for debugging)
 * @param {Object} modifier - The modifier configuration object
 * @returns {string} Human-readable effects description or fallback text
 */
function getModifierEffectsText(modifierName, modifier) {
  const effects = [];

  if (modifier.evasiveBonus) {
    effects.push(`+${Math.round(modifier.evasiveBonus * 100)}% 회피`);
  }

  if (modifier.fleeBonus) {
    effects.push(`+${Math.round(modifier.fleeBonus * 100)}% 도주`);
  }

  if (modifier.returnFireBonus) {
    effects.push(`+${Math.round(modifier.returnFireBonus * 100)}% 전투`);
  }

  return effects.join(', ') || '전투 보정';
}
