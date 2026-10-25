import { useState, useEffect, useRef } from 'react';
import { useGameAction } from '../../hooks/useGameAction';
import { useGameEvent } from '../../hooks/useGameEvent';
import { Modal } from '../../components/Modal';
import { EVENT_NAMES } from '../../game/constants.js';

function getSatisfactionLabel(satisfaction) {
  if (satisfaction >= 80) return '매우 만족';
  if (satisfaction >= 60) return '만족';
  if (satisfaction >= 40) return '보통';
  if (satisfaction >= 20) return '불만';
  return '매우 불만';
}

export function MissionCompleteNotifier() {
  const { completeMission, getCompletableMissions, calculateTradeWithholding } =
    useGameAction();
  // Re-render trigger only — getCompletableMissions() returns the derived view
  const missions = useGameEvent(EVENT_NAMES.MISSIONS_CHANGED);
  const [completable, setCompletable] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const prevIdsRef = useRef(null);

  useEffect(() => {
    const found = getCompletableMissions();
    const newIds = found.map((m) => m.id).join(',');
    setCompletable(found);
    // Only reset index when the set of completable missions actually changes,
    // not on every MISSIONS_CHANGED event (which fires from our own completeMission call)
    if (newIds !== prevIdsRef.current) {
      prevIdsRef.current = newIds;
      setCurrentIndex(0);
    }
  }, [missions, getCompletableMissions]);

  const current = completable[currentIndex];
  if (!current) return null;

  const handleComplete = () => {
    completeMission(current.id);
    const nextIndex = currentIndex + 1;
    if (nextIndex < completable.length) {
      setCurrentIndex(nextIndex);
    } else {
      setCompletable([]);
    }
  };

  const handleDismiss = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < completable.length) {
      setCurrentIndex(nextIndex);
    } else {
      setCompletable([]);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={handleDismiss}
      title="임무 완료!"
      showCloseButton={false}
    >
      <div className="mission-complete-body">
        <p className="mission-complete-title">{current.title}</p>
        {current.type === 'passenger' && current.passenger && (
          <div className="passenger-delivery-info">
            <p>{current.passenger.name}  하선.</p>
            <div className="passenger-satisfaction">
              만족도:  {current.passenger.satisfaction}% (
              {getSatisfactionLabel(current.passenger.satisfaction)})
            </div>
          </div>
        )}
        {current.grossCredits > 0 &&
          (() => {
            const gross = current.grossCredits;
            const { withheld, playerReceives } =
              calculateTradeWithholding(gross);
            return (
              <div className="mission-complete-rewards">
                <h4>보상:</h4>
                <div>₡{gross}</div>
                {withheld > 0 && (
                  <>
                    <div className="withholding-line">
                      콜의 몫: -₡{withheld}  (부채는 줄어들지 않음)
                    </div>
                    <div>수령액: ₡{playerReceives}</div>
                  </>
                )}
              </div>
            );
          })()}
      </div>
      <div className="modal-actions">
        <button className="modal-cancel" onClick={handleDismiss}>
          나중에
        </button>
        <button className="modal-confirm" onClick={handleComplete}>
          보상 받기
        </button>
      </div>
    </Modal>
  );
}
