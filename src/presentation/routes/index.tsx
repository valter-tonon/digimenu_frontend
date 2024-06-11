import {Login} from "../pages/Login.tsx";
import {Route, Routes, BrowserRouter} from 'react-router-dom';
import SignUp from "../pages/SignUp.tsx";
import {Menu} from "../pages/Menu.tsx";
import LoadTableMenu from "../pages/LoadTableMenu.tsx";
import NotFoundPage from "../pages/NotFoundPage.tsx";

const ReactRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Menu/>}/>
                <Route path={'/:storeId/:tableId'} element={<LoadTableMenu/>}/>
                <Route path='/login' element={<Login/>}/>
                <Route path='/signup' element={<SignUp/>}/>
                <Route path={"*"} element={<NotFoundPage/>}/>
            </Routes>
        </BrowserRouter>
    );
}
export default ReactRoutes;
