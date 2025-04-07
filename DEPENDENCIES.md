# Dependências do Frontend

Para que o frontend funcione corretamente, é necessário instalar as seguintes dependências:

```bash
# Navegue até o diretório frontend
cd frontend

# Instalação das dependências
npm install react-hot-toast date-fns react-i18next i18next --save
```

## Dependências importantes

- `react-hot-toast`: Utilizado para exibir notificações de toast na interface
- `date-fns`: Utilizado para formatação de datas
- `react-i18next` e `i18next`: Utilizados para internacionalização do aplicativo

## Usando com Sail

Se estiver utilizando Laravel Sail, você pode executar:

```bash
sail exec -it laravel.test bash
cd frontend
npm install react-hot-toast date-fns react-i18next i18next --save
```

## Declarações de tipos

Os tipos para estas bibliotecas estão incluídos no arquivo `src/types/declarations.d.ts`, portanto não é necessário instalar pacotes adicionais de tipos. 