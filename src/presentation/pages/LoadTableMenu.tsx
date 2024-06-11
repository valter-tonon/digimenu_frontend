import Stack from '@mui/material/Stack';
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {LogoTop} from "../components/LogoTop.tsx";
import {GradientCircularProgress} from "../components/GradientCircularProgress.tsx";
import {useNavigate, useParams} from "react-router-dom";
import {useEffect} from "react";
import api from "../../infra/api.ts";
import {CompanyInterface} from "../../domain/types/CompanyInterface.ts";
import {TableInterface} from "../../domain/types/TableInterface.ts";


export default function LoadTableMenu() {
    const navigate = useNavigate()
    const {storeId, tableId} = useParams()

    useEffect(() => {
        api.get(`tables/${tableId}`,{
            params: {
                token_company: storeId
            }
        })
            .then(response => {
                const table: TableInterface = response.data
                localStorage.setItem('table', JSON.stringify(table))
            })
            .catch(error => {
                console.error(error)
            })
        api.get(`tenant/${storeId}`)
            .then(response => {
                const company: CompanyInterface = response.data
                localStorage.setItem('store', JSON.stringify(company))
                navigate(`/`)
            })
            .catch(error => {
                console.error(error)
            })
        navigate(`/`)
    },[storeId])
    return (
        <Box display={"flex"} justifyContent={"center"} alignItems={"center"} height={"100vh"}>
            <Box>
                <Box display={"flex"} mb={10}>
                    <LogoTop/>
                </Box>
                <Stack ml={7} >
                    <GradientCircularProgress />
                </Stack>
                <Typography mt={5} ml={4}>Carregando...</Typography>
            </Box>
        </Box>
    );
}
