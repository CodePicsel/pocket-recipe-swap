import React from "react";
import ReactDOM from "react-dom/client";
import {createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import "./index.css";
 
// Pages
import AiChat from "./pages/Ai";
import Search from "./pages/Search";
import SurpriseMe from "./pages/SurpriseMe";
import Home from "./pages/Home";

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <Home />
      },
      {
        path: '/surprise-me',
        element: <SurpriseMe />
      },
      {
        path: '/Ai-Chat',
        element: <AiChat />
      },
      {
        path: '/search',
        element: <Search />
      }
      
    ]
}])

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router}/>
  </React.StrictMode>
);
