import Box from "@mui/material/Box";
import Navigation from "../components/Navigation.tsx";
import CategoriesTab from "../components/CategoriesTab.tsx";

export const Menu = () => {
    return (
        <Box>
            <Navigation/>
            <CategoriesTab/>
        </Box>
    );
};
