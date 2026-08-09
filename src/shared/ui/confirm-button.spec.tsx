import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/render.tsx';
import { ConfirmButton } from './confirm-button.tsx';

describe('ConfirmButton', () => {
  it('does not fire on the first click', async () => {
    const onConfirm = vi.fn();
    renderWithProviders(<ConfirmButton label="Delete" onConfirm={onConfirm} />);

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Delete for good' })).toBeInTheDocument();
  });

  it('fires once the second click confirms it', async () => {
    const onConfirm = vi.fn();
    renderWithProviders(<ConfirmButton label="Delete" onConfirm={onConfirm} />);

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete for good' }));

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('can be backed out of', async () => {
    const onConfirm = vi.fn();
    renderWithProviders(<ConfirmButton label="Delete" onConfirm={onConfirm} />);

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });
});
