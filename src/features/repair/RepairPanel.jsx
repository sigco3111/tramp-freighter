import { useState } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';
import { useStarData } from '../../hooks/useStarData';
import {
  calculateRepairCost,
  calculateDiscountedRepairCost,
  calculateRepairAllCost,
  calculateDiscountedRepairAllCost,
  validateRepairAll,
  getSystemCondition,
  getSystemName,
  isSystemCritical,
  canAffordRepairAboveThreshold,
  calculateCannibalizeRequired,
  calculateMaxDonation,
} from './repairUtils';
import {
  SHIP_CONFIG,
  UI_CONFIG,
  REPAIR_CONFIG,
  EVENT_NAMES,
} from '../../game/constants';
import { getNPCsAtSystem } from '../../game/game-npcs';
import { tierKo } from '../../game/tier-ko.js';

/**
 * RepairPanel component for repairing ship systems.
 *
 * Displays current ship condition and provides options to repair hull,
 * engine, and life support systems individually or all at once.
 *
 * React Migration Spec: Requirements 8.3
 *
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Callback to close the panel
 * @returns {JSX.Element} Repair panel component
 */
export function RepairPanel({ onClose }) {
  const starData = useStarData();
  const shipCondition = useGameEvent(EVENT_NAMES.SHIP_CONDITION_CHANGED);
  const credits = useGameEvent(EVENT_NAMES.CREDITS_CHANGED);
  const currentSystemId = useGameEvent(EVENT_NAMES.LOCATION_CHANGED);
  const {
    repair,
    canGetFreeRepair,
    getFreeRepair,
    applyEmergencyPatch,
    cannibalizeSystem,
    getNarrativeFlags,
    getServiceDiscount,
  } = useGameAction();

  const [validationMessage, setValidationMessage] = useState('');
  const [validationClass, setValidationClass] = useState('');
  const [cannibalizeAllocation, setCannibalizeAllocation] = useState({});

  // Use Bridge Pattern to get ship condition
  const condition = shipCondition;

  // Get NPCs at current location for free repair checks
  const npcsAtSystem = getNPCsAtSystem(currentSystemId, getNarrativeFlags());

  // Check for available free repairs from any NPC at this location
  const freeRepairOptions = npcsAtSystem
    .map((npc) => {
      const freeRepairAvailability = canGetFreeRepair(npc.id);
      return {
        npc,
        availability: freeRepairAvailability,
      };
    })
    .filter((option) => option.availability.available);

  // Get repair service discounts from NPCs at this location
  const repairDiscounts = npcsAtSystem
    .map((npc) => {
      const discountInfo = getServiceDiscount(npc.id, 'repair');
      return {
        npc,
        discount: discountInfo.discount,
        npcName: discountInfo.npcName,
      };
    })
    .filter((option) => option.discount > 0);

  // Calculate the best discount available
  const bestDiscount = repairDiscounts.reduce(
    (best, current) => (current.discount > best.discount ? current : best),
    { discount: 0, npcName: null }
  );

  const handleRepairSystem = (systemType, amountStr) => {
    let amount = 0;
    const currentCondition = getSystemCondition(condition, systemType);

    if (amountStr === 'full') {
      amount = SHIP_CONFIG.CONDITION_BOUNDS.MAX - currentCondition;
    } else {
      amount = parseInt(amountStr);
    }

    // Execute repair
    const repairOutcome = repair(systemType, amount, bestDiscount.discount);

    if (!repairOutcome.success) {
      setValidationMessage(`수리 실패: ${repairOutcome.reason}`);
      setValidationClass('error');
    } else {
      setValidationMessage('');
      setValidationClass('');
    }
  };

  const handleFreeRepair = (npcId, _maxHullPercent) => {
    // Calculate current hull damage percentage
    const currentHull = condition.hull;
    const maxHull = SHIP_CONFIG.CONDITION_BOUNDS.MAX;
    const hullDamagePercent = maxHull - currentHull;

    // Apply free repair
    const repairOutcome = getFreeRepair(npcId, hullDamagePercent);

    if (repairOutcome.success) {
      setValidationMessage(`무료 수리 완료: ${repairOutcome.message}`);
      setValidationClass('success');
    } else {
      setValidationMessage(`무료 수리 실패: ${repairOutcome.message}`);
      setValidationClass('error');
    }
  };

  const handleEmergencyPatch = (systemType) => {
    const result = applyEmergencyPatch(systemType);
    if (result.success) {
      setValidationMessage(
        `${getSystemName(systemType)}에 응급 패치를 적용했습니다. +${REPAIR_CONFIG.EMERGENCY_PATCH_DAYS_PENALTY}일.`
      );
      setValidationClass('warning');
    } else {
      setValidationMessage(`응급 패치 실패: ${result.reason}`);
      setValidationClass('error');
    }
  };

  const handleCannibalize = (targetType) => {
    const donations = Object.entries(cannibalizeAllocation)
      .filter(([, amount]) => amount > 0)
      .map(([system, amount]) => ({ system, amount }));

    const result = cannibalizeSystem(targetType, donations);
    if (result.success) {
      setValidationMessage(
        `${getSystemName(targetType)}을(를) 패치하려고 다른 시스템을 분해했습니다.`
      );
      setValidationClass('warning');
      setCannibalizeAllocation({});
    } else {
      setValidationMessage(`분해 수리 실패: ${result.reason}`);
      setValidationClass('error');
    }
  };

  const handleRepairAll = () => {
    const validation = validateRepairAll(condition, credits);

    if (!validation.valid) {
      setValidationMessage(validation.reason);
      setValidationClass('error');
      return;
    }

    let repairCount = 0;
    let failedRepairs = [];

    // Repair hull
    const hullAmount = SHIP_CONFIG.CONDITION_BOUNDS.MAX - condition.hull;
    if (hullAmount > 0) {
      const repairOutcome = repair('hull', hullAmount, bestDiscount.discount);
      if (repairOutcome.success) {
        repairCount++;
      } else {
        failedRepairs.push(`선체: ${repairOutcome.reason}`);
      }
    }

    // Repair engine
    const engineAmount = SHIP_CONFIG.CONDITION_BOUNDS.MAX - condition.engine;
    if (engineAmount > 0) {
      const repairOutcome = repair(
        'engine',
        engineAmount,
        bestDiscount.discount
      );
      if (repairOutcome.success) {
        repairCount++;
      } else {
        failedRepairs.push(`엔진: ${repairOutcome.reason}`);
      }
    }

    // Repair life support
    const lifeSupportAmount =
      SHIP_CONFIG.CONDITION_BOUNDS.MAX - condition.lifeSupport;
    if (lifeSupportAmount > 0) {
      const repairOutcome = repair(
        'lifeSupport',
        lifeSupportAmount,
        bestDiscount.discount
      );
      if (repairOutcome.success) {
        repairCount++;
      } else {
        failedRepairs.push(`생명 유지: ${repairOutcome.reason}`);
      }
    }

    // Show results
    if (failedRepairs.length > 0) {
      setValidationMessage(`일부 수리 실패: ${failedRepairs.join(', ')}`);
      setValidationClass('error');
    } else if (repairCount > 0) {
      setValidationMessage('');
      setValidationClass('');
    } else {
      setValidationMessage('모든 시스템이 이미 최대 상태입니다');
      setValidationClass('info');
    }
  };

  const renderConditionItem = (systemType, label, barClass) => {
    const currentCondition = getSystemCondition(condition, systemType);

    return (
      <div className="condition-item">
        <div className="condition-header">
          <span className="condition-label">{label}:</span>
          <span className="condition-value">
            {Math.round(currentCondition)}%
          </span>
        </div>
        <div className="condition-bar-container">
          <div
            className={`condition-bar ${barClass}`}
            style={{ width: `${currentCondition}%` }}
          />
        </div>
      </div>
    );
  };

  const renderSystemRepair = (systemType, label) => {
    const currentCondition = getSystemCondition(condition, systemType);
    const repairAmounts = UI_CONFIG.REPAIR_AMOUNTS;

    return (
      <div className="repair-system-group">
        <h4>{label}</h4>
        <div className="repair-buttons">
          {repairAmounts.map((amountStr) => {
            let amount = 0;
            let cost = 0;
            let discountedCost = 0;
            let buttonText = '';

            if (amountStr === 'full') {
              amount = SHIP_CONFIG.CONDITION_BOUNDS.MAX - currentCondition;
              cost = calculateRepairCost(amount, currentCondition);
              discountedCost = calculateDiscountedRepairCost(
                amount,
                currentCondition,
                bestDiscount.discount
              );

              if (bestDiscount.discount > 0) {
                buttonText = `전체 (₡${discountedCost})`;
              } else {
                buttonText = `전체 (₡${cost})`;
              }
            } else {
              amount = amountStr;
              cost = calculateRepairCost(amount, currentCondition);
              discountedCost = calculateDiscountedRepairCost(
                amount,
                currentCondition,
                bestDiscount.discount
              );

              if (bestDiscount.discount > 0) {
                buttonText = `+${amount}% (₡${discountedCost})`;
              } else {
                buttonText = `+${amount}% (₡${cost})`;
              }
            }

            const wouldExceedMax =
              currentCondition + amount > SHIP_CONFIG.CONDITION_BOUNDS.MAX;
            const atMax = currentCondition >= SHIP_CONFIG.CONDITION_BOUNDS.MAX;
            const finalCost = bestDiscount.discount > 0 ? discountedCost : cost;
            const notEnoughCredits = credits < finalCost;

            const disabled =
              atMax || notEnoughCredits || wouldExceedMax || amount <= 0;

            return (
              <button
                key={amountStr}
                className="repair-btn"
                onClick={() => handleRepairSystem(systemType, amountStr)}
                disabled={disabled}
              >
                {buttonText}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const totalCost = calculateRepairAllCost(condition);
  const discountedTotalCost = calculateDiscountedRepairAllCost(
    condition,
    bestDiscount.discount
  );
  const finalTotalCost =
    bestDiscount.discount > 0 ? discountedTotalCost : totalCost;

  const allAtMax =
    condition.hull >= SHIP_CONFIG.CONDITION_BOUNDS.MAX &&
    condition.engine >= SHIP_CONFIG.CONDITION_BOUNDS.MAX &&
    condition.lifeSupport >= SHIP_CONFIG.CONDITION_BOUNDS.MAX;
  const repairAllDisabled =
    allAtMax || credits < finalTotalCost || totalCost === 0;

  const currentSystem = starData.find((s) => s.id === currentSystemId);

  if (!currentSystem) {
    return (
      <div id="repair-panel" className="visible">
        <button className="close-btn" onClick={onClose} aria-label="닫기">
          ×
        </button>
        <h2>수리 - 오류</h2>
        <div className="repair-content">
          <div className="validation-message error">
            시스템 데이터 오류: 수리 패널을 불러올 수 없습니다. 게임을 다시 시작하세요.
          </div>
        </div>
        <div className="repair-actions">
          <button className="station-btn secondary" onClick={onClose}>
            정거장으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const currentSystemName = currentSystem.name;

  return (
    <div id="repair-panel" className="visible">
      <button className="close-btn" onClick={onClose} aria-label="닫기">
        ×
      </button>
      <h2>
        수리 -  <span>{currentSystemName}</span>
      </h2>

      <div className="repair-content">
        {/* Ship Condition Status Section */}
        <div className="repair-section">
          <h3>함선 상태</h3>
          <div className="condition-status">
            {renderConditionItem('hull', '선체 무결성', 'hull-bar')}
            {renderConditionItem('engine', '엔진', 'engine-bar')}
            {renderConditionItem(
              'lifeSupport',
              '생명 유지',
              'life-support-bar'
            )}
          </div>
        </div>

        {/* Repair Options Section */}
        <div className="repair-section">
          <h3>수리 선택지</h3>
          <div className="repair-options">
            {renderSystemRepair('hull', '선체 무결성')}
            {renderSystemRepair('engine', '엔진')}
            {renderSystemRepair('lifeSupport', '생명 유지')}

            {/* Repair All Option */}
            <div className="repair-all-section">
              <button
                className="repair-all-btn"
                onClick={handleRepairAll}
                disabled={repairAllDisabled}
              >
                전부 최대치로 수리 (₡{finalTotalCost})
              </button>
            </div>
          </div>
        </div>

        {/* Emergency Patch Section */}
        {['hull', 'engine', 'lifeSupport'].some(
          (sys) =>
            isSystemCritical(getSystemCondition(condition, sys)) &&
            !canAffordRepairAboveThreshold(
              getSystemCondition(condition, sys),
              credits
            )
        ) && (
          <div className="repair-section emergency-section">
            <h3>응급 패치</h3>
            <p className="emergency-warning">
              최소 비행 가능 상태로 임시 수리합니다. 시스템당 소요:{' '}
              {REPAIR_CONFIG.EMERGENCY_PATCH_DAYS_PENALTY} 일
            </p>
            {['hull', 'engine', 'lifeSupport'].map((sys) => {
              const cond = getSystemCondition(condition, sys);
              if (!isSystemCritical(cond)) return null;
              if (canAffordRepairAboveThreshold(cond, credits)) return null;

              return (
                <button
                  key={sys}
                  className="repair-btn emergency-btn"
                  onClick={() => handleEmergencyPatch(sys)}
                >
                  응급 패치  {getSystemName(sys)} (+
                  {REPAIR_CONFIG.EMERGENCY_PATCH_DAYS_PENALTY} 일)
                </button>
              );
            })}
          </div>
        )}

        {/* Cannibalize Section */}
        {['hull', 'engine', 'lifeSupport'].some((sys) =>
          isSystemCritical(getSystemCondition(condition, sys))
        ) && (
          <div className="repair-section cannibalize-section">
            <h3>시스템 분해 수리</h3>
            <p className="cannibalize-warning">
              다른 시스템의 부품을 희생합니다. 50% 낭비 페널티(비용 1.5배).
            </p>
            {['hull', 'engine', 'lifeSupport'].map((targetSys) => {
              const targetCond = getSystemCondition(condition, targetSys);
              if (!isSystemCritical(targetCond)) return null;

              const required = calculateCannibalizeRequired(targetCond);
              const donorSystems = ['hull', 'engine', 'lifeSupport'].filter(
                (s) =>
                  s !== targetSys &&
                  !isSystemCritical(getSystemCondition(condition, s))
              );
              const totalAvailable = donorSystems.reduce(
                (sum, s) =>
                  sum + calculateMaxDonation(getSystemCondition(condition, s)),
                0
              );

              if (totalAvailable < required) return null;

              const totalAllocated = donorSystems.reduce(
                (sum, s) => sum + (cannibalizeAllocation[s] || 0),
                0
              );

              return (
                <div key={targetSys} className="cannibalize-target">
                  <h4>
                    수리  {getSystemName(targetSys)} ({Math.round(targetCond)}%
                    → 21%)
                  </h4>
                  <p>필요  {required}% 기증 시스템에서:</p>
                  {donorSystems.map((donorSys) => {
                    const donorCond = getSystemCondition(condition, donorSys);
                    const maxDonation = calculateMaxDonation(donorCond);
                    const currentAlloc = cannibalizeAllocation[donorSys] || 0;

                    return (
                      <div key={donorSys} className="donor-row">
                        <label>
                          {getSystemName(donorSys)} ({Math.round(donorCond)}%, 최대  {maxDonation}%)
                        </label>
                        <div className="donor-slider-group">
                          <input
                            type="range"
                            min={0}
                            max={maxDonation}
                            value={currentAlloc}
                            aria-label={`${getSystemName(donorSys)} 분해`}
                            onChange={(e) =>
                              setCannibalizeAllocation((prev) => ({
                                ...prev,
                                [donorSys]: parseInt(e.target.value),
                              }))
                            }
                          />
                          <span>{currentAlloc}%</span>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    className="repair-btn cannibalize-btn"
                    onClick={() => handleCannibalize(targetSys)}
                    disabled={totalAllocated < required}
                  >
                    분해 수리 ({totalAllocated}/{required}%)
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* NPC Discount Section */}
        {bestDiscount.discount > 0 && (
          <div className="repair-section">
            <h3>NPC 할인 적용</h3>
            <div className="discount-info">
              <div className="discount-details">
                <p>
                  <strong>{bestDiscount.npcName}</strong>  님이 수리 서비스를 {' '}
                  <strong>{Math.round(bestDiscount.discount * 100)}%</strong>{' '}
                  할인해 주고 있습니다.
                </p>
                <p className="discount-note">
                  <em>위에 표시된 모든 수리 가격에는 이 할인이 포함되어 있습니다.</em>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Free Repair Section */}
        <div className="repair-section">
          <h3>무료 수리</h3>
          {freeRepairOptions.length > 0 ? (
            <div className="free-repair-options">
              {freeRepairOptions.map(({ npc, availability }) => {
                const currentHull = condition.hull;
                const maxHull = SHIP_CONFIG.CONDITION_BOUNDS.MAX;
                const hullDamagePercent = maxHull - currentHull;
                const actualRepairPercent = Math.min(
                  hullDamagePercent,
                  availability.maxHullPercent
                );

                // Get tier name for display
                const tierName =
                  availability.maxHullPercent === 25 ? 'Family' : 'Trusted';

                return (
                  <div key={npc.id} className="free-repair-option">
                    <div className="free-repair-info">
                      <h4>
                        {npc.name} ({npc.role})
                      </h4>
                      <div className="free-repair-details">
                        <p className="tier-info">
                          <strong>{tierKo(tierName)} 등급:</strong>  최대{' '}
                          {availability.maxHullPercent}% 선체 피해 수리
                        </p>
                        <p className="limitation-info">
                          <em>방문당 1회 제한</em>
                        </p>
                        {actualRepairPercent > 0 ? (
                          <p className="repair-amount">
                            수리 내용:{' '}
                            <strong>{actualRepairPercent.toFixed(1)}%</strong>{' '}
                            선체 피해
                          </p>
                        ) : (
                          <p className="no-damage">수리할 선체 피해 없음</p>
                        )}
                      </div>
                    </div>
                    <button
                      className="free-repair-btn"
                      onClick={() =>
                        handleFreeRepair(npc.id, availability.maxHullPercent)
                      }
                      disabled={actualRepairPercent <= 0}
                    >
                      무료 수리 받기
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="free-repair-unavailable">
              {npcsAtSystem.length > 0 ? (
                <div className="validation-info">
                  <h4>무료 수리 조건</h4>
                  <div className="npc-status-list">
                    {npcsAtSystem.map((npc) => {
                      const availability = canGetFreeRepair(npc.id);
                      return (
                        <div key={npc.id} className="npc-status-item">
                          <div className="npc-info">
                            <strong>{npc.name}</strong> ({npc.role})
                          </div>
                          <div className="status-message">
                            {availability.reason || '조건 미충족'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="tier-requirements">
                    <p>
                      <strong>등급 조건:</strong>
                    </p>
                    <ul>
                      <li>
                        <strong>신뢰 등급:</strong>  선체 피해 최대 10% 수리 (방문당 1회)
                      </li>
                      <li>
                        <strong>가족 등급:</strong>  선체 피해 최대 25% 수리 (방문당 1회)
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="no-npcs">
                  이 정거장에는 무료 수리를 해 줄 NPC가 없습니다.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Validation Message */}
        {validationMessage && (
          <div className={`validation-message ${validationClass}`} role="alert">
            {validationMessage}
          </div>
        )}
      </div>

      <div className="repair-actions">
        <button className="station-btn secondary" onClick={onClose}>
          정거장으로 돌아가기
        </button>
      </div>
    </div>
  );
}
