import {Login} from "../presentation/pages/Login.tsx";
import {Route, Routes, BrowserRouter} from 'react-router-dom';
import SignUp from "../presentation/pages/SignUp.tsx";
import {Menu} from "../presentation/pages/Menu.tsx";
import LoadTableMenu from "../presentation/pages/LoadTableMenu.tsx";

const ReactRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Menu/>}/>
                <Route path={'/:storeId/:tableId'} element={<LoadTableMenu/>}/>
                <Route path='/login' element={<Login/>}/>
                <Route path='/signup' element={<SignUp/>}/>
            </Routes>
        </BrowserRouter>
    );
}
export default ReactRoutes;
