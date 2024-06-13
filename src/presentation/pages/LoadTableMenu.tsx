import Stack from '@mui/material/Stack';
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {LogoTop} from "../components/LogoTop.tsx";
import {GradientCircularProgress} from "../components/GradientCircularProgress.tsx";
import {useNavigate, useParams} from "react-router-dom";
import {useContext, useEffect} from "react";
import api from "../../infra/api.ts";
import {CompanyInterface} from "../../domain/types/CompanyInterface.ts";
import {TableInterface} from "../../domain/types/TableInterface.ts";
import {StoreContext} from "../components/AppContextProvider.tsx";


export default function LoadTableMenu() {
    const navigate = useNavigate()
    const {storeId, tableId} = useParams()
    const context = useContext(StoreContext)


    if (!context) {
        throw new Error('StoreContext must be used within a StoreProvider');
    }
    const { store, table, setStore, setTable } = context;

    useEffect(() => {
        const asyncFunction = async () => {
            try {
                const storeData = store
                const tableData = table
                if (!storeData) {
                    await api.get(`tenant/${storeId}`)
                        .then(response => {
                            const company: CompanyInterface = response.data.data
                            setStore(company)
                        })
                        .catch(error => {
                            console.error(error)
                        })
                }
                if (!tableData || tableData.id !== tableId) {
                    await api.get(`tables/${tableId}`, {
                        params: {
                            token_company: storeId
                        }
                    })
                        .then(response => {
                            const table: TableInterface = response.data.data
                            setTable(table)
                        })
                        .catch(error => {
                            console.error(error)
                        })
                }
            } catch (error) {
                console.error(error)
            }
        }
        setTimeout(() => {
            asyncFunction().then(() => navigate('/'))
        },1000)
    },[store, table])
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
