import './App.css'
import Canvas from './components/Canvas';
import SideBar from './components/SideBar';
import TopNavbar from './components/TopNavbar';
import { MediaEditorProvider } from './context/MediaEditorProvider';

function App() {

  return (
    <MediaEditorProvider>
      <section className='flex flex-row w-full relative bg-gray-800 h-screen'>
        <SideBar />
        <div className='flex flex-col h-full w-full'>
          <TopNavbar />
          <Canvas />
        </div>
      </section>
    </MediaEditorProvider>

  );
};

export default App;
