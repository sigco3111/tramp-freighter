import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
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
 * Integration tests for pirate flee path in App.jsx
 *
 * Tests handleEncounterChoice when the player chooses "도주" from
 * the initial pirate encounter panel, covering:
 * - Successful flee → OutcomePanel
 * - Failed flee → CombatPanel with flee context
 * - Error during flee → return to orbit
 *
 * Feature: danger-system
 */
describe('Pirate Flee Path Integration', () => {
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

  /** Open dev admin and trigger pirate encounter */
  async function triggerPirateEncounter() {
    const devAdminButton = document.querySelector('#dev-admin-btn');
    fireEvent.click(devAdminButton);

    await waitFor(() => {
      expect(screen.getByText('🏴‍☠️ Pirate')).toBeInTheDocument();
    });

    const pirateButton = screen.getByText('🏴‍☠️ Pirate');
    fireEvent.click(pirateButton);

    await waitFor(() => {
      expect(screen.getByText('해적 조우')).toBeInTheDocument();
    });
  }

  /** Select Flee and confirm */
  function chooseFlee() {
    const fleeOption = screen.getByText('도주');
    fireEvent.click(fleeOption);

    const confirmButton = screen.getByText('확정 도주');
    fireEvent.click(confirmButton);
  }

  it('should show OutcomePanel after successful flee', async () => {
    render(
      <GameProvider game={game}>
        <App devMode={true} />
      </GameProvider>
    );

    await navigateToOrbit();
    await triggerPirateEncounter();

    // Mock resolveCombatChoice to return successful flee
    vi.spyOn(game, 'resolveCombatChoice').mockReturnValue({
      success: true,
      description: 'You escaped the pirates!',
      costs: {},
      rewards: {},
    });

    chooseFlee();

    // OutcomePanel should appear with result
    await waitFor(() => {
      expect(screen.getByText('조우 결과')).toBeInTheDocument();
    });

    // Should show Continue button
    expect(screen.getByText('계속')).toBeInTheDocument();
  });

  it('should show CombatPanel with flee context after failed flee', async () => {
    render(
      <GameProvider game={game}>
        <App devMode={true} />
      </GameProvider>
    );

    await navigateToOrbit();
    await triggerPirateEncounter();

    // Mock resolveCombatChoice to return failed flee
    vi.spyOn(game, 'resolveCombatChoice').mockReturnValue({
      success: false,
      description: 'The pirates caught up to you!',
      costs: { hull: 10 },
      rewards: {},
    });

    chooseFlee();

    // CombatPanel should appear (it has heading "전투 결과")
    await waitFor(() => {
      expect(screen.getByText('전투 결과')).toBeInTheDocument();
    });

    // Should show flee-failed alert
    expect(
      screen.getByText('회피 실패 — 도주하지 못했습니다')
    ).toBeInTheDocument();
    expect(
      screen.getByText('The pirates caught up to you!')
    ).toBeInTheDocument();
  });

  it('should return to orbit when flee resolution throws an error', async () => {
    render(
      <GameProvider game={game}>
        <App devMode={true} />
      </GameProvider>
    );

    await navigateToOrbit();
    await triggerPirateEncounter();

    // Mock resolveCombatChoice to throw
    vi.spyOn(game, 'resolveCombatChoice').mockImplementation(() => {
      throw new Error('Combat system failure');
    });

    chooseFlee();

    // Should return to orbit — pirate encounter panel gone
    await waitFor(() => {
      expect(screen.queryByText('해적 조우')).not.toBeInTheDocument();
    });

    // CombatPanel and OutcomePanel should not be present
    expect(screen.queryByText('전투 결과')).not.toBeInTheDocument();
    expect(screen.queryByText('조우 결과')).not.toBeInTheDocument();

    // Error was logged
    expect(console.error).toHaveBeenCalledWith(
      'Flee resolution failed:',
      expect.any(Error)
    );
  });
});
