import Stack from '@mui/material/Stack';
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {LogoTop} from "../components/LogoTop.tsx";
import {GradientCircularProgress} from "../components/GradientCircularProgress.tsx";
import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import api from "../../services/api.ts";
import { useNavigate } from 'react-router-dom';

export default function LoadTableMenu() {
    const navigate = useNavigate()
    const {storeId, tableId} = useParams()
    const [_, setStore] = useState({})

    useEffect(() => {
        api.get(`tables/${tableId}`,{
            params: {
                token_company: storeId
            }

        })
            .then(response => {
                sessionStorage.setItem('table', JSON.stringify(response.data))
            })
            .catch(error => {
                console.error(error)
            })
        api.get(`tenant/${storeId}`)
            .then(response => {
                setStore(response.data)
                sessionStorage.setItem('store', JSON.stringify(response.data))
                navigate(`/`)
            })
            .catch(error => {
                console.error(error)
            })

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
