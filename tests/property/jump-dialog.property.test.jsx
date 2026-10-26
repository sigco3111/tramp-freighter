import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { JumpDialog } from '../../src/features/navigation/JumpDialog';
import { GameProvider } from '../../src/context/GameContext';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { NavigationSystem } from '../../src/game/game-navigation';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';

describe('Property: Jump Dialog', () => {
  let game;
  let navigationSystem;

  beforeEach(() => {
    navigationSystem = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA, navigationSystem);
    game.initNewGame();
  });

  it('should display target system name and jump information', () => {
    // Sol (0) to Alpha Centauri A (1) - connected systems
    const targetSystemId = 1;

    render(
      <GameProvider game={game}>
        <JumpDialog
          targetSystemId={targetSystemId}
          onClose={() => {}}
          onJumpComplete={() => {}}
        />
      </GameProvider>
    );

    // Should display system name
    expect(screen.getByText(/Alpha Centauri A/i)).toBeInTheDocument();

    // Should display distance, fuel cost, and jump time
    expect(screen.getByText(/거리:/)).toBeInTheDocument();
    expect(screen.getByText(/연료 비용:/)).toBeInTheDocument();
    expect(screen.getByText(/점프 시간:/)).toBeInTheDocument();

    // Should have jump button
    expect(screen.getByText(/항성계로 점프/)).toBeInTheDocument();
  });

  it('should disable jump button when fuel is insufficient', () => {
    // Set fuel to 0
    game.updateFuel(0);

    const targetSystemId = 1;

    render(
      <GameProvider game={game}>
        <JumpDialog
          targetSystemId={targetSystemId}
          onClose={() => {}}
          onJumpComplete={() => {}}
        />
      </GameProvider>
    );

    const jumpButton = screen.getByText(/항성계로 점프/);
    expect(jumpButton).toBeDisabled();

    // Should show error message
    expect(screen.getByText(/연료가 부족/)).toBeInTheDocument();
  });

  it('should disable jump button when no wormhole connection exists', () => {
    // Find a system not connected to Sol
    const unconnectedSystem = STAR_DATA.find((system) => {
      const isConnected = navigationSystem.areSystemsConnected(0, system.id);
      return !isConnected && system.id !== 0;
    });

    if (!unconnectedSystem) {
      // Skip test if all systems are connected to Sol
      return;
    }

    render(
      <GameProvider game={game}>
        <JumpDialog
          targetSystemId={unconnectedSystem.id}
          onClose={() => {}}
          onJumpComplete={() => {}}
        />
      </GameProvider>
    );

    const jumpButton = screen.getByText(/항성계로 점프/);
    expect(jumpButton).toBeDisabled();

    // Should show error message
    expect(screen.getByText(/웜홀 연결이 없습니다/)).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    const targetSystemId = 1;

    render(
      <GameProvider game={game}>
        <JumpDialog
          targetSystemId={targetSystemId}
          onClose={onClose}
          onJumpComplete={() => {}}
        />
      </GameProvider>
    );

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should have enabled jump button for valid jumps', () => {
    const targetSystemId = 1; // Alpha Centauri A - connected to Sol

    render(
      <GameProvider game={game}>
        <JumpDialog
          targetSystemId={targetSystemId}
          onClose={() => {}}
          onJumpComplete={() => {}}
        />
      </GameProvider>
    );

    const jumpButton = screen.getByText(/항성계로 점프/);

    // Button should be enabled for valid jump
    expect(jumpButton).not.toBeDisabled();

    // Should not show error message
    expect(screen.queryByText(/연료가 부족/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/웜홀 연결이 없습니다/)
    ).not.toBeInTheDocument();
  });

  it('should update displayed information when fuel changes', async () => {
    const targetSystemId = 1;

    const { rerender } = render(
      <GameProvider game={game}>
        <JumpDialog
          targetSystemId={targetSystemId}
          onClose={() => {}}
          onJumpComplete={() => {}}
        />
      </GameProvider>
    );

    // Initially should be enabled (sufficient fuel)
    let jumpButton = screen.getByText(/항성계로 점프/);
    expect(jumpButton).not.toBeDisabled();

    // Reduce fuel to insufficient level
    await act(async () => {
      game.updateFuel(0);
    });

    // Re-render to reflect state change
    rerender(
      <GameProvider game={game}>
        <JumpDialog
          targetSystemId={targetSystemId}
          onClose={() => {}}
          onJumpComplete={() => {}}
        />
      </GameProvider>
    );

    // Should now be disabled
    jumpButton = screen.getByText(/항성계로 점프/);
    expect(jumpButton).toBeDisabled();
    expect(screen.getByText(/연료가 부족/)).toBeInTheDocument();
  });

  it('should calculate correct fuel cost and jump time', () => {
    const targetSystemId = 1; // Alpha Centauri A

    render(
      <GameProvider game={game}>
        <JumpDialog
          targetSystemId={targetSystemId}
          onClose={() => {}}
          onJumpComplete={() => {}}
        />
      </GameProvider>
    );

    // Get validation data with quirks and upgrades (matching useJumpValidation hook)
    const state = game.getState();
    const quirks = state.ship?.quirks || [];
    const capabilities = game.calculateShipCapabilities();
    const validation = navigationSystem.validateJump(
      0,
      targetSystemId,
      100,
      state.ship?.engine ?? 100,
      game.applyQuirkModifiers.bind(game),
      quirks,
      capabilities.fuelConsumption,
      {
        hull: state.ship.hull,
        engine: state.ship.engine,
        lifeSupport: state.ship.lifeSupport,
      }
    );

    // Check that displayed values match calculated values
    expect(
      screen.getByText(new RegExp(`${validation.distance.toFixed(1)} 광년`))
    ).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`${Math.round(validation.fuelCost)}%`))
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        new RegExp(
          `${validation.jumpTime} 일`
        )
      )
    ).toBeInTheDocument();
  });
});
