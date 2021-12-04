const puppeteer = require("puppeteer");
const fs = require("fs");
const dotenv = require("dotenv").config();
const { parse } = require("json2csv");

(async () => {
  const browser = await puppeteer.launch({ headless: false }); //{ headless: false }
  const page = await browser.newPage();
  await page.goto(process.env.WEBSITE_URL);
  await page.screenshot({ path: "website.png" });
  await page.type("#l-email", process.env.USER_EMAIL);
  await page.type("#l-password", process.env.USER_PASSWORD);
  await Promise.all([
    page.click(".btn-login"),
    page.waitForNavigation({
      waitUntil: "networkidle0",
    }),
  ]);
  const items = await page.evaluate(() => {
    const data = [];
    document.querySelectorAll("tbody tr").forEach((item) => {
      const fields = item.querySelectorAll("td");
      data.push({
        title: fields[0].innerText,
        author: fields[1].innerText,
        publisher: fields[2].innerText,
        isbn: fields[3].innerText,
        category: fields[4].innerText,
      });
    });
    return data;
  });
  console.log(items);

  //Convert Object to CSV file
  const csv = parse(items, {
    fields: ["title", "author", "publisher", "isbn", "category"],
  });
  fs.writeFile("./data.csv", csv, (err) => {
    if (err) throw new err();
    console.log("saved");
  });

  await page.goto(process.env.NEWS_WEBSITE_URL);
  const articles = await page.evaluate(() => {
    const data = [];
    const list = document.querySelectorAll(".ok-news-post.ltr-post");
    list.forEach((item) => {
      const title = item.querySelector(".ok-post-contents > h2 > a").innerText;
      const postHours = item.querySelector(
        ".ok-post-contents .ok-post-hours > span"
      ).innerText;
      data.push({ title, postHours });
    });
    return data;
  });
  console.log(articles);

  fs.writeFile("./articles.json", JSON.stringify({ data: articles }), (err) => {
    if (err) console.log(err);
  });

  await browser.close();
})();
