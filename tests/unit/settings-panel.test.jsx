import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CameraControls } from '../../src/features/navigation/CameraControls.jsx';

// Mock the modal components
vi.mock('../../src/features/instructions/InstructionsModal', () => ({
  InstructionsModal: ({ isOpen }) =>
    isOpen ? <div data-testid="instructions-modal">Instructions</div> : null,
}));
vi.mock('../../src/features/achievements/AchievementsModal', () => ({
  AchievementsModal: ({ isOpen }) =>
    isOpen ? <div data-testid="achievements-modal">Achievements</div> : null,
}));

// Mock GameContext
vi.mock('../../src/context/GameContext', () => {
  const hook = () => ({
    getPreference: vi.fn((key) => {
      if (key === 'jumpWarningsEnabled') return true;
      return true;
    }),
    setPreference: vi.fn(),
    getVisitedSystems: vi.fn(() => [0]),
  });
  return { useGame: hook };
});

// Mock StarmapContext
vi.mock('../../src/context/StarmapContext', () => ({
  useStarmap: () => ({ selectStarById: vi.fn() }),
}));

// Mock useStarData
vi.mock('../../src/hooks/useStarData', () => ({
  useStarData: () => [{ id: 0, name: 'Sol', x: 0, y: 0, z: 0 }],
}));

// Mock useGameEvent
vi.mock('../../src/hooks/useGameEvent', () => ({
  useGameEvent: () => ({ jumpWarningsEnabled: true }),
}));

// Mock MobileContext
vi.mock('../../src/context/MobileContext', () => ({
  useMobile: () => ({ isMobile: false }),
}));

describe('Settings Panel', () => {
  const defaultProps = {
    cameraState: { autoRotationEnabled: true, boundaryVisible: true },
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onToggleRotation: vi.fn(),
    onToggleBoundary: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders gear toggle button', () => {
    render(<CameraControls {...defaultProps} />);
    expect(screen.getByLabelText('설정 전환')).toBeTruthy();
  });

  it('shows settings panel with header when expanded', () => {
    render(<CameraControls {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('설정 전환'));
    expect(screen.getByText('설정')).toBeTruthy();
  });

  it('renders toggle switches for boolean preferences', () => {
    render(<CameraControls {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('설정 전환'));

    expect(screen.getByText('별 회전')).toBeTruthy();
    expect(screen.getByText('경계선')).toBeTruthy();
    expect(screen.getByText('반물질')).toBeTruthy();
    expect(screen.getByText('점프 경고')).toBeTruthy();
  });

  it('renders action buttons', () => {
    render(<CameraControls {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('설정 전환'));

    expect(screen.getByText('확대')).toBeTruthy();
    expect(screen.getByText('축소')).toBeTruthy();
    expect(screen.getByText('설명서')).toBeTruthy();
    expect(screen.getByText('업적')).toBeTruthy();
    expect(screen.getByText('GitHub')).toBeTruthy();
  });

  it('toggle switches have correct initial state', () => {
    render(<CameraControls {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('설정 전환'));

    const rotationToggle = screen.getByLabelText('별 회전');
    expect(rotationToggle.checked).toBe(true);

    const boundaryToggle = screen.getByLabelText('경계선');
    expect(boundaryToggle.checked).toBe(true);
  });

  it('clicking Star Rotation toggle calls onToggleRotation', () => {
    render(<CameraControls {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('설정 전환'));
    fireEvent.click(screen.getByLabelText('별 회전'));
    expect(defaultProps.onToggleRotation).toHaveBeenCalled();
  });

  it('should collapse when clicking outside the settings panel', () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <CameraControls {...defaultProps} />
      </div>
    );
    // Expand
    fireEvent.click(screen.getByLabelText('설정 전환'));
    expect(screen.getByText('설정')).toBeTruthy();

    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByText('설정')).toBeNull();
  });

  it('should not collapse when clicking inside the settings panel', () => {
    render(<CameraControls {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('설정 전환'));
    expect(screen.getByText('설정')).toBeTruthy();

    // Click inside
    fireEvent.mouseDown(screen.getByText('설정'));
    expect(screen.getByText('설정')).toBeTruthy();
  });
});
