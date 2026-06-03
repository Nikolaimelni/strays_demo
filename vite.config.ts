import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // plugin-react v6 runs the React Compiler through oxc, not babel, so the old
  // babel-plugin-react-compiler wiring does not apply here
  plugins: [react({ compiler: true }), tailwindcss()],
  server: { port: 5173 },
});
