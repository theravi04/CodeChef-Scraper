import express from 'express';
import cors from 'cors';
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
puppeteer.use(StealthPlugin());
// import fetchingData from 'fs';

const app = express();

app.use(express.json())
app.use(cors());

const fetchingData = async (req, res) =>{

    const username = req.body.username
    const browser = await puppeteer.launch({headless: 'new'});
    const page = await browser.newPage();
    await page.goto(`https://www.codechef.com/users/${username}`);

    const element = await page.waitForSelector('button#gdpr-i-love-cookies.button.grey.tiny');
    await element.click();

    const userId = await page.$("[class = 'h2-style']");
    const userIdText = await (await userId.getProperty('textContent')).jsonValue();

    const userRating = await page.$("[class = 'rating-number']");
    const userRatingText = await (await userRating.getProperty('textContent')).jsonValue();

    const userStar = await page.$("[class = 'rating']");
    const userStarText = await (await userStar.getProperty('textContent')).jsonValue();

    let notFound = setTimeout(() => {
      res.status(404).send();
    }, 12000);

    setTimeout(() => {
        clearTimeout(notFound);
        res.status(200).send({
          userId: userIdText,
          userRating: userRatingText,
          userStar: userStarText
      })
    }, 2000);
    

    await browser.close();
    console.log("Data has been written to extracted_data.json");
    
};

app.post('/', fetchingData);

app.listen(4000, ()=> {
console.log("listening on port http://localhost:4000");
})