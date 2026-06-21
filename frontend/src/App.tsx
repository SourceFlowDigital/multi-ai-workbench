import { useEffect, useState } from 'react';
import { useWorkbenchStore } from './store/workbenchStore';
import TopBar from './components/layout/TopBar';
import MainLayout from './components/layout/MainLayout';
import LeftPanel from './components/left-panel/LeftPanel';
import Canvas from './components/canvas/Canvas';
import ResultPanel from './components/result-panel/ResultPanel';
import TaskHistoryPanel from './components/history/TaskHistoryPanel';
import GuideOverlay from './components/guide/GuideOverlay';
import Toast from './components/ui/Toast';

function App() {
  const fetchModels = useWorkbenchStore((s) => s.fetchModels);
  const fetchRoles = useWorkbenchStore((s) => s.fetchRoles);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    fetchModels();
    fetchRoles();

    const seen = localStorage.getItem('workbench-guide-seen');
    if (!seen) {
      useWorkbenchStore.setState({ guideOpen: true });
    } else {
      useWorkbenchStore.setState({ guideSeen: true });
    }
  }, [fetchModels, fetchRoles]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar onHistoryClick={() => setHistoryOpen(true)} />
      <MainLayout
        left={<LeftPanel />}
        canvas={<Canvas />}
      />
      <ResultPanel />
      <TaskHistoryPanel open={historyOpen} onClose={() => setHistoryOpen(false)} />
      <GuideOverlay />
      <Toast />
    </div>
  );
}

export default App;
