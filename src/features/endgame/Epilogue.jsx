import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useGameAction } from '../../hooks/useGameAction.js';
import { Button } from '../../components/Button.jsx';
import { EndCredits } from './EndCredits.jsx';
import { gameDayToDate } from '../../game/utils/date-utils.js';
import { CREDITS_CONFIG } from '../../game/constants.js';
import './endgame.css';

export function Epilogue({ onCreditsComplete }) {
  const { getEpilogueData, getEpilogueStats } = useGameAction();
  const [phase, setPhase] = useState('epilogue');

  // Computed once — the game is over by the time Epilogue renders
  const sections = useMemo(() => getEpilogueData(), [getEpilogueData]);
  const stats = useMemo(() => getEpilogueStats(), [getEpilogueStats]);

  const fadeTimerRef = useRef(null);
  const revealTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      clearTimeout(fadeTimerRef.current);
      clearTimeout(revealTimerRef.current);
    };
  }, []);

  const handleCreditsClick = useCallback(() => {
    setPhase('fading');
    fadeTimerRef.current = setTimeout(() => {
      setPhase('credits');
      revealTimerRef.current = setTimeout(() => {
        setPhase('credits-revealed');
      }, CREDITS_CONFIG.FADE_IN_MS);
    }, CREDITS_CONFIG.FADE_OUT_MS + CREDITS_CONFIG.FADE_HOLD_MS);
  }, []);

  if (phase === 'credits' || phase === 'credits-revealed') {
    return (
      <>
        <EndCredits onCreditsComplete={onCreditsComplete} />
        {phase === 'credits' && <div className="credits-blackout-out" />}
      </>
    );
  }

  if (phase === 'stats' || phase === 'fading') {
    const isFading = phase === 'fading';
    return (
      <>
        {isFading && <div className="credits-blackout" />}
        <div id="epilogue" className="visible">
          <div className="endgame-panel">
            <h2>항해 통계</h2>
            <div className="stats-grid">
              <div className="stat-row">
                <span>최종 날짜:</span>
                <span>{gameDayToDate(stats.daysElapsed ?? 0)}</span>
              </div>
              <div className="stat-row">
                <span>방문한 항성계:</span>
                <span>{stats.systemsVisited}</span>
              </div>
              <div className="stat-row">
                <span>번 크레딧:</span>
                <span>₡{stats.creditsEarned.toLocaleString()}</span>
              </div>
              <div className="stat-row">
                <span>완료한 임무:</span>
                <span>{stats.missionsCompleted}</span>
              </div>
              <div className="stat-row">
                <span>신뢰 이상 NPC:</span>
                <span>{stats.trustedNPCs}</span>
              </div>
              <div className="stat-row">
                <span>수송한 화물:</span>
                <span>{stats.cargoHauled}  단위</span>
              </div>
              <div className="stat-row">
                <span>점프 횟수:</span>
                <span>{stats.jumpsCompleted}</span>
              </div>
            </div>
            <Button onClick={handleCreditsClick} disabled={isFading}>
              크레딧
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div id="epilogue" className="visible">
      <div className="endgame-panel">
        <h2>에필로그</h2>
        {sections.map((section) => (
          <p key={section.id} className="epilogue-text">
            {section.text}
          </p>
        ))}
        <Button onClick={() => setPhase('stats')}>계속</Button>
      </div>
    </div>
  );
}
