// src/App.jsx
import { BrowserRouter as Router } from 'react-router-dom';
import Layout from './Components/Layout/Layout';
import AppRouter from './Routes/Router';

export default function App() {
  return (
    <Router>
      <Layout>
        <AppRouter />
      </Layout>
    </Router>
  );
}
