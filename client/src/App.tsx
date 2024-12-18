import { HomePage } from "./pages/home";
import { Login } from "./pages/login";
import Register from "./pages/register";
import { Route,Routes,BrowserRouter } from "react-router-dom";

function App() {
  return <BrowserRouter>
        <Routes>
            <Route path="/" element={<HomePage/>}/>
            <Route path="/register" element={<Register/>}/>
            <Route path="/login" element={<Login/>}/>
        </Routes>
    </BrowserRouter>
}
export default App;