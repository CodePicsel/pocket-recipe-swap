import React, { useRef, useState } from "react";
import {ID} from 'appwrite'

function Card({
  id = ID.unique(),
  title,
  rating,
  description,
  featured_image,
  items = ["item1", "item2", "item 3"],
  isFlipped = false,
  onFlip
}) {

  const scrollRef = useRef(null);

  return (
    <div>
      {/* 🔥 CLICK ONLY HERE */}
      <div
        onClick={onFlip}
        className={`card group flex flex-col h-[25rem] w-[20rem] bg-black relative rounded-3xl
            cursor-pointer
          transform-3d border-2 perspective-[1000px]
          transition-transform 
           ${isFlipped ? "rotate-y-180" : "rotate-y-0"}`}

      >
        {/* FRONT */}
        <img
          className="h-full w-full object-cover rounded-3xl z-0 opacity-[85%]"
          src={
            featured_image ||
            "https://static.spotapps.co/website_images/ab_websites/174603_website_v1/menu.jpg"
          }
        />

        <div className="card-front absolute top-[15rem] w-full h-[10rem] bg-[#C2410C] rounded-md border-t-1 rounded-b-3xl backface-hidden p-1">
          <div className="ml-2 text-3xl">
            {[...Array(5)].map((_, index) => (
              <span
                key={index}
                className={index + 1 <= rating ? "text-amber-300" : ""}
              >
                ★
              </span>
            ))}
          </div>
            <div>
                <h1 className="text-[2rem] ml-3 font-extrabold line-clamp-3">
                    {title.toUpperCase()}
                </h1>
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

        {/* BACK */}
        <div className="card-back inset-0 absolute bg-[#C2410C] h-full w-full rounded-3xl p-2 backface-hidden "
            onClick={onFlip}
        >
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
          <p className="font-bold ml-2 text-3xl">Recipe :</p>

          {/* ✅ SCROLL AREA */}
          <p
            ref={scrollRef}
            tabIndex={0}
            onMouseEnter={() => scrollRef.current?.focus()} // 🔥 focus on hover
            onClick={(e) => (e.stopPropagation()
                )}            // 🔥 prevent flip
            onWheel={(e) => e.stopPropagation()}            // 🔥 prevent page scroll
            className={`
              max-h-[18rem]
              overflow-y-auto
              text-[1rem]
              p-2
              focus:outline-none
              overscroll-y-contain

              [&::-webkit-scrollbar]:w-1
              [&::-webkit-scrollbar-thumb]:rounded-md
              [&::-webkit-scrollbar-track]:rounded-md
              dark:[&::-webkit-scrollbar-track]:bg-amber-800
              dark:[&::-webkit-scrollbar-thumb]:bg-white

              cursor-pointer
            `}
          >
            {description}
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, delectus? Veritatis id enim temporibus fuga debitis aperiam quo quos atque, facere consequuntur ab non veniam est provident impedit architecto nulla.
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ipsa beatae sapiente reprehenderit explicabo. Quos iure soluta nulla magnam adipisci beatae incidunt cupiditate, illo in corrupti, earum sit modi ipsam fuga!
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Itaque esse porro quidem inventore! Veniam, ipsum vitae! Perspiciatis magnam placeat, quas facere sed voluptate iusto, dolores ratione laborum ipsum reprehenderit distinctio maiores vel consectetur et at voluptates corporis. Sequi expedita nulla quas sit quos eos numquam qui, ratione explicabo quam aperiam.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Card;
