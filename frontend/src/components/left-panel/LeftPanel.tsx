import TaskInputSection from './TaskInputSection';
import RouterStatusSection from './RouterStatusSection';
import CustomRoleSection from './CustomRoleSection';

export default function LeftPanel() {
  return (
    <>
      <TaskInputSection />
      <RouterStatusSection />
      <CustomRoleSection />
    </>
  );
}
