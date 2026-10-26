import { BaseManager } from './base-manager.js';
import {
  REPAIR_CONFIG,
  SHIP_CONFIG,
  REPUTATION_BOUNDS,
  NPC_BENEFITS_CONFIG,
} from '../../constants.js';
import { tierKo } from '../../tier-ko.js';

/**
 * RepairManager - Manages ship repair operations
 *
 * Handles all repair-related operations including:
 * - Repair cost calculations
 * - Repair transaction validation and execution
 * - NPC free repair benefits system
 */
const SYS_KO_TOPIC = { hull: '선체는', engine: '엔진은', lifeSupport: '생명 유지 장치는' };
const SYS_KO_SUBJ = { hull: '선체가', engine: '엔진이', lifeSupport: '생명 유지 장치가' };

export class RepairManager extends BaseManager {
  /**
   * Calculate repair cost for a ship system
   *
   * Cost is ₡5 per 1% restored, rounded up. If system is already at maximum
   * condition, cost is 0.
   *
   * @param {string} systemType - One of: 'hull', 'engine', 'lifeSupport'
   * @param {number} amount - Percentage points to restore
   * @param {number} currentCondition - Current condition percentage
   * @param {number} discount - Discount fraction (0-1), e.g. 0.1 for 10% off
   * @returns {number} Cost in credits (ceiled integer)
   */
  getRepairCost(systemType, amount, currentCondition, discount = 0) {
    // If already at max, no cost
    if (currentCondition >= SHIP_CONFIG.CONDITION_BOUNDS.MAX) {
      return 0;
    }

    // Calculate cost at ₡5 per 1%
    const baseCost = amount * REPAIR_CONFIG.COST_PER_PERCENT;
    return discount > 0
      ? Math.ceil(baseCost * (1 - discount))
      : Math.ceil(baseCost);
  }

  /**
   * Execute repair transaction for a ship system
   *
   * @param {string} systemType - One of: 'hull', 'engine', 'lifeSupport'
   * @param {number} amount - Percentage points to restore
   * @param {number} discount - Discount fraction (0-1), e.g. 0.1 for 10% off
   * @returns {Object} { success: boolean, reason: string }
   */
  repairShipSystem(systemType, amount, discount = 0) {
    this.validateState();

    // Validate system type
    const validSystems = ['hull', 'engine', 'lifeSupport'];
    if (!validSystems.includes(systemType)) {
      return { success: false, reason: '잘못된 시스템 유형입니다' };
    }

    const condition = this.capabilities.getShipCondition();
    const currentCondition = condition[systemType];
    const credits = this.capabilities.getCredits();
    const cost = this.getRepairCost(
      systemType,
      amount,
      currentCondition,
      discount
    );

    // Validation order matters for user experience:
    // 1. Check for positive amount (basic input validation)
    // 2. Check if system already at max (no repair needed)
    // 3. Check credits (player can fix by earning money)
    // 4. Check if would exceed max (player can fix by reducing amount)

    if (amount <= 0) {
      return { success: false, reason: '수리량은 양수여야 합니다' };
    }

    if (currentCondition >= SHIP_CONFIG.CONDITION_BOUNDS.MAX) {
      return { success: false, reason: '이미 최대 상태입니다' };
    }

    if (cost > credits) {
      return { success: false, reason: '수리할 크레딧이 부족합니다' };
    }

    if (currentCondition + amount > SHIP_CONFIG.CONDITION_BOUNDS.MAX) {
      return {
        success: false,
        reason: '수리하면 최대 상태를 초과합니다',
      };
    }

    this.capabilities.updateCredits(credits - cost);

    const newConditions = { ...condition };
    newConditions[systemType] = currentCondition + amount;

    this.capabilities.updateShipCondition(
      newConditions.hull,
      newConditions.engine,
      newConditions.lifeSupport
    );

    this.capabilities.markDirty();
    return { success: true, reason: null };
  }

  /**
   * Apply emergency patch to a critically damaged system
   *
   * Available only when the system is at or below the critical threshold and
   * the player cannot afford standard repair. Sets the system to exactly
   * EMERGENCY_PATCH_TARGET and advances time as a penalty.
   *
   * @param {string} systemType - One of: 'hull', 'engine', 'lifeSupport'
   * @returns {Object} { success: boolean, reason: string | null }
   */
  applyEmergencyPatch(systemType) {
    this.validateState();

    const validSystems = ['hull', 'engine', 'lifeSupport'];
    if (!validSystems.includes(systemType)) {
      return { success: false, reason: '잘못된 시스템 유형입니다' };
    }

    const condition = this.capabilities.getShipCondition();
    const currentCondition = condition[systemType];

    if (currentCondition > REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD) {
      return {
        success: false,
        reason: `${SYS_KO_TOPIC[systemType]} 심각하게 손상되지 않았습니다`,
      };
    }

    const repairAmount =
      REPAIR_CONFIG.EMERGENCY_PATCH_TARGET - currentCondition;
    const repairCost = repairAmount * REPAIR_CONFIG.COST_PER_PERCENT;

    if (this.capabilities.getCredits() >= repairCost) {
      return { success: false, reason: '표준 수리 비용을 감당할 수 있습니다' };
    }

    const newConditions = { ...condition };
    newConditions[systemType] = REPAIR_CONFIG.EMERGENCY_PATCH_TARGET;

    this.capabilities.updateShipCondition(
      newConditions.hull,
      newConditions.engine,
      newConditions.lifeSupport
    );

    this.capabilities.advanceTime(
      this.capabilities.getDaysElapsed() +
        REPAIR_CONFIG.EMERGENCY_PATCH_DAYS_PENALTY
    );

    this.capabilities.markDirty();
    return { success: true, reason: null };
  }

  /**
   * Cannibalize healthy systems to patch a critically damaged one
   *
   * Sacrifices condition from donor systems to bring a critical system to
   * EMERGENCY_PATCH_TARGET. A 1.5x waste multiplier means donors lose more
   * than the target gains, reflecting improvised field repairs.
   *
   * @param {string} targetType - 'hull', 'engine', or 'lifeSupport' (must be at or below 20%)
   * @param {Array<{system: string, amount: number}>} donations - systems and amounts to take from each
   * @returns {Object} { success: boolean, reason: string | null }
   */
  cannibalizeSystem(targetType, donations) {
    this.validateState();

    const validSystems = ['hull', 'engine', 'lifeSupport'];
    const systemDisplayNames = {
      hull: '선체',
      engine: '엔진',
      lifeSupport: '생명 유지 장치',
    };

    if (!validSystems.includes(targetType)) {
      return { success: false, reason: '잘못된 시스템 유형입니다' };
    }

    const condition = this.capabilities.getShipCondition();
    const currentTargetCondition = condition[targetType];

    if (currentTargetCondition > REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD) {
      return {
        success: false,
        reason: `${SYS_KO_TOPIC[targetType]} 심각하게 손상되지 않았습니다`,
      };
    }

    for (const donation of donations) {
      if (!validSystems.includes(donation.system)) {
        return { success: false, reason: '잘못된 기증 시스템 유형입니다' };
      }

      if (donation.system === targetType) {
        return {
          success: false,
          reason: `${SYS_KO_TOPIC[donation.system]} 자기 자신에게 기증할 수 없습니다`,
        };
      }

      if (donation.amount <= 0) {
        return { success: false, reason: '기증량은 양수여야 합니다' };
      }

      const donorCondition = condition[donation.system];

      if (donorCondition <= REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD) {
        return {
          success: false,
          reason: `${SYS_KO_SUBJ[donation.system]} 심각하게 손상되어 기증할 수 없습니다`,
        };
      }

      if (
        donorCondition - donation.amount <
        REPAIR_CONFIG.CANNIBALIZE_DONOR_MIN
      ) {
        return {
          success: false,
          reason: `${SYS_KO_SUBJ[donation.system]} 최소 안전 상태 아래로 떨어집니다`,
        };
      }
    }

    const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0);
    const amountNeeded =
      REPAIR_CONFIG.EMERGENCY_PATCH_TARGET - currentTargetCondition;
    const requiredDonation =
      amountNeeded * REPAIR_CONFIG.CANNIBALIZE_WASTE_MULTIPLIER;

    if (totalDonated < requiredDonation) {
      return {
        success: false,
        reason: `기증 총량(${totalDonated})이 부족합니다 - 최소 ${requiredDonation} 필요`,
      };
    }

    const newConditions = { ...condition };
    newConditions[targetType] = REPAIR_CONFIG.EMERGENCY_PATCH_TARGET;

    for (const donation of donations) {
      newConditions[donation.system] -= donation.amount;
    }

    this.capabilities.updateShipCondition(
      newConditions.hull,
      newConditions.engine,
      newConditions.lifeSupport
    );

    this.capabilities.markDirty();
    return { success: true, reason: null };
  }

  /**
   * Check if NPC can provide free repair
   *
   * Checks if the NPC's reputation tier is Trusted or Family and if the
   * once-per-visit limitation is satisfied (lastFreeRepairDay is not current day).
   * Returns availability status and tier-based repair limits.
   *
   * @param {string} npcId - NPC identifier
   * @returns {Object} { available: boolean, maxHullPercent: number, reason: string | null }
   */
  canGetFreeRepair(npcId) {
    this.validateState();

    // Validate NPC ID
    this.capabilities.validateAndGetNPCData(npcId);

    // Get NPC state (creates default if doesn't exist)
    const npcState = this.capabilities.getNPCState(npcId);

    // Check reputation tier is Trusted or Family
    const repTier = this.capabilities.getRepTier(npcState.rep);
    const isTrusted =
      npcState.rep >= REPUTATION_BOUNDS.TRUSTED_MIN &&
      npcState.rep <= REPUTATION_BOUNDS.TRUSTED_MAX;
    const isFamily = npcState.rep >= REPUTATION_BOUNDS.FAMILY_MIN;

    if (!isTrusted && !isFamily) {
      return {
        available: false,
        maxHullPercent: 0,
        reason: `신뢰하는 관계가 필요합니다 (현재: ${tierKo(repTier.name)})`,
      };
    }

    // Check once-per-visit limitation (lastFreeRepairDay is not current day)
    const currentDay = this.capabilities.getDaysElapsed();
    if (
      npcState.lastFreeRepairDay !== null &&
      npcState.lastFreeRepairDay === currentDay
    ) {
      return {
        available: false,
        maxHullPercent: 0,
        reason: '무료 수리는 방문당 한 번만 가능합니다',
      };
    }

    // Determine max hull percent based on tier
    let maxHullPercent;
    if (isFamily) {
      maxHullPercent = NPC_BENEFITS_CONFIG.FREE_REPAIR_LIMITS.family;
    } else if (isTrusted) {
      maxHullPercent = NPC_BENEFITS_CONFIG.FREE_REPAIR_LIMITS.trusted;
    }

    return {
      available: true,
      maxHullPercent: maxHullPercent,
      reason: null,
    };
  }

  /**
   * Apply free repair from NPC
   *
   * Validates free repair availability, then repairs up to the tier-appropriate
   * hull damage limit. Sets lastFreeRepairDay to current day to enforce
   * once-per-visit limitation.
   *
   * @param {string} npcId - NPC identifier
   * @param {number} hullDamagePercent - Current hull damage percentage (0-100)
   * @returns {Object} { success: boolean, repairedPercent: number, message: string }
   */
  applyFreeRepair(npcId, hullDamagePercent) {
    this.validateState();

    // Validate with canGetFreeRepair
    const availability = this.canGetFreeRepair(npcId);
    if (!availability.available) {
      return {
        success: false,
        repairedPercent: 0,
        message: availability.reason,
      };
    }

    // Validate hull damage parameter
    if (
      typeof hullDamagePercent !== 'number' ||
      hullDamagePercent < 0 ||
      hullDamagePercent > 100
    ) {
      return {
        success: false,
        repairedPercent: 0,
        message: '잘못된 선체 손상 비율입니다',
      };
    }

    const condition = this.capabilities.getShipCondition();

    // Calculate repair amount (up to maxHullPercent of hull damage)
    const maxRepairPercent = availability.maxHullPercent;
    const actualRepairPercent = Math.min(hullDamagePercent, maxRepairPercent);

    // Apply repair to ship hull
    const currentHull = condition.hull;
    const newHull = Math.min(
      SHIP_CONFIG.CONDITION_BOUNDS.MAX,
      currentHull + actualRepairPercent
    );

    // Update ship condition
    this.capabilities.updateShipCondition(
      newHull,
      condition.engine,
      condition.lifeSupport
    );

    // Get NPC state and set lastFreeRepairDay to current day
    const npcState = this.capabilities.getNPCState(npcId);
    npcState.lastFreeRepairDay = this.capabilities.getDaysElapsed();

    // Update interaction tracking
    npcState.lastInteraction = this.capabilities.getDaysElapsed();
    npcState.interactions += 1;

    // Persist immediately - free repair modifies ship condition and NPC state
    this.capabilities.markDirty();

    return {
      success: true,
      repairedPercent: actualRepairPercent,
      message: `선체 손상 ${actualRepairPercent}% 수리 완료`,
    };
  }
}
