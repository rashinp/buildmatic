import React from 'react';
import StatsCards from './StatsCards';
import PlayersTable from './PlayersTable';
import MatchesChart from './MatchesChart';
import TeamsOverview from './TeamsOverview';

interface DashboardProps {
  activeView: string;
}

const Dashboard: React.FC<DashboardProps> = ({ activeView }) => {
  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <div className="dashboard-grid">
            <StatsCards />
            <div className="chart-section">
              <MatchesChart />
            </div>
            <div className="table-section">
              <PlayersTable />
            </div>
            <div className="teams-section">
              <TeamsOverview />
            </div>
          </div>
        );
      case 'players':
        return <PlayersTable expanded />;
      case 'teams':
        return <TeamsOverview expanded />;
      case 'matches':
        return <MatchesChart expanded />;
      case 'analytics':
        return (
          <div className="analytics-view">
            <h2>Analytics Dashboard</h2>
            <MatchesChart />
            <StatsCards />
          </div>
        );
      case 'settings':
        return (
          <div className="settings-view">
            <h2>Settings</h2>
            <p>Configure your sports management settings here.</p>
          </div>
        );
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className="dashboard-content">
      {renderContent()}
    </div>
  );
};

export default Dashboard;