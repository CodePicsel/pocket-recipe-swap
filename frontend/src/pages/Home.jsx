import React from 'react'
import Card from '../components/Card'
import Typewriter from '../components/Text'

function Home() {
  return (
    <div>
        <div className=' flex justify-center m-4'>
          <Typewriter />
        </div>
        <div className='grid grid-cols-4 place-self-center gap-x-10  gap-y-10 '>
            {
              [...Array(30)].map((_, index) => {
                return(
                <div key={index}> 
                <Card title='tour' rating={5}/>
                </div>
                )
              })
            }
        </div>
    </div>
  )
}

export default Home 