import {createTheme} from "@mui/material/styles";

export const appTheme = createTheme({
    palette: {
            mode: "light",
        text: {
            primary: '#333',
            secondary: '#666',
        },
        primary: {
            main: '#EB7707',

        },
        secondary: {
            main: '#3f51b5',
        },

    },
    typography: {
        fontFamily: 'Roboto, sans-serif',
    },
    components: {
        MuiButton: {
            defaultProps: {
                variant: 'contained',
                color: 'primary',
            },
        },
        MuiTextField: {
            defaultProps: {
                variant: 'outlined',
            },
        },
        MuiCssBaseline: {
            styleOverrides: `
                body {
                    background-color: #f5f5f5;
                }
            `,
        },
    },
})
