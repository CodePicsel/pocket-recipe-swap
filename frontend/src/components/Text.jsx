import { useEffect, useRef, useState } from "react";

const texts = [
 "Snack time just got tastier",
  "Crunch into happiness",
  "Small bites, big smiles",
  "Because every break deserves a snack",
  "Quick snacks for busy moments",
  "Fuel your day, one snack at a time",
  "Midday cravings, solved",
  "Fresh snacks, fast delivery",
  "Turn breaks into treat time",
  "Perfect bites for every mood",
  "Snack smart, snack happy",
  "When hunger strikes, we deliver",
  "Little munchies, big flavor",
  "Your favorite snacks, on demand",
  "Bite-sized joy, anytime",
  "From crunch to munch in minutes",
  "Good vibes start with good snacks",
  "Satisfy cravings without the wait"
];

export default function Typewriter() {
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [charIndex, setCharIndex] = useState(0);
  const [textIndex, setTextIndex] = useState(0);

  const orderRef = useRef([]);
  const timeoutRef = useRef(null);

  const shuffleOrder = () => {
    const arr = texts.map((_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  useEffect(() => {
    orderRef.current = shuffleOrder();
    setTextIndex(orderRef.current[0]);
  }, []);

  useEffect(() => {
    const currentText = texts[textIndex];

    timeoutRef.current = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentText.length) {
          setDisplayText(currentText.slice(0, charIndex + 1));
          setCharIndex((prev) => prev + 1);
        } else {
          // ⏸ Pause after typing
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (charIndex > 0) {
          setDisplayText(currentText.slice(0, charIndex - 1));
          setCharIndex((prev) => prev - 1);
        } else {
          setIsDeleting(false);

          orderRef.current.shift();
          if (orderRef.current.length === 0) {
            orderRef.current = shuffleOrder();
          }

          setTextIndex(orderRef.current[0]);
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timeoutRef.current);
  }, [charIndex, isDeleting, textIndex]);

  return (
    // <div className="text-3xl font-extrabold capitalize text-white bg-blue-600    rounded-2xl flex  p-4">
    <div className="text-3xl font-[Unbounded] font-extrabold capitalize text-blue-600  rounded-2xl flex  p-4">
      <span>{displayText}</span>
      <span className="ml-1 animate-fast-blink">|</span>
    </div>
  );
}
