const puppeteer = require('puppeteer');
const database = require('../PUVODNI_KNIHY.json');
const fs = require('fs');

(async () => {
    let data = {
        books: [],
    };

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--disable-setuid-sandbox', '--start-maximized'],
        ignoreHTTPSErrors: true,
    });
    const page = await browser.newPage();

    for (let book of database.books) {
        let { name, publicationYear, authorFamilyName, deaccessYear } = book;

        if (deaccessYear !== null) {
            continue;
        }

        let insert = book;

        let url = `https://aleph.nkp.cz/F/?func=find-d&find_code=WYR&request=${publicationYear}&find_code=WTL&request=${name}&find_code=WAU&request=${authorFamilyName}`;

        await page
            .goto(url.replace(/null/g, ''))
            .then(async () => {
                await page
                    .waitForSelector(
                        'body > form:nth-child(4) > table:nth-child(2) > tbody:nth-child(1) > tr:nth-child(5) > td:nth-child(3) > a:nth-child(1)',
                        { timeout: 2500 }
                    )
                    .then(async () => {
                        let results = parseInt(
                            (
                                await page.$eval(
                                    'body > form:nth-child(4) > table:nth-child(2) > tbody:nth-child(1) > tr:nth-child(5) > td:nth-child(3) > a:nth-child(1)',
                                    (a) => a.innerHTML
                                )
                            ).replace('        ', '')
                        );

                        if (results == 1) {
                            await page.click(
                                'body > form:nth-child(4) > table:nth-child(2) > tbody:nth-child(1) > tr:nth-child(5) > td:nth-child(3) > a:nth-child(1)'
                            );

                            await page
                                .waitForSelector('#ISBN > td:nth-child(2)', {
                                    timeout: 2500,
                                })
                                .then(async () => {
                                    let isbn = (
                                        await page.$eval(
                                            '#ISBN > td:nth-child(2)',
                                            (td) => td.innerHTML
                                        )
                                    ).split('&')[0];
                                    insert.isbn = isbn;
                                })
                                .catch(() => {});

                            await page
                                .waitForSelector(
                                    'tr[id="Číslo nár.bibl."] > td:nth-child(2)',
                                    {
                                        timeout: 2500,
                                    }
                                )
                                .then(async () => {
                                    let cnb = await page.$eval(
                                        'tr[id="Číslo nár.bibl."] > td:nth-child(2)',
                                        (td) => td.innerHTML
                                    );
                                    insert.cnb = cnb;
                                })
                                .catch(() => {});

                            await page
                                .waitForSelector(
                                    'tr[id="Popis (rozsah)"] > td:nth-child(2)',
                                    {
                                        timeout: 2500,
                                    }
                                )
                                .then(async () => {
                                    let size = await page.$eval(
                                        'tr[id="Popis (rozsah)"] > td:nth-child(2)',
                                        (td) => td.innerHTML
                                    );
                                    insert.size = size;
                                })
                                .catch(() => {});

                            await page
                                .waitForSelector(
                                    'tr[id="Forma, žánr"] > td:nth-child(2)',
                                    {
                                        timeout: 2500,
                                    }
                                )
                                .then(async () => {
                                    let genre = await page.$eval(
                                        'tr[id="Forma, žánr"] > td:nth-child(2)',
                                        (td) => td.innerHTML
                                    );
                                    insert.genre = genre;
                                })
                                .catch(() => {});

                            await page
                                .waitForSelector(
                                    '#obalky_knih > a:nth-child(3) > img:nth-child(1)',
                                    {
                                        timeout: 2500,
                                    }
                                )
                                .then(async () => {
                                    let coverUrl = (
                                        await page.$eval(
                                            '#obalky_knih > a:nth-child(3) > img:nth-child(1)',
                                            (img) => img.src
                                        )
                                    ).replace('cache.', '');
                                    insert.coverUrl = coverUrl;
                                })
                                .catch(() => {});

                            await page
                                .waitForSelector(
                                    '#obalky_anotace > div:nth-child(3)',
                                    {
                                        timeout: 2500,
                                    }
                                )
                                .then(async () => {
                                    const annotation = await page.$eval(
                                        '#obalky_anotace > div:nth-child(3)',
                                        (div) => div.innerHTML
                                    );
                                    insert.annotation = annotation;
                                })
                                .catch(() => {});

                            await page
                                .waitForSelector('#Resumé > td:nth-child(2)', {
                                    timeout: 2500,
                                })
                                .then(async () => {
                                    let resume = await page.$eval(
                                        '#Resumé > td:nth-child(2)',
                                        (td) => td.innerHTML
                                    );
                                    insert.resume = resume;
                                })
                                .catch(() => {});
                        } else {
                        }
                    })
                    .catch(() => {});
            })
            .catch(() => {});
        data.books.push(insert);
        fs.writeFile(
            'AKTUALNI_DOPLNENE_KNIHY.json',
            JSON.stringify(data, null, 4),
            (err) => {}
        );
    }
    await browser.close();
})();
