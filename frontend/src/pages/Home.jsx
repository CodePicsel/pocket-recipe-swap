import React, { useState, useEffect } from 'react'
import Card from '../components/Card'
import Typewriter from '../components/Text'

function Home() {
  const [ActiveCard, setActiveCard] = useState(null)


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
                <Card 
                  title='tour' rating={5}
                  isFlipped={ActiveCard === index}
                  onFlip={() =>
                  setActiveCard(ActiveCard === index ? null : index)}
                />
                </div>
                )
              })
            }
        </div>
    </div>
  )
}

export default Home 