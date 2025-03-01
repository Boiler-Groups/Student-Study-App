# Boiler Groups
Study app for CS 307 using MongoDB, Express.js, React Native, and Node.js

## Launch Instructions

Clone the repository
```
git clone https://github.com/GavinMcCormack912/Student-Study-App.git
```

Get server dependencies
```
cd server
npm install
```

Get client dependencies
```
cd client
npm install
```

Create a .env file in the server folder with the following fields filled in
```
MONGO_URI=
PORT=
NODE_ENV=
JWT_SECRET=
```
- MONGO_URI: This is the connection string to your MongoDB database. If you're using MongoDB Atlas or any cloud-hosted MongoDB service, you'll get a connection string from their dashboard. Replace <username> and <password> with your actual MongoDB credentials, and mydatabase with the name of your database.

- PORT: The port on which your server will run. By default, it is set to 8080, but you can change this to any available port number that you prefer.

- NODE_ENV: This variable sets the environment for your application. Use development for local development, production for deployment, or test for running tests. This helps control environment-specific behavior.

- JWT_SECRET: A secret key used for signing JSON Web Tokens (JWT) for authentication. This key should be kept secure and private. You can generate any random string to use as a secret key. Ensure this value is not exposed in public repositories.

Create a .env file in the client folder with the following fields filled in
```
API_URL=
```
- API_URL: This is the root or starting URL for all of the API requests your frontend will make to the backend. 
For example, if your backend is running on http://localhost:8080 (Port 8080 is default) 
and your frontend is running on http://localhost:8081 (Port 8081 is defualt for metro builder), you would set the API_URL to your backend's URL.
Ex. API_URL=http://localhost:8080. During production it might look something like https://api.yoursite.com in production.

Start the server and client on separate terminals and open the application
```
cd server
npm start
```
```
cd client
npm start
```

## Testing
Server tests are ran with Mocha. Insert test files in `server/test`. Run tests with
```
cd server
npm test
```