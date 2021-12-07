const express = require('express');
const app = express();
const morgan = require('morgan');
const mongoose = require('mongoose')
const cors = require('cors')
const authJwt = require('./Helpers/jwt');
const errorHandler = require('./Helpers/errorHandler');

//enable CORS
app.use(cors())
app.options('*', cors());

//Middleware
app.use(express.json())
app.use(morgan('tiny'))
app.use(authJwt())
app.use(errorHandler)
//make the image url static and viewable in browser
app.use('/public/uploads', express.static(__dirname + '/public/uploads'));

//Env
require('dotenv/config')
const api = process.env.API_URL;

//Routes
const productRouter = require('./router/products')
const categoriesRouter = require('./router/categories')
const ordersRouter = require('./router/orders')
const usersRouter = require('./router/users');

//Router Services
app.use(`${api}/products`, productRouter);
app.use(`${api}/categories`, categoriesRouter)
app.use(`${api}/orders`, ordersRouter)
app.use(`${api}/users`, usersRouter)

//Connection to MongoDb
mongoose.connect(process.env.CONNECTION_STRING).then(()=> {
    console.log('Connection is Established!')
}).catch((err) => {
    console.log(`Connection Error : ${err}`)
})
//PORT
const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Listening in port ${PORT}`)
})