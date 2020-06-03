const {News, ValidateNews} = require('../model/News');
const Cheerio = require('cheerio');
const Request = require('request');


const CategoryUrls = {
    'politics': 'https://www.ghanaweb.com/GhanaHomePage/politics/',
};

/**
 * Tie everything together here. Forgive me, I couldn't think of a better name, lets assume it's our own main....LOLXs
 * @returns {Promise<void>}
 */
async function main() {
    for (const category of Object.keys(CategoryUrls)) {
        console.log("Getting Base Urls For: " + category);
        try {
            await fetchNews(CategoryUrls[category]);
        } catch (e) {
            console.log("Error fetching news: " + e)
        }
    }
}


/**
 * Given a url which is of type CategoryUrl, build it's news url list and fetch all news from the
 * specified number of pages
 * @returns {Promise<void>}
 * @param baseUrl
 */
async function fetchNews(baseUrl) {
    try {
        let relativeUrls = await getUrls(baseUrl);

        const absoluteNewsUrls = relativeUrls.map(relUrl => baseUrl + relUrl);

        for (const newsUrl of absoluteNewsUrls) {
            const newsItem = await getNewsItem(newsUrl, baseUrl);
            await saveNewsItem(newsItem);
        }
    } catch (e) {
        console.log(e)
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
    let newsUrls = [];
    let newsPageUrls = [];

    for (const key of Object.keys(CategoryUrls)) {
        newsPageUrls.push(CategoryUrls[key]);
    }

    console.log(newsPageUrls.length + " obtained")

    return new Promise((resolve, reject) => {
            newsPageUrls.forEach(function (url) {
                Request(url, function (error, response, html) {
                    if (!error && response.statusCode === 200) {
                        let $ = Cheerio.load(html);
                        const leftSection = $('.panelbox > .world-sec-wrap > .world-sec-main > .world-sec-left').first().html();
                        const rightSection = $('.panelbox > .world-sec-wrap > .world-sec-main > .world-sec-right').first().html();
                        const leadItemSelector = '.newsLead > .image > a';
                        const leftRemainingItemsSelector = '.newList > ul > li > a';
                        const rightRemainingItemsSelector = 'ul > li > a';

                        //load leading news item on the left
                        $ = Cheerio.load(leftSection);
                        const newsLeadUrl = $(leadItemSelector).attr('href');
                        newsUrls.push(newsLeadUrl)

                        //load remaining news items on the left
                        $(leftRemainingItemsSelector).each(function () {
                            newsUrls.push($(this).attr('href'));
                        });

                        //load news items on the right. There seem to be no leading news item for the right divs
                        $ = Cheerio.load(rightSection);
                        $(rightRemainingItemsSelector).each(function () {
                            newsUrls.push($(this).attr('href'));
                        });


                        resolve(newsUrls);

                    } else {
                        reject(error)
                        console.log(error + response + html);
                    }
                });
            });
        }
    )
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

                const date = $('#mainbody .article-left-col > #date').first().text();
                const headline = $('#mainbody .article-left-col > h1').first().text();
                const content = $('#mainbody .article-left-col > p[style*="clear:right"]').first().text();
                const imageUrl = $('#mainbody .article-image > a > img').attr('src');


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

module.exports.GhanaWebProvider = main;
