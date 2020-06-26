const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const {GhanaMotionProvider} = require('./service/GhanaMotionProvider');
const {GhanaWebProvider} = require('./service/GhanaWebProvider');
const {News} = require('./model/News');

const cron = require('node-cron');
const newsRouter = require('./routes/news');
const categoriesRouter = require('./routes/categories');

const config = require('config');
const app = express();
const moment = require('moment');

app.use(logger('dev'));
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

//routes
app.use('/news', newsRouter);
app.use('/categories', categoriesRouter);


//default route
app.get('/', (req, res) => {
    //res.send("Welcome to the news api. Access news content from /news. You may access all news with /news/all or sports news with /news/sport");
    res.render('index');
});


mongoose.connect(config.get("mongoUri"), {useNewUrlParser: true})
    .then(() => console.log('Connected to MongoDB...'))
    .catch((error) => console.error('Could not connect to MongoDB...' + error));

// We are currently running on a free dyno at heroku so scheduling this task to run at a particular time of the day is highly not ideal.
//Instead we can just fetch the news every 20mins which is 10mins before the app idles out.
const task = cron.schedule('*/10 * * * *', async () => {
    const time = moment().format("dddd: MMMM D, YYYY HH:mm:SS");
    console.log('Job Started:::' + time);

    try {
        //always clear database before adding new entries
        await News.deleteMany({});
    } catch (error) {
        console.log('Error executing cron job' + error);
    }

    GhanaWebProvider()
        .then(() => console.log("Fetched Ghanaweb sources"))
        .catch((error)=> console.log("Error fetching Ghanaweb sources" + error));

    GhanaMotionProvider()
        .then(() => console.log("Fetched Ghanamotion sources"))
        .catch((error)=> console.log("Error fetching Ghanamotion sources" + error));
});

task.start();


module.exports = app;

