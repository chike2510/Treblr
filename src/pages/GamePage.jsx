import React, { useEffect } from 'react';
import useStore from '../store/gameStore';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import Dashboard from '../components/panels/Dashboard';
import ActionsPanel from '../components/panels/ActionsPanel';
import StudioPanel from '../components/panels/StudioPanel';
import ChartsPanel from '../components/panels/ChartsPanel';
import SocialPanel from '../components/panels/SocialPanel';
import EventsPanel from '../components/panels/EventsPanel';
import LeaderboardPanel from '../components/panels/LeaderboardPanel';

const PANELS = { dashboard: Dashboard, actions: ActionsPanel, studio: StudioPanel, charts: ChartsPanel, social: SocialPanel, events: EventsPanel, leaderboard: LeaderboardPanel };

export default function GamePage() {
  const { panel, loadState, loadChart, loadLeaderboard } = useStore();

  useEffect(() => {
    loadState();
    loadChart();
    loadLeaderboard();
  }, []);

  const Panel = PANELS[panel] || Dashboard;

  return (
    <div className="min-h-screen bg-t-bg flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto p-5">
          <div className="slide-up max-w-5xl mx-auto">
            <Panel />
          </div>
        </main>
      </div>
    </div>
  );
}
