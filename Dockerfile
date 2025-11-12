FROM node:18-alpine 

WORKDIR /app 

#Copy package file
COPY package.json pnpm-lock.yaml ./ 

#Install pnpm and dependencies 
RUN npm install -g pnpm && pnpm install 

#Copy source code 
COPY . .

#build the app 
RUN pnpm build 

#Expose port
EXPOSE 8000

#Start the app 
CMD ["pnpm", "start"]
