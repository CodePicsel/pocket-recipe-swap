import { Outlet } from 'react-router-dom'
import Card from './components/Card'
import Typewriter from './components/Text'
import Navbar from './components/Navbar'



function App() {

  return (
    <>
      <Navbar />
      <div className=' flex justify-center m-4'>
        <Typewriter />
      </div>
      <Outlet />
    <div className='grid grid-cols-4 place-self-center gap-x-10  gap-y-10'>
      <Card rating={2} title={'tour'}  />
      <Card rating={2} title={'tour'}  />
      <Card rating={2} title={'tour'}  />
      <Card rating={2} title={'tour'}  />
      <Card rating={2} title={'tour'}  />
      <Card rating={2} title={'tour'}  />
      <Card rating={2} title={'tour'}  />
      <Card rating={2} title={'tour'}  />
      <Card rating={2} title={'tour'}  />
      <Card rating={2} title={'tour'}  />
      <Card rating={2} title={'tour'}  />
      <Card rating={2} title={'tour'}  />
      <Card rating={2} title={'tour'}  />
      <Card rating={2} title={'tour'}  />
      <Card rating={2} title={'tour'}  />
      <Card rating={2} title={'tour'}  />
      <Card rating={2} title={'tour'}  />
      <Card rating={2} title={'tour'}  />
      <Card rating={2} title={'tour'}  />
      <Card rating={2} title={'tour'}  />
    </div>
    </>
  )
}

export default App
