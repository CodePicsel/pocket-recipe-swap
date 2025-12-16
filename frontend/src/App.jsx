import { Outlet } from 'react-router-dom'
import Card from './components/Card'
import Typewriter from './components/Text'
import Navbar from './components/Navbar'



function App() {

  return (
    <div className='w-full min-h-screen'>
      <Navbar />
      <div className='flex justify-center m-5'>
        <Outlet />
      </div>
    </div>
  )
}

export default App
