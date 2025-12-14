import React from 'react'

function Card({title, rating, description, featured_image, items=["item1", "item2", "item3"]}) {


  return (
    <div className='flex flex-col  h-[13rem] w-[10rem] relative'>
            <img className='h-full w-full object-cover rounded-md z-0 opacity-75' src={"https://static.spotapps.co/website_images/ab_websites/174603_website_v1/menu.jpg"}/>
            {/* <div className='absolute h-full w-full border-2 inset-0 from-white via-transparent to-transparent ' ></div> */}
        <div className='card-front justify-center text-center align-middle border-2 absolute top-[55%] left-[10%]'>
            <div className='absolute'>
                <h1 className='text-[2vw]'>{title}</h1>

                {/* RATING DISPLAY */}
                <div>
                   {
                    [...Array(5)].map((_, index) => {
                        return (
                            <span
                                className={index+1 <= rating ? 'text-amber-300': null}
                            >&#9733;</span>
                        )
                    })
                   }
                </div>
                <div>
                    <ul className='flex gap-2 justify-around line-clamp-2 text-[1vw] flex-nowrap'>
                        <li>{items[0]}</li>
                        <li>{items[1]}</li>
                        <li>{items[2]}</li>
                    </ul>
                </div>
            </div>
        </div>
        <div className='card-back'>

        </div>
    </div>
  )
}

export default Card