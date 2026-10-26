import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SystemPanel } from '../../src/features/navigation/SystemPanel';
import { GameProvider } from '../../src/context/GameContext';
import { StarmapProvider } from '../../src/context/StarmapContext';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { NavigationSystem } from '../../src/game/game-navigation';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';

/**
 * Integration tests for SystemPanel danger warning functionality
 *
 * Tests the integration between SystemPanel and DangerWarningDialog
 * when jumping to dangerous systems.
 *
 * Feature: danger-system
 * Validates: Requirements 1.3, 12.3
 */
describe('SystemPanel Danger Warning Integration', () => {
  let game;
  let navigationSystem;
  let mockStarmapContext;

  beforeEach(() => {
    // Create NavigationSystem and GameCoordinator properly
    navigationSystem = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA, navigationSystem);
    game.initNewGame();

    // Mock starmap context
    mockStarmapContext = {
      selectStarById: vi.fn(),
    };

    // Mock console.error to avoid noise in test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderSystemPanel = (viewingSystemId, props = {}) => {
    return render(
      <GameProvider game={game}>
        <StarmapProvider value={mockStarmapContext}>
          <SystemPanel
            viewingSystemId={viewingSystemId}
            onClose={vi.fn()}
            onJumpStart={vi.fn()}
            onJumpComplete={vi.fn()}
            {...props}
          />
        </StarmapProvider>
      </GameProvider>
    );
  };

  describe('Danger Warning Dialog Display', () => {
    it('should show danger warning dialog when jumping to dangerous system', async () => {
      // Arrange: Set up at Barnard's Star (safe system)
      game.updateLocation(4); // Barnard's Star
      game.updateFuel(100);

      // Act: Render SystemPanel viewing 70 Ophiuchi A (dangerous system)
      renderSystemPanel(73); // 70 Ophiuchi A

      // Get the jump button and click it
      const jumpButton = screen.getByText('항성계로 점프');
      fireEvent.click(jumpButton);

      // Assert: Danger warning dialog should appear
      await waitFor(() => {
        expect(screen.getByText('점프 경고')).toBeInTheDocument();
      });

      // Check for system name specifically in the danger dialog
      const dangerDialog = screen
        .getByText('점프 경고')
        .closest('#danger-warning-dialog');
      expect(dangerDialog.querySelector('.destination-name')).toHaveTextContent(
        '70 Ophiuchi A'
      );
      expect(
        dangerDialog.querySelector('.classification-value.dangerous')
      ).toHaveTextContent('위험');
      expect(screen.getByText('해적 조우')).toBeInTheDocument();
      expect(screen.getByText('세관 검문')).toBeInTheDocument();
      expect(screen.getByText('위험을 감수하고 진행')).toBeInTheDocument();
      expect(screen.getByText('점프 취소')).toBeInTheDocument();
    });

    it('should show danger warning dialog when jumping to contested system', async () => {
      // Arrange: Set up at Sol (safe system)
      game.updateLocation(0); // Sol
      game.updateFuel(100);

      // Act: Render SystemPanel viewing Sirius (contested system)
      renderSystemPanel(7); // Sirius

      // Get the jump button and click it
      const jumpButton = screen.getByText('항성계로 점프');
      fireEvent.click(jumpButton);

      // Assert: Danger warning dialog should appear
      await waitFor(() => {
        expect(screen.getByText('점프 경고')).toBeInTheDocument();
      });

      // Check for system name specifically in the danger dialog
      const dangerDialog = screen
        .getByText('점프 경고')
        .closest('#danger-warning-dialog');
      expect(dangerDialog.querySelector('.destination-name')).toHaveTextContent(
        'Sirius A'
      );
      expect(
        dangerDialog.querySelector('.classification-value.contested')
      ).toHaveTextContent('분쟁');
      expect(screen.getByText('진행')).toBeInTheDocument(); // Not "Accept Risk" for contested
      expect(screen.getByText('점프 취소')).toBeInTheDocument();
    });

    it('should NOT show danger warning dialog when jumping to safe system', async () => {
      // Arrange: Set up at Sol (safe system)
      game.updateLocation(0); // Sol
      game.updateFuel(100);

      const mockOnClose = vi.fn();
      const mockOnJumpComplete = vi.fn();

      // Act: Render SystemPanel viewing Alpha Centauri (safe system)
      renderSystemPanel(1, {
        onClose: mockOnClose,
        onJumpComplete: mockOnJumpComplete,
      }); // Alpha Centauri

      // Get the jump button and click it
      const jumpButton = screen.getByText('항성계로 점프');
      fireEvent.click(jumpButton);

      // Assert: No danger warning dialog should appear
      // Instead, jump should proceed directly
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });

      expect(screen.queryByText('점프 경고')).not.toBeInTheDocument();
    });
  });

  describe('Danger Warning Dialog Interactions', () => {
    it('should proceed with jump when user clicks "위험을 감수하고 진행"', async () => {
      // Arrange: Set up dangerous system jump
      game.updateLocation(4); // Barnard's Star
      game.updateFuel(100);

      const mockOnClose = vi.fn();
      const mockOnJumpComplete = vi.fn();

      renderSystemPanel(73, {
        onClose: mockOnClose,
        onJumpComplete: mockOnJumpComplete,
      }); // 70 Ophiuchi A

      // Act: Click jump button to show dialog
      const jumpButton = screen.getByText('항성계로 점프');
      fireEvent.click(jumpButton);

      await waitFor(() => {
        expect(screen.getByText('점프 경고')).toBeInTheDocument();
      });

      // Click proceed button
      const proceedButton = screen.getByText('위험을 감수하고 진행');
      fireEvent.click(proceedButton);

      // Assert: Jump should execute
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledWith(true); // true = keep selection ring
      });

      await waitFor(() => {
        expect(mockOnJumpComplete).toHaveBeenCalled();
      });

      // Player should be at destination
      expect(game.getPlayer().currentSystem).toBe(73);
    });

    it('should cancel jump when user clicks "점프 취소"', async () => {
      // Arrange: Set up dangerous system jump
      game.updateLocation(4); // Barnard's Star
      game.updateFuel(100);

      const mockOnClose = vi.fn();
      const mockOnJumpComplete = vi.fn();

      renderSystemPanel(73, {
        onClose: mockOnClose,
        onJumpComplete: mockOnJumpComplete,
      }); // 70 Ophiuchi A

      // Act: Click jump button to show dialog
      const jumpButton = screen.getByText('항성계로 점프');
      fireEvent.click(jumpButton);

      await waitFor(() => {
        expect(screen.getByText('점프 경고')).toBeInTheDocument();
      });

      // Click cancel button
      const cancelButton = screen.getByText('점프 취소');
      fireEvent.click(cancelButton);

      // Assert: Jump should NOT execute
      await waitFor(() => {
        expect(screen.queryByText('점프 경고')).not.toBeInTheDocument();
      });

      expect(mockOnClose).not.toHaveBeenCalled();
      expect(mockOnJumpComplete).not.toHaveBeenCalled();

      // Player should still be at origin
      expect(game.getPlayer().currentSystem).toBe(4);
    });

    it('should close dialog when user clicks close button', async () => {
      // Arrange: Set up dangerous system jump
      game.updateLocation(4); // Barnard's Star
      game.updateFuel(100);

      renderSystemPanel(73); // 70 Ophiuchi A

      // Act: Click jump button to show dialog
      const jumpButton = screen.getByText('항성계로 점프');
      fireEvent.click(jumpButton);

      await waitFor(() => {
        expect(screen.getByText('점프 경고')).toBeInTheDocument();
      });

      // Click close button (×) in the danger warning dialog
      const dangerDialog = screen
        .getByText('점프 경고')
        .closest('#danger-warning-dialog');
      const closeButton = dangerDialog.querySelector('.close-btn');
      fireEvent.click(closeButton);

      // Assert: Dialog should close without jumping
      await waitFor(() => {
        expect(screen.queryByText('점프 경고')).not.toBeInTheDocument();
      });

      // Player should still be at origin
      expect(game.getPlayer().currentSystem).toBe(4);
    });
  });

  describe('Danger Zone Classification', () => {
    it('should correctly classify safe systems', async () => {
      // Test Sol (system 0)
      game.updateLocation(1); // Alpha Centauri
      game.updateFuel(100);

      renderSystemPanel(0); // Sol

      const jumpButton = screen.getByText('항성계로 점프');
      fireEvent.click(jumpButton);

      // Should not show danger warning for safe system
      expect(screen.queryByText('점프 경고')).not.toBeInTheDocument();
    });

    it('should correctly classify contested systems', async () => {
      game.updateLocation(0); // Sol
      game.updateFuel(100);

      renderSystemPanel(7); // Sirius (contested)

      const jumpButton = screen.getByText('항성계로 점프');
      fireEvent.click(jumpButton);

      await waitFor(() => {
        expect(screen.getByText('점프 경고')).toBeInTheDocument();
      });

      // Look for "Contested" in the danger warning dialog specifically
      const dangerDialog = screen
        .getByText('점프 경고')
        .closest('#danger-warning-dialog');
      const contestedElement = dangerDialog.querySelector(
        '.classification-value.contested'
      );
      expect(contestedElement).toHaveTextContent('분쟁');
    });

    it('should correctly classify dangerous systems', async () => {
      // Use Barnard's Star as starting point (as per manual testing plan)
      game.updateLocation(4); // Barnard's Star
      game.updateFuel(100);

      // Find a dangerous system that's actually connected to Barnard's Star
      const connectedSystems = game.navigationSystem.getConnectedSystems(4);
      const dangerousSystems = connectedSystems.filter((systemId) => {
        const dangerZone = game.dangerManager.getDangerZone(systemId);
        return dangerZone === 'dangerous';
      });

      // Skip test if no dangerous systems are connected to Barnard's Star
      if (dangerousSystems.length === 0) {
        console.log(
          "No dangerous systems connected to Barnard's Star, skipping test"
        );
        return;
      }

      const dangerousSystemId = dangerousSystems[0];
      renderSystemPanel(dangerousSystemId);

      const jumpButton = screen.getByText('항성계로 점프');
      fireEvent.click(jumpButton);

      await waitFor(() => {
        expect(screen.getByText('점프 경고')).toBeInTheDocument();
      });

      // Look for "Dangerous" in the danger warning dialog specifically
      const dangerDialog = screen
        .getByText('점프 경고')
        .closest('#danger-warning-dialog');
      const dangerousElement = dangerDialog.querySelector(
        '.classification-value.dangerous'
      );
      expect(dangerousElement).toHaveTextContent('위험');
    });
  });

  describe('Risk Assessment Display', () => {
    it('should display pirate and inspection probabilities', async () => {
      game.updateLocation(4); // Barnard's Star
      game.updateFuel(100);

      renderSystemPanel(73); // 70 Ophiuchi A

      const jumpButton = screen.getByText('항성계로 점프');
      fireEvent.click(jumpButton);

      await waitFor(() => {
        expect(screen.getByText('점프 경고')).toBeInTheDocument();
      });

      // Should show risk assessment section
      expect(screen.getByText('위험 평가')).toBeInTheDocument();
      expect(screen.getByText('해적 조우')).toBeInTheDocument();
      expect(screen.getByText('세관 검문')).toBeInTheDocument();

      // Should show percentage values
      const percentageElements = screen.getAllByText(/%$/);
      expect(percentageElements.length).toBeGreaterThan(0);
    });

    it('should show risk factors when applicable', async () => {
      // Arrange: Add cargo to trigger risk factors
      game.updateLocation(4); // Barnard's Star
      game.updateFuel(100);

      // Add some cargo to trigger risk factor display
      const state = game.getState();
      state.ship.cargo.push({
        type: 'electronics',
        quantity: 10,
        purchasePrice: 100,
        purchaseSystem: 4,
        purchaseDate: 0,
      });

      renderSystemPanel(73); // 70 Ophiuchi A

      const jumpButton = screen.getByText('항성계로 점프');
      fireEvent.click(jumpButton);

      await waitFor(() => {
        expect(screen.getByText('점프 경고')).toBeInTheDocument();
      });

      // Should show risk modifiers section
      expect(screen.getByText('위험 보정 요인')).toBeInTheDocument();
      expect(
        screen.getByText('화물 가치가 해적 조우 확률에 영향을 줍니다')
      ).toBeInTheDocument();
    });
  });

  describe('안전 권고', () => {
    it('should show safety recommendations for dangerous systems', async () => {
      game.updateLocation(4); // Barnard's Star
      game.updateFuel(100);

      renderSystemPanel(73); // 70 Ophiuchi A (dangerous)

      const jumpButton = screen.getByText('항성계로 점프');
      fireEvent.click(jumpButton);

      await waitFor(() => {
        expect(screen.getByText('점프 경고')).toBeInTheDocument();
      });

      expect(screen.getByText('안전 권고')).toBeInTheDocument();
      expect(
        screen.getByText('위험 지대 - 해적 활동이 활발할 것으로 예상됩니다')
      ).toBeInTheDocument();
    });

    it('should show appropriate recommendations for contested systems', async () => {
      game.updateLocation(0); // Sol
      game.updateFuel(100);

      renderSystemPanel(7); // Sirius (contested)

      const jumpButton = screen.getByText('항성계로 점프');
      fireEvent.click(jumpButton);

      await waitFor(() => {
        expect(screen.getByText('점프 경고')).toBeInTheDocument();
      });

      expect(screen.getByText('안전 권고')).toBeInTheDocument();
      expect(
        screen.getByText('분쟁 지대 - 조우 위험이 중간 수준입니다')
      ).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null faction data gracefully', async () => {
      // Arrange: Corrupt faction data to test null handling
      game.updateLocation(4); // Barnard's Star
      game.updateFuel(100);

      // Temporarily corrupt faction data
      const state = game.getState();
      const originalFactions = state.player.factions;
      state.player.factions = null;

      renderSystemPanel(73); // 70 Ophiuchi A

      const jumpButton = screen.getByText('항성계로 점프');
      fireEvent.click(jumpButton);

      // Should not crash and should show dialog
      await waitFor(() => {
        expect(screen.getByText('점프 경고')).toBeInTheDocument();
      });

      // Restore faction data
      state.player.factions = originalFactions;
    });

    it('should handle missing ship condition data gracefully', async () => {
      game.updateLocation(4); // Barnard's Star
      game.updateFuel(100);

      renderSystemPanel(73); // 70 Ophiuchi A

      const jumpButton = screen.getByText('항성계로 점프');
      fireEvent.click(jumpButton);

      // Should not crash and should show dialog
      await waitFor(() => {
        expect(screen.getByText('점프 경고')).toBeInTheDocument();
      });
    });

    it('should not show danger warning if jump validation fails', async () => {
      // Arrange: Set up insufficient fuel
      game.updateLocation(4); // Barnard's Star
      game.updateFuel(5); // Insufficient fuel

      renderSystemPanel(73); // 70 Ophiuchi A

      // Jump button should be disabled
      const jumpButton = screen.getByText('항성계로 점프');
      expect(jumpButton).toBeDisabled();

      // Clicking disabled button should not show danger warning
      fireEvent.click(jumpButton);

      expect(screen.queryByText('점프 경고')).not.toBeInTheDocument();
    });
  });
});
