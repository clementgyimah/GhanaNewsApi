const Router = require('express').Router();
const News = require('../model/news');

Router.get('/', (req, res) => {
    res.send("Welcome to the brand new beautiful news api");
});

Router.get('/all', async (req, res) => {
    const allNews = await News.find().sort('-date');
    res.send(allNews);
});

Router.get('/:category', async (req, res) => {
    const categoryNews = await News.find({
        "category": req.params.category
    });
    res.send(categoryNews);
});


module.exports = Router;
