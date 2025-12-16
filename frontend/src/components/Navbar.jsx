import { NavLink } from "react-router-dom";

export default function Navbar() {
  const linkClass = ({ isActive }) =>
    `transition-colors duration-200 ${
      isActive ? "text-white" : "text-gray-400 hover:text-blue-600"
    }`;

  return (
    <nav className="w-full h-[6rem] px-8 flex items-center justify-between rounded-b-md 
    bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700">
      
      {/* LEFT - LOGO */}
      <NavLink to='/' className="text-2xl font-bold tracking-wider text-white">
        POCKET RECIPES
      </NavLink>

      {/* RIGHT - NAV LINKS */}
      <div className="flex items-center gap-8 text-lg font-[poppins-light]">

        <NavLink to="/" className={linkClass}>
          Home
        </NavLink>

        <NavLink to="/surprise-me" className={linkClass}>
          Surprise
        </NavLink>

        <NavLink to="/search" className={linkClass}>
          Search
        </NavLink>

        <NavLink to="/Ai-Chat" className={linkClass}>
          AI
        </NavLink>

        {/* 
          HEXAGON PLACEHOLDER
          Drop your hexagon component/div here later 
        */}
        {/* <HexagonIcon /> */}

      </div>
    </nav>
  );
}
