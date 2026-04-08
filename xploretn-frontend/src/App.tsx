import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ExploreActivities from './pages/ExploreActivities';
import ExperienceDetails from './pages/ExperienceDetails';
import BookingPage from './pages/BookingPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="explore" element={<ExploreActivities />} />
          <Route path="experience/:id" element={<ExperienceDetails />} />
          <Route path="booking/:id" element={<BookingPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
