import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";

type Props = {
    sx: { mt: number; };
}
export const Copyright = (props: Props) => {
    return (
        <Typography variant="body2" color="text.secondary" align="center" {...props}>
            {'Copyright © '}
            <Link color="inherit" href="https://digimenu.net.br">
                DigiMenu
            </Link>{' '}
            {new Date().getFullYear()}
            {'.'}
        </Typography>
    );
};
