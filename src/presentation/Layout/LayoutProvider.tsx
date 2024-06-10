import * as React from 'react';
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";

export const LayoutProvider = ({children}: {children: React.ReactNode}) => {
    return (
        <Box
            sx={{
                color: "black",
                height: "100vh"
            }}
        >
            {children}
        </Box>
    );
};
