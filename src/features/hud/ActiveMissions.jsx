import { useState } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';
import { useGame } from '../../context/GameContext';
import { ConfirmModal } from '../../components/Modal';
import { EVENT_NAMES } from '../../game/constants.js';

function getCargoProgress(mission, cargo) {
  if (!mission.requirements?.cargo || !mission.requirements?.quantity) {
    return null;
  }
  const held = (cargo || [])
    .filter((c) => c.good === mission.requirements.cargo)
    .reduce((sum, c) => sum + c.qty, 0);
  return {
    good: mission.requirements.cargo,
    held,
    needed: mission.requirements.quantity,
    complete: held >= mission.requirements.quantity,
  };
}

export function ActiveMissions() {
  const missions = useGameEvent(EVENT_NAMES.MISSIONS_CHANGED);
  const daysElapsed = useGameEvent(EVENT_NAMES.TIME_CHANGED);
  const cargo = useGameEvent(EVENT_NAMES.CARGO_CHANGED);
  const { abandonMission } = useGameAction();
  const [missionToAbandon, setMissionToAbandon] = useState(null);
  const game = useGame();

  // Subscribe to quest changes so we re-render when Tanaka quest updates
  useGameEvent(EVENT_NAMES.QUEST_CHANGED);
  const tanakaMission = game.getTanakaMissionDisplay();

  if (!missions?.active?.length && !tanakaMission) return null;

  const handleAbandonConfirm = () => {
    if (missionToAbandon) {
      abandonMission(missionToAbandon.id);
      setMissionToAbandon(null);
    }
  };

  return (
    <div className="active-missions-hud">
      <h2>진행 중인 임무</h2>
      {tanakaMission && (
        <div className="mission-hud-item quest-mission">
          <span className="mission-hud-quest-label">퀘스트</span>
          <div className="mission-hud-title">{tanakaMission.title}</div>
          {tanakaMission.progress && (
            <div className="mission-hud-cargo">{tanakaMission.progress}</div>
          )}
          <div className="mission-hud-deadline">지속</div>
        </div>
      )}
      {missions?.active?.map((mission) => {
        const daysRemaining = Math.max(
          0,
          Math.ceil(mission.deadlineDay - daysElapsed)
        );
        const isUrgent = daysRemaining <= 2;
        const cargoProgress = getCargoProgress(mission, cargo);

        return (
          <div
            key={mission.id}
            className={`mission-hud-item ${isUrgent ? 'urgent' : ''}`}
          >
            <div className="mission-hud-title">{mission.title}</div>
            {mission.destination?.name && (
              <div className="mission-hud-destination">
                → {mission.destination.name}
              </div>
            )}
            {mission.missionCargo?.isIllegal &&
              (cargo || []).some((c) => c.missionId === mission.id) && (
                <div className="mission-hud-rumor">소문 확산 중</div>
              )}
            {cargoProgress && (
              <div
                className={`mission-hud-cargo ${cargoProgress.complete ? 'complete' : ''}`}
              >
                {cargoProgress.held}/{cargoProgress.needed} {cargoProgress.good}
                {cargoProgress.complete ? ' \u2713' : ''}
              </div>
            )}
            <div className="mission-hud-deadline">
              {daysRemaining > 0 ? `${daysRemaining}일 남음` : '기한 만료'}
            </div>
            <button
              className="mission-abandon-btn"
              onClick={() => setMissionToAbandon(mission)}
            >
              포기
            </button>
          </div>
        );
      })}
      <ConfirmModal
        isOpen={!!missionToAbandon}
        onConfirm={handleAbandonConfirm}
        onCancel={() => setMissionToAbandon(null)}
        title="임무를 포기하시겠습니까?"
        message={
          missionToAbandon
            ? `"${missionToAbandon.title}" 임무를 포기하시겠습니까? 임무가 실패로 처리되고 불이익이 적용될 수 있습니다.`
            : ''
        }
        confirmText="포기"
        cancelText="임무 유지"
      />
    </div>
  );
}
