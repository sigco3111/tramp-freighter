import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PavonisRun } from '../../src/features/endgame/PavonisRun.jsx';

vi.mock('../../src/features/endgame/endgame.css', () => ({}));

const mockMarkDirty = vi.fn();

vi.mock('../../src/context/GameContext.jsx', () => ({
  useGame: vi.fn(() => ({ markDirty: mockMarkDirty })),
}));

vi.mock('../../src/components/Button.jsx', () => ({
  Button: ({ children, onClick, ...rest }) => (
    <button onClick={onClick} {...rest}>
      {children}
    </button>
  ),
}));

describe('PavonisRun', () => {
  let onComplete;
  let onCancel;

  beforeEach(() => {
    onComplete = vi.fn();
    onCancel = vi.fn();
    mockMarkDirty.mockClear();
  });

  it('renders confirmation screen initially with "POINT OF NO RETURN"', () => {
    render(<PavonisRun onComplete={onComplete} onCancel={onCancel} />);
    expect(screen.getByText('돌아올 수 없는 지점')).toBeDefined();
  });

  it('cancel button calls onCancel', () => {
    render(<PavonisRun onComplete={onComplete} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('아직 아닙니다'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('confirm button transitions to jumping phase showing first jump text', () => {
    render(<PavonisRun onComplete={onComplete} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('네, 준비됐습니다'));

    expect(screen.queryByText('돌아올 수 없는 지점')).toBeNull();
    expect(screen.getByText(/항속 연장기가 윙 하고/)).toBeDefined();
  });

  it('confirm calls markDirty on the game state manager', () => {
    render(<PavonisRun onComplete={onComplete} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('네, 준비됐습니다'));
    expect(mockMarkDirty).toHaveBeenCalledTimes(1);
  });

  it('continue button advances through the jump sequence', () => {
    render(<PavonisRun onComplete={onComplete} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('네, 준비됐습니다'));

    // First text visible
    expect(screen.getByText(/항속 연장기가 윙 하고/)).toBeDefined();

    // Advance to second text
    fireEvent.click(screen.getByText('계속'));
    expect(screen.getByText(/타나카의 목소리가 지직거리며/)).toBeDefined();

    // Advance to third text
    fireEvent.click(screen.getByText('계속'));
    expect(screen.getByText(/별들이 늘어납니다/)).toBeDefined();
  });

  it('final continue button shows "Arrive at Delta Pavonis"', () => {
    render(<PavonisRun onComplete={onComplete} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('네, 준비됐습니다'));

    // Click through all but the last text (6 items, indices 0-5)
    // We start at index 0, need to click Continue 5 times to reach index 5
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByText('계속'));
    }

    expect(screen.getByText('해냈습니다.')).toBeDefined();
    expect(screen.getByText('델타 파보니스 도착')).toBeDefined();
  });

  it('after all text, clicking final button calls onComplete', () => {
    render(<PavonisRun onComplete={onComplete} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('네, 준비됐습니다'));

    // Advance through all 6 texts (click Continue 5 times, then Arrive)
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByText('계속'));
    }

    fireEvent.click(screen.getByText('델타 파보니스 도착'));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
