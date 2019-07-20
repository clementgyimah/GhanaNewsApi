const Router = require('express').Router();
const {News} = require('../model/News');
const {Categories} = require('../service/NewsCategories');

Router.get('/all', async (req, res) => {
    const allNews = await News.find().sort('-date');
    res.send(allNews);
});

Router.get('/', async (req, res) => {
    const allNews = await News.find().sort('-date');
    res.send(allNews);
});

/**
 * Get news item by category where category is one of music, showbiz, sport, lifestyle, regional, business
 * Example: http://localhost/news/music
 * An error{} object with a status and reason is returned alongside a 400 response code
 */
Router.get('/:category', async (req, res) => {
    const category = req.params.category;
    if (!Categories.includes(category))
        res.status(400).send({
            status: 'rejected',
            reason: `News category ${category} Not found`
        });
    const categoryNews = await News.find({
        "category": req.params.category
    });
    res.send(categoryNews);
});


module.exports = Router;
