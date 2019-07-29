const {News, ValidateNews} = require('../model/News');
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

/**
 * Tie everything together here. Forgive me, I couldn't think of a better name, lets assume it's our own main....LOLXs
 * @returns {Promise<void>}
 */
async function main() {
    //clear the database
    await News.deleteMany({});
    console.log('Database Cleared!');
    for (const newsCategoryUrl of Object.keys(CategoryUrls)) {
        console.log("Getting Base Urls For: " + newsCategoryUrl);
        await fetchNews(CategoryUrls[newsCategoryUrl]);
    }
}


/**
 * Given a url which is of type CategoryUrl, build it's news url list and fetch all news from the
 * specified number of pages
 * @param url
 * @returns {Promise<void>}
 */
async function fetchNews(url) {
    let newsUrls = await getUrls(url);
    console.log(newsUrls.length + " News Item Urls in Page: " + url + "...");

    for (const newsUrl of newsUrls) {
        const newsItem = await getNewsItem(newsUrl, url);
        await saveNewsItem(newsItem);
    }
}

//Store the resulting news Item to the database
async function saveNewsItem(newsItem) {
    try {
        if (ValidateNews(newsItem)) {
            //console.log("content length: " + newsItem.content.length)
            const savedNews = await newsItem.save();
            console.log("Saved News Item: Content Length: " + savedNews.content.length);
        }
    } catch (error) {
        console.log("Rejected News Item");
        //log the error somewhere. I am not interested in it at this moment
    }
}

/**
 * Get Urls from various categories websites. Each category has it's own news items so we fetch PAGE_LENGTH
 * each from every available category.
 * @param category one of the members of CategoryUrls, i.e CategoryUrls.music, CategoryUrls.sport...etc
 * @returns {Promise<*>}
 */
async function getUrls(category) {
    const newsPageUrls = buildUrls(category, PAGE_LENGTH);
    let newsUrls = [];

    return new Promise(resolve => {
            let count = 0;
            newsPageUrls.forEach(function (url) {
                Request(url, function (error, response, html) {
                    count++;
                    if (!error && response.statusCode === 200) {
                        const $ = Cheerio.load(html);

                        $('.post-box-title > a').each(function () {
                            newsUrls.push($(this).attr('href'));
                        });

                        //stop the process when PAGE_LENGTH number of pages are processed. We don't want to go all the way to infinity
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


/**
 * Accept an url of the form https://news.ghanamotion.com/category/ and build urls
 * of the form https://news.ghanamotion.com/category/page/n where  length > n > 0
 */
function buildUrls(url, length) {
    let urls = [];
    for (let i = 1; i <= length; i++) {
        urls.push(url.concat('page/', i));
    }
    return urls;
}

/**
 * Extract a single news Item from a news url.
 * @param newsUrl url of an individual news Item.
 * @param categoryUrl used to determine the category of the news Item. One of Music, Lifestyle, Sport, etc
 * @returns {Promise<*>}
 */
async function getNewsItem(newsUrl, categoryUrl) {
    return new Promise(resolve => {
        Request(newsUrl, async function (error, response, html) {
            if (!error && response.statusCode === 200) {
                const $ = Cheerio.load(html);
                const headline = $('.post-title').first().text().trim();
                const date = $('.post-meta > span').first().text();
                const imageUrl = $('.single-post-thumb > img').first().attr('src');
                let content = ' ';

                //grab individual paragraphs from article, concatenate them together and separate them using a newline character
                $('.entry > p').each(function () {
                    const paragraph = $(this).text();
                    content = content.concat(paragraph, '\n'); //append a newline character after each paragraph
                });

                //some articles may contain quotes
                $('.entry > blockquote > p').each(function () {
                    const paragraph = $(this).text().trim();

                    if (paragraph.length !== 0)
                        content = content.concat(paragraph, '\n');
                });

                const newsItem = new News({
                    headline: headline,
                    content: content.trimEnd().trimStart(),
                    date: date,
                    imageUrl: imageUrl,
                    category: getKeyByValue(CategoryUrls, categoryUrl)
                });

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

module.exports.FetchNews = main;
