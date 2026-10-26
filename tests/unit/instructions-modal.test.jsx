import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { InstructionsModal } from '../../src/features/instructions/InstructionsModal.jsx';

describe('InstructionsModal', () => {
  afterEach(() => {
    cleanup();
  });

  it('should not render when isOpen is false', () => {
    render(<InstructionsModal isOpen={false} onClose={() => {}} />);
    expect(screen.queryByText("선장 브리핑")).not.toBeInTheDocument();
  });

  it('should render all sections when isOpen is true', () => {
    render(<InstructionsModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText("선장 브리핑")).toBeInTheDocument();
    expect(screen.getByText('당신의 목표')).toBeInTheDocument();
    expect(screen.getByText('항법')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '당신의 함선' })
    ).toBeInTheDocument();
    expect(screen.getByText('정거장')).toBeInTheDocument();
    expect(screen.getByText('과학')).toBeInTheDocument();
  });

  it('should display ship name and mention Ship Status in Your Ship section', () => {
    render(
      <InstructionsModal isOpen={true} onClose={() => {}} shipName="Wanderer" />
    );
    expect(
      screen.getByRole('heading', { name: '당신의 함선' })
    ).toBeInTheDocument();
    expect(screen.getByText(/Wanderer/)).toBeInTheDocument();
    expect(screen.getByText(/함선 상태/)).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<InstructionsModal isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('창 닫기'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<InstructionsModal isOpen={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
