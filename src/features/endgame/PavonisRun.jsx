import { useState } from 'react';
import { useGame } from '../../context/GameContext.jsx';
import { Button } from '../../components/Button.jsx';
import './endgame.css';

const JUMP_SEQUENCE = [
  "항속 연장기가 윙 하고 깨어납니다. 함선이 처음 느껴보는 방식으로 진동합니다.",
  '통신으로 타나카의 목소리가 지직거리며 들려옵니다. "좌표 고정. 델타 파보니스. 19.89광년. 점프 개시, 셋... 둘... 하나..."',
  '별들이 늘어납니다. 현실이 휘어집니다. 함선이 만들어진 목적과는 전혀 다른 방식으로 우주를 가르며 비명을 지릅니다.',
  '그리고... 정적.',
  '델타 파보니스가 눈앞에서 타오릅니다. 주황빛. 따뜻함. 집.',
  '해냈습니다.',
];

export function PavonisRun({ onComplete, onCancel }) {
  const game = useGame();
  const [phase, setPhase] = useState('confirm');
  const [textIndex, setTextIndex] = useState(0);

  const handleConfirm = () => {
    game.markDirty();
    setPhase('jumping');
  };

  const handleContinue = () => {
    if (textIndex < JUMP_SEQUENCE.length - 1) {
      setTextIndex(textIndex + 1);
    } else {
      setPhase('complete');
      onComplete();
    }
  };

  if (phase === 'confirm') {
    return (
      <div id="pavonis-run" className="visible">
        <div className="endgame-panel">
          <h2>돌아올 수 없는 지점</h2>
          <p>타나카가 공구를 든 채 함선 옆에 서 있습니다.</p>
          <p>
            "이걸 하고 나면 돌아올 수 없어요. 항속 연장기는 편도예요. 델타 파보니스에는 도착하겠지만 네트워크로는 돌아오지 못해요. 그쪽에 웜홀 기반시설을 지어 놓지 않았다면요."
          </p>
          <p>그녀가 말을 멈춥니다.</p>
          <p>"정말 괜찮겠어요?"</p>
          <div className="endgame-choices">
            <Button onClick={handleConfirm}>네, 준비됐습니다</Button>
            <Button onClick={onCancel}>아직 아닙니다</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="pavonis-run" className="visible">
      <div className="endgame-panel">
        <p className="jump-text">{JUMP_SEQUENCE[textIndex]}</p>
        <Button onClick={handleContinue}>
          {textIndex < JUMP_SEQUENCE.length - 1
            ? '계속'
            : '델타 파보니스 도착'}
        </Button>
      </div>
    </div>
  );
}
