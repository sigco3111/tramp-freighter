import { BaseManager } from './base-manager.js';
import {
  NEGOTIATION_CONFIG,
  PIRATE_CREDIT_DEMAND_CONFIG,
} from '../../constants.js';
import { calculateKarmaModifier } from '../../utils/danger-utils.js';
import { SeededRandom, buildEncounterSeed } from '../../utils/seeded-random.js';
import { josaEulreul } from '../../utils/string-utils.js';

const NEGOTIATION_SYSTEM_KO = { hull: '선체', engine: '엔진', lifeSupport: '생명 유지 장치' };
function negotiationSystemName(key) {
  return NEGOTIATION_SYSTEM_KO[key] || key;
}

/**
 * NegotiationManager - Handles pirate negotiation resolution
 *
 * Extracted from DangerManager. Resolves dialogue-based pirate encounter options:
 * counter-proposal, medicine claim, intel offer, accept demand.
 *
 * Feature: danger-system, Property 6: Negotiation Outcomes
 * Validates: Requirements 4.1-4.11, 8.7, 9.4, 9.10
 */
export class NegotiationManager extends BaseManager {
  /**
   * Resolve a negotiation choice and return the outcome
   *
   * @param {Object} encounter - The pirate encounter object
   * @param {string} choice - Negotiation choice ('counter_proposal', 'medicine_claim', 'intel_offer', 'accept_demand')
   * @returns {Object} Negotiation outcome with success, costs, rewards, and description
   */
  resolveNegotiation(encounter, choice) {
    this.validateState();

    const seed = buildEncounterSeed(
      this.capabilities.getDaysElapsed(),
      this.capabilities.getCurrentSystem(),
      'negotiation'
    );
    const seededRng = new SeededRandom(seed);
    const rngValue = seededRng.next();

    // Build stateView for internal methods that check karma, cargo, world flags
    const stateView = {
      player: {
        karma: this.capabilities.getKarma(),
        credits: this.capabilities.getCredits(),
        daysElapsed: this.capabilities.getDaysElapsed(),
        currentSystem: this.capabilities.getCurrentSystem(),
      },
      ship: { cargo: this.capabilities.getShipCargo() },
      missions: { active: this.capabilities.getActiveMissions() },
      world: { flags: { hasPriorIntel: this.capabilities.getHasPriorIntel() } },
    };

    let result;
    switch (choice) {
      case 'counter_proposal':
        result = this.resolveCounterProposal(encounter, stateView, rngValue);
        break;
      case 'medicine_claim':
        result = this.resolveMedicineClaim(encounter, stateView, rngValue);
        break;
      case 'intel_offer':
        result = this.resolveIntelOffer(encounter, stateView, rngValue);
        break;
      case 'accept_demand':
        result = this.resolveAcceptDemand();
        break;
      default:
        throw new Error(`Unknown negotiation choice: ${choice}`);
    }

    this.capabilities.incrementDangerFlag('piratesNegotiated');
    return result;
  }

  /**
   * Resolve counter-proposal negotiation choice
   *
   * Success rate: 60% base chance + karma modifier
   * Success: 10% cargo payment instead of full demand
   * Failure: +10% enemy strength increase, forces combat
   *
   * @param {Object} encounter - The pirate encounter
   * @param {Object} gameState - Current game state
   * @param {number} rng - Random number (0-1) for success determination
   * @returns {Object} Negotiation outcome
   */
  resolveCounterProposal(encounter, gameState, rng) {
    const { COUNTER_PROPOSAL } = NEGOTIATION_CONFIG;

    let successChance = COUNTER_PROPOSAL.BASE_CHANCE;
    successChance += calculateKarmaModifier(gameState.player.karma);

    successChance = Math.max(0, Math.min(1, successChance));

    const success = rng < successChance;

    if (success) {
      if (this.hasTradeCargoForPirates()) {
        return {
          success: true,
          costs: {
            cargoPercent: COUNTER_PROPOSAL.SUCCESS_CARGO_PERCENT,
          },
          rewards: {},
          description:
            '해적과 협상해 지불액을 성공적으로 깎았습니다.',
        };
      }

      const reducedCredits = Math.round(
        PIRATE_CREDIT_DEMAND_CONFIG.MIN_CREDIT_DEMAND *
          PIRATE_CREDIT_DEMAND_CONFIG.COUNTER_PROPOSAL_DISCOUNT
      );
      return {
        success: true,
        costs: {
          credits: reducedCredits,
        },
        rewards: {},
        description: `해적을 설득해 ₡${reducedCredits}로 낮췄습니다.`,
      };
    } else {
      return {
        success: false,
        escalate: true,
        costs: {},
        rewards: {},
        description: "해적은 당신의 제안을 곱게 받아들이지 않습니다.",
      };
    }
  }

  /**
   * Resolve medicine claim negotiation choice
   *
   * Success rate: 40% sympathy chance if medicine present
   * Success: Free passage
   * Failure: Forces combat or other consequence
   *
   * @param {Object} encounter - The pirate encounter
   * @param {Object} gameState - Current game state
   * @param {number} rng - Random number (0-1) for success determination
   * @returns {Object} Negotiation outcome
   */
  resolveMedicineClaim(encounter, gameState, rng) {
    const { MEDICINE_CLAIM } = NEGOTIATION_CONFIG;

    const hasMedicine = gameState.ship.cargo.some(
      (item) => item.good === 'medicine'
    );

    if (!hasMedicine) {
      return {
        success: false,
        costs: {},
        rewards: {},
        description:
          '해적이 당신에게 의약품이 없다는 걸 알아챘습니다. 거짓말이 들통났습니다.',
      };
    }

    let sympathyChance = MEDICINE_CLAIM.SYMPATHY_CHANCE;
    sympathyChance += calculateKarmaModifier(gameState.player.karma);

    sympathyChance = Math.max(0, Math.min(1, sympathyChance));

    const success = rng < sympathyChance;

    if (success) {
      return {
        success: true,
        costs: {},
        rewards: {},
        description:
          '해적이 당신의 의료 임무에 동정을 보이며 통과시켜 주었습니다.',
      };
    } else {
      return {
        success: false,
        costs: {
          cargoPercent:
            encounter.demandPercent ??
            PIRATE_CREDIT_DEMAND_CONFIG.CARGO_DEMAND_PERCENT,
        },
        rewards: {},
        description:
          '해적이 의약품은 인정했지만 여전히 대가를 요구했습니다.',
      };
    }
  }

  /**
   * Resolve intel offer negotiation choice
   *
   * Success: Free passage, +3 outlaw reputation for cooperating with pirates
   * Failure: Reputation penalty if discovered, forces combat
   *
   * @param {Object} encounter - The pirate encounter
   * @param {Object} gameState - Current game state
   * @param {number} rng - Random number (0-1) for success determination
   * @returns {Object} Negotiation outcome
   */
  resolveIntelOffer(encounter, gameState, rng) {
    const { INTEL_OFFER } = NEGOTIATION_CONFIG;

    const hasPriorIntel = gameState.world.flags?.hasPriorIntel || false;

    if (!hasPriorIntel) {
      return {
        success: false,
        costs: {},
        rewards: {},
        description: '해적이 원하는 것이 당신에겐 없습니다.',
      };
    }

    let successChance = NEGOTIATION_CONFIG.INTEL_OFFER.BASE_SUCCESS_RATE;
    successChance += calculateKarmaModifier(gameState.player.karma);

    successChance = Math.max(0, Math.min(1, successChance));

    const success = rng < successChance;

    if (success) {
      return {
        success: true,
        costs: {},
        rewards: {
          factionRep: {
            outlaws: INTEL_OFFER.OUTLAW_REP_GAIN,
          },
        },
        description:
          '해적이 당신의 정보를 받아들이고 통과시켜 주었습니다. 당신의 협조가 기록되었습니다.',
      };
    } else {
      return {
        success: false,
        costs: {},
        rewards: {
          factionRep: {
            authorities: INTEL_OFFER.SUCCESS_REP_PENALTY,
          },
        },
        description:
          '해적이 당신의 정보 제안을 거절하고 의심하기 시작했습니다.',
      };
    }
  }

  /**
   * Check if ship has any trade cargo for pirate tribute
   *
   * @returns {boolean} True if ship has trade cargo with qty > 0
   */
  hasTradeCargoForPirates() {
    this.validateState();
    const cargo = this.capabilities.getShipCargo();
    return cargo.some((item) => item.qty > 0);
  }

  /**
   * Resolve accept demand negotiation choice
   *
   * If the ship has trade cargo, pays the standard cargo percentage.
   * If no trade cargo, demands flat credits instead. If player can't
   * afford credits, routes to kidnap/damage resolution.
   *
   * @returns {Object} Negotiation outcome
   */
  resolveAcceptDemand() {
    const { ACCEPT_DEMAND } = NEGOTIATION_CONFIG;

    if (this.hasTradeCargoForPirates()) {
      return {
        success: true,
        costs: {
          cargoPercent: ACCEPT_DEMAND.CARGO_PERCENT,
        },
        rewards: {},
        description:
          '해적이 요구한 상납금을 내고 무사히 갈 길을 갔습니다.',
      };
    }

    const rng = new SeededRandom(
      buildEncounterSeed(
        this.capabilities.getDaysElapsed(),
        this.capabilities.getCurrentSystem(),
        'negotiation_payment'
      )
    );

    const { MIN_CREDIT_DEMAND, MAX_CREDIT_DEMAND } =
      PIRATE_CREDIT_DEMAND_CONFIG;
    const creditDemand = Math.round(
      MIN_CREDIT_DEMAND + rng.next() * (MAX_CREDIT_DEMAND - MIN_CREDIT_DEMAND)
    );

    if (this.capabilities.getCredits() >= creditDemand) {
      return {
        success: true,
        costs: {
          credits: creditDemand,
        },
        rewards: {},
        description: `약탈할 화물이 없습니다. 해적은 대신 ₡${creditDemand}를 요구했습니다.`,
      };
    }

    return this.resolveCannotPayPirates(rng);
  }

  /**
   * Resolve situation when player can't pay pirate credit demand
   *
   * If active passenger missions exist, pirates may kidnap the highest-value
   * passenger (weighted by type). Otherwise, pirates damage the ship.
   *
   * @param {SeededRandom} [rng] - Seeded RNG instance (created internally if not provided)
   * @returns {Object} Negotiation outcome with kidnap or damage costs
   */
  resolveCannotPayPirates(rng) {
    if (!rng) {
      rng = new SeededRandom(
        buildEncounterSeed(
          this.capabilities.getDaysElapsed(),
          this.capabilities.getCurrentSystem(),
          'negotiation_payment'
        )
      );
    }

    const activeMissions = this.capabilities.getActiveMissions() || [];
    const passengerMissions = activeMissions.filter(
      (m) => m.type === 'passenger' && m.passenger
    );

    if (passengerMissions.length > 0) {
      const sorted = [...passengerMissions].sort((a, b) => {
        const wA =
          PIRATE_CREDIT_DEMAND_CONFIG.KIDNAP_WEIGHTS[a.passenger.type] || 0;
        const wB =
          PIRATE_CREDIT_DEMAND_CONFIG.KIDNAP_WEIGHTS[b.passenger.type] || 0;
        return wB - wA;
      });

      const target = sorted[0];
      const weight =
        PIRATE_CREDIT_DEMAND_CONFIG.KIDNAP_WEIGHTS[target.passenger.type] || 0;
      const rngValue = rng.next();

      if (rngValue < weight) {
        return {
          success: false,
          costs: {
            kidnappedPassengerId: target.id,
          },
          rewards: {},
          description: `돈을 낼 수 없었습니다. 해적이 승객 ${target.passenger.name}${josaEulreul(target.passenger.name)} 붙잡았습니다.`,
        };
      }
    }

    const { MIN_PERCENT, MAX_PERCENT } =
      PIRATE_CREDIT_DEMAND_CONFIG.NO_PAYMENT_SHIP_DAMAGE;
    const damageRng = rng.next();
    const damagePercent = Math.round(
      MIN_PERCENT + damageRng * (MAX_PERCENT - MIN_PERCENT)
    );

    const systems = ['hull', 'engine', 'lifeSupport'];
    const targetSystem = rng.pickRandom(systems);

    const costs = {};
    costs[targetSystem] = damagePercent;

    return {
      success: false,
      costs,
      rewards: {},
      description: `돈을 낼 수 없었습니다. 해적이 떠나기 전에 ${negotiationSystemName(targetSystem)}${josaEulreul(negotiationSystemName(targetSystem))} 손상시켰습니다.`,
    };
  }
}
