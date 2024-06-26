import React, {useContext, useEffect} from 'react';
import {Button, Card, CardActions, CardContent, CardMedia, Container, Grid, Grow, Typography} from '@mui/material';
import api from "../../infra/api.ts";
import {Category} from "./CategoriesTab.tsx";
import {StoreContext} from "./AppContextProvider.tsx";

export type Product = {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: Category;
}

export const Products = ({category = null}: {category:Category|null}) => {
    const [products, setProducts] = React.useState([] as Product[]);
    const context = useContext(StoreContext)
    const storeContext = context?.store
    const storeId = storeContext?.uuid

    useEffect(() => {
        api.get('/products', {
            params: {
                token_company: storeId,
                categories: [category?.url]
            }
        })
            .then(response => {
                setProducts(response.data.data);
            })
            .catch(error => {
                console.error(error);
            });
    },[storeId])

    const calculateWidth = (size: string) => {
        const productsQuantity = products.length
        if (productsQuantity >= 3) {
            return size === "md" ? 4 : 6
        } else if (productsQuantity === 2) {
            return size === "md" ? 6 : 12
        } else {
            return 12
        }

    }

    return (
        <Container>
            <Typography variant="h4" component="p" gutterBottom color={"primary"}>
                {category ? category.name : "Todos os produtos"} - {context?.table?.identifier}
            </Typography>

            <Grid container spacing={2}>
                {products.map((product) => (
                    <Grow     in={products.length>0}
                              style={{ transformOrigin: '0 0 0' }}
                              {...(products.length ? { timeout: 1000 } : {})}>
                        <Grid item key={product.id} xs={12} sm={calculateWidth("sm")} md={calculateWidth("md")}>
                            <Card>
                                <CardMedia
                                    component="img"
                                    height="140"
                                    image={product.image}
                                    alt={product.name}
                                />
                                <CardContent>
                                    <Typography gutterBottom variant="h5" component="div">
                                        {product.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {product.description}
                                    </Typography>
                                    <Typography variant="h6" color="text.primary">
                                        R$ {product.price}
                                    </Typography>
                                </CardContent>
                                <CardActions>
                                    <Button size="small" color="primary">
                                        Adicionar ao carrinho
                                    </Button>
                                    <Button size="small" color="secondary">
                                        Ver detalhes
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    </Grow>

                ))}
            </Grid>
        </Container>
    );
};

