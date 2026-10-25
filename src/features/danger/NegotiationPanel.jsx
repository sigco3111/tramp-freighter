import { useState, useMemo } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import {
  NEGOTIATION_CONFIG,
  KARMA_CONFIG,
  PIRATE_CREDIT_DEMAND_CONFIG,
  EVENT_NAMES,
  BASE_PRICES,
  REPUTATION_BOUNDS,
} from '../../game/constants.js';
import { getKarmaClass, getReputationTier } from './dangerDisplayUtils';

/**
 * NegotiationPanel - React component for pirate negotiation resolution
 *
 * Displays contextual dialogue options with conditional options (medicine claim, intel offer).
 * Shows success probabilities and consequences for each negotiation choice.
 * Provides clear feedback on potential outcomes and karma/reputation effects.
 *
 * Architecture: danger-system
 * Validates: Requirements 4.1, 4.5, 4.8, 4.11, 12.1, 12.5
 *
 * @param {Object} props
 * @param {Object} props.encounter - The pirate encounter object
 * @param {Function} props.onChoice - Callback when player makes a negotiation choice
 * @param {Function} props.onClose - Callback to close the panel
 */
export function NegotiationPanel({ encounter, onChoice, onClose: _onClose }) {
  // Subscribe to relevant game events for negotiation context
  const cargo = useGameEvent(EVENT_NAMES.CARGO_CHANGED);
  const karma = useGameEvent(EVENT_NAMES.KARMA_CHANGED);
  const factions = useGameEvent(EVENT_NAMES.FACTION_REP_CHANGED);
  const intelligence = useGameEvent(EVENT_NAMES.INTELLIGENCE_CHANGED);

  // Local state for selected negotiation option
  const [selectedOption, setSelectedOption] = useState(null);

  // Calculate success probabilities for negotiation options
  const negotiationAnalysis = useMemo(
    () =>
      calculateNegotiationProbabilities(encounter, cargo, karma, intelligence),
    [encounter, cargo, karma, intelligence]
  );

  // Check for conditional options availability
  const hasMedicine = cargo?.some((item) => item.good === 'medicine') || false;
  const hasIntelligence = intelligence && Object.keys(intelligence).length > 0;
  const hasTradeCargo = cargo?.some((item) => item.qty > 0) || false;

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

  // Determine negotiation context for display
  const demandPercent =
    encounter.demandPercent ?? PIRATE_CREDIT_DEMAND_CONFIG.CARGO_DEMAND_PERCENT;
  const pirateDescription =
    encounter.description ||
    `해적들이 화물의 ${demandPercent}%를 공물로 요구하고 있습니다.`;

  return (
    <div
      id="negotiation-panel"
      className="panel-base visible"
      role="dialog"
      aria-modal="true"
      aria-labelledby="negotiation-panel-title"
    >
      <button
        className="close-btn"
        onClick={() => onChoice('flee')}
        aria-label="협상 이탈"
      >
        ×
      </button>
      <h2 id="negotiation-panel-title">협상</h2>

      <div className="negotiation-content">
        {/* Negotiation Context Section */}
        <div className="negotiation-section context-section">
          <h3>상황</h3>
          <div className="context-info">
            <div className="pirate-demand">
              <span className="demand-label">해적 요구:</span>
              <span className="demand-value">{demandPercent}% 화물</span>
            </div>
            <div className="situation-description">{pirateDescription}</div>
            <div className="negotiation-prompt">
              "좀 더... 합리적인 선에서 합의할 수 있지 않겠소?"
            </div>
          </div>
        </div>

        {/* Player Status Section */}
        <div className="negotiation-section status-section">
          <h3>당신의 입장</h3>
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">화물 가치:</span>
              <span className="status-value">
                ₡{calculateCargoValue(cargo).toLocaleString()}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">카르마:</span>
              <span className={`status-value ${getKarmaClass(karma)}`}>
                {karma > 0 ? '+' : ''}
                {karma || 0}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">무법자 입지:</span>
              <span
                className={`status-value ${getReputationClass(factions?.outlaws)}`}
              >
                {getReputationTier(factions?.outlaws || 0)}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">보유 정보:</span>
              <span className="status-value">
                {hasIntelligence ? 'Yes' : '없음'}
              </span>
            </div>
          </div>
        </div>

        {/* Negotiation Options Section */}
        <div className="negotiation-section options-section">
          <h3>대화 선택지</h3>
          <div className="options-list">
            {/* Counter-Proposal Option */}
            <button
              className={`negotiation-option ${selectedOption === 'counter_proposal' ? 'selected' : ''}`}
              onClick={() => handleOptionSelect('counter_proposal')}
            >
              <div className="option-header">
                <span className="option-name">역제안</span>
                <span className="option-type">흥정</span>
              </div>
              <div className="option-dialogue">
                "당신들도 먹고살아야 하는 건 알지만 요구가 너무 과해요. 좀 더 합리적인 선에서 끝내는 게 어떻겠소?"
              </div>
              <div className="option-analysis">
                <div className="probability-display">
                  <span className="prob-label">성공 확률:</span>
                  <span className="prob-value">
                    {Math.round(
                      negotiationAnalysis.counterProposal.finalChance * 100
                    )}
                    %
                  </span>
                </div>
                {negotiationAnalysis.counterProposal.modifiers.map((mod) => (
                  <div
                    key={mod.name}
                    className={`modifier-display ${mod.type}`}
                  >
                    <span className="modifier-label">{mod.name}:</span>
                    <span className="modifier-value">
                      {mod.value > 0 ? '+' : ''}
                      {Math.round(mod.value * 100)}%
                    </span>
                  </div>
                ))}
              </div>
              <div className="option-outcomes">
                <div className="outcome success">
                  <span className="outcome-label">성공:</span>
                  <span className="outcome-text">
                    화물의 {' '}
                    {NEGOTIATION_CONFIG.COUNTER_PROPOSAL.SUCCESS_CARGO_PERCENT}%만 지불 (원래 요구:  {demandPercent}%
                  </span>
                </div>
                <div className="outcome failure">
                  <span className="outcome-label">실패:</span>
                  <span className="outcome-text">
                    해적이 더 공격적으로 변함 (+
                    {Math.round(
                      NEGOTIATION_CONFIG.COUNTER_PROPOSAL
                        .FAILURE_STRENGTH_INCREASE * 100
                    )}
                    % 위협), 전투 가능성 높음
                  </span>
                </div>
              </div>
            </button>

            {/* Medicine Claim Option - Only if player has medicine */}
            {hasMedicine && (
              <button
                className={`negotiation-option conditional ${selectedOption === 'medicine_claim' ? 'selected' : ''}`}
                onClick={() => handleOptionSelect('medicine_claim')}
              >
                <div className="option-header">
                  <span className="option-name">의약품 주장</span>
                  <span className="option-type">인도주의</span>
                </div>
                <div className="option-dialogue">
                  "잠깐! 외곽 항성계 민간인에게 보낼 의료품을 싣고 있소. 이게 도착하지 못하면 사람들이 죽소."
                </div>
                <div className="option-analysis">
                  <div className="probability-display">
                    <span className="prob-label">동정 확률:</span>
                    <span className="prob-value">
                      {Math.round(
                        negotiationAnalysis.medicineClaim.finalChance * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="conditional-note">
                    <span className="condition-label">필요:</span>
                    <span className="condition-text">화물에 의약품</span>
                  </div>
                </div>
                <div className="option-outcomes">
                  <div className="outcome success">
                    <span className="outcome-label">성공:</span>
                    <span className="outcome-text">
                      해적이 동정해 무료 통과 허용
                    </span>
                  </div>
                  <div className="outcome failure">
                    <span className="outcome-label">실패:</span>
                    <span className="outcome-text">
                      해적이 믿지 않고 원래 공물 요구
                    </span>
                  </div>
                </div>
              </button>
            )}

            {/* Intel Offer Option - Only if player has intelligence */}
            {hasIntelligence && (
              <button
                className={`negotiation-option conditional ${selectedOption === 'intel_offer' ? 'selected' : ''}`}
                onClick={() => handleOptionSelect('intel_offer')}
              >
                <div className="option-header">
                  <span className="option-name">정보 제공</span>
                  <span className="option-type">정보</span>
                </div>
                <div className="option-dialogue">
                  "이 근처 다른 배들에 대한 정보가 있소... 값나가는 화물 항로 말이오. 거래할 마음이 있다면."
                </div>
                <div className="option-analysis">
                  <div className="probability-display">
                    <span className="prob-label">수락 확률:</span>
                    <span className="prob-value">
                      {Math.round(
                        NEGOTIATION_CONFIG.INTEL_OFFER.BASE_SUCCESS_RATE * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="conditional-note">
                    <span className="condition-label">필요:</span>
                    <span className="condition-text">
                      시장 정보 데이터
                    </span>
                  </div>
                </div>
                <div className="option-outcomes">
                  <div className="outcome success">
                    <span className="outcome-label">성공:</span>
                    <span className="outcome-text">
                      해적이 정보를 받아들이고 통과 허용, +
                      {NEGOTIATION_CONFIG.INTEL_OFFER.OUTLAW_REP_GAIN}  무법자 평판
                    </span>
                  </div>
                  <div className="outcome failure">
                    <span className="outcome-label">실패:</span>
                    <span className="outcome-text">
                      해적이 정보의 질을 의심함, +
                      {Math.round(
                        NEGOTIATION_CONFIG.INTEL_OFFER
                          .SUSPICIOUS_STRENGTH_INCREASE * 100
                      )}
                      % 위협
                    </span>
                  </div>
                  <div className="outcome warning">
                    <span className="outcome-label">위험:</span>
                    <span className="outcome-text">
                      나중에 발각될 경우:{' '}
                      {NEGOTIATION_CONFIG.INTEL_OFFER.SUCCESS_REP_PENALTY}{' '}
                      당국과의 평판
                    </span>
                  </div>
                </div>
              </button>
            )}

            {/* Accept Demand Option */}
            <button
              className={`negotiation-option ${selectedOption === 'accept_demand' ? 'selected' : ''}`}
              onClick={() => handleOptionSelect('accept_demand')}
            >
              <div className="option-header">
                <span className="option-name">요구 수락</span>
                <span className="option-type">순응</span>
              </div>
              <div className="option-dialogue">
                {hasTradeCargo
                  ? '"알았소, 내가 졌소. 공물을 내겠소. 제 갈 길 가게 해 주시오."'
                  : '"화물은 없지만 크레딧으로 낼 수 있소..."'}
              </div>
              <div className="option-analysis">
                <div
                  className={`probability-display ${hasTradeCargo ? 'guaranteed' : ''}`}
                >
                  <span className="prob-label">성공률:</span>
                  <span
                    className={`prob-value ${hasTradeCargo ? 'guaranteed' : ''}`}
                  >
                    {hasTradeCargo ? '100%' : '변동'}
                  </span>
                </div>
              </div>
              <div className="option-outcomes">
                {hasTradeCargo ? (
                  <div className="outcome guaranteed">
                    <span className="outcome-label">확정:</span>
                    <span className="outcome-text">
                      화물의  {NEGOTIATION_CONFIG.ACCEPT_DEMAND.CARGO_PERCENT}% 지불, 안전 통과
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="outcome guaranteed">
                      <span className="outcome-label">크레딧 요구:</span>
                      <span className="outcome-text">
                        ₡{PIRATE_CREDIT_DEMAND_CONFIG.MIN_CREDIT_DEMAND}-₡
                        {PIRATE_CREDIT_DEMAND_CONFIG.MAX_CREDIT_DEMAND}
                      </span>
                    </div>
                    <div className="outcome failure">
                      <span className="outcome-label">낼 수 없는 경우:</span>
                      <span className="outcome-text">
                        해적이 승객을 납치하거나 함선을 손상시킬 수 있습니다
                      </span>
                    </div>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="negotiation-actions">
          {selectedOption && (
            <>
              <button
                className="negotiation-btn primary"
                onClick={handleConfirm}
              >
                말하기: "{getOptionDialogue(selectedOption)}"
              </button>
              <button
                className="negotiation-btn secondary"
                onClick={handleCancel}
              >
                다시 생각하기
              </button>
            </>
          )}
          {!selectedOption && (
            <div className="selection-prompt">
              말을 신중히 고르세요 - 목숨이 달려 있을 수 있습니다
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Calculate success probabilities for negotiation options
 *
 * @param {Object} encounter - The pirate encounter
 * @param {Array} cargo - Current cargo
 * @param {number} karma - Current karma value
 * @param {Object} intelligence - Available intelligence data
 * @returns {Object} Analysis for each negotiation option
 */
function calculateNegotiationProbabilities(
  encounter,
  _cargo = [],
  karma = 0,
  _intelligence = {}
) {
  // Calculate karma modifier
  const karmaModifier = karma * (KARMA_CONFIG.SUCCESS_RATE_SCALE ?? 0.0005);

  // Counter-proposal analysis
  const counterProposalModifiers = [];
  let counterProposalChance = NEGOTIATION_CONFIG.COUNTER_PROPOSAL.BASE_CHANCE;

  // Apply karma modifier
  if (Math.abs(karmaModifier) > 0.001) {
    counterProposalChance += karmaModifier;
    counterProposalModifiers.push({
      name: karma > 0 ? '선한 카르마' : '악한 카르마',
      value: karmaModifier,
      type: karma > 0 ? 'bonus' : 'penalty',
    });
  }

  counterProposalChance = Math.max(0, Math.min(1, counterProposalChance));

  // Medicine claim analysis
  const medicineClaimModifiers = [];
  let medicineClaimChance = NEGOTIATION_CONFIG.MEDICINE_CLAIM.SYMPATHY_CHANCE;

  // Apply karma modifier
  if (Math.abs(karmaModifier) > 0.001) {
    medicineClaimChance += karmaModifier;
    medicineClaimModifiers.push({
      name: karma > 0 ? '선한 카르마' : '악한 카르마',
      value: karmaModifier,
      type: karma > 0 ? 'bonus' : 'penalty',
    });
  }

  medicineClaimChance = Math.max(0, Math.min(1, medicineClaimChance));

  return {
    counterProposal: {
      finalChance: counterProposalChance,
      modifiers: counterProposalModifiers,
    },
    medicineClaim: {
      finalChance: medicineClaimChance,
      modifiers: medicineClaimModifiers,
    },
  };
}

/**
 * Calculate total cargo value for display
 *
 * @param {Array} cargo - Current cargo array
 * @returns {number} Total cargo value in credits
 */
function calculateCargoValue(cargo) {
  if (!cargo || cargo.length === 0) return 0;
  return cargo.reduce((total, item) => {
    // Estimate value based on quantity and typical prices
    const estimatedPrice = getEstimatedPrice(item.good);
    return total + (item.qty || 0) * estimatedPrice;
  }, 0);
}

/**
 * Get estimated price for a commodity (simplified for display)
 *
 * @param {string} good - Commodity type
 * @returns {number} Estimated price per unit
 */
function getEstimatedPrice(good) {
  return BASE_PRICES[good] || 20;
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

/**
 * Get shortened dialogue text for button display
 *
 * @param {string} optionName - The selected option name
 * @returns {string} Shortened dialogue for button
 */
function getOptionDialogue(optionName) {
  switch (optionName) {
    case 'counter_proposal':
      return '좀 더 합리적인 선은 어떻소?';
    case 'medicine_claim':
      return "의료품을 싣고 있소...";
    case 'intel_offer':
      return '당신들이 원할 만한 정보가 있소...';
    case 'accept_demand':
      return "알았소, 내가 졌소.";
    default:
      return '협상 계속';
  }
}
