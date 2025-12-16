import { useEffect, useRef, useState } from "react";
import { quotes } from "./Quotes";

const texts = quotes

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
