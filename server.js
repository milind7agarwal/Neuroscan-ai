require('dotenv').config();

const app = require('./src/app.js');
const connectDB = require('./src/config/database');

connectDB();
app.listen(3000, () =>{
    console.log("server is listening to port 3000");
});