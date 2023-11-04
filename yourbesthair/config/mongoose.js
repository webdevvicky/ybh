const mongoose = require('mongoose');

//Datbase Connection
//const db = 'mongodb://localhost/YBH';
const db = 'mongodb://127.0.0.1:27017/your_best_hair';


//mongodb://localhost:27017/
mongoose.connect(db, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useFindAndModify: false,
	useCreateIndex: true
}).then(() => console.log('MongoDB Connected'))
	.catch(err => console.log('Mongodb Not connected',err));