let baseURL = 'https://www.alphavantage.co/query?'

// Time Series intraday
let timeFunction = 'function=TIME_SERIES_INTRADAY'
let timeInterval = '&interval=5min'

// Time Series Monthly
let monthlyFunction = 'function=TIME_SERIES_MONTHLY'

// Time series daily
let dailyFunction = 'function=TIME_SERIES_DAILY'
let outputSize = '&outputsize=compact'

// Symbol Search
let searchFunction = 'function=SYMBOL_SEARCH'
let searchKeyword = '&keywords=' // plus search keywords

// Global Quote
let quoteFunction = 'function=GLOBAL_QUOTE'
let quoteSymbol = '&symbol=' // plus symbol

// API Key
let apiKey = '&apikey=SI7NQQ7U40XVI2K7'

// Bar Charts API
let alphavantageAPIForRefresh = true
let BCbaseURL = 'https://marketdata.websol.barchart.com/getQuote.json?symbols='
let BCapiKey = '&apikey=da4f1b3d039f0de403eea5e45b14814a'


// Global Variables
let gameInProgress = false
let currentSelectedStock
let currentSearchedStocks
let currentSearchSymbolLookup
let refreshRate = 300 // refresh rate in seconds to update portfolio value
let maxStocks = 3

let portfolio = {}
let portfolioFn = {
    updateCashBalance: (adjustByAmount) =>
    {
        // console.log("Adjust cash balance by:" + adjustByAmount)
        portfolio.cashBalance += adjustByAmount

    },
    getCashBalance: () =>
    {
        // console.log("Get Cash Balance:" + portfolio.cashBalance)
        return portfolio.cashBalance
    },
    getTotalValue: () =>
    {
        // console.log("Get Total Value:" + portfolio.totalValue)
        return portfolio.totalValue
    },
    setTotalValue: (newTotalValue) =>
    {
        // console.log("Set Total Value:" + portfolio.totalValue)
        portfolio.totalValue = newTotalValue
    },
    updateStockVolume: (symbol, amount) =>
    {

    },
    setStockPrice: (symbol, newPrice) =>
    {
        let index = findStockIndexInPortfolio(symbol)
        let ownedStock = portfolio.currentlyOwnedStocks[index]
        ownedStock.singleValue = newPrice
        let volume = ownedStock.volume
        ownedStock.totalValue = volume * ownedStock.singleValue
        portfolioFn.calcPortfolioTotalValue()
    },
    calcPortfolioTotalValue: () =>
    {
        let newPortfolioTotalValue = 0;
        portfolio.currentlyOwnedStocks.forEach(ownedStock => {
            newPortfolioTotalValue += ownedStock.totalValue
        })
        newPortfolioTotalValue += portfolioFn.getCashBalance()
        portfolio.totalValue = newPortfolioTotalValue
        // let currencyFormatOptions = { currency: "USD", maximumFractionDigits: 2 }
        // let totalValueString = portfolio.totalValue.toLocaleString('en-US', currencyFormatOptions)
        // document.querySelector('#total-value').innerHTML = "$"+totalValueString

        document.querySelector('#total-value').innerHTML = formatCurrencyText(portfolio.totalValue)

        // let timeFormatOptions = { timeZone: "America/New_York", timeZoneName: 'short' }
        // let datetimenow = Date.now()
        // document.querySelector('#time-value').innerHTML = datetimenow.toLocaleString('en-US',timeFormatOptions)
    },
    refreshTotalValue: () =>
    {
        //console.log("refreshing value")
        if (portfolio.currentlyOwnedStocks.length > 0)
        {
            portfolio.currentlyOwnedStocks.forEach(ownedStock => {
                if (alphavantageAPIForRefresh)
                {
                    let queryString = buildQuoteQueryString(ownedStock.stock.symbol)
                    collectResults(queryString, portfolioFn.refreshIndividualStockValue)
                } else
                {
                    let queryString = buildBCQuoteQueryString(ownedStock.stock.symbol)
                    collectResults(queryString, portfolioFn.refreshIndividualStockValue)
                }
            })
        } else
        {
            portfolioFn.calcPortfolioTotalValue()
        }
    },
    refreshIndividualStockValue: (results) =>
    {
        let symbol
        let newPrice

        if (alphavantageAPIForRefresh)
        {
            //console.log(results)
            // Stock symbol
            symbol = results['Global Quote']['01. symbol']
            // Stock Buy Price
            newPrice = results['Global Quote']['05. price']

        } else
        {
            symbol = results
        }
        portfolioFn.setStockPrice(symbol, newPrice)

    },
    canAfford: (amount) =>
    {
        return amount < portfolioFn.getCashBalance()
    },
    confirmStockBalance: (symbol, amount) =>
    {
        // let index = findStockIndexInPortfolio()
        // return portfolio.currentlyOwnedStocks[index].volume >= amount
        return portfolioFn.getStockBalance(symbol) >= amount
    },
    getStockBalance: (symbol) =>
    {
        let index = findStockIndexInPortfolio(symbol)
        return portfolio.currentlyOwnedStocks[index].volume
    }
}


const formatCurrencyText = (amount) =>
{
    amount = parseFloat(amount)
    let currencyFormatOptions = {currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2}
    let returnText = "$" + amount.toLocaleString('en-US', currencyFormatOptions)
    // console.log("formatted text input:"+amount)
    // console.log("formatted text:"+returnText)
    return returnText
}

//////////////////////////////////////////////////////////////////////////
// Portfolio Load/Save/Build Functions

const loadLocalPortfolio = () => {
    let portfolioString = localStorage.getItem("main-portfolio")
    if (portfolioString !== null)
    {
        portfolio = JSON.parse(portfolioString)
        gameInProgress = true
        document.querySelector('#onboarding').style.display = 'none'
        document.querySelector('#dialog-box-parent').style.display = 'none'
        renderPortfolio(portfolio)
    } else
    {
        buildNewPortfolio()
        document.querySelector('#onboarding').style.display = 'flex'
        document.querySelector('#dialog-box-parent').style.display = 'flex'
    }
}

const saveLocalPortfolio = () => {
    let portfolioString = JSON.stringify(portfolio)
    localStorage.setItem("main-portfolio", portfolioString)
}

const deleteLocalPortfolio = () => {
    delete portfolio
    localStorage.removeItem("main-portfolio")
}

const buildNewPortfolio = () => {
    portfolio = {
        cashBalance: 0,
        currentlyOwnedStocks: [],
        transactionHistory: [],
        totalValue: 0,
        totalValueTime: Date.now(),
        totalValueHistory: [],

    }
    portfolioFn.setTotalValue = portfolioFn.getCashBalance()
}


//////////////////////////////////////////////////////////////////////////
// Charts

let data = {
    "Meta Data": {
        "1. Information": "Daily Prices (open, high, low, close) and Volumes",
        "2. Symbol": "MSFT",
        "3. Last Refreshed": "2020-01-06",
        "4. Output Size": "Compact",
        "5. Time Zone": "US/Eastern"
    },
    "Time Series (Daily)": {
        "2020-01-06": {
            "1. open": "157.0800",
            "2. high": "159.1000",
            "3. low": "156.5100",
            "4. close": "159.0300",
            "5. volume": "19214320"
        },
        "2020-01-03": {
            "1. open": "158.3200",
            "2. high": "159.9450",
            "3. low": "158.0600",
            "4. close": "158.6200",
            "5. volume": "21121681"
        },
        "2020-01-02": {
            "1. open": "158.7800",
            "2. high": "160.7300",
            "3. low": "158.3300",
            "4. close": "160.6200",
            "5. volume": "22634546"
        },
        "2019-12-31": {
            "1. open": "156.7700",
            "2. high": "157.7700",
            "3. low": "156.4500",
            "4. close": "157.7000",
            "5. volume": "18393383"
        },
        "2019-12-30": {
            "1. open": "158.9865",
            "2. high": "159.0200",
            "3. low": "156.7300",
            "4. close": "157.5900",
            "5. volume": "16356720"
        },
        "2019-12-27": {
            "1. open": "159.4500",
            "2. high": "159.5500",
            "3. low": "158.2200",
            "4. close": "158.9600",
            "5. volume": "18414352"
        },
        "2019-12-26": {
            "1. open": "157.5511",
            "2. high": "158.7300",
            "3. low": "157.4000",
            "4. close": "158.6700",
            "5. volume": "14526927"
        },
        "2019-12-24": {
            "1. open": "157.4800",
            "2. high": "157.7100",
            "3. low": "157.1150",
            "4. close": "157.3800",
            "5. volume": "8989150"
        },
        "2019-12-23": {
            "1. open": "158.1200",
            "2. high": "158.1200",
            "3. low": "157.2700",
            "4. close": "157.4100",
            "5. volume": "17726283"
        },
        "2019-12-20": {
            "1. open": "157.3500",
            "2. high": "158.4900",
            "3. low": "156.2900",
            "4. close": "157.4100",
            "5. volume": "53599613"
        },
        "2019-12-19": {
            "1. open": "154.0000",
            "2. high": "155.7700",
            "3. low": "153.7500",
            "4. close": "155.7100",
            "5. volume": "25813825"
        },
        "2019-12-18": {
            "1. open": "154.3000",
            "2. high": "155.4800",
            "3. low": "154.1800",
            "4. close": "154.3700",
            "5. volume": "24132379"
        },
        "2019-12-17": {
            "1. open": "155.4500",
            "2. high": "155.7100",
            "3. low": "154.4500",
            "4. close": "154.6900",
            "5. volume": "25443527"
        },
        "2019-12-16": {
            "1. open": "155.1100",
            "2. high": "155.9000",
            "3. low": "154.8200",
            "4. close": "155.5300",
            "5. volume": "24152770"
        },
        "2019-12-13": {
            "1. open": "153.1106",
            "2. high": "154.8900",
            "3. low": "152.8300",
            "4. close": "154.5300",
            "5. volume": "23850062"
        },
        "2019-12-12": {
            "1. open": "151.6500",
            "2. high": "153.4400",
            "3. low": "151.0200",
            "4. close": "153.2400",
            "5. volume": "24645366"
        },
        "2019-12-11": {
            "1. open": "151.5400",
            "2. high": "151.8700",
            "3. low": "150.3300",
            "4. close": "151.7000",
            "5. volume": "18860001"
        },
        "2019-12-10": {
            "1. open": "151.2900",
            "2. high": "151.8900",
            "3. low": "150.7650",
            "4. close": "151.1300",
            "5. volume": "16481060"
        },
        "2019-12-09": {
            "1. open": "151.0700",
            "2. high": "152.2100",
            "3. low": "150.9100",
            "4. close": "151.3600",
            "5. volume": "16741350"
        },
        "2019-12-06": {
            "1. open": "150.9900",
            "2. high": "151.8700",
            "3. low": "150.2700",
            "4. close": "151.7500",
            "5. volume": "16410400"
        },
        "2019-12-05": {
            "1. open": "150.0500",
            "2. high": "150.3200",
            "3. low": "149.4800",
            "4. close": "149.9300",
            "5. volume": "17880601"
        },
        "2019-12-04": {
            "1. open": "150.1400",
            "2. high": "150.1799",
            "3. low": "149.2000",
            "4. close": "149.8500",
            "5. volume": "17580617"
        },
        "2019-12-03": {
            "1. open": "147.4900",
            "2. high": "149.4300",
            "3. low": "146.6500",
            "4. close": "149.3100",
            "5. volume": "25192145"
        },
        "2019-12-02": {
            "1. open": "151.8100",
            "2. high": "151.8300",
            "3. low": "148.3200",
            "4. close": "149.5500",
            "5. volume": "27473616"
        },
        "2019-11-29": {
            "1. open": "152.1000",
            "2. high": "152.3000",
            "3. low": "151.2800",
            "4. close": "151.3800",
            "5. volume": "11977300"
        },
        "2019-11-27": {
            "1. open": "152.3300",
            "2. high": "152.5000",
            "3. low": "151.5200",
            "4. close": "152.3200",
            "5. volume": "15201293"
        },
        "2019-11-26": {
            "1. open": "151.3600",
            "2. high": "152.4200",
            "3. low": "151.3200",
            "4. close": "152.0300",
            "5. volume": "24635100"
        },
        "2019-11-25": {
            "1. open": "150.0000",
            "2. high": "151.3500",
            "3. low": "149.9200",
            "4. close": "151.2300",
            "5. volume": "22428585"
        },
        "2019-11-22": {
            "1. open": "150.0700",
            "2. high": "150.3000",
            "3. low": "148.8200",
            "4. close": "149.5900",
            "5. volume": "15841680"
        },
        "2019-11-21": {
            "1. open": "149.4000",
            "2. high": "149.8000",
            "3. low": "148.5010",
            "4. close": "149.4800",
            "5. volume": "18576083"
        },
        "2019-11-20": {
            "1. open": "150.3100",
            "2. high": "150.8400",
            "3. low": "148.4600",
            "4. close": "149.6200",
            "5. volume": "25720060"
        },
        "2019-11-19": {
            "1. open": "150.8800",
            "2. high": "151.3300",
            "3. low": "150.1950",
            "4. close": "150.3900",
            "5. volume": "23960164"
        },
        "2019-11-18": {
            "1. open": "150.0700",
            "2. high": "150.5500",
            "3. low": "148.9800",
            "4. close": "150.3400",
            "5. volume": "21554762"
        },
        "2019-11-15": {
            "1. open": "148.9300",
            "2. high": "149.9900",
            "3. low": "148.2700",
            "4. close": "149.9700",
            "5. volume": "23508807"
        },
        "2019-11-14": {
            "1. open": "147.0200",
            "2. high": "148.4100",
            "3. low": "147.0000",
            "4. close": "148.0600",
            "5. volume": "19755100"
        },
        "2019-11-13": {
            "1. open": "146.7400",
            "2. high": "147.4625",
            "3. low": "146.2800",
            "4. close": "147.3100",
            "5. volume": "17444230"
        },
        "2019-11-12": {
            "1. open": "146.2800",
            "2. high": "147.5700",
            "3. low": "146.0600",
            "4. close": "147.0700",
            "5. volume": "18648712"
        },
        "2019-11-11": {
            "1. open": "145.3400",
            "2. high": "146.4200",
            "3. low": "144.7300",
            "4. close": "146.1100",
            "5. volume": "14370178"
        },
        "2019-11-08": {
            "1. open": "143.9800",
            "2. high": "145.9900",
            "3. low": "143.7600",
            "4. close": "145.9600",
            "5. volume": "16752939"
        },
        "2019-11-07": {
            "1. open": "143.8400",
            "2. high": "144.8800",
            "3. low": "143.7700",
            "4. close": "144.2600",
            "5. volume": "17786715"
        },
        "2019-11-06": {
            "1. open": "144.3700",
            "2. high": "144.5200",
            "3. low": "143.2000",
            "4. close": "144.0600",
            "5. volume": "16575798"
        },
        "2019-11-05": {
            "1. open": "144.9700",
            "2. high": "145.0200",
            "3. low": "143.9050",
            "4. close": "144.4600",
            "5. volume": "18250172"
        },
        "2019-11-04": {
            "1. open": "144.8300",
            "2. high": "145.0000",
            "3. low": "144.1600",
            "4. close": "144.5500",
            "5. volume": "16911999"
        },
        "2019-11-01": {
            "1. open": "144.2600",
            "2. high": "144.4200",
            "3. low": "142.9650",
            "4. close": "143.7200",
            "5. volume": "33128366"
        },
        "2019-10-31": {
            "1. open": "144.9000",
            "2. high": "144.9300",
            "3. low": "142.9900",
            "4. close": "143.3700",
            "5. volume": "24605135"
        },
        "2019-10-30": {
            "1. open": "143.5200",
            "2. high": "145.0000",
            "3. low": "142.7900",
            "4. close": "144.6100",
            "5. volume": "18496591"
        },
        "2019-10-29": {
            "1. open": "144.0800",
            "2. high": "144.5000",
            "3. low": "142.6500",
            "4. close": "142.8300",
            "5. volume": "20589469"
        },
        "2019-10-28": {
            "1. open": "144.4000",
            "2. high": "145.6700",
            "3. low": "143.5100",
            "4. close": "144.1900",
            "5. volume": "34912902"
        },
        "2019-10-25": {
            "1. open": "139.3400",
            "2. high": "141.1400",
            "3. low": "139.2000",
            "4. close": "140.7300",
            "5. volume": "25959724"
        },
        "2019-10-24": {
            "1. open": "139.3900",
            "2. high": "140.4200",
            "3. low": "138.6700",
            "4. close": "139.9400",
            "5. volume": "37278399"
        },
        "2019-10-23": {
            "1. open": "136.8800",
            "2. high": "137.4500",
            "3. low": "135.6100",
            "4. close": "137.2400",
            "5. volume": "31380309"
        },
        "2019-10-22": {
            "1. open": "138.9700",
            "2. high": "140.0100",
            "3. low": "136.2600",
            "4. close": "136.3700",
            "5. volume": "27935270"
        },
        "2019-10-21": {
            "1. open": "138.4500",
            "2. high": "138.5000",
            "3. low": "137.0100",
            "4. close": "138.4300",
            "5. volume": "20078066"
        },
        "2019-10-18": {
            "1. open": "139.7600",
            "2. high": "140.0000",
            "3. low": "136.5600",
            "4. close": "137.4100",
            "5. volume": "30650850"
        },
        "2019-10-17": {
            "1. open": "140.9500",
            "2. high": "141.4200",
            "3. low": "139.0200",
            "4. close": "139.6900",
            "5. volume": "22102797"
        },
        "2019-10-16": {
            "1. open": "140.7900",
            "2. high": "140.9900",
            "3. low": "139.5300",
            "4. close": "140.4100",
            "5. volume": "20841687"
        },
        "2019-10-15": {
            "1. open": "140.0600",
            "2. high": "141.7900",
            "3. low": "139.8100",
            "4. close": "141.5750",
            "5. volume": "19917762"
        },
        "2019-10-14": {
            "1. open": "139.6900",
            "2. high": "140.2900",
            "3. low": "139.5200",
            "4. close": "139.5500",
            "5. volume": "13591639"
        },
        "2019-10-11": {
            "1. open": "140.1200",
            "2. high": "141.0300",
            "3. low": "139.5000",
            "4. close": "139.6800",
            "5. volume": "25551065"
        },
        "2019-10-10": {
            "1. open": "138.4900",
            "2. high": "139.6699",
            "3. low": "138.2500",
            "4. close": "139.1000",
            "5. volume": "18396605"
        },
        "2019-10-09": {
            "1. open": "137.4600",
            "2. high": "138.7000",
            "3. low": "136.9700",
            "4. close": "138.2400",
            "5. volume": "20178482"
        },
        "2019-10-08": {
            "1. open": "137.0800",
            "2. high": "137.7600",
            "3. low": "135.6200",
            "4. close": "135.6700",
            "5. volume": "26783336"
        },
        "2019-10-07": {
            "1. open": "137.1400",
            "2. high": "138.1800",
            "3. low": "137.0200",
            "4. close": "137.1200",
            "5. volume": "16601284"
        },
        "2019-10-04": {
            "1. open": "136.7500",
            "2. high": "138.2500",
            "3. low": "136.4200",
            "4. close": "138.1200",
            "5. volume": "23839548"
        },
        "2019-10-03": {
            "1. open": "134.9500",
            "2. high": "136.7500",
            "3. low": "133.2200",
            "4. close": "136.2800",
            "5. volume": "26379798"
        },
        "2019-10-02": {
            "1. open": "136.2500",
            "2. high": "136.3700",
            "3. low": "133.5799",
            "4. close": "134.6500",
            "5. volume": "32001763"
        },
        "2019-10-01": {
            "1. open": "139.6600",
            "2. high": "140.2500",
            "3. low": "137.0000",
            "4. close": "137.0700",
            "5. volume": "22581929"
        },
        "2019-09-30": {
            "1. open": "138.0500",
            "2. high": "139.2150",
            "3. low": "137.7800",
            "4. close": "139.0300",
            "5. volume": "18430390"
        },
        "2019-09-27": {
            "1. open": "140.1500",
            "2. high": "140.3600",
            "3. low": "136.6450",
            "4. close": "137.7300",
            "5. volume": "22498958"
        },
        "2019-09-26": {
            "1. open": "139.4400",
            "2. high": "140.1800",
            "3. low": "138.4400",
            "4. close": "139.5400",
            "5. volume": "17813512"
        },
        "2019-09-25": {
            "1. open": "137.5000",
            "2. high": "139.9580",
            "3. low": "136.0300",
            "4. close": "139.3600",
            "5. volume": "22544054"
        },
        "2019-09-24": {
            "1. open": "140.3600",
            "2. high": "140.6900",
            "3. low": "136.8800",
            "4. close": "137.3800",
            "5. volume": "30016670"
        },
        "2019-09-23": {
            "1. open": "139.2300",
            "2. high": "139.6300",
            "3. low": "138.4400",
            "4. close": "139.1400",
            "5. volume": "17408374"
        },
        "2019-09-20": {
            "1. open": "141.0100",
            "2. high": "141.6500",
            "3. low": "138.2500",
            "4. close": "139.4400",
            "5. volume": "40040766"
        },
        "2019-09-19": {
            "1. open": "140.3000",
            "2. high": "142.3700",
            "3. low": "140.0736",
            "4. close": "141.0700",
            "5. volume": "36095413"
        },
        "2019-09-18": {
            "1. open": "137.3600",
            "2. high": "138.6700",
            "3. low": "136.5299",
            "4. close": "138.5200",
            "5. volume": "24473386"
        },
        "2019-09-17": {
            "1. open": "136.9600",
            "2. high": "137.5200",
            "3. low": "136.4250",
            "4. close": "137.3900",
            "5. volume": "17976285"
        },
        "2019-09-16": {
            "1. open": "135.8300",
            "2. high": "136.7000",
            "3. low": "135.6600",
            "4. close": "136.3300",
            "5. volume": "16731440"
        },
        "2019-09-13": {
            "1. open": "137.7800",
            "2. high": "138.0600",
            "3. low": "136.5700",
            "4. close": "137.3200",
            "5. volume": "23363057"
        },
        "2019-09-12": {
            "1. open": "137.8500",
            "2. high": "138.4200",
            "3. low": "136.8700",
            "4. close": "137.5200",
            "5. volume": "27009981"
        },
        "2019-09-11": {
            "1. open": "135.9100",
            "2. high": "136.2700",
            "3. low": "135.0900",
            "4. close": "136.1200",
            "5. volume": "24726117"
        },
        "2019-09-10": {
            "1. open": "136.8000",
            "2. high": "136.8862",
            "3. low": "134.5100",
            "4. close": "136.0800",
            "5. volume": "28903378"
        },
        "2019-09-09": {
            "1. open": "139.5900",
            "2. high": "139.7500",
            "3. low": "136.4600",
            "4. close": "137.5200",
            "5. volume": "25773932"
        },
        "2019-09-06": {
            "1. open": "140.0300",
            "2. high": "140.1800",
            "3. low": "138.2000",
            "4. close": "139.1000",
            "5. volume": "20824504"
        },
        "2019-09-05": {
            "1. open": "139.1100",
            "2. high": "140.3837",
            "3. low": "138.7600",
            "4. close": "140.0500",
            "5. volume": "26119520"
        },
        "2019-09-04": {
            "1. open": "137.3000",
            "2. high": "137.6900",
            "3. low": "136.4800",
            "4. close": "137.6300",
            "5. volume": "18015310"
        },
        "2019-09-03": {
            "1. open": "136.6100",
            "2. high": "137.2000",
            "3. low": "135.7000",
            "4. close": "136.0400",
            "5. volume": "18880773"
        },
        "2019-08-30": {
            "1. open": "139.1500",
            "2. high": "139.1800",
            "3. low": "136.2700",
            "4. close": "137.8600",
            "5. volume": "23946123"
        },
        "2019-08-29": {
            "1. open": "137.2500",
            "2. high": "138.4400",
            "3. low": "136.9100",
            "4. close": "138.1200",
            "5. volume": "20179716"
        },
        "2019-08-28": {
            "1. open": "134.8800",
            "2. high": "135.7600",
            "3. low": "133.5500",
            "4. close": "135.5600",
            "5. volume": "17343042"
        },
        "2019-08-27": {
            "1. open": "136.3900",
            "2. high": "136.7200",
            "3. low": "134.6600",
            "4. close": "135.7400",
            "5. volume": "23115635"
        },
        "2019-08-26": {
            "1. open": "134.9900",
            "2. high": "135.5600",
            "3. low": "133.9000",
            "4. close": "135.4500",
            "5. volume": "20325271"
        },
        "2019-08-23": {
            "1. open": "137.1897",
            "2. high": "138.3500",
            "3. low": "132.8000",
            "4. close": "133.3900",
            "5. volume": "38515386"
        },
        "2019-08-22": {
            "1. open": "138.6600",
            "2. high": "139.2000",
            "3. low": "136.2900",
            "4. close": "137.7800",
            "5. volume": "18709662"
        },
        "2019-08-21": {
            "1. open": "138.5500",
            "2. high": "139.4935",
            "3. low": "138.0000",
            "4. close": "138.7900",
            "5. volume": "14982314"
        },
        "2019-08-20": {
            "1. open": "138.2100",
            "2. high": "138.7100",
            "3. low": "137.2400",
            "4. close": "137.2600",
            "5. volume": "21188998"
        },
        "2019-08-19": {
            "1. open": "137.8550",
            "2. high": "138.5500",
            "3. low": "136.8850",
            "4. close": "138.4100",
            "5. volume": "24370543"
        },
        "2019-08-16": {
            "1. open": "134.8800",
            "2. high": "136.4600",
            "3. low": "134.7200",
            "4. close": "136.1300",
            "5. volume": "25026151"
        },
        "2019-08-15": {
            "1. open": "134.3900",
            "2. high": "134.5800",
            "3. low": "132.2500",
            "4. close": "133.6800",
            "5. volume": "28125416"
        },
        "2019-08-14": {
            "1. open": "136.3600",
            "2. high": "136.9200",
            "3. low": "133.6700",
            "4. close": "133.9800",
            "5. volume": "32527251"
        }
    }
}

let chartObject = {
    bindto: '#stock-chart',
    size: {
        height: 240,
        width: 320
    },
    data: {
        x: 'date',
        columns: [
            ['date', 10, 30, 45, 50, 70, 100],
            ['data1', 30, 200, 100, 400, 150, 250],
        ]
    },
    axis: {
        x: {
            type: 'timeseries'
        }
    },
    regions: [{start: '2019-08-14', end: '2020-01-06'}]
}
let c3ChartRef
const newChart = (chartData) =>
{
    c3ChartRef = c3.generate(chartData);
}

newChart(chartObject)
let currentChartData = 'data1'

const prepareDataForChart = (dataForPrep) =>
{
    // let metaData = dataForPrep['Meta Data']
    // delete dataForPrep['Meta Data']
    //console.log("Data for prep")
    //console.log(dataForPrep)

    data = dataForPrep['Time Series (Daily)']
    let axisArray = ['date']
    let dataArray = [dataForPrep['Meta Data']["2. Symbol"]]
    Object.keys(dataForPrep['Time Series (Daily)']).forEach(date => {
        //console.log(date)
        axisArray.push(date)
        //console.log(parseFloat(data[date]["4. close"]))
        dataArray.push(parseFloat(data[date]["4. close"]))
    })

    let columns = {
        columns: [
            axisArray,
            dataArray
        ],
        unload: currentChartData
    }

    // let columns2 = {
    //     columns: [
    //         ['data1', 130, 120, 150, 140, 160, 150],
    //         ['data4', 30, 20, 50, 40, 60, 50],
    //     ],
    //     unload: ['data2', 'data3'],
    // }

    //console.log(columns)
    c3ChartRef.load(columns)
    currentChartData = dataForPrep['Meta Data']["2. Symbol"]
}


//chart.data.columns = prepareDataForChart(data)


//////////////////////////////////////////////////////////////////////////
// Portfolio Sub-Elements Functions

const buildPortfolioStock = (newSymbol, newName, newVolume, newSingleValue, newCurrency) =>
{
    let newStock = {
        symbol: newSymbol,
        name: newName
    }

    let newPortfolioStock = {
        stock: newStock,
        volume: newVolume,
        singleValue: newSingleValue,
        totalValue: 0,
        valueTime: "",
        currency: newCurrency
    }

    newPortfolioStock.totalValue = newPortfolioStock.volume * newPortfolioStock.singleValue
    newPortfolioStock.valueTime = Date.now()

    return newPortfolioStock
}

//////////////////////////////////////////////////////////////////////////
// Misc Util Functions


const buildTableRowElement = (tableElementObject) =>
{
    let rowElement = document.createElement('div')
    rowElement.classList.add('Rtable-cell')

    Object.keys(tableElementObject).forEach(keyName => {

        let keyValue = tableElementObject[keyName]

        if (keyName == "clickEvent")
        {
            rowElement.addEventListener('click', keyValue)
        } else if (keyName.includes('domDataSet'))
        {
            rowElement.setAttribute("data-" + keyValue[0], keyValue[1]);
        } else
        {
            let rowSubElement = document.createElement('div')
            rowSubElement.classList.add(keyName)
            rowSubElement.innerHTML = keyValue
            if (keyValue != "")
            {
                rowElement.append(rowSubElement)
            }
        }
    })

    return rowElement
}

function findStockIndexInPortfolio(symbol)
{
    let stockToFindIndex = -1
    let index = 0
    portfolio.currentlyOwnedStocks.forEach(ownedStock => {
        // console.log("ownedStock.stock.symbol")
        // console.log(ownedStock.stock.symbol)
        // console.log(symbol)
        if (ownedStock.stock.symbol == symbol)
        {
            // console.log("found symbol")
            stockToFindIndex = index
        }
        index++
    })
    return stockToFindIndex
}

const addStock = (stockToAdd) =>
{
    // console.log("add stock")
    // console.log(stockToAdd.stock.symbol)
    let index = findStockIndexInPortfolio(stockToAdd.stock.symbol)
    // console.log("index:"+index)
    let returnValue = -1
    if (index >= 0)
    {
        let stockIndex = findStockIndexInPortfolio(stockToAdd.stock.symbol)
        if (stockIndex >= 0)
        {
            portfolio.currentlyOwnedStocks[stockIndex].volume += stockToAdd.volume
            returnValue = 2
        }

    } else if (portfolio.currentlyOwnedStocks.length >= maxStocks)
    {
        returnValue = -1
    } else
    {
        portfolio.currentlyOwnedStocks.push(stockToAdd)
        returnValue = 1
    }
    // console.log("return value:"+returnValue)

    return returnValue
}

const removeStock = (stockToRemove) => {

    // console.log('removeStock')
    // console.log(stockToRemove)
    // console.log(portfolio.currentlyOwnedStocks)
    let stockIndex = findStockIndexInPortfolio(stockToRemove.stock.symbol)
    if (stockIndex >= 0)
    {
        // console.log('removing stock')
        portfolio.currentlyOwnedStocks[stockIndex].volume -= stockToRemove.volume
        if (portfolio.currentlyOwnedStocks[stockIndex].volume <= 0)
        {
            portfolio.currentlyOwnedStocks.splice(stockIndex, 1)
        }
    } else
    {
        console.log("Stock not owned")
    }
}

const getTimeSeries = (symbol) => {
    let queryString = buildDailyTimeSeriesQueryString(symbol)
    //console.log(queryString)
    collectResults(queryString, prepareDataForChart, 3600)
}


const buildQuoteQueryString = (symbol) => {
    return `${baseURL}${quoteFunction}${quoteSymbol}${symbol}${apiKey}`
}

const buildBCQuoteQueryString = (symbol) => {
    return `${BCbaseURL}${symbol}${BCapiKey}`
}

const buildDailyTimeSeriesQueryString = (symbol) => {
    return `${baseURL}${dailyFunction}${quoteSymbol}${symbol}${outputSize}${apiKey}`
}

//////////////////////////////////////////////////////////////////////////
// Render Functions

const renderSearchResults = results =>
{
    let main = document.querySelector('#main-results')
    main.innerHTML = ""
    currentSearchedStocks = results.bestMatches;
    let index = 0
    currentSearchSymbolLookup = {}
    let stockSearchHeader = buildTableRowElement({searchHeader: "Search results"})
    main.append(stockSearchHeader)

    // console.log(results)
    if (results.bestMatches.length > 0)
    {
        results.bestMatches.forEach(match => {
            let rowElementObject = {
                clickEvent: searchResultClick,
                domDataSet1: ['symbol', match["1. symbol"]],
                domDataSet2: ['name', match["2. name"]],
                searchSymbol: match["1. symbol"],
                searchName: match["2. name"]
            }

            let stockSearchMatch = buildTableRowElement(rowElementObject)
            currentSearchSymbolLookup[match["1. symbol"]] = index
            main.append(stockSearchMatch)
            index++
        })
    } else
    {
        let noResults1 = buildTableRowElement({portfolio: "There were no search results for that query"})
        main.append(noResults1)
    }
}

const renderQuoteResults = results =>
{

    // Specifically for when someone clicks on a search result

    currentSelectedStock = {}

    // Stock symbol
    let slideOutTitle = document.querySelector('#slide-out-title')
    currentSelectedStock.symbol = results['Global Quote']['01. symbol']
    slideOutTitle.innerHTML = currentSelectedStock.symbol

    // Stock Company Name
    let slideOutSummary = document.querySelector('#slide-out-summary')
    let symbolNameIndex = currentSearchSymbolLookup[results['Global Quote']['01. symbol']]
    let symbolName = currentSearchedStocks[symbolNameIndex]['2. name']
    currentSelectedStock.name = symbolName
    slideOutSummary.innerHTML = currentSelectedStock.name

    // Stock owned
    let slideOutAmountOwned = document.querySelector('#slide-out-amount-owned')
    let index = findStockIndexInPortfolio(currentSelectedStock.symbol)
    let volume = 0
    if (index >= 0)
    {
        volume = portfolio.currentlyOwnedStocks[index].volume
        document.querySelector('#stock-chart').style.display = 'inline'
        getTimeSeries(currentSelectedStock.symbol)
    } else
    {
        // hide chart if no stock owned
        // mainly to keep API calls low 
        document.querySelector('#stock-chart').style.display = 'none'
    }
    currentSelectedStock.volume = volume
    slideOutAmountOwned.innerHTML = currentSelectedStock.volume


    // Currency
    let slideOutCurrencyList = document.querySelectorAll('.slide-out-currency')
    let symbolCurrency = currentSearchedStocks[symbolNameIndex]['8. currency']
    currentSelectedStock.currency = symbolCurrency
    slideOutCurrencyList.forEach(slideOutCurrency => {
        slideOutCurrency.innerHTML = currentSelectedStock.currency
    })

    // Stock Buy Price
    let slideOutBuyPrice = document.querySelector('#slide-out-buy-price')
    currentSelectedStock.price = results['Global Quote']['05. price']
    slideOutBuyPrice.innerHTML = formatCurrencyText(currentSelectedStock.price)

    // Stock Sell Price
    let slideOutSellPrice = document.querySelector('#slide-out-sell-price')
    slideOutSellPrice.innerHTML = formatCurrencyText(currentSelectedStock.price)

}

const renderPortfolio = portfolio =>
{
    portfolioFn.refreshTotalValue()
    let cashDiv = document.querySelector("#cash")
    // let totalValueDiv = document.querySelector("#total-value")
    cashDiv.innerHTML = formatCurrencyText(portfolioFn.getCashBalance())
    //totalValueDiv.innerHTML = portfolioFn.getTotalValue()
    // update total value in another location

    let main = document.querySelector('#main-results')
    main.innerHTML = ""


    let portfolioHeader = buildTableRowElement({portfolioHeader: "Your Stocks"})
    main.append(portfolioHeader)
    if (portfolio.currentlyOwnedStocks.length > 0)
    {
        let index = 0
        portfolio.currentlyOwnedStocks.forEach(ownedStock => {
            if (ownedStock.totalValue == null)
            {
                console.log(ownedStock)
            }
            let rowElementObject = {
                clickEvent: portfolioStockClick,
                domDataSet1: ['symbol', ownedStock.stock.symbol],
                domDataSet2: ['name', ownedStock.stock.name],
                domDataSet3: ['index', index],
                portfolioSymbol: ownedStock.stock.symbol,
                portfolioName: ownedStock.stock.name,
                portfolioValue: formatCurrencyText(ownedStock.totalValue),
                portfolioVolume: ownedStock.volume
            }
            index++
            let stockSearchMatch = buildTableRowElement(rowElementObject)
            main.append(stockSearchMatch)
        })
    } else
    {
        let noStock1 = buildTableRowElement({portfolio: "You do not have any stocks in your portfolio at present =("})
        main.append(noStock1)
        let noStock2 = buildTableRowElement({portfolio: "Use the search function to find stocks to buy and sell"})
        main.append(noStock2)
    }
}

const renderPortfolioStock = (selectedStock) =>
{
    currentSelectedStock = {}

    // Stock symbol
    let slideOutTitle = document.querySelector('#slide-out-title')
    currentSelectedStock.symbol = selectedStock.stock.symbol
    slideOutTitle.innerHTML = currentSelectedStock.symbol

    // Stock Company Name
    let slideOutSummary = document.querySelector('#slide-out-summary')
    currentSelectedStock.name = selectedStock.stock.name
    slideOutSummary.innerHTML = currentSelectedStock.name

    // Stock owned
    let slideOutAmountOwned = document.querySelector('#slide-out-amount-owned')
    currentSelectedStock.volume = selectedStock.volume
    slideOutAmountOwned.innerHTML = currentSelectedStock.volume

    // display chart and update its data
    document.querySelector('#stock-chart').style.display = 'inline'
    getTimeSeries(currentSelectedStock.symbol)

    let slideOutCurrencyList = document.querySelectorAll('.slide-out-currency')
    currentSelectedStock.currency = selectedStock.currency
    slideOutCurrencyList.forEach(slideOutCurrency => {
        slideOutCurrency.innerHTML = currentSelectedStock.currency
    })

    // Stock Buy Price
    let slideOutBuyPrice = document.querySelector('#slide-out-buy-price')
    currentSelectedStock.price = selectedStock.singleValue
    slideOutBuyPrice.innerHTML = formatCurrencyText(currentSelectedStock.price)

    // Stock Sell Price
    let slideOutSellPrice = document.querySelector('#slide-out-sell-price')
    slideOutSellPrice.innerHTML = formatCurrencyText(currentSelectedStock.price)
}


//////////////////////////////////////////////////////////////////////////
// Event handler functions

const closeSlideOutClick = () =>
{
    document.querySelector('#slide-out-parent').classList.add('hidden')
}

const slideOutSellClick = (stock, amount) =>
{
    let soldStock = buildPortfolioStock(
        stock.symbol,
        stock.name,
        parseInt(amount),
        stock.price,
        stock.currency)

    // refresh stock total value before selling

    let hasEnoughToSell = portfolioFn.confirmStockBalance(stock.symbol, amount)
    if (hasEnoughToSell)
    {
        portfolioFn.updateCashBalance(soldStock.totalValue)
        removeStock(soldStock)
        saveLocalPortfolio()
        renderPortfolio(portfolio)
        if (findStockIndexInPortfolio(soldStock.stock.symbol) >= 0)
        {
            document.querySelector("#slide-out-amount-owned").innerHTML = portfolioFn.getStockBalance(soldStock.stock.symbol)
        } else
        {
            document.querySelector("#slide-out-amount-owned").innerHTML = 0
        }
    } else
    {
        console.log("Do not have enough to sell")
    }

}

const slideOutBuyClick = (stock, amount) =>
{
    let purchasedStock = buildPortfolioStock(
        stock.symbol,
        stock.name,
        parseInt(amount),
        stock.price,
        stock.currency)
    if (portfolioFn.canAfford(purchasedStock.totalValue))
    {
        let addStockSuccess = addStock(purchasedStock)
        if (addStockSuccess > 0)
        {
            portfolioFn.updateCashBalance(-purchasedStock.totalValue)
            saveLocalPortfolio()
            renderPortfolio(portfolio)
            document.querySelector("#slide-out-amount-owned").innerHTML = portfolioFn.getStockBalance(purchasedStock.stock.symbol)
        } else
        {
            console.log('Was not able to purchase stock due to portfolio max stock limit of ' + maxStocks)
        }
    } else
    {
        console.log('Was not able to afford stock')
    }


}

const portfolioStockClick = (event) =>
{
    document.querySelector('#slide-out-parent').classList.remove('hidden')
    let index = event.currentTarget.dataset.index
    renderPortfolioStock(portfolio.currentlyOwnedStocks[index])
}

const searchResultClick = (event) =>
{
    // https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=MSFT&apikey=SI7NQQ7U40XVI2K7
    document.querySelector('#slide-out-parent').classList.remove('hidden')
    let symbol = event.currentTarget.dataset.symbol
    //let queryString = `${baseURL}${quoteFunction}${quoteSymbol}${symbol}${apiKey}`
    let queryString = buildQuoteQueryString(symbol)
    collectResults(queryString, renderQuoteResults)
}

const searchButtonClick = symbolSearchText =>
{
    // https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=Micro&apikey=SI7NQQ7U40XVI2K7
    let queryString = `${baseURL}${searchFunction}${searchKeyword}${symbolSearchText}${apiKey}`
    collectResults(queryString, renderSearchResults)
}

const portfolioClick = () =>
{
    renderPortfolio(portfolio)
}

const menuClick = () =>
{
    document.querySelector('#dialog-box-parent').style.display = 'flex'
    document.querySelector('#main-menu').style.display = 'flex'
}

const restartGameClick = () =>
{
    deleteLocalPortfolio()
    gameInProgress = false
    loadLocalPortfolio()
    document.querySelector('#dialog-box-parent').style.display = 'flex'
    document.querySelector('#onboarding').style.display = 'flex'
    document.querySelector('#main-menu').style.display = 'none'
}

const closeMenuClick = () =>
{
    document.querySelector('#dialog-box-parent').style.display = 'none'
    document.querySelector('#main-menu').style.display = 'none'
}

// const timeSeries = symbol =>
// {
//     // get example time series request
//     let queryString = `${baseURL}${timeFunction}${timeSymbol}${symbol}${timeInterval}${apiKey}`
//     collectResults(symbolSearchText, renderSearchResults)
// }


//////////////////////////////////////////////////////////////////////////
// Axios Data Collection Function
//
// Caching ideas from: https://www.sitepoint.com/cache-fetched-ajax-requests/
// querystring is the full query string to be given to axios
// renderfunction is the function to call and pass the data to
// cachetime seconds until cache should be treated as expired
// cachetime will directly influence the expiry timestamp of the cache item.
// cachetime default is 5 mins (300), 0 means don't cache
// temp bumped cache to 3000 seconds (50 minutes) to minimize hits on API


const collectResults = async (queryString, renderFunction, cacheTime = 300) =>
{
    try
    {
        let data // final data from cache or live API call
        let cache = sessionStorage.getItem(queryString)
        let expire = sessionStorage.getItem(queryString + "-expire")
        let now = Date.now()
        let expiryMS = now - expire
        // console.log("expire check:"+expire)
        // console.log("now check:"+Date.now())
        // console.log("now < expire check:"+ (Date.now() < expire))
        // console.log("now - expire check:"+ (Date.now() - expire))
        // console.log(expiryMS)
        if (cache !== null && expiryMS < 0)
        {
            data = JSON.parse(cache)
            console.log("Cached API Request. Cache expires in " + (-expiryMS / 1000) + " seconds")
        } else
        {
            let results = await axios.get(queryString)
            let resultsData
            if(results.data != null)
            {
                resultsData = results.data
                // Specifically coded earlier on to support AlphaVantage Data Structure
            }
            else
            {
                resultsData = results
                // Added later to remove the dependancy on Alphavantage data Structure
            }

            sessionStorage.setItem(queryString, JSON.stringify(resultsData))
            if (cacheTime != 0)
            {
                let expire = now + cacheTime * 1000
                // console.log("Now:"+Date.now())
                // console.log("Expire:"+expire)
                sessionStorage.setItem(queryString + "-expire", expire)
            }
            data = resultsData
            console.log("Live API Request")
        }

        renderFunction(data)

    } catch (error)
    {
        console.log(error)
    }
}

//////////////////////////////////////////////////////////////////////////
// Add Event Listeners


const setEventListeners = () =>
{
    // Toolbox search button event listener
    let searchText = document.querySelector('#search-text')
    let searchButton = document.querySelector('#search-button')
    searchButton.addEventListener('click', (e) => {
        e.preventDefault()
        searchButtonClick(searchText.value)
        searchText.value = ""
    })

    // Slide out close button event listener
    let slideOutClose = document.querySelector('#slide-out-close')
    slideOutClose.addEventListener('click', closeSlideOutClick)

    // Slide out buy button event listener
    let slideOutBuy = document.querySelector('#slide-out-buy')
    let slideOutBuyAmount = document.querySelector("#slide-out-buy-amount")
    slideOutBuy.addEventListener('click', (e) => {
        e.preventDefault()
        slideOutBuyClick(currentSelectedStock, slideOutBuyAmount.value)
        slideOutBuyAmount.value = ""
    })

    // Slide out buy button event listener
    let slideOutSell = document.querySelector('#slide-out-sell')
    let slideOutSellAmount = document.querySelector("#slide-out-sell-amount")
    slideOutSell.addEventListener('click', (e) => {
        e.preventDefault()
        slideOutSellClick(currentSelectedStock, slideOutSellAmount.value)
        slideOutSellAmount.value = ""
    })

    // Total Value refresh button event listener
    let totalValueRefresh = document.querySelector('#total-value-refresh')
    totalValueRefresh.addEventListener('click', (e) => {
        e.preventDefault()
        portfolioFn.refreshTotalValue()
    })

    // Portfolio Button
    let portfolioButton = document.querySelector('#portfolio')
    portfolioButton.addEventListener('click', (e) => {
        e.preventDefault()
        portfolioClick()
    })

    let onboardingButtons = document.querySelectorAll('.onboard-start-buttons')
    onboardingButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault()
            let startCash = parseInt(e.currentTarget.dataset.amount)
            portfolioFn.updateCashBalance(startCash)
            beginGame()
        })
    })

    let menuButton = document.querySelector('#menu-button')
    menuButton.addEventListener('click', menuClick)

    let restartGameButton = document.querySelector('#restart-game')
    restartGameButton.addEventListener('click', restartGameClick)

    let closeMenuButton = document.querySelector('#close-menu')
    closeMenuButton.addEventListener('click', closeMenuClick)
}

const initAppSetup = () =>
{


    PNotify.defaults.icons = 'fontawesome5';
    PNotify.defaults.width = window.innerWidth - 30 + 'px'
    PNotify.defaults.modules = {
        Buttons: {
            closer: true,
            closerHover: false,
            sticker: false
        },
        Mobile: {

            swipeDismiss: true,
            styling: false
        }
    }

}

let PNstack = {
    dir1: 'up', // With a dir1 of 'up', the stacks will start appearing at the bottom.
    // Without a `dir2`, this stack will be horizontally centered, since the `dir1` axis is vertical.
    firstpos1: 100, // The notices will appear 25 pixels from the bottom of the context.
    spacing1: 5,
    // Without a `spacing1`, this stack's notices will be placed 25 pixels apart.
    push: 'top', // Each new notice will appear at the bottom of the screen, which is where the 'top' of the stack is. Other notices will be pushed up.
    // modal: true, // When a notice appears in this stack, a modal overlay will be created.
    overlayClose: true, // When the user clicks on the overlay, all notices in this stack will be closed.
    context: document.getElementById('main')
}

// Game Flow Functions

const beginGame = () =>
{
    gameInProgress = true
    document.querySelector('#onboarding').style.display = 'none'
    document.querySelector('#dialog-box-parent').style.display = 'none'
    renderPortfolio(portfolio)
    PNotify.alert({text: 'Welcome', stack: PNstack})
    setTimeout(() => {
        PNotify.alert({text: 'Search for stock using the search bar', stack: PNstack})
    }, 1000)
}

setEventListeners()
initAppSetup()
loadLocalPortfolio()