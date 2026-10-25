import { useMemo } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useStarData } from '../../hooks/useStarData';
import { TradingSystem } from '../../game/game-trading.js';
import {
  capitalizeFirst,
  formatCargoDisplayName,
  pluralizeUnit,
} from '../../game/utils/string-utils.js';
import { PASSENGER_CONFIG, EVENT_NAMES } from '../../game/constants.js';
import { formatCargoAge } from './cargoUtils';

/**
 * CargoManifestPanel - React component for displaying cargo manifest
 *
 * Displays ship name, cargo capacity usage, all cargo stacks with purchase metadata,
 * passenger manifest with satisfaction and destination, and total cargo value.
 *
 * Architecture: react-migration
 * Validates: Requirements 8.6
 *
 * @param {Object} props
 * @param {Function} props.onClose - Callback to close the panel
 */
export function CargoManifestPanel({ onClose }) {
  const starData = useStarData();

  // Subscribe to game events
  const cargo = useGameEvent(EVENT_NAMES.CARGO_CHANGED);
  const shipName = useGameEvent(EVENT_NAMES.SHIP_NAME_CHANGED);
  const currentDay = useGameEvent(EVENT_NAMES.TIME_CHANGED);
  const cargoCapacity = useGameEvent(EVENT_NAMES.CARGO_CAPACITY_CHANGED);
  const missions = useGameEvent(EVENT_NAMES.MISSIONS_CHANGED);

  // Calculate cargo usage
  const tradeCargoUsed = cargo.reduce((sum, stack) => sum + stack.qty, 0);

  // Get active passenger missions
  const passengerMissions = useMemo(() => {
    if (!missions || !missions.active) return [];
    return missions.active.filter((m) => m.type === 'passenger');
  }, [missions]);

  const passengerSpace = passengerMissions.reduce(
    (sum, m) => sum + (m.requirements?.cargoSpace || 0),
    0
  );

  const cargoUsed = tradeCargoUsed + passengerSpace;

  // Calculate total value
  const totals =
    cargo.length > 0
      ? TradingSystem.calculateCargoTotals(cargo)
      : { totalCapacityUsed: 0, totalValue: 0 };

  /**
   * Render a single cargo manifest item
   *
   * @param {Object} cargoEntry - Cargo stack with metadata
   * @param {number} index - Index in cargo array
   * @returns {JSX.Element} Cargo manifest item
   */
  const renderCargoItem = (cargoEntry, index) => {
    const cargoValue = TradingSystem.calculateCargoValue(cargoEntry);
    const locationName = cargoEntry.buySystemName || '알 수 없음';
    const ageText = formatCargoAge(currentDay, cargoEntry.buyDate || 0);

    return (
      <div key={index} className="cargo-manifest-item">
        <div className="cargo-manifest-name">
          {formatCargoDisplayName(cargoEntry.good)}
        </div>
        <div className="cargo-manifest-details">
          <div className="cargo-manifest-detail">
            <span className="detail-label">수량:</span>
            <span className="detail-value">
              {pluralizeUnit(cargoEntry.qty)}
            </span>
          </div>
          <div className="cargo-manifest-detail">
            <span className="detail-label">구매 장소:</span>
            <span className="detail-value">{locationName}</span>
          </div>
          <div className="cargo-manifest-detail">
            <span className="detail-label">구매 가격:</span>
            <span className="detail-value">₡{cargoEntry.buyPrice}/단위</span>
          </div>
          <div className="cargo-manifest-detail">
            <span className="detail-label">구매일:</span>
            <span className="detail-value">{ageText}</span>
          </div>
          <div className="cargo-manifest-detail cargo-manifest-value">
            <span className="detail-label">현재 가치:</span>
            <span className="detail-value">₡{cargoValue.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="cargo-manifest-panel" className="panel-base visible">
      <button className="close-btn" onClick={onClose} aria-label="닫기">
        ×
      </button>
      <h2>
        화물 목록 —  <span id="cargo-manifest-ship-name">{shipName}</span>
      </h2>

      <div className="cargo-manifest-content">
        {/* Capacity Display */}
        <div className="cargo-manifest-section">
          <div className="cargo-capacity-display">
            <span className="capacity-label">적재량:</span>
            <span id="cargo-manifest-used">{cargoUsed}</span>
            <span> / </span>
            <span id="cargo-manifest-capacity">{cargoCapacity}</span>
            <span className="capacity-units">  단위</span>
            {passengerSpace > 0 && (
              <span className="capacity-breakdown">
                {' '}
                ({tradeCargoUsed}  화물 +  {passengerSpace}  승객)
              </span>
            )}
          </div>
        </div>

        {/* Passenger Manifest */}
        {passengerMissions.length > 0 && (
          <div className="cargo-manifest-section">
            <h3>승객</h3>
            <div className="cargo-manifest-list">
              {passengerMissions.map((mission) => {
                const typeConfig =
                  PASSENGER_CONFIG.TYPES[mission.passenger?.type] || {};
                const destName =
                  mission.destination?.name ||
                  starData.find(
                    (s) => s.id === mission.requirements?.destination
                  )?.name ||
                  '알 수 없음';
                return (
                  <div key={mission.id} className="cargo-manifest-item">
                    <div className="cargo-manifest-name">
                      {mission.passenger?.name || '이름 모를 승객'}
                    </div>
                    <div className="cargo-manifest-details">
                      <div className="cargo-manifest-detail">
                        <span className="detail-label">종류:</span>
                        <span className="detail-value">
                          {capitalizeFirst(
                            mission.passenger?.type || 'unknown'
                          )}
                        </span>
                      </div>
                      <div className="cargo-manifest-detail">
                        <span className="detail-label">화물 공간:</span>
                        <span className="detail-value">
                          {pluralizeUnit(typeConfig.cargoSpace || 0)}
                        </span>
                      </div>
                      <div className="cargo-manifest-detail">
                        <span className="detail-label">목적지:</span>
                        <span className="detail-value">{destName}</span>
                      </div>
                      <div className="cargo-manifest-detail">
                        <span className="detail-label">만족도:</span>
                        <span className="detail-value">
                          {Math.round(mission.passenger?.satisfaction ?? 50)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cargo List */}
        <div className="cargo-manifest-section">
          <h3>화물</h3>
          <div id="cargo-manifest-list" className="cargo-manifest-list">
            {cargo.length === 0 ? (
              <div className="cargo-manifest-empty">화물 없음</div>
            ) : (
              cargo.map((cargoEntry, index) =>
                renderCargoItem(cargoEntry, index)
              )
            )}
          </div>
        </div>

        {/* Total Value */}
        <div className="cargo-manifest-section">
          <div className="cargo-manifest-total">
            <span className="total-label">총 가치:</span>
            <span id="cargo-manifest-total-value" className="total-value">
              ₡{totals.totalValue.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
