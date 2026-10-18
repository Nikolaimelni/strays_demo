import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server } from '../../test/msw.ts';
import { renderWithProviders } from '../../test/render.tsx';
import { RegisterPage } from './register-page.tsx';

const API = 'http://localhost:3000';

// the box stands for an age and an agreement the server records, so it is never ticked
// for anybody and an account is never asked for without it
describe('register page', () => {
  it('will not sign up until the terms box is ticked', async () => {
    let body: unknown = null;
    server.use(
      http.post(`${API}/auth/register`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ user: { id: 'u1' } }, { status: 201 });
      }),
    );

    renderWithProviders(<RegisterPage />);
    await userEvent.type(screen.getByLabelText('Email'), 'someone@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'a long enough one');

    const box = screen.getByRole('checkbox');
    expect(box).not.toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('Tick this to create an account.')).toBeInTheDocument();
    expect(body).toBeNull();

    await userEvent.click(box);
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await screen.findByRole('button', { name: 'Create account' });
    await vi.waitFor(() => expect(body).toMatchObject({ acceptTerms: true }));
  });
});
