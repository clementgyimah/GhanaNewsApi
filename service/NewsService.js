const {News, ValidateNews} = require('../model/news');
const Cheerio = require('cheerio');
const Request = require('request');

const PAGE_LENGTH = 3;

const CategoryUrls = {
    'music': 'https://news.ghanamotion.com/category/music/',
    'sport': 'https://news.ghanamotion.com/category/sport/',
    'showbiz': 'https://news.ghanamotion.com/category/showbiz/',
    'lifestyle': 'https://news.ghanamotion.com/category/lifestyle/',
    'regional': 'https://news.ghanamotion.com/category/news/regional-news/',
    'business': 'https://news.ghanamotion.com/category/business/'
};


async function letItRain() {
    const del = await News.deleteMany({});
    console.log('Database Cleared!');
    Object.keys(CategoryUrls).forEach(async function (newsCategoryUrl) {
        await fetchNews(CategoryUrls[newsCategoryUrl]);
    });
}

async function fetchNews(url) {
    let newsUrls = await getUrls(url);

    newsUrls.forEach(async function (newsUrl) {
        const newsItem = await getNewsItem(newsUrl, url);
    });
}

async function getUrls(category) {
    let newsUrls = buildUrls(category, PAGE_LENGTH);

    return new Promise(resolve => {
            let count = 0;
            newsUrls.forEach(function (url, index) {
                Request(url, function (error, response, html) {
                    count++;
                    if (!error && response.statusCode === 200) {
                        const $ = Cheerio.load(html);
                        $('.post-box-title > a').each(function (i, element) {
                            newsUrls.push($(this).attr('href'));
                        });
                        if (count === PAGE_LENGTH)
                            resolve(newsUrls);
                    } else {
                        console.log(error);
                    }
                });
            });
        }
    )
}

function buildUrls(url, length) {
    let urls = [];

    for (i = 1; i <= length; i++) {
        urls.push(url.concat('page/', i));
    }
    console.log(urls);
    return urls;

}

async function getNewsItem(newsUrl, categoryUrl) {
    return new Promise(resolve => {
        Request(newsUrl, async function (error, response, html) {
            if (!error && response.statusCode === 200) {
                const $ = Cheerio.load(html);
                const headline = $('.post-title').first().text().trim();
                const date = $('.post-meta > span').first().text();
                const imageUrl = $('.single-post-thumb > img').first().attr('src');
                let content = ' ';

                $('.entry > p').each(function () {
                    const paragraph = $(this).text();
                    content = content.concat(paragraph).trim();
                });

                const newsItem = new News({
                    headline: headline,
                    content: content,
                    date: date,
                    imageUrl: imageUrl,
                    category: getKeyByValue(CategoryUrls, categoryUrl)

                });
                try {
                    if (ValidateNews(newsItem))
                        await newsItem.save();
                } catch (error) {
                    console.log(error);
                    //log the error somewhere. I am not interested in it at this moment
                }

                resolve(newsItem);
            } else {
                console.log(error);
            }
        });
    });
}

function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

module.exports.FetchNews = letItRain;
