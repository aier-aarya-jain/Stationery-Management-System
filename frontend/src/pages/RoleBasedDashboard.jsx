/**
 * RoleBasedDashboard.jsx — Renders AdminDashboard or StudentDashboard based on JWT role.
 */
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import StudentDashboard from './StudentDashboard';

export default function RoleBasedDashboard() {
  const { user } = useContext(AuthContext);
  return user?.role === 'ROLE_ADMIN' ? <AdminDashboard /> : <StudentDashboard />;
}
