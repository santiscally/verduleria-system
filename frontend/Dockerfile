FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el código del frontend
COPY . .

# Construir para desarrollo
EXPOSE 3000

CMD ["npm", "run", "dev"]