import { useAuth } from '../hooks/useAuth';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <header>
        <h1>Dashboard</h1>
        <button onClick={logout}>Logout</button>
      </header>
      <main>
        <p>Welcome, {user?.name}</p>
      </main>
    </div>
  );
}
