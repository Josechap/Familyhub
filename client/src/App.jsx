import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Tasks from './pages/Tasks';
import Recipes from './pages/Recipes';
import MealPlanning from './pages/MealPlanning';
import Settings from './pages/Settings';

function App() {
  return (
    <ErrorBoundary>
      <Layout>
        <Routes>
          <Route path="/" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
          <Route path="/calendar" element={<ErrorBoundary><Calendar /></ErrorBoundary>} />
          <Route path="/tasks" element={<ErrorBoundary><Tasks /></ErrorBoundary>} />
          <Route path="/recipes" element={<ErrorBoundary><Recipes /></ErrorBoundary>} />
          <Route path="/meals" element={<ErrorBoundary><MealPlanning /></ErrorBoundary>} />
          <Route path="/settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  );
}

export default App;
