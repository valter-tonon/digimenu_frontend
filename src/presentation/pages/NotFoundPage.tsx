import { Box, Typography, Container, Grid, Button,  CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';

const StyledContainer = styled(Container)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: theme.palette.background.default,
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    fontSize: '3rem',
    color: theme.palette.primary.main,
}));

const StyledBox = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing(4),
}));

const StyledGrid = styled(Grid)(() => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
}));

const variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

const FoodAnimation = () => {
    return (
        <StyledBox>
            <motion.div variants={variants} initial="hidden" animate="visible" whileHover={{ scale: 1.1 }}>
                <CircularProgress size={100} sx={{ color: '#FF9800' }} />
            </motion.div>
            <Typography variant="h4" gutterBottom component="div" sx={{ color: '#FF9800' }}>
                Oops! Parece que você se perdeu.
            </Typography>
            <Typography variant="body1" gutterBottom component="div" sx={{ color: '#FF9800' }}>
                A página que você está procurando não existe ou foi movida.
            </Typography>
            <Button variant="contained" sx={{marginTop: 2, backgroundColor: '#FF9800', color: 'white'}} href="/">
                Voltar para o início
            </Button>
        </StyledBox>
    );
};

const NotFoundPage = () => {
    return (
        <StyledContainer>
            <StyledTypography variant="h2" gutterBottom>
                404
            </StyledTypography>
            <Typography variant="h4" gutterBottom component="div" sx={{ color: '#FF9800' }}>
                Página não encontrada
            </Typography>
            <StyledGrid container spacing={3} sx={{ mt: 3 }}>
                <FoodAnimation />
            </StyledGrid>
        </StyledContainer>
    );
};

export default NotFoundPage;
