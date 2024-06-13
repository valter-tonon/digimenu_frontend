import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import {Products} from "./Products.tsx";
import api from "../../infra/api.ts";

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

export type Category = {
    id: string;
    name: string;
    url: string;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`vertical-tabpanel-${index}`}
            aria-labelledby={`vertical-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    <Typography>{children}</Typography>
                </Box>
            )}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `vertical-tab-${index}`,
        'aria-controls': `vertical-tabpanel-${index}`,
    };
}

export default function CategoriesTab() {
    const [categories, setCategories] = React.useState([] as Category[]);
    const store = localStorage.getItem('store')
    const storeId = store ? JSON.parse(store).uuid : null
    React.useEffect(() => {
        api.get('/categories', {
            params: {
                token_company: storeId
            }
        })
            .then(response => {
                setCategories(response.data.data);
            })
            .catch(error => {
                console.error(error);
            });

    }, [storeId]);

    const [value, setValue] = React.useState(0);

    const handleChange = (_: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <Box
            sx={{ flexGrow: 1, bgcolor: 'background.paper', display: 'flex', height: '100' }}
            px={15}
        >
            <Tabs
                orientation="vertical"
                variant="scrollable"
                value={value}
                onChange={handleChange}
                aria-label="Vertical tabs example"
                sx={{ borderRight: 1, borderColor: 'divider' }}
            >
                <Tab label="Todos" {...a11yProps(0)} />
                {categories.map((category, index) => (
                    <Tab label={category.name} {...a11yProps(index + 1)} key={category.id}/>
                ))}
            </Tabs>

            {categories.map((category, index) => (
                <TabPanel value={value} index={index + 1} key={category.id}>
                    <Products category={category}/>
                </TabPanel>
            ))}
            <TabPanel index={0} value={value}>
                <Products category={null}/>
            </TabPanel>
        </Box>
    );
}
