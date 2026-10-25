/**
 * Trade utility functions - Pure functions for trade validation and calculations
 *
 * These functions are extracted from the TradePanelController to separate business
 * logic from React components. All functions are pure (no side effects) and can be
 * tested independently.
 *
 * Architecture: react-migration
 * Validates: Requirements 15.1, 15.5, 26.4
 */

/**
 * Validates a buy transaction
 *
 * @param {string} goodType - The type of good to buy
 * @param {number} quantity - The quantity to buy
 * @param {number} price - The price per unit
 * @param {Object} state - The current game state
 * @returns {Object} Validation result with valid boolean and reason string
 */
export function validateBuy(goodType, quantity, price, state) {
  if (!goodType || typeof goodType !== 'string') {
    return { valid: false, reason: '잘못된 상품 종류입니다' };
  }

  if (!quantity || quantity <= 0) {
    return { valid: false, reason: '수량은 양수여야 합니다' };
  }

  if (!price || price <= 0) {
    return { valid: false, reason: '가격은 양수여야 합니다' };
  }

  if (!state || !state.player || !state.ship) {
    return { valid: false, reason: '잘못된 게임 상태입니다' };
  }

  const totalCost = price * quantity;
  if (state.player.credits < totalCost) {
    return { valid: false, reason: '구매할 크레딧이 부족합니다' };
  }

  const tradeCargoUsed = state.ship.cargo.reduce(
    (sum, stack) => sum + stack.qty,
    0
  );
  const passengerSpace = getPassengerCargoSpace(state);
  const cargoRemaining =
    state.ship.cargoCapacity - tradeCargoUsed - passengerSpace;

  if (cargoRemaining < quantity) {
    return { valid: false, reason: '화물 적재량이 부족합니다' };
  }

  return { valid: true, reason: '' };
}

/**
 * Validates a sell transaction
 *
 * @param {number} stackIndex - The index of the cargo stack to sell
 * @param {number} quantity - The quantity to sell
 * @param {Object} state - The current game state
 * @returns {Object} Validation result with valid boolean and reason string
 */
export function validateSell(stackIndex, quantity, state) {
  if (stackIndex < 0) {
    return { valid: false, reason: '잘못된 스택 번호입니다' };
  }

  if (!quantity || quantity <= 0) {
    return { valid: false, reason: '수량은 양수여야 합니다' };
  }

  if (!state || !state.ship || !state.ship.cargo) {
    return { valid: false, reason: '잘못된 게임 상태입니다' };
  }

  if (stackIndex >= state.ship.cargo.length) {
    return { valid: false, reason: '스택 번호가 범위를 벗어났습니다' };
  }

  const stack = state.ship.cargo[stackIndex];
  if (quantity > stack.qty) {
    return { valid: false, reason: '스택의 수량이 부족합니다' };
  }

  return { valid: true, reason: '' };
}

/**
 * Calculates the maximum quantity that can be bought
 *
 * @param {number} price - The price per unit
 * @param {Object} state - The current game state
 * @returns {number} Maximum quantity that can be bought
 */
export function calculateMaxBuyQuantity(price, state) {
  if (!price || price <= 0 || !state || !state.player || !state.ship) {
    return 0;
  }

  const maxAffordable = Math.floor(state.player.credits / price);
  const tradeCargoUsed = state.ship.cargo.reduce(
    (sum, stack) => sum + stack.qty,
    0
  );
  const passengerSpace = getPassengerCargoSpace(state);
  const cargoRemaining =
    state.ship.cargoCapacity - tradeCargoUsed - passengerSpace;

  return Math.min(maxAffordable, Math.max(0, cargoRemaining));
}

/**
 * Calculates profit margin for a cargo stack
 *
 * @param {Object} stack - The cargo stack
 * @param {number} currentPrice - The current sell price
 * @returns {Object} Profit information with margin, percentage, and direction
 */
export function calculateProfit(stack, currentPrice) {
  if (!stack || !stack.buyPrice || !currentPrice) {
    return { margin: 0, percentage: 0, direction: 'neutral' };
  }

  const margin = currentPrice - stack.buyPrice;
  const percentage = Math.round((margin / stack.buyPrice) * 100);

  let direction = 'neutral';
  if (margin > 0) {
    direction = 'positive';
  } else if (margin < 0) {
    direction = 'negative';
  }

  return { margin, percentage, direction };
}

/**
 * Calculate cargo space consumed by active passenger missions
 *
 * @param {Object} state - The current game state
 * @returns {number} Cargo units reserved by passengers
 */
function getPassengerCargoSpace(state) {
  if (!state.missions || !state.missions.active) return 0;
  return state.missions.active
    .filter((m) => m.type === 'passenger' && m.requirements?.cargoSpace)
    .reduce((total, m) => total + m.requirements.cargoSpace, 0);
}

/**
 * Formats the age of a cargo stack purchase
 *
 * @param {number} currentDay - The current game day
 * @param {number} buyDate - The day the cargo was purchased
 * @returns {string} Formatted age string
 */
// Re-export from canonical location to avoid breaking existing imports
export { formatCargoAge } from '../cargo/cargoUtils';
