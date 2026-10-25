import { useState, useRef, useCallback } from 'react';
import { useClickOutside } from '../../hooks/useClickOutside';

export function MobileCameraToolbar({
  onZoomIn,
  onZoomOut,
  onFindStar,
  stars = [],
  visitedSet,
  toggles = {},
  onToggle,
  onShowInstructions,
  onShowAchievements,
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [selectKey, setSelectKey] = useState(0);
  const toolbarRef = useRef(null);
  const collapseSettings = useCallback(() => setShowSettings(false), []);
  useClickOutside(toolbarRef, collapseSettings, showSettings);

  return (
    <div
      className="mobile-camera-toolbar"
      ref={toolbarRef}
      role="toolbar"
      aria-label="별지도 조작"
    >
      <button
        className="mobile-toolbar-btn"
        onClick={onZoomOut}
        aria-label="축소"
      >
        −
      </button>
      <button
        className="mobile-toolbar-btn"
        onClick={onZoomIn}
        aria-label="확대"
      >
        +
      </button>
      <label className="mobile-toolbar-find">
        <select
          key={selectKey}
          className="mobile-toolbar-select"
          value=""
          onChange={(e) => {
            onFindStar(e.target.value);
            setSelectKey((k) => k + 1);
          }}
          aria-label="별 찾기"
        >
          <option value="" disabled>
            찾기...
          </option>
          {stars.map((star) => (
            <option key={star.id} value={star.id}>
              {visitedSet?.has(star.id) ? '\u2713 ' : '  '}
              {star.name}
            </option>
          ))}
        </select>
      </label>
      <button
        className="mobile-toolbar-btn"
        onClick={() => setShowSettings(!showSettings)}
        aria-label="설정"
        aria-expanded={showSettings}
      >
        ⚙
      </button>

      {showSettings && (
        <div className="mobile-toolbar-popover">
          {Object.entries(toggles).map(([key, value]) => {
            const label = key
              .replace(/^show/, '')
              .replace(/([A-Z])/g, ' $1')
              .trim();
            return (
              <label key={key} className="mobile-toolbar-toggle">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => onToggle(key)}
                />
                {label}
              </label>
            );
          })}
          {onShowInstructions && (
            <button
              className="mobile-toolbar-action"
              onClick={() => {
                setShowSettings(false);
                onShowInstructions();
              }}
            >
              설명서
            </button>
          )}
          {onShowAchievements && (
            <button
              className="mobile-toolbar-action"
              onClick={() => {
                setShowSettings(false);
                onShowAchievements();
              }}
            >
              업적
            </button>
          )}
        </div>
      )}
    </div>
  );
}
