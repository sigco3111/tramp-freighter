import { useMemo } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import {
  FACTION_CONFIG,
  EVENT_NAMES,
  REPUTATION_BOUNDS,
} from '../../game/constants.js';
import { getKarmaClass } from './dangerDisplayUtils';

/**
 * OutcomePanel - React component for displaying encounter outcomes
 *
 * Displays encounter outcome with explanation, shows what modifiers
 * affected the result, and displays karma/reputation changes.
 * Provides feedback on why specific outcomes occurred.
 *
 * Architecture: danger-system
 * Validates: Requirements 9.9, 12.6
 *
 * @param {Object} props
 * @param {Object} props.outcome - The encounter outcome object
 * @param {Function} props.onClose - Callback to close the panel
 * @param {Function} props.onContinue - Callback to continue after reviewing outcome
 */
export function OutcomePanel({ outcome, onClose, onContinue }) {
  // Subscribe to current karma and faction reputation for display
  const karma = useGameEvent(EVENT_NAMES.KARMA_CHANGED);
  const factions = useGameEvent(EVENT_NAMES.FACTION_REP_CHANGED) || {};

  // Process outcome data for display
  const outcomeAnalysis = useMemo(() => {
    if (!outcome) return null;

    return {
      success: outcome.success || false,
      encounterType: outcome.encounterType || 'unknown',
      choiceMade: outcome.choiceMade || 'unknown',
      explanation: outcome.explanation || '조우가 종료되었습니다.',
      modifiers: outcome.modifiers || [],
      consequences: outcome.consequences || {},
      karmaChanges: outcome.karmaChanges || [],
      reputationChanges: outcome.reputationChanges || [],
      resourceChanges: outcome.resourceChanges || {},
    };
  }, [outcome]);

  if (!outcomeAnalysis) {
    return null;
  }

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    }
  };

  return (
    <div
      id="outcome-panel"
      className="panel-base visible"
      role="dialog"
      aria-modal="true"
      aria-labelledby="outcome-panel-title"
    >
      <button className="close-btn" onClick={onClose} aria-label="닫기">
        ×
      </button>
      <h2 id="outcome-panel-title">조우 결과</h2>

      <div className="outcome-content">
        {/* Outcome Summary Section */}
        <div className="outcome-section outcome-summary">
          <h3>결과</h3>
          <div className="outcome-result">
            <div className="result-header">
              <span className="encounter-type">
                {formatEncounterType(outcomeAnalysis.encounterType)}
              </span>
              <span
                className={`result-status ${outcomeAnalysis.success ? 'success' : 'failure'}`}
              >
                {outcomeAnalysis.success ? '성공' : '실패'}
              </span>
            </div>
            <div className="choice-made">
              <span className="choice-label">당신의 선택:</span>
              <span className="choice-value">
                {formatChoiceName(outcomeAnalysis.choiceMade)}
              </span>
            </div>
            <div className="outcome-explanation">
              {outcomeAnalysis.explanation}
            </div>
          </div>
        </div>

        {/* Modifiers That Affected Result */}
        {outcomeAnalysis.modifiers.length > 0 && (
          <div className="outcome-section modifiers-section">
            <h3>결과에 영향을 준 요인</h3>
            <div className="modifiers-list">
              {outcomeAnalysis.modifiers.map((modifier, index) => (
                <div
                  key={index}
                  className={`modifier-item ${modifier.type || 'neutral'}`}
                >
                  <div className="modifier-header">
                    <span className="modifier-name">{modifier.name}</span>
                    <span className="modifier-impact">
                      {formatModifierImpact(modifier.value, modifier.type)}
                    </span>
                  </div>
                  {modifier.description && (
                    <div className="modifier-description">
                      {modifier.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Consequences Section - only render when there's content */}
        {(Object.keys(outcomeAnalysis.resourceChanges).length > 0 ||
          outcomeAnalysis.karmaChanges.length > 0 ||
          outcomeAnalysis.reputationChanges.length > 0) && (
          <div className="outcome-section consequences-section">
            <h3>결과로 인한 영향</h3>
            <div className="consequences-grid">
              {/* Resource Changes */}
              {Object.keys(outcomeAnalysis.resourceChanges).length > 0 && (
                <div className="consequence-category resource-changes">
                  <h4>함선 및 자원</h4>
                  <div className="changes-list">
                    {Object.entries(outcomeAnalysis.resourceChanges).map(
                      ([resource, change]) => (
                        <div key={resource} className="change-item">
                          <span className="change-label">
                            {formatResourceName(resource)}:
                          </span>
                          <span
                            className={`change-value ${change >= 0 ? 'positive' : 'negative'}`}
                          >
                            {formatResourceChange(resource, change)}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Karma Changes */}
              {outcomeAnalysis.karmaChanges.length > 0 && (
                <div className="consequence-category karma-changes">
                  <h4>도덕적 입지</h4>
                  <div className="changes-list">
                    {outcomeAnalysis.karmaChanges.map((change, index) => (
                      <div key={index} className="change-item karma">
                        <span className="change-label">카르마:</span>
                        <span
                          className={`change-value ${change.amount >= 0 ? 'positive' : 'negative'}`}
                        >
                          {change.amount >= 0 ? '+' : ''}
                          {change.amount}
                        </span>
                        <span className="change-reason">({change.reason})</span>
                      </div>
                    ))}
                    <div className="current-karma">
                      <span className="current-label">현재 카르마:</span>
                      <span className={`current-value ${getKarmaClass(karma)}`}>
                        {karma}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Reputation Changes */}
              {outcomeAnalysis.reputationChanges.length > 0 && (
                <div className="consequence-category reputation-changes">
                  <h4>세력 입지</h4>
                  <div className="changes-list">
                    {outcomeAnalysis.reputationChanges.map((change, index) => (
                      <div key={index} className="change-item reputation">
                        <span className="change-label">
                          {formatFactionName(change.faction)}:
                        </span>
                        <span
                          className={`change-value ${change.amount >= 0 ? 'positive' : 'negative'}`}
                        >
                          {change.amount >= 0 ? '+' : ''}
                          {change.amount}
                        </span>
                        <span className="change-reason">({change.reason})</span>
                      </div>
                    ))}
                    {/* Current Faction Standings */}
                    <div className="current-standings">
                      <h5>현재 입지:</h5>
                      {FACTION_CONFIG.FACTIONS.map((faction) => (
                        <div key={faction} className="current-standing">
                          <span className="faction-name">
                            {formatFactionName(faction)}:
                          </span>
                          <span
                            className={`faction-value ${getReputationClass(
                              factions[faction]
                            )}`}
                          >
                            {factions[faction] ?? 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Consequences */}
        {outcomeAnalysis.consequences.additionalEffects && (
          <div className="outcome-section additional-effects">
            <h3>추가 효과</h3>
            <div className="effects-list">
              {outcomeAnalysis.consequences.additionalEffects.map(
                (effect, index) => (
                  <div key={index} className="effect-item">
                    <span className="effect-icon">•</span>
                    <span className="effect-text">{effect}</span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="outcome-actions">
          <button className="outcome-btn primary" onClick={handleContinue}>
            계속
          </button>
          {onClose && (
            <button className="outcome-btn secondary" onClick={onClose}>
              닫기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Format encounter type for display
 *
 * @param {string} encounterType - The encounter type identifier
 * @returns {string} Formatted display name
 */
function formatEncounterType(encounterType) {
  switch (encounterType) {
    case 'pirate':
    case 'pirate_encounter':
      return '해적 조우';
    case 'inspection':
    case 'customs_inspection':
      return '세관 검문';
    case 'mechanical_failure':
      return '기계 고장';
    case 'distress_call':
    case 'civilian_distress':
      return '조난 신호';
    case 'combat':
      return '전투';
    case 'negotiation':
      return '협상';
    default:
      return '조우';
  }
}

/**
 * Format choice name for display
 *
 * @param {string} choice - The choice identifier
 * @returns {string} Formatted display name
 */
function formatChoiceName(choice) {
  return choice
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format modifier impact for display
 *
 * @param {number} value - The modifier value
 * @param {string} type - The modifier type (bonus, penalty, neutral)
 * @returns {string} Formatted impact display
 */
function formatModifierImpact(value, type) {
  if (typeof value === 'number') {
    const percentage = Math.round(Math.abs(value) * 100);
    const sign = value >= 0 ? '+' : '-';
    return `${sign}${percentage}%`;
  }

  switch (type) {
    case 'bonus':
      return '긍정적';
    case 'penalty':
      return '부정적';
    default:
      return '중립';
  }
}

/**
 * Format resource name for display
 *
 * @param {string} resource - The resource identifier
 * @returns {string} Formatted display name
 */
function formatResourceName(resource) {
  switch (resource) {
    case 'hull':
      return '선체 무결성';
    case 'engine':
      return '엔진 상태';
    case 'fuel':
      return '연료';
    case 'lifeSupport':
      return '생명 유지';
    case 'credits':
      return '크레딧';
    case 'cargo':
      return '화물';
    case 'days':
      return '시간 지연';
    default:
      return resource.charAt(0).toUpperCase() + resource.slice(1);
  }
}

/**
 * Format resource change for display
 *
 * @param {string} resource - The resource type
 * @param {number} change - The change amount
 * @returns {string} Formatted change display
 */
function formatResourceChange(resource, change) {
  if (resource === 'credits') {
    return `${change >= 0 ? '+' : '-'}₡${Math.abs(change)}`;
  }

  if (resource === 'days') {
    const days = Math.abs(change);
    return `${change >= 0 ? '+' : ''}${days} day${days !== 1 ? 's' : ''}`;
  }

  if (resource === 'cargo') {
    const percent = Math.abs(change);
    if (percent >= 100) return '모든 화물 손실';
    return `-${percent}% 화물`;
  }

  // For percentage-based resources (hull, engine, fuel, lifeSupport)
  return `${change >= 0 ? '+' : ''}${change}%`;
}

/**
 * Format faction name for display
 *
 * @param {string} faction - The faction identifier
 * @returns {string} Formatted display name
 */
function formatFactionName(faction) {
  switch (faction) {
    case 'authorities':
      return '당국';
    case 'traders':
      return '상인';
    case 'outlaws':
      return '무법자';
    case 'civilians':
      return '민간인';
    default:
      return faction.charAt(0).toUpperCase() + faction.slice(1);
  }
}

/**
 * Get CSS class for reputation value display
 *
 * @param {number} reputation - The reputation value
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
