import React, { useEffect } from 'react'
import { useState } from 'react'
import Card from '../components/Card'
import {PacmanLoader} from 'react-spinners'
import '../index.css'

function SurpriseMe() {
    const [ActiveCard, setActiveCard] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
    const timer = setTimeout(() => {
    setLoading(false);
  }, 2000);

  return () => clearTimeout(timer); // cleanup
}, []);


  return (
    <div className='flex flex-col justify-evenly max-h-screen'>
    <header className='text-center text-3xl font-bold font-[Unbounded] pt-[3rem] pb-[3rem] capitalize text-blue-600 relative'>
      <h1>You may like it !</h1>
    </header>
    <div className='animate-none animate-[appear-top_500ms_ease-in-out]'>
      {
        loading ? ( 
          <div className='flex justify-center'>
          <PacmanLoader
            color="#046aff"
            cssOverride={{}}
            />
          </div>
        ) 
        :
        (
          <section className='max-h=[1vh] grid grid-cols-4 gap-x-10'> 
            {
              [...Array(4)].map((_,index) => {
                return (
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
          </section>
        )
      }
    </div>
    </div>
  )
}

export default SurpriseMe