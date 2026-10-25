import { useEffect, useMemo, useState } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';
import { useGame } from '../../context/GameContext';
import { useStarData } from '../../hooks/useStarData';
import { EVENT_NAMES, MISSION_CONFIG } from '../../game/constants.js';
import {
  capitalizeFirst,
  pluralizeUnit,
  formatCargoDisplayName,
} from '@game/utils/string-utils.js';
import {
  calculateRouteIndicator,
  formatRouteIndicator,
  getFeasibilityWarning,
} from './missionRouteUtils.js';

export function MissionBoardPanel({ onClose }) {
  const missions = useGameEvent(EVENT_NAMES.MISSIONS_CHANGED);
  // Quest changes affect getEffectiveMissionCount() via Tanaka quest slot
  useGameEvent(EVENT_NAMES.QUEST_CHANGED);
  const { acceptMission, refreshMissionBoard } = useGameAction();
  const game = useGame();
  const starData = useStarData();
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    refreshMissionBoard();
  }, [refreshMissionBoard]);

  // Pre-compute route indicators for all board missions
  const routeIndicators = useMemo(() => {
    if (!missions?.board || !starData || !game?.navigationSystem) {
      return {};
    }
    const indicators = {};
    for (const mission of missions.board) {
      const destId = mission.destination?.systemId;
      const originId = mission.giverSystem;
      if (destId !== undefined && originId !== undefined) {
        indicators[mission.id] = calculateRouteIndicator(
          originId,
          destId,
          starData,
          game.navigationSystem
        );
      }
    }
    return indicators;
  }, [missions?.board, starData, game?.navigationSystem]);

  // Compute why each board mission can't be accepted (if any).
  // No useMemo — the computation is trivially cheap and avoiding it
  // eliminates stale-dependency bugs with quests/active array references.
  const disabledReasons = (() => {
    if (!missions?.board) return {};
    const activeCount = game.getEffectiveMissionCount();
    const cargoRemaining = game.getCargoRemaining();
    const activeIds = new Set((missions.active ?? []).map((m) => m.id));

    const reasons = {};
    for (const mission of missions.board) {
      if (activeCount >= MISSION_CONFIG.MAX_ACTIVE) {
        reasons[mission.id] =
          `진행 중인 임무는 최대 ${MISSION_CONFIG.MAX_ACTIVE}개입니다.`;
      } else if (activeIds.has(mission.id)) {
        reasons[mission.id] = '이미 수락했습니다.';
      } else if (
        mission.type === 'passenger' &&
        mission.requirements.cargoSpace > cargoRemaining
      ) {
        reasons[mission.id] =
          `화물 공간 ${mission.requirements.cargoSpace} 필요 (남은 공간 ${cargoRemaining}).`;
      } else if (
        mission.missionCargo &&
        mission.missionCargo.quantity > cargoRemaining
      ) {
        reasons[mission.id] =
          `화물 공간 ${mission.missionCargo.quantity} 필요 (남은 공간 ${cargoRemaining}).`;
      }
    }
    return reasons;
  })();

  const handleAccept = (mission) => {
    const result = acceptMission(mission);
    if (!result.success) {
      setFeedback(result.reason);
    } else {
      setFeedback(`수락함: ${mission.title}`);
    }
  };

  return (
    <div id="mission-board-panel" className="visible">
      <button className="close-btn" onClick={onClose} aria-label="닫기">
        &times;
      </button>
      <h2>임무 게시판</h2>
      {feedback && <div className="mission-feedback">{feedback}</div>}
      <div className="mission-list">
        {missions?.board?.map((mission) => (
          <div key={mission.id} className="mission-card">
            <h3>
              {mission.title}
              {mission.priority && (
                <span className="priority-badge">우선</span>
              )}
            </h3>
            <p>{mission.description}</p>
            {routeIndicators[mission.id] && (
              <div className="mission-route-info">
                {formatRouteIndicator(routeIndicators[mission.id])}
              </div>
            )}
            <div className="mission-details">
              {mission.type === 'passenger' ? (
                <>
                  <div className="passenger-type">
                    {capitalizeFirst(mission.passenger.type)}
                  </div>
                  <div className="passenger-dialogue">
                    &ldquo;{mission.passenger.dialogue}&rdquo;
                  </div>
                  <div>
                    필요 공간:{' '}
                    {pluralizeUnit(mission.requirements.cargoSpace)}
                  </div>
                </>
              ) : mission.missionCargo ? (
                <>
                  <div>
                    화물:  {mission.missionCargo.quantity}{' '}
                    {mission.missionCargo.good
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </div>
                  {mission.missionCargo.isIllegal && (
                    <div className="illegal-warning">은밀한 배달</div>
                  )}
                </>
              ) : mission.requirements?.cargo ? (
                <div>
                  배달:  {mission.requirements.quantity}{' '}
                  {formatCargoDisplayName(mission.requirements.cargo)}
                </div>
              ) : null}
              <div>기한:  {mission.requirements.deadline} 일</div>
              {(() => {
                const warning = getFeasibilityWarning(
                  routeIndicators[mission.id]?.totalDays,
                  mission.requirements.deadline
                );
                return warning ? (
                  <div
                    className={`feasibility-warning feasibility-${warning.level}`}
                  >
                    {warning.text}
                  </div>
                ) : null;
              })()}
              <div className={mission.saturated ? 'reward-saturated' : ''}>
                보수: ₡{mission.rewards.credits}
                {mission.saturated && (
                  <span
                    className="saturation-hint"
                    title="이 항로에는 운송업자가 많아 보수가 줄었습니다"
                    aria-label="보수 감소: 이 항로에는 운송업자가 많습니다"
                  >
                    {' '}
                    ▼
                  </span>
                )}
              </div>
            </div>
            <button
              className="accept-btn"
              onClick={() => handleAccept(mission)}
              disabled={!!disabledReasons[mission.id]}
              title={disabledReasons[mission.id] || ''}
            >
              수락
            </button>
            {disabledReasons[mission.id] && (
              <div className="mission-disabled-reason">
                {disabledReasons[mission.id]}
              </div>
            )}
          </div>
        ))}
        {(!missions?.board || missions.board.length === 0) && (
          <p>의뢰가 없습니다. 내일 다시 확인하세요.</p>
        )}
      </div>
      <button className="station-btn secondary" onClick={onClose}>
        정거장으로 돌아가기
      </button>
    </div>
  );
}
