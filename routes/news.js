const Router = require('express').Router();
const {News} = require('../model/News');

Router.get('/all', async (req, res) => {
    const allNews = await News.find().sort('-date');
    res.send(allNews);
});

Router.get('/', async (req, res) => {
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
