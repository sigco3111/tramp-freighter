import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';
import { useStarData } from '../../hooks/useStarData';
import {
  validateIntelligencePurchase,
  validateRumorPurchase,
  calculateDiscountedRumorCost,
  calculateDiscountedIntelligenceCost,
  sortIntelligenceByPriority,
  formatVisitInfo,
  formatStaleness,
  formatSource,
  getKnownSystemsSortedByStaleness,
} from './infoBrokerUtils';
import {
  INTELLIGENCE_CONFIG,
  COMMODITY_TYPES,
  EVENT_NAMES,
} from '../../game/constants';
import { capitalizeFirst } from '../../game/utils/string-utils';
import { getNPCsAtSystem } from '../../game/game-npcs';

/**
 * InfoBrokerPanel component for purchasing market intelligence.
 *
 * Provides two tabs:
 * - Purchase Intelligence: Buy rumors and system price data
 * - Market Data: View known market prices sorted by staleness
 *
 * React Migration Spec: Requirements 8.5
 *
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Callback to close the panel
 * @returns {JSX.Element} Information broker panel component
 */
export function InfoBrokerPanel({ onClose }) {
  const game = useGame();
  const starData = useStarData();
  const credits = useGameEvent(EVENT_NAMES.CREDITS_CHANGED);
  const currentSystemId = useGameEvent(EVENT_NAMES.LOCATION_CHANGED);
  const priceKnowledge = useGameEvent(EVENT_NAMES.PRICE_KNOWLEDGE_CHANGED);
  const {
    purchaseIntelligence,
    updateCredits,
    generateRumor,
    getNarrativeFlags,
  } = useGameAction();

  const [activeTab, setActiveTab] = useState('purchase');
  const purchaseTabRef = useRef(null);
  const marketDataTabRef = useRef(null);
  const [rumor, setRumor] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [validationClass, setValidationClass] = useState('');
  // Get available intelligence options using Bridge Pattern
  const [intelligenceOptions, setIntelligenceOptions] = useState([]);

  // Update intelligence options when location or price knowledge changes
  useEffect(() => {
    const options = game.listAvailableIntelligence();
    setIntelligenceOptions(options);
  }, [game, currentSystemId, priceKnowledge]);

  // Get NPCs at current location for intel discounts
  const npcsAtSystem = getNPCsAtSystem(currentSystemId, getNarrativeFlags());

  // Get intel service discounts from NPCs at this location
  const intelDiscounts = npcsAtSystem
    .map((npc) => {
      const discountInfo = game.getServiceDiscount(npc.id, 'intel');
      return {
        npc,
        discount: discountInfo.discount,
        npcName: discountInfo.npcName,
      };
    })
    .filter((option) => option.discount > 0);

  // Calculate the best discount available
  const bestDiscount = intelDiscounts.reduce(
    (best, current) => (current.discount > best.discount ? current : best),
    { discount: 0, npcName: null }
  );

  const sortedIntelligence = sortIntelligenceByPriority(intelligenceOptions);

  const purchasingRef = useRef(false);

  const handleBuyRumor = () => {
    if (purchasingRef.current) return;

    const rumorCost = INTELLIGENCE_CONFIG.PRICES.RUMOR;
    const discountedRumorCost = calculateDiscountedRumorCost(
      bestDiscount.discount
    );
    const finalRumorCost =
      bestDiscount.discount > 0 ? discountedRumorCost : rumorCost;

    const validation = validateRumorPurchase(credits);

    // Override validation for discounted cost if applicable
    let finalValidation = validation;
    if (bestDiscount.discount > 0 && !validation.valid) {
      finalValidation = validateIntelligencePurchase(finalRumorCost, credits);
    }

    if (!finalValidation.valid) {
      setValidationMessage(finalValidation.reason);
      setValidationClass('error');
      return;
    }

    // Guard against stale closure from rapid double-click
    purchasingRef.current = true;
    requestAnimationFrame(() => {
      purchasingRef.current = false;
    });

    // Deduct credits
    updateCredits(credits - finalRumorCost);

    // Generate and display rumor
    const generatedRumor = generateRumor();
    setRumor(generatedRumor);

    // Show success message — persists until next user action
    setValidationMessage('소문을 구매했습니다');
    setValidationClass('info');
  };

  const handlePurchaseIntelligence = (systemId) => {
    const intelligenceOutcome = purchaseIntelligence(
      systemId,
      bestDiscount.discount
    );

    if (!intelligenceOutcome.success) {
      setValidationMessage(intelligenceOutcome.reason);
      setValidationClass('error');
      return;
    }

    // Show success message — persists until next user action
    const systemName =
      starData.find((s) => s.id === systemId)?.name || '알 수 없는 항성계';
    setValidationMessage(`${systemName} 정보를 구매했습니다`);
    setValidationClass('info');

    // Refresh intelligence options to reflect the purchase
    // This ensures the UI immediately shows the updated state
    const updatedOptions = game.listAvailableIntelligence();
    setIntelligenceOptions(updatedOptions);
  };

  const handleTabSwitch = (tabName, focusTab = false) => {
    setActiveTab(tabName);
    // Clear validation message when switching tabs
    setValidationMessage('');
    setValidationClass('');
    if (focusTab) {
      const ref = tabName === 'purchase' ? purchaseTabRef : marketDataTabRef;
      ref.current?.focus();
    }
  };

  const handleTabKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = activeTab === 'purchase' ? 'marketData' : 'purchase';
      handleTabSwitch(next, true);
    }
  };

  const renderIntelligenceItem = (option) => {
    const baseCost = option.cost;
    const discountedCost = calculateDiscountedIntelligenceCost(
      baseCost,
      bestDiscount.discount
    );
    const finalCost = bestDiscount.discount > 0 ? discountedCost : baseCost;

    const validation = validateIntelligencePurchase(finalCost, credits);
    const isCurrentSystem = option.lastVisit === 0;

    return (
      <div key={option.systemId} className="intelligence-item">
        <div className="intelligence-info">
          <div className="intelligence-system-name">{option.systemName}</div>
          <div className="intelligence-visit-info">
            {formatVisitInfo(option.lastVisit, option.source)}
          </div>
        </div>
        <div className="intelligence-actions">
          <div className="intelligence-cost">
            ₡{finalCost}
            {bestDiscount.discount > 0 && baseCost !== finalCost && (
              <span className="original-cost">  (이전 ₡{baseCost})</span>
            )}
          </div>
          <button
            className="info-broker-btn"
            onClick={() => handlePurchaseIntelligence(option.systemId)}
            disabled={!validation.valid || isCurrentSystem}
          >
            {isCurrentSystem ? '현재' : '구매'}
          </button>
        </div>
      </div>
    );
  };

  const renderMarketData = () => {
    const knownSystems = getKnownSystemsSortedByStaleness(
      priceKnowledge || {},
      starData
    );

    if (knownSystems.length === 0) {
      return (
        <div className="market-data-empty">
          시장 데이터가 없습니다. 정보를 구매하거나 항성계를 방문해 가격 정보를 모으세요.
        </div>
      );
    }

    return knownSystems.map(({ system, knowledge }) => (
      <div key={system.id} className="market-data-system">
        <div className="market-data-header">
          <div className="market-data-system-name">{system.name}</div>
          <div className="market-data-meta">
            <div className="market-data-source">
              {formatSource(knowledge.source)}
            </div>
            <div
              className={`market-data-staleness ${formatStaleness(knowledge.lastVisit).cssClass}`}
            >
              {formatStaleness(knowledge.lastVisit).text}
            </div>
          </div>
        </div>
        <div className="market-data-prices">
          {COMMODITY_TYPES.map((commodity) => (
            <div key={commodity} className="market-data-price-item">
              <span className="market-data-commodity">
                {capitalizeFirst(commodity)}
              </span>
              <span className="market-data-price">
                {knowledge.prices[commodity] != null
                  ? `₡${knowledge.prices[commodity]}`
                  : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    ));
  };

  const rumorCost = INTELLIGENCE_CONFIG.PRICES.RUMOR;
  const discountedRumorCost = calculateDiscountedRumorCost(
    bestDiscount.discount
  );
  const finalRumorCost =
    bestDiscount.discount > 0 ? discountedRumorCost : rumorCost;
  const rumorValidation = validateIntelligencePurchase(finalRumorCost, credits);

  const currentSystem = starData.find((s) => s.id === currentSystemId);

  if (!currentSystem) {
    throw new Error(
      `Invalid game state: current system ID ${currentSystemId} not found in star data`
    );
  }

  return (
    <div id="info-broker-panel" className="visible">
      <button className="close-btn" onClick={onClose} aria-label="닫기">
        ×
      </button>
      <h2>
        정보 중개인 -  <span>{currentSystem.name}</span>
      </h2>

      {/* Tab Navigation */}
      <div
        className="info-broker-tabs"
        role="tablist"
        aria-label="정보 중개인 구역"
      >
        <button
          ref={purchaseTabRef}
          role="tab"
          id="tab-purchase"
          aria-selected={activeTab === 'purchase'}
          aria-controls="tabpanel-purchase"
          className={`info-broker-tab ${activeTab === 'purchase' ? 'active' : ''}`}
          onClick={() => handleTabSwitch('purchase')}
          onKeyDown={handleTabKeyDown}
          tabIndex={activeTab === 'purchase' ? 0 : -1}
        >
          정보 구매
        </button>
        <button
          ref={marketDataTabRef}
          role="tab"
          id="tab-marketData"
          aria-selected={activeTab === 'marketData'}
          aria-controls="tabpanel-marketData"
          className={`info-broker-tab ${activeTab === 'marketData' ? 'active' : ''}`}
          onClick={() => handleTabSwitch('marketData')}
          onKeyDown={handleTabKeyDown}
          tabIndex={activeTab === 'marketData' ? 0 : -1}
        >
          시장 데이터
        </button>
      </div>

      {/* Purchase Intelligence Tab */}
      {activeTab === 'purchase' && (
        <div
          role="tabpanel"
          id="tabpanel-purchase"
          aria-labelledby="tab-purchase"
          className="info-broker-content active"
        >
          {/* Rumor Section */}
          <div className="rumor-section">
            <h3>시장 소문</h3>
            <p className="rumor-description">
              소문을 사서 시장 상황과 기회에 대한 힌트를 얻으세요.
            </p>
            <div className="rumor-purchase">
              <button
                id="buy-rumor-btn"
                className="info-broker-btn"
                onClick={handleBuyRumor}
                disabled={!rumorValidation.valid}
              >
                소문 구매 (₡{finalRumorCost})
              </button>
            </div>
            {rumor && (
              <div id="rumor-text" className="rumor-text visible">
                {rumor}
              </div>
            )}
          </div>

          {/* Intelligence List */}
          <div className="intelligence-section">
            <h3>항성계 정보</h3>
            <p className="intelligence-description">
              연결된 항성계의 현재 시장 가격을 구매합니다.
            </p>
            <div id="intelligence-list" className="intelligence-list">
              {sortedIntelligence.length === 0 ? (
                <div className="intelligence-empty">
                  정보를 구매할 수 있는 항성계가 없습니다.
                </div>
              ) : (
                sortedIntelligence.map(renderIntelligenceItem)
              )}
            </div>
          </div>

          {/* NPC Discount Section */}
          {bestDiscount.discount > 0 && (
            <div className="intelligence-section">
              <h3>NPC 할인 적용</h3>
              <div className="discount-info">
                <div className="discount-details">
                  <p>
                    <strong>{bestDiscount.npcName}</strong>  님이 정보 서비스를 {' '}
                    <strong>{Math.round(bestDiscount.discount * 100)}%</strong>{' '}
                    할인해 주고 있습니다.
                  </p>
                  <p className="discount-note">
                    <em>위에 표시된 모든 가격에는 이 할인이 포함되어 있습니다.</em>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Validation Message */}
          {validationMessage && (
            <div
              id="info-broker-validation-message"
              className={`validation-message ${validationClass}`}
            >
              {validationMessage}
            </div>
          )}
        </div>
      )}

      {/* Market Data Tab */}
      {activeTab === 'marketData' && (
        <div
          role="tabpanel"
          id="tabpanel-marketData"
          aria-labelledby="tab-marketData"
          className="info-broker-content active"
        >
          <div className="market-data-section">
            <h3>알려진 시장 가격</h3>
            <div id="market-data-list" className="market-data-list">
              {renderMarketData()}
            </div>
          </div>
        </div>
      )}

      <div className="info-broker-actions">
        <button className="station-btn secondary" onClick={onClose}>
          정거장으로 돌아가기
        </button>
      </div>
    </div>
  );
}
