/**
 * Title Screen Component
 *
 * Displays the game title screen with options to continue an existing game
 * or start a new game. Shows a confirmation modal if starting a new game
 * would overwrite an existing save.
 *
 * React Migration Spec: Requirements 47.1, 47.2, 47.3, 47.4, 47.5, 47.6, 47.7
 */
import { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { ConfirmModal } from '../../components/Modal';
import { GAME_VERSION } from '../../game/constants';

/**
 * TitleScreen component that displays the game title and menu options.
 *
 * @param {Object} props - Component props
 * @param {Function} props.onStartGame - Callback when starting a game (isNewGame: boolean)
 * @returns {JSX.Element} Title screen component
 */
export function TitleScreen({ onStartGame }) {
  const game = useGame();
  const [hasSave, setHasSave] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Check for saved game on mount
  useEffect(() => {
    setHasSave(game.hasSavedGame());
  }, [game]);

  const handleContinue = () => {
    onStartGame(false); // Load existing game
  };

  const handleNewGame = () => {
    if (hasSave) {
      // Show confirmation if save exists
      setShowConfirmation(true);
    } else {
      // Start new game directly if no save exists
      onStartGame(true);
    }
  };

  const handleConfirmNewGame = () => {
    setShowConfirmation(false);
    onStartGame(true); // Start new game
  };

  const handleCancelNewGame = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="title-screen">
      <div className="menu-content">
        <h1 className="menu-title">트램프 프레이터 블루스</h1>
        <div className="menu-subtitle">솔 섹터 교역 시뮬레이션</div>

        <div className="menu-buttons">
          {hasSave && (
            <button className="menu-btn" onClick={handleContinue}>
              이어하기
            </button>
          )}
          <button className="menu-btn" onClick={handleNewGame}>
            새 게임
          </button>
        </div>

        <div className="menu-footer">
          <div className="menu-version">v{GAME_VERSION}</div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirmation}
        onConfirm={handleConfirmNewGame}
        onCancel={handleCancelNewGame}
        title="새 게임 시작"
        message="새 게임을 시작하면 기존 저장 데이터를 덮어씁니다. 계속하시겠습니까?"
        confirmText="OK"
        cancelText="취소"
      />
    </div>
  );
}
