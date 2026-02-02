import { PlDirectoryPage } from '../components/PlDirectoryPage';
import { useTestSetupContext } from '../context/useTestSetupContext';

export function PlDirectoryView() {
  const { plDirectory, addPlContact, removePlContact, dbReady } = useTestSetupContext();
  return (
    <div className="flex-1 min-h-0 pb-2">
      <PlDirectoryPage
        data={plDirectory}
        onAdd={addPlContact}
        onDelete={removePlContact}
        dbReady={dbReady}
      />
    </div>
  );
}
