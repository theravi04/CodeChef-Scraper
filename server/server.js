import express from "express";
import cors from "cors";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import path from "path";
import { log } from "console";
const __dirname = path.resolve();

puppeteer.use(StealthPlugin());

const app = express();

app.use(express.json());
app.use(cors());

const fetchingData = async (req, res) => {
  try {
    const username = req.body.username;

    // Launch the browser in headless mode -> opens in background
    const browser = await puppeteer.launch({ headless: "new" });
    // Use false to view the browser
    // const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(`https://www.codechef.com/users/${username}`);

    await page.waitForSelector("#gdpr-i-love-cookies", { visible: true });
    const element = await page.$("#gdpr-i-love-cookies");
    await page.evaluate((el) => el.scrollIntoView(), element);
    await element.click();
    console.log("Cookie button clicked");

    // Extract User ID
    await page.waitForSelector("[class = 'h2-style']", { visible: true, timeout: 10000 });
    const userId = await page.$("[class = 'h2-style']");
    const userIdText = userId ? await (await userId.getProperty("textContent")).jsonValue() : null;

    // Extract User Rating
    const userRating = await page.$("[class = 'rating-number']");
    const userRatingText = userRating ? await (await userRating.getProperty("textContent")).jsonValue() : null;

    // Extract User Stars
    const userStar = await page.$("[class = 'rating']");
    const userStarText = userStar ? await (await userStar.getProperty("textContent")).jsonValue() : null;

    // Extract Contest Count
    await page.waitForSelector(".contest-participated-count", { visible: true });
    const userContestCountElement = await page.$(".contest-participated-count");
    const userContestCountHtml = await page.evaluate(el => el.innerHTML, userContestCountElement);
    // below code attempts to match any sequence of digits (\d+) that appears b/w <b> and </b> tags.
    const match = userContestCountHtml.match(/<b>(\d+)<\/b>/);
    // If match not null parseInt(match[1], 10) converts number string to an integer.
    const contestCount = match ? parseInt(match[1], 10) : 0;

    // Extract Profile Image URL
    await page.waitForSelector(".profileImage", { visible: false });
    const profileImg = await page.$(".profileImage");
    const profileImgUrl = profileImg ? await page.evaluate(el => el.src, profileImg) : null;

    // Extract Sidebar Info (Country, Profession, Institution)
    await page.waitForSelector(".side-nav");
    const sideNavItems = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll(".side-nav li"));
      return items.map((li) => {
        const labelText = li.querySelector("label")?.textContent || "";
        const spanText = li.querySelector("span")?.textContent || "";
        return { labelText, spanText };
      });
    });

    // Filter for required sidebar data
    const requiredUserInfo = sideNavItems.filter((item) =>
      ["Country:", "Student/Professional:", "Institution:"].includes(item.labelText)
    );

    // await page.waitForSelector(".dataTable");
    // const userData = await page.$("[class = 'dataTable']");
    // const userDataTemp = userData ? await (await userData.getProperty("textContent")).jsonValue() : null;
    // console.log(userDataTemp);
    
    // Close the browser
    await browser.close();

    // Send the structured data as a response
    res.json({
      userId: userIdText,
      userRating: userRatingText,
      userStar: userStarText,
      contestCount: contestCount,
      profileImgUrl: profileImgUrl,
      additionalInfo: requiredUserInfo
    });
    console.log("Data has been sent to the frontend");
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
};

app.post("/", fetchingData);


// Serve static files from the "frontend/dist" directory
// app.use(express.static(path.join(__dirname, "client", "build")));
app.use(express.static(path.join(__dirname, "/client/build")));

// Handle all other routes and serve the client application
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
});

app.listen(4000, () => {
  console.log("listening on port http://localhost:4000");
});
