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
            **Pantry Items (Optional, but highly recommended):**
*   1 teaspoon olive oil or butter
*   Salt, to taste
*   Freshly ground black pepper, to taste

---

### Equipment

*   Cutting board
*   Sharp knife
*   Small bowl
*   Fork or whisk
*   8-inch non-stick frying pan or skillet
*   Spatula
t texture in your finished dish.

t texture in your finished dish.

**2. Heat the Pan (1-2 minutes)**
    *   Place your non-stick frying pan over medium heat. Add the olive oil or butter and swirl to coat the bottom of the pan.
    *   *Cooking Tip:* Allow the pan to heat sufficiently before adding ingredients. A good test is to flick a tiny drop of water into the pan; if it sizzles and evaporates immediately, it's ready.

**3. Sauté the Tomato (2-3 minutes)**
    *   Add the diced tomato to the hot pan. Sauté gently, stirring occasionally, until the tomato softens slightly and releases some of its juices. You want them tender, not mushy.
    *   *Cooking Tip:* Avoid overcrowding the pan with tomatoes, as this can steam them instead of allowing them to sear slightly and concentrate their flavor.        

**4. Introduce the Egg (3-5 minutes)**
    *   Pour the whisked eggs directly over the softened tomatoes in the pan. Gently spread the eggs to cover the tomatoes evenly. Allow the edges to set for about 30 seconds.
    *   *Cooking Tip:* For a soft scramble, gently push the cooked egg from the edges towards the center with your spatula, tilting the pan to allow uncooked egg to flow underneath. For a more omelet-like texture, disturb the eggs less.

**5. Melt the Cheese (1-2 minutes)**
    *   Once the eggs are mostly set but still slightly moist on top, sprinkle the shredded cheese evenly over the surface.
    *   Cover the pan with a lid (if you have one) or a plate for 1-2 minutes. The trapped steam will help the cheese melt perfectly and finish
          </p>
        </div>
      </div>
    </div>
  );
}

export default Card;
