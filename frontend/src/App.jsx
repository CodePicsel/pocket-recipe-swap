import { useState } from 'react'
import Card from './components/Card'

function App() {
  const [count, setCount] = useState(0)

  return (
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
  )
}

export default App
