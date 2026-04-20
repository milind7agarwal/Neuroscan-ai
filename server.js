require('dotenv').config();

const app = require('./src/app.js');
const connectDB = require('./src/config/database');

connectDB();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>{
    console.log(`server is listening to port ${PORT}`);
});

// const PORT = process.env.PORT || 3000;

// app.listen(PORT, () =>{
//     console.log(`server is listening to port ${PORT}`);
// });

