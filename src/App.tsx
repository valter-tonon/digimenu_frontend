import {BrowserRouter, Route, Routes} from "react-router-dom";
import {Login} from "./presentation/pages/Login.tsx";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Login/>} exact/>
            </Routes>
        </BrowserRouter>
    )
}
export default App
