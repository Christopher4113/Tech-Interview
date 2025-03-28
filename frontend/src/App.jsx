import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Start from './pages/Start';
function App() {
  

  return (
   <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/start" />} />
        <Route path="/start" element={<Start />} />
      </Routes>
   </BrowserRouter>
  )
}

export default App
