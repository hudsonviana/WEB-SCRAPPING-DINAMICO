const pup = require('puppeteer');
const fs = require('fs');

const url = 'https://www.mercadolivre.com.br/';
const searchFor = 'parafusadeira';

let lista = [];

(async () => {
    const browser = await pup.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(url);
    await page.waitForSelector('#cb1-edit');
    await page.type('#cb1-edit', searchFor);
    
    await Promise.all([
        page.waitForNavigation(),
        page.click('.nav-search-btn')
    ]);

    const links = await page.$$eval('.ui-search-result__image > a', el => el.map(link => link.href)); // equivalente ao documento.querySelectorAll()

    console.log('Total de produtos:', links.length);
    console.log('--------------------------');

    for (const link of links) {

        if (links.indexOf(link) + 1 > 10) continue; // limitar o loop a 10 consultas

        let id = links.indexOf(link) + 1;

        console.log('Página:', id);
        
        await page.goto(link);
        await page.waitForSelector('.andes-money-amount__fraction');

        const title = await page.$eval('.ui-pdp-title', element => element.innerText);
        const price = await page.$eval('.andes-money-amount__fraction', element => element.innerText);

        const seller = await page.evaluate(() => {
            const el = document.querySelector('.ui-pdp-color--BLUE.ui-pdp-family--REGULAR');
            if (el) {
                return el.innerHTML;
            }
            return null;
        });

        const obj = {id, title, price, seller, link};
        
        lista.push(obj);
    }

    // Escrever os dados em um arquivo local (json)
    fs.writeFile('produtos.json', JSON.stringify(lista, null, 2), err => {
        if (err) throw new Error('something went wrong!');
        console.log('well done!');
    });

    // await page.waitForTimeout(3000);
    await browser.close();
})();


/*
// alternativa a << const links = await page.$$eval('.ui-search-result__image > a', el => el.map(link => link.href)) >>
const imgList = await page.evaluate(() => {
    // código executado na página aberta pelo robô
    const nodeList = document.querySelectorAll('.ui-search-result__image > a');
    // transformar o NodeList em array
    const imgArray = [...nodeList];
    // transformar os nodes (elementos html) em objeto javascript
    const imgList = imgArray.map( ({href}) => ({
        href
    }));
    // console.log(imgList);
    return imgList
})
console.log(imgList);
*/
