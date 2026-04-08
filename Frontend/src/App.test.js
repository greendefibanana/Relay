import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

jest.mock('./pages/landingPage', () => () => <div>Landing Page</div>);
jest.mock('./pages/presalePage', () => () => <div>Presale Page</div>);
jest.mock('./dapp/dapp.index', () => ({ component }) => <div>{component}</div>);
jest.mock('./dapp/dapp.setuptrade', () => () => <div>Setup Trade</div>);
jest.mock('./dapp/dapp.otc', () => () => <div>OTC Market</div>);
jest.mock('./dapp/dapp.stakings', () => () => <div>Staking Page</div>);
jest.mock('./dapp/Trade.otc', () => () => <div>Trade Detail</div>);
jest.mock('./hooks/useWallet', () => ({
  usePhantomWallet: () => ({
    publicKey: null,
    connected: false,
    connecting: false,
    displayKey: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
    signTransaction: jest.fn(),
    signMessage: jest.fn(),
  }),
}));

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

test('renders the requested route after the preloader finishes', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  );

  expect(screen.queryByText('Landing Page')).not.toBeInTheDocument();

  act(() => {
    jest.advanceTimersByTime(1500);
  });

  expect(screen.getByText('Landing Page')).toBeInTheDocument();
});
