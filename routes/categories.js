const Router = require('express').Router();
const {Categories} = require('../service/NewsCategories');

Router.get('/', (req, res) => {
    res.send(Categories);
});

module.exports = Router;
