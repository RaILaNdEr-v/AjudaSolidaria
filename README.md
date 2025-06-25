# AjudaSolidária - Plataforma de Doação

## Descrição
Projeto exemplo para gerenciar doações entre doadores, beneficiários e organizações.

## Tecnologias Utilizadas
- Python Flask
- React (via CDN)
- MySQL
- Docker

## Como Executar
1. Configure um banco MySQL e ajuste a variável `DATABASE_URL` se necessário.
2. Construa a imagem do backend e execute o container:
   ```bash
   docker build -t ajuda-backend backend
   docker run -p 5000:5000 --env DATABASE_URL=mysql+pymysql://user:password@db/ajuda ajuda-backend
   ```
3. Abra o arquivo `frontend/index.html` em um navegador para acessar a interface.

Este projeto é apenas um esqueleto inicial demonstrando as principais rotas e estrutura sugerida.
