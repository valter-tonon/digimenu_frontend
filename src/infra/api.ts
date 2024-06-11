import axios from 'axios';

const api = axios.create({
    // baseURL: 'https://digimenu.net.br/api/v1/',
    baseURL: 'http://localhost/api/v1/',
});


export default api;
