const axios = require('axios').default;
const fs = require('fs');
require('dotenv').config()

class GamePriceChecker {
    constructor() {
        this.packageId = process.env.PACKAGEID
        this.delay = process.env.DELAY
        this.axiosStantion = axios.create({
            baseURL: 'https://store.steampowered.com',
            method: 'GET',
            headers: {
                'accept': '*/*',
                'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
                'sec-ch-ua': '\"Not?A_Brand\";v=\"8\", \"Chromium\";v=\"108\", \"Google Chrome\";v=\"108\"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '\"Windows\"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'Referer': "https://store.steampowered.com/",
            },
            responseType: 'json',
            timeout: 10000,
        })
        this.countryesInfo = require('./sources/countryesInfo.json')
        this.countryCode;
        this.countryName;
        this.resultFileName = 'GPC v1.0.0 - result'
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async checker() {
        try {
            let response = await this.axiosStantion(`/api/packagedetails/?cc=${this.countryCode}&packageids=${this.packageId}`)
            return [{'status': 'Good'}, [response.data[`${this.packageId}`]['data']['name'], (response.data[`${this.packageId}`]['data']['price']['final'] / 100), response.data[`${this.packageId}`]['data']['price']['currency'], this.countryName, this.countryCode]]
        } catch (e) {
            if (e.code) {
                if (e.code == 'ECONNABORTED') {
                    return [{'status': 'Bad'}, [`Timeout error | ${e.code}`, this.countryName, this.countryCode]]
                } else if (e.code == 'ERR_BAD_REQUEST') {
                    return [{'status': 'Bad'}, [`Ratelimit error | ${e.code}`, this.countryName, this.countryCode]]
                } else {
                    return [{'status': 'Bad'}, [`Unhandled error | ${e.code}`, this.countryName, this.countryCode]]
                }
            }
        }
    }

    async boot() {
        let counter = 0
        let countryesQuantity = this.countryesInfo['countries'].length
        console.log(countryesQuantity)
        while (counter < countryesQuantity) {
            this.countryCode = this.countryesInfo['countries'][counter]['code']
            this.countryName = this.countryesInfo['countries'][counter]['name']
            let result = await this.checker()
            switch(result[0]['status']) {
                case 'Good':
                    fs.appendFile(`result/${this.resultFileName}`, `${result[1][0]} | ${result[1][1]} | ${result[1][2]} | ${result[1][3]}\n`, function (err) {if (err) throw err})
                    break
                case 'Bad':
                    fs.appendFile(`result/${this.resultFileName}`, `${result[1][0]} | ${result[1][1]} | ${result[1][2]}\n`, function (err) {if (err) throw err})
                    break
            }
            console.log(result)
            counter += 1
            console.log(counter)
            await this.sleep(this.delay)
        }
    }

}

const gamePriceChecker = new GamePriceChecker()
gamePriceChecker.boot()