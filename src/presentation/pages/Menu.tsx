import Box from "@mui/material/Box";
import Navigation from "../componets/Navigation.tsx";
import CategoriesTab from "../componets/CategoriesTab.tsx";

export const Menu = () => {
    return (
        <Box>
            <Navigation/>
            <CategoriesTab/>
        </Box>
    );
};
