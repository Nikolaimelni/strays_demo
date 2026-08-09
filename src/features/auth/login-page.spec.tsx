import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../test/msw.ts';
import { renderWithProviders } from '../../test/render.tsx';
import { LoginPage } from './login-page.tsx';

const API = 'http://localhost:3000';

const fillAndSubmit = async () => {
  await userEvent.type(screen.getByLabelText('Email'), 'someone@example.com');
  await userEvent.type(screen.getByLabelText('Password'), 'demo');
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
};

describe('login page', () => {
  it('puts a server field error next to the field it belongs to', async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json(
          {
            code: 'VALIDATION_FAILED',
            message: 'request validation failed',
            details: [{ path: 'email', message: 'that address looks wrong' }],
          },
          { status: 400 },
        ),
      ),
    );

    renderWithProviders(<LoginPage />);
    await fillAndSubmit();

    const message = await screen.findByText('that address looks wrong');
    expect(message).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows a translated message for a code with no field attached', async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json(
          { code: 'INVALID_CREDENTIALS', message: 'email or password is incorrect' },
          { status: 401 },
        ),
      ),
    );

    renderWithProviders(<LoginPage />);
    await fillAndSubmit();

    expect(await screen.findByText('Wrong email or password.')).toBeInTheDocument();
  });

  it('validates on the client before it ever reaches the network', async () => {
    renderWithProviders(<LoginPage />);

    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email');
    await userEvent.type(screen.getByLabelText('Password'), 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
