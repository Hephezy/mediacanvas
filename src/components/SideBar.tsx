import MediaControls from './SideBar/MediaControls';
import MediaList from './SideBar/MediaList';
import UploadArea from './SideBar/UploadArea';

const SideBar = () => {
  return (
    <div className='left-0 top-0 flex h-full flex-col items-center p-4 w-[366px] border-r border-gray-700 overflow-auto'>
      <div className='flex flex-col items-center justify-center'>
        <UploadArea />
        <MediaList />
        <MediaControls />
      </div>
    </div>
  );
};

export default SideBar;