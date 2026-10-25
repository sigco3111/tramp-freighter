import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { InstructionsModal } from '../instructions/InstructionsModal';
import { AchievementsModal } from '../achievements/AchievementsModal';
import { CustomSelect } from '../../components/CustomSelect';
import { useGame } from '../../context/GameContext';
import { useStarmap } from '../../context/StarmapContext';
import { useMobile } from '../../context/MobileContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useStarData } from '../../hooks/useStarData';
import { useClickOutside } from '../../hooks/useClickOutside';
import { MobileCameraToolbar } from './MobileCameraToolbar';
import { EVENT_NAMES } from '../../game/constants';

export function CameraControls({
  cameraState,
  onZoomIn,
  onZoomOut,
  onToggleRotation,
  onToggleBoundary,
}) {
  const game = useGame();
  const { selectStarById } = useStarmap();
  const starData = useStarData();
  const preferences = useGameEvent(EVENT_NAMES.PREFERENCES_CHANGED);
  const shipName = useGameEvent(EVENT_NAMES.SHIP_NAME_CHANGED);
  const currentLocation = useGameEvent(EVENT_NAMES.LOCATION_CHANGED);

  const [isExpanded, setIsExpanded] = useState(false);
  const [antimatter, setAntimatter] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const controlsRef = useRef(null);

  const { isMobile } = useMobile();
  const jumpWarningsEnabled = preferences?.jumpWarningsEnabled ?? true;

  // Invalidate when location changes — visited set only grows on jump
  const visitedSet = useMemo(() => {
    void currentLocation;
    return new Set(game.getVisitedSystems());
  }, [game, currentLocation]);

  const sortedStars = useMemo(() => {
    if (!starData) return [];
    return [...starData].sort((a, b) => a.name.localeCompare(b.name));
  }, [starData]);

  const collapseSettings = useCallback(() => setIsExpanded(false), []);
  useClickOutside(controlsRef, collapseSettings, isExpanded && !isMobile);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    if (antimatter) {
      document.documentElement.classList.add('antimatter');
    } else {
      document.documentElement.classList.remove('antimatter');
    }
    return () => document.documentElement.classList.remove('antimatter');
  }, [antimatter]);

  const toggleAntimatter = () => {
    setAntimatter((prev) => !prev);
  };

  const toggleJumpWarnings = () => {
    game.setPreference('jumpWarningsEnabled', !jumpWarningsEnabled);
  };

  if (isMobile) {
    return (
      <>
        <MobileCameraToolbar
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onFindStar={(val) => {
            const systemId = parseInt(val, 10);
            if (!isNaN(systemId)) selectStarById(systemId);
          }}
          stars={sortedStars}
          visitedSet={visitedSet}
          toggles={{
            showAntimatter: antimatter,
            showJumpWarnings: jumpWarningsEnabled,
            showStarRotation: cameraState.autoRotationEnabled,
            showBoundary: cameraState.boundaryVisible,
          }}
          onToggle={(key) => {
            const handlers = {
              showAntimatter: toggleAntimatter,
              showJumpWarnings: toggleJumpWarnings,
              showStarRotation: onToggleRotation,
              showBoundary: onToggleBoundary,
            };
            handlers[key]?.();
          }}
          onShowInstructions={() => setShowInstructions(true)}
          onShowAchievements={() => setShowAchievements(true)}
        />
        <InstructionsModal
          isOpen={showInstructions}
          onClose={() => setShowInstructions(false)}
          shipName={shipName}
        />
        <AchievementsModal
          isOpen={showAchievements}
          onClose={() => setShowAchievements(false)}
        />
      </>
    );
  }

  return (
    <div
      id="camera-controls"
      ref={controlsRef}
      data-panel
      className={isExpanded ? 'expanded' : 'collapsed'}
    >
      <button
        className="camera-controls-toggle"
        onClick={toggleExpanded}
        aria-label="설정 전환"
      >
        ⚙
      </button>

      {isExpanded && (
        <div className="settings-panel">
          <div className="settings-header">설정</div>

          <div className="settings-list">
            {/* Toggle switches */}
            <label className="settings-toggle-row">
              <span className="settings-label">별 회전</span>
              <input
                type="checkbox"
                className="settings-toggle-input"
                checked={cameraState.autoRotationEnabled}
                onChange={onToggleRotation}
                aria-label="별 회전"
              />
              <span className="settings-toggle-slider" />
            </label>

            <label className="settings-toggle-row">
              <span className="settings-label">경계선</span>
              <input
                type="checkbox"
                className="settings-toggle-input"
                checked={cameraState.boundaryVisible}
                onChange={onToggleBoundary}
                aria-label="경계선"
              />
              <span className="settings-toggle-slider" />
            </label>

            <label className="settings-toggle-row">
              <span className="settings-label">반물질</span>
              <input
                type="checkbox"
                className="settings-toggle-input"
                checked={antimatter}
                onChange={toggleAntimatter}
                aria-label="반물질"
              />
              <span className="settings-toggle-slider" />
            </label>

            <label className="settings-toggle-row">
              <span className="settings-label">점프 경고</span>
              <input
                type="checkbox"
                className="settings-toggle-input"
                checked={jumpWarningsEnabled}
                onChange={toggleJumpWarnings}
                aria-label="점프 경고"
              />
              <span className="settings-toggle-slider" />
            </label>

            <div className="settings-divider" />

            <div className="settings-star-finder">
              <span className="settings-label">별 찾기</span>
              <CustomSelect
                className="star-finder-select"
                options={sortedStars.map((star) => ({
                  value: String(star.id),
                  label: `${visitedSet.has(star.id) ? '\u2713 ' : '  '}${star.name}`,
                }))}
                value=""
                onChange={(val) => {
                  const systemId = parseInt(val, 10);
                  if (!isNaN(systemId)) {
                    selectStarById(systemId);
                  }
                }}
                placeholder="-- 선택 --"
                aria-label="항성계 찾기"
              />
            </div>

            <div className="settings-divider" />

            {/* Action buttons */}
            <button className="settings-action-btn" onClick={onZoomIn}>
              확대
            </button>
            <button className="settings-action-btn" onClick={onZoomOut}>
              축소
            </button>
            <button
              className="settings-action-btn"
              onClick={() => setShowInstructions(true)}
            >
              설명서
            </button>
            <button
              className="settings-action-btn"
              onClick={() => setShowAchievements(true)}
            >
              업적
            </button>
            <a
              className="settings-action-btn"
              href="https://github.com/Ovid/tramp-freighter/"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      )}

      <InstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        shipName={shipName}
      />
      <AchievementsModal
        isOpen={showAchievements}
        onClose={() => setShowAchievements(false)}
      />
    </div>
  );
}
