import { useState } from 'react'
import Card from './components/Card'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Card rating={4} title={'samosa'}  />
    </>
  )
}

export default App
