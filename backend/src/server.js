const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('./config/config');
require('./scripts/CreateAdmin');

console.log('Config loaded...');
console.log('Created admin user with the following credentials:');
console.log(`Username: ${process.env.ADMIN_USERNAME}`);
console.log(`Password: ${process.env.ADMIN_PASSWORD}`);

mongoose.connect('mongodb://mongo:27017/clipsDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
console.log('Connected to MongoDB...');

const app = express();
app.set('trust proxy', true);
app.use((_req, _res, next) => {
  _req.ip = _req.headers['x-forwarded-for'] || _req.socket.remoteAddress;
  next();
});

app.use(bodyParser.json({ limit: '200mb' }));
app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/profilePictures', express.static(path.join(__dirname, 'profilePictures')));
app.use('/download', express.static(path.join(__dirname, 'download')));
app.use(cors());

const adminRoute = require('./routes/Admin');
const userRoute = require('./routes/User');
const clipsRoute = require('./routes/Clips');
const messagesRoute = require('./routes/Messages');
const ratingsRoute = require('./routes/Ratings');
const zipsRoute = require('./routes/Zips');
const discordRoute = require('./routes/Discord');
app.use('/api/admin', adminRoute);
app.use('/api/users', userRoute);
app.use('/api/clips', clipsRoute);
app.use('/api/messages', messagesRoute);
app.use('/api/ratings', ratingsRoute);
app.use('/api/zips', zipsRoute);
app.use('/api/discord', discordRoute);
app.use('/api/notifications', require('./routes/Notifications'));

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'ClipSesh API',
      version: '1.0.0',
      description: 'API for ClipSesh',
    },
    servers: [
      {
        url: `https://api.spoekle.com`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [path.join(__dirname, './routes/*.js'), path.join(__dirname, './models/*.js')],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.listen(5000, () => {
  console.log('Server is running on port 5000, happy rating!');
});