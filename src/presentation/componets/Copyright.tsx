import * as React from 'react';
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";

export const Copyright = (props) => {
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
