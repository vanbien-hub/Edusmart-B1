import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { AdminDashboard } from './pages/admin/Dashboard';
import { Classes } from './pages/admin/Classes';
import { Students } from './pages/admin/Students';
import { Subjects } from './pages/admin/Subjects';
import { Lessons as AdminLessons } from './pages/admin/Lessons';
import { Assignments as AdminAssignments } from './pages/admin/Assignments';
import { Gradebook } from './pages/admin/Gradebook';
import { Announcements } from './pages/admin/Announcements';
import { Reports } from './pages/admin/Reports';
import { QuestionBank } from './pages/admin/QuestionBank';
import { StudentDashboard } from './pages/app/Dashboard';
import { StudentLessons } from './pages/app/Lessons';
import { StudentAssignments } from './pages/app/Assignments';
import { Profile } from './pages/app/Profile';
import { seedData } from './core/providers/mockProvider';

// Initialize mock data
seedData();

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<Layout role="teacher" />}>
          <Route index element={<AdminDashboard />} />
          <Route path="classes" element={<Classes />} />
          <Route path="students" element={<Students />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="lessons" element={<AdminLessons />} />
          <Route path="assignments" element={<AdminAssignments />} />
          <Route path="gradebook" element={<Gradebook />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="reports" element={<Reports />} />
          <Route path="questions" element={<QuestionBank />} />
        </Route>

        {/* App Routes */}
        <Route path="/app" element={<Layout role="student" />}>
          <Route index element={<StudentDashboard />} />
          <Route path="lessons" element={<StudentLessons />} />
          <Route path="assignments" element={<StudentAssignments />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
