import Avatar from "@mui/material/Avatar";
import Logo from "../../assets/images/DIGI-MENU.png";
import Typography from "@mui/material/Typography";

export const LogoTop = () => {
    return (
        <>
            <Avatar alt={"logo"} src={Logo} variant={"square"}/>
            <Typography component="h1" variant="h5">
                DigiMenu
            </Typography>
        </>
    );
};
