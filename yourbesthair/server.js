const http = require('http');
const app = require('./app');
const swaggerUi = require('swagger-ui-express')
const swaggerFile = require('./swagger_output.json')

const port = process.env.PORT || 5000;

const server = http.createServer(app);

server.listen(port, () => {console.log(`server is running on ${port}`);});
app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile))