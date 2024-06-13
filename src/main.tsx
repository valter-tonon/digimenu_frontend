import ReactDOM from 'react-dom/client'
import './index.css'
import ReactRoutes from "./presentation/routes";
import {ThemeProvider} from "@mui/material/styles";
import {appTheme} from "./presentation/Layout/theme.ts";
import {LayoutProvider} from "./presentation/Layout/LayoutProvider.tsx";
import {AppContextProvider} from "./presentation/components/AppContextProvider.tsx";

ReactDOM.createRoot(document.getElementById('root')!).render(
    <AppContextProvider>
        <ThemeProvider theme={appTheme}>
            <LayoutProvider>
                <ReactRoutes />
            </LayoutProvider>
        </ThemeProvider>
    </AppContextProvider>,
)
