import ReactDOM from 'react-dom/client'
import './index.css'
import ReactRoutes from "./presentation/routes";
import {ThemeProvider} from "@mui/material/styles";
import {appTheme} from "./presentation/Layout/theme.ts";
import {LayoutProvider} from "./presentation/Layout/LayoutProvider.tsx";

ReactDOM.createRoot(document.getElementById('root')!).render(
    <>
        <ThemeProvider theme={appTheme}>
            <LayoutProvider>
                <ReactRoutes />
            </LayoutProvider>
        </ThemeProvider>
    </>,
)
