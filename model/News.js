const mongoose = require('mongoose');
const joi = require('joi');

const News = mongoose.model('news', new mongoose.Schema({
        headline: {
            type: String,
            required: true,
            min: 10
        },
        content: {
            type: String,
            required: true,
            min: 10
        },

        category: {
            type: String,
            required: true,
        },
        imageUrl: {
            type: String,
            min: 10,
            required: true
        },
        date: {
            type: Date,
            required: true
        }
    })
);

function ValidateNews(news) {
    const schema = {
        headline: joi.string().required().min(10),
        content: joi.string().required().min(30),
        imageUrl: joi.string().required().min(10),
    };

    return joi.validate(news, schema);
}

module.exports.News = News;
module.exports.ValidateNews = ValidateNews;
