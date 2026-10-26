import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import { EVENT_NAMES } from '../../src/game/constants.js';
import App from '../../src/App';

// Mock scene to avoid WebGL in jsdom
vi.mock('../../src/game/engine/scene', () => {
  const mockRenderer = {
    domElement: document.createElement('canvas'),
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
  };
  const mockControls = { update: vi.fn() };
  const mockScene = {
    background: null,
    fog: null,
    add: vi.fn(),
    traverse: vi.fn(),
  };
  const mockCamera = {
    aspect: 1,
    position: { set: vi.fn() },
    lookAt: vi.fn(),
    updateProjectionMatrix: vi.fn(),
  };
  const mockLights = {
    ambientLight: {},
    directionalLight: {
      position: { set: vi.fn().mockReturnThis(), normalize: vi.fn() },
    },
  };
  const mockStars = [
    {
      data: { id: 1 },
      position: { x: 0, y: 0, z: 0 },
      sprite: { material: { color: { setHex: vi.fn() } } },
      originalColor: 0xffffff,
    },
  ];

  return {
    initScene: vi.fn(() => ({
      scene: mockScene,
      camera: mockCamera,
      renderer: mockRenderer,
      controls: mockControls,
      lights: mockLights,
      stars: mockStars,
      sectorBoundary: { visible: true },
    })),
    onWindowResize: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    toggleBoundary: vi.fn(() => true),
  };
});

// Mock animation system
vi.mock('../../src/game/engine/game-animation', () => {
  return {
    JumpAnimationSystem: vi.fn().mockImplementation(() => ({
      isAnimating: false,
      inputLockManager: {
        isInputLocked: vi.fn(() => false),
        lock: vi.fn(),
        unlock: vi.fn(),
      },
      playJumpAnimation: vi.fn(),
    })),
  };
});

/**
 * Integration tests for non-pirate encounter panels in App.jsx
 *
 * Tests that InspectionPanel, MechanicalFailurePanel, and DistressCallPanel
 * render correctly when their encounter type is emitted, and that closing
 * the encounter returns the player to orbit view.
 *
 * Feature: danger-system
 */
describe('Non-Pirate Encounter Integration', () => {
  let game;

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Navigate past title screen to orbit mode */
  async function navigateToOrbit() {
    const newGameButton = screen.getByText('새 게임');
    fireEvent.click(newGameButton);

    const shipNameInput = screen.getByPlaceholderText('함선 이름 입력...');
    fireEvent.change(shipNameInput, { target: { value: 'Test Ship' } });
    fireEvent.keyDown(shipNameInput, { key: 'Enter' });

    await waitFor(() => {
      expect(document.querySelector('#dev-admin-btn')).toBeTruthy();
    });
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  }

  describe('Inspection encounter', () => {
    const inspectionData = {
      type: 'inspection',
      encounter: {
        id: 'insp_test_1',
        severity: 'routine',
        description:
          'Customs officials are conducting a standard cargo inspection.',
        choices: [{ id: 'cooperate', label: '협조' }],
      },
    };

    it('should render InspectionPanel when inspection encounter is emitted', async () => {
      render(
        <GameProvider game={game}>
          <App devMode={true} />
        </GameProvider>
      );

      await navigateToOrbit();

      game.emit(EVENT_NAMES.ENCOUNTER_TRIGGERED, inspectionData);

      await waitFor(() => {
        expect(screen.getByText('세관 검문')).toBeInTheDocument();
      });

      expect(screen.getByText('협조')).toBeInTheDocument();
      expect(screen.getByText('뇌물 시도')).toBeInTheDocument();
      expect(screen.getByText('도주')).toBeInTheDocument();
    });

    it('should return to orbit after resolving inspection encounter', async () => {
      render(
        <GameProvider game={game}>
          <App devMode={true} />
        </GameProvider>
      );

      await navigateToOrbit();

      game.emit(EVENT_NAMES.ENCOUNTER_TRIGGERED, inspectionData);

      await waitFor(() => {
        expect(screen.getByText('세관 검문')).toBeInTheDocument();
      });

      // Cooperate option resolves through handleEncounterChoice -> resolveEncounter
      const cooperateOption = screen.getByText('협조');
      fireEvent.click(cooperateOption);

      // OutcomePanel should appear after resolution
      await waitFor(() => {
        expect(screen.getByText('조우 결과')).toBeInTheDocument();
      });

      // Click Continue to return to orbit
      const continueButton = screen.getByText('계속');
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(
          screen.queryByText('세관 검문')
        ).not.toBeInTheDocument();
        expect(screen.queryByText('조우 결과')).not.toBeInTheDocument();
      });
    });
  });

  describe('Mechanical failure encounter', () => {
    const hullBreachData = {
      type: 'mechanical_failure',
      encounter: {
        id: 'mech_test_1',
        type: 'hull_breach',
        severity: 'serious',
        choices: [{ id: 'acknowledge', label: 'Acknowledge' }],
      },
    };

    it('should render MechanicalFailurePanel when mechanical failure encounter is emitted', async () => {
      render(
        <GameProvider game={game}>
          <App devMode={true} />
        </GameProvider>
      );

      await navigateToOrbit();

      game.emit(EVENT_NAMES.ENCOUNTER_TRIGGERED, hullBreachData);

      await waitFor(() => {
        expect(screen.getByText('기계 고장')).toBeInTheDocument();
      });

      expect(screen.getByText('선체 파손')).toBeInTheDocument();
      expect(screen.getByText('확인')).toBeInTheDocument();
    });

    it('should return to orbit when mechanical failure encounter is acknowledged', async () => {
      render(
        <GameProvider game={game}>
          <App devMode={true} />
        </GameProvider>
      );

      await navigateToOrbit();

      game.emit(EVENT_NAMES.ENCOUNTER_TRIGGERED, hullBreachData);

      await waitFor(() => {
        expect(screen.getByText('기계 고장')).toBeInTheDocument();
      });

      // Hull breach Acknowledge button resolves through encounter resolution
      const acknowledgeButton = screen.getByText('확인');
      fireEvent.click(acknowledgeButton);

      // OutcomePanel should appear after resolution
      await waitFor(() => {
        expect(screen.getByText('조우 결과')).toBeInTheDocument();
      });

      // Click Continue to return to orbit
      const continueButton = screen.getByText('계속');
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(
          screen.queryByText('기계 고장')
        ).not.toBeInTheDocument();
        expect(screen.queryByText('조우 결과')).not.toBeInTheDocument();
      });
    });
  });

  describe('Distress call encounter', () => {
    const distressCallData = {
      type: 'distress_call',
      encounter: {
        id: 'dist_test_1',
        severity: 'moderate',
        type: 'mechanical',
        description: 'A civilian transport is requesting emergency assistance.',
        vesselType: 'Civilian Transport',
        crewCount: '4 persons',
        timeElapsed: '1.5 hours',
        choices: [{ id: 'respond', label: 'Respond' }],
      },
    };

    it('should render DistressCallPanel when distress call encounter is emitted', async () => {
      render(
        <GameProvider game={game}>
          <App devMode={true} />
        </GameProvider>
      );

      await navigateToOrbit();

      game.emit(EVENT_NAMES.ENCOUNTER_TRIGGERED, distressCallData);

      await waitFor(() => {
        expect(screen.getByText('조난 신호')).toBeInTheDocument();
      });

      expect(screen.getByText('조난 신호에 응답')).toBeInTheDocument();
      expect(screen.getByText('신호 무시')).toBeInTheDocument();
      expect(screen.getByText('잔해 인양')).toBeInTheDocument();
    });

    it('should return to orbit after resolving distress call encounter', async () => {
      render(
        <GameProvider game={game}>
          <App devMode={true} />
        </GameProvider>
      );

      await navigateToOrbit();

      game.emit(EVENT_NAMES.ENCOUNTER_TRIGGERED, distressCallData);

      await waitFor(() => {
        expect(screen.getByText('조난 신호')).toBeInTheDocument();
      });

      // Select "신호 무시" then confirm
      const ignoreOption = screen.getByText('신호 무시');
      fireEvent.click(ignoreOption);

      // Confirm the choice
      await waitFor(() => {
        expect(screen.getByText('항로 유지')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('항로 유지'));

      // OutcomePanel should appear after resolution
      await waitFor(() => {
        expect(screen.getByText('조우 결과')).toBeInTheDocument();
      });

      // Click Continue to return to orbit
      const continueButton = screen.getByText('계속');
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(screen.queryByText('조난 신호')).not.toBeInTheDocument();
        expect(screen.queryByText('조우 결과')).not.toBeInTheDocument();
      });
    });
  });
});
