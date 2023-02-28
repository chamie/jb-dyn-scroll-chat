import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from './app/store';
import App from './App';
import { HashRouter as Router } from 'react-router-dom';

test('renders learn react link', () => {
  render(
    <Router>
      <Provider store={store}>
        <App />
      </Provider>
    </Router>
  );

  expect(screen.getByText(/Select a chat from above/i)).toBeInTheDocument();
});
