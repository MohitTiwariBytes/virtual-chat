import { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Game from "./Game/Game";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route exact path="/" element={<Game></Game>}></Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
