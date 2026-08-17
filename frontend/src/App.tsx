import React from 'react';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { MainLayout } from './components/layout/MainLayout';
import { CreateProjectModal } from './components/project/CreateProjectModal';

// Views
import { DashboardView } from './views/training/DashboardView';
import { DatasetView } from './views/training/DatasetView';
import { AnnotationView } from './views/training/AnnotationView';
import { ModelTrainView } from './views/training/ModelTrainView';
import { MonitorView } from './views/training/MonitorView';
import { ExportView } from './views/training/ExportView';
import { InferenceStationView } from './views/inference/InferenceStationView';
import { ApiServerView } from './views/inference/ApiServerView';
import { SettingsView } from './views/settings/SettingsView';

const ContentRouter: React.FC = () => {
  const { currentView } = useProject();

  switch (currentView) {
    case 'dashboard':
      return <DashboardView />;
    case 'dataset':
      return <DatasetView />;
    case 'annotator':
      return <AnnotationView />;
    case 'train':
      return <ModelTrainView />;
    case 'monitor':
      return <MonitorView />;
    case 'export':
      return <ExportView />;
    case 'inference_station':
      return <InferenceStationView />;
    case 'api_server':
      return <ApiServerView />;
    case 'settings':
      return <SettingsView />;
    default:
      return <DashboardView />;
  }
};

export const App: React.FC = () => {
  return (
    <ProjectProvider>
      <MainLayout>
        <ContentRouter />
      </MainLayout>
      <CreateProjectModal />
    </ProjectProvider>
  );
};

export default App;
