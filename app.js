require('dotenv').config();
require('express-async-errors');

// extra security packages
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss-clean');
const rateLimiter = require('express-rate-limit');
const hpp = require('hpp');

// Swagger
const swaggerUI = require('swagger-ui-express');
const YAML = require('yamljs');

// Load Swagger File
const swaggerDocument = YAML.load('./swagger.yaml');

const express = require('express');
const app = express();

// connectDB
const connectDB = require('./db/connect');

const authenticateUser = require('./middleware/authentication');

// error handler
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

// Rate Limiting
app.set('trustproxy', 1);
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windows
  })
);

// Body Parser
app.use(express.json());

// Sanitize Data : No SQL Injection
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Prevent http param pollution
app.use(hpp());

app.use(cors());

// Prevent XSS attacks : <script></script>
app.use(xss());

app.get('/', (req, res) => {
  res.send('<h1>Jobs API</h1><a href="/api-docs">Documentation</a>');
});

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

// mount routers
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/jobs', authenticateUser, require('./routes/jobs'));

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 8000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
