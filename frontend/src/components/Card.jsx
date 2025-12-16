import React, {useState} from 'react'

function Card({title, rating, description, featured_image, items=['item1', 'item2', 'item 3']}) {

    const [hover, setHover] = useState(false)


  return (
    <div>
    <div className={`card group flex flex-col  h-[25rem] w-[20rem] bg-black relative rounded-3xl transform-3d border-2 perspective:1000px ${hover ? 'rotate-y-180' : 'rotate-y-0'} `} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} >
            {/* <div className='absolute h-full w-full border-2 inset-0 from-white via-transparent to-transparent ' ></div> */}
            <img className='h-full w-full object-cover rounded-3xl z-0 opacity-[85%]' src={"https://static.spotapps.co/website_images/ab_websites/174603_website_v1/menu.jpg"}/>
        <div className={`card-front justify-center text-left align-middle border-t-2 absolute top-[15rem] p-1 w-full h-[10rem] rounded-b-3xl rounded-t-2xl rounded-t bg-[#C2410C] backface-hidden `}>
            <div>

                {/* RATING DISPLAY */}
                <div className='ml-2 text-3xl'>
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
                    <h1 is='' className='text-[2rem]  ml-3 font-extrabold line-clamp-3 overflow-hidden text-ellipsis whitespace-nowrap  '>{title.toUpperCase()}</h1>
                <div>
                    <ul className='flex gap-1 ml-0.5 justify-around text-orange-100 line-clamp-2 text-[sm] relative capitalize '>
                        <li>{items[0]}</li>
                        <li>|</li>
                        <li>{items[1]}</li>
                        <li>|</li>
                        <li>{items[2]}</li>
                    </ul>
                </div>
            </div>
        </div>
        <div className={`card-back absolute bg-[#C2410C] h-full w-full rounded-3xl p-1 backface-hidden ${hover ? 'rotate-y-180' : 'rotate-y-0'}`}>
            <div className='ml-2 text-[1.2rem] font-bold'>
                Ingredients :
                <ul className='flex gap-1 text-left  line-clamp-2 text-[1rem] relative capitalize'>
                        <li>{items[0]}</li>
                        <li>|</li>
                        <li>{items[1]}</li>
                        <li>|</li>
                        <li>{items[2]}</li>
                    </ul>
            </div>
            {/* <div>______________________________________________</div> */}
            <div className='ml-2 text-3xl mt-2'>
                <p className='font-bold mb-1'>Recipe :</p>
                <p className='max-h-[18rem] text-[1rem] p-2 m-0.5 overflow-y-scroll 
                    [&::-webkit-scrollbar]:w-1
                    [&::-webkit-scrollbar-track]:rounded-md
                    [&::-webkit-scrollbar-thumb]:rounded-md
                    dark:[&::-webkit-scrollbar-track]:bg-amber-800
                    dark:[&::-webkit-scrollbar-thumb]:bg-white
                    '>
                    {description}
                    Lorem 
                    ipsum dolor sit amet consectetur
                     adipisicing elit. Molestiae maxime, necessitatibus eaque molestias illo blanditiis temporibus fuga minima, alias inventore cupiditate nisi ducimus consectetur! Porro velit saepe laboriosam veniam molestiae?
                     Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequuntur illo voluptate, suscipit neque nesciunt debitis reprehenderit, quis velit molestiae optio enim sed ut repudiandae voluptas cumque sint aperiam eos earum?
                     Lorem ipsum dolor sit amet consectetur, adipisicing elit. A expedita maxime similique laboriosam cupiditate aliquid inventore quis, deleniti odit voluptas debitis minima magnam amet! Corrupti modi consectetur itaque consequuntur. Magni!
                </p>
            </div>
        </div>
    </div>
</div>
  )
}

export default Card