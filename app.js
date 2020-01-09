//////////////////////////////////////////////////////////////////////////

// Query strings

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
let alphavantageAPIForRefresh = false
let BCbaseURL = 'https://marketdata.websol.barchart.com/getQuote.json?symbols='
let BCapiKey = '&apikey=da4f1b3d039f0de403eea5e45b14814a'

//////////////////////////////////////////////////////////////////////////

// Global Variables

let gameInProgress = false
let currentSelectedStock
let currentSearchedStocks
let currentSearchSymbolLookup
let refreshRate = 300 // refresh rate in seconds to update portfolio value
let maxStocks = 20

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
        // console.log("calc total value ran")
        document.querySelector('#total-value').innerHTML = formatCurrencyText(portfolio.totalValue)

        // let timeFormatOptions = { timeZone: "America/New_York", timeZoneName: 'short' }
        // let datetimenow = Date.now()
        // document.querySelector('#time-value').innerHTML = datetimenow.toLocaleString('en-US',timeFormatOptions)
    },
    refreshTotalValue: () =>
    {
        if (portfolio.currentlyOwnedStocks.length > 0)
        {

            if (alphavantageAPIForRefresh)
            {
                portfolio.currentlyOwnedStocks.forEach(ownedStock => {
                    let queryString = buildQuoteQueryString(ownedStock.stock.symbol)
                    collectResults(queryString, portfolioFn.refreshIndividualStockValue, 600)
                })
            } else
            {
                console.log("Total refresh using BC")
                let symbolString = ""
                let ownedStockLength = portfolio.currentlyOwnedStocks.length
                let index = 0
                portfolio.currentlyOwnedStocks.forEach(ownedStock => {
                    symbolString += ownedStock.stock.symbol
                    if (index < ownedStockLength - 1)
                    {
                        symbolString += ","
                    }
                    index++
                })
                let queryString = buildBCQuoteQueryString(symbolString)

                collectResults(queryString, portfolioFn.refreshAllStockValues, 600)
            }
        } else
        {
            // not stocks owned
        }

    },
    refreshAllStockValues: (results) =>
    {
        results.results.forEach(symbol => {
            portfolioFn.setStockPrice(symbol.symbol, symbol.lastPrice)
        })
        portfolioFn.calcPortfolioTotalValue()
    },
    refreshIndividualStockValue: (results) =>
    {
        let symbol
        let newPrice

        if (alphavantageAPIForRefresh)
        {
            // Stock symbol
            symbol = results['Global Quote']['01. symbol']
            // Stock Buy Price
            newPrice = results['Global Quote']['05. price']

        } else
        {
            // should not run this function if using barcharts. 
            // Due to format of data 
            // refreshAllStockValues used
        }
        portfolioFn.setStockPrice(symbol, newPrice)

    },
    canAfford: (amount) =>
    {
        return amount < portfolioFn.getCashBalance()
    },
    confirmStockBalance: (symbol, amount) =>
    {
        return portfolioFn.getStockBalance(symbol) >= amount
    },
    getStockBalance: (symbol) =>
    {
        let index = findStockIndexInPortfolio(symbol)
        if (index >= 0)
        {
            if (portfolio.currentlyOwnedStocks[index].volume != null)
            {
                return portfolio.currentlyOwnedStocks[index].volume
            }
        } else
        {
            return -Infinity
        }
    }
}


const formatCurrencyText = (amount) =>
{
    amount = parseFloat(amount)
    let currencyFormatOptions = {currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2}
    let returnText = "$" + amount.toLocaleString('en-US', currencyFormatOptions)
    return returnText
}

//////////////////////////////////////////////////////////////////////////

// Portfolio Load/Save/Build Functions

const loadLocalPortfolio = () =>
{
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

const saveLocalPortfolio = () =>
{
    let portfolioString = JSON.stringify(portfolio)
    localStorage.setItem("main-portfolio", portfolioString)
}

const deleteLocalPortfolio = () =>
{
    delete portfolio
    localStorage.removeItem("main-portfolio")
}

const buildNewPortfolio = () =>
{
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

let chartObject =
    {
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
        colors: {data1: '#ffffff'},
        regions: [{start: '2019-08-15', end: '2020-01-07'}]
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


    data = dataForPrep['Time Series (Daily)']
    let axisArray = ['date']
    let dataArray = [dataForPrep['Meta Data']["2. Symbol"]]
    Object.keys(dataForPrep['Time Series (Daily)']).forEach(date => {
        axisArray.push(date)
        dataArray.push(parseFloat(data[date]["4. close"]))
    })

    let columns = {
        columns: [
            axisArray,
            dataArray
        ],
        unload: currentChartData
    }
    columns['colors'] = {}
    columns['colors'][dataForPrep['Meta Data']["2. Symbol"]] = '#ffffff'

    c3ChartRef.load(columns)
    currentChartData = dataForPrep['Meta Data']["2. Symbol"]
}

const resizeChart = (x, y) =>
{
    c3ChartRef.resize({height: y, width: x})
}


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

const returnTextAtSpecificLength = (text, length) =>
{

}

const returnToPortfolio = () =>
{
    renderPortfolio(portfolio)
}

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
        if (ownedStock.stock.symbol == symbol)
        {
            stockToFindIndex = index
        }
        index++
    })
    return stockToFindIndex
}

const addStock = (stockToAdd) =>
{
    let index = findStockIndexInPortfolio(stockToAdd.stock.symbol)
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

    return returnValue
}

const removeStock = (stockToRemove) =>
{
    let stockIndex = findStockIndexInPortfolio(stockToRemove.stock.symbol)
    if (stockIndex >= 0)
    {
        portfolio.currentlyOwnedStocks[stockIndex].volume -= stockToRemove.volume
        if (portfolio.currentlyOwnedStocks[stockIndex].volume <= 0)
        {
            portfolio.currentlyOwnedStocks.splice(stockIndex, 1)
        }
    } else
    {
        console.log("Stock not owned")
        easyPnotify("Stock not owned")
    }
}

const getTimeSeries = (symbol) =>
{
    let queryString = buildDailyTimeSeriesQueryString(symbol)
    collectResults(queryString, prepareDataForChart, 60000)
}

const buildQuoteQueryString = (symbol) =>
{
    return `${baseURL}${quoteFunction}${quoteSymbol}${symbol}${apiKey}`
}

const buildBCQuoteQueryString = (symbol) =>
{
    return `${BCbaseURL}${symbol}${BCapiKey}`
}

const buildDailyTimeSeriesQueryString = (symbol) =>
{
    return `${baseURL}${dailyFunction}${quoteSymbol}${symbol}${outputSize}${apiKey}`
}

const buildNewsQueryString = (searchTerms) =>
{
    return `https://newsapi.org/v2/everything?q=${searchTerms}&from=2020-01-08&sortBy=popularity&apiKey=4287cda86a9948c9b0c52cc90cf7c8c6`
}

const getNews = (searchTerms) =>
{
    let queryString = buildNewsQueryString(searchTerms)
    collectResults(queryString, renderNewsForSymbol, 36000)
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
    let stockSearchHeader = buildTableRowElement({portfolioHeader: "Search results"})
    stockSearchHeader.classList.add('Rtable-cell--head')
    main.append(stockSearchHeader)

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
        noResults1.classList.add('Rtable-cell--head')
        main.append(noResults1)
    }
    let returnToPortfolioRow = buildTableRowElement({portfolio: ""})
    returnToPortfolioRow.innerHTML = "<button id='close-search'>Close Search</button>"

    returnToPortfolioRow.classList.add('Rtable-cell--head')
    returnToPortfolioRow.style.alignSelf = 'center'
    main.append(returnToPortfolioRow)
    document.querySelector('#close-search').addEventListener('click', returnToPortfolio)
}

const renderQuoteResults = results =>
{
    currentSelectedStock = {}
    currentSelectedStock.symbol = results['Global Quote']['01. symbol']
    let symbolNameIndex = currentSearchSymbolLookup[results['Global Quote']['01. symbol']]
    let symbolName = currentSearchedStocks[symbolNameIndex]['2. name']
    currentSelectedStock.name = symbolName
    let index = findStockIndexInPortfolio(currentSelectedStock.symbol)
    let volume = 0
    if (index >= 0)
    {
        volume = portfolio.currentlyOwnedStocks[index].volume
    }
    currentSelectedStock.volume = volume
    let symbolCurrency = currentSearchedStocks[symbolNameIndex]['8. currency']
    currentSelectedStock.currency = symbolCurrency
    currentSelectedStock.price = results['Global Quote']['05. price']

    renderStock(currentSelectedStock)
}

const renderPortfolio = portfolio =>
{
    portfolioFn.refreshTotalValue()
    let cashDiv = document.querySelector("#cash")
    cashDiv.innerHTML = formatCurrencyText(portfolioFn.getCashBalance())

    let main = document.querySelector('#main-results')
    main.innerHTML = ""

    let portfolioHeader = buildTableRowElement({portfolioHeader: "Your Stocks"})
    portfolioHeader.classList.add('Rtable-cell--head')
    main.append(portfolioHeader)

    let headerRowElementObject = {
        portfolioSymbol: "Symbol",
        portfolioName: "Company",
        portfolioSingleValue: "Single Value",
        portfolioValue: "Total Value",
        portfolioVolume: "#"
    }


    if (portfolio.currentlyOwnedStocks.length > 0)
    {
        let headerRow = buildTableRowElement(headerRowElementObject)
        headerRow.classList.add('Rtable-cell--head')
        main.append(headerRow)
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
                portfolioSingleValue: formatCurrencyText(ownedStock.singleValue),
                portfolioValue: formatCurrencyText(ownedStock.totalValue),
                portfolioVolume: ownedStock.volume
            }
            index++
            let stockSearchMatch = buildTableRowElement(rowElementObject)
            main.append(stockSearchMatch)
        })
    } else
    {
        let noStock1 = buildTableRowElement({noPortfolio: "You do not have any stocks in your portfolio at present. Use the search function to find stocks to buy and sell"})
        noStock1.classList.add('Rtable-cell--head')
        main.append(noStock1)
    }
}

const renderPortfolioStock = (selectedStock) =>
{
    currentSelectedStock = {}

    currentSelectedStock.symbol = selectedStock.stock.symbol
    currentSelectedStock.name = selectedStock.stock.name
    currentSelectedStock.volume = selectedStock.volume
    currentSelectedStock.currency = selectedStock.currency
    currentSelectedStock.price = selectedStock.singleValue

    renderStock(currentSelectedStock)
}

const renderStock = (currentlySelectedStock) =>
{
    let slideOutTitle = document.querySelector('#slide-out-title')
    slideOutTitle.innerHTML = currentlySelectedStock.symbol

    let slideOutSummary = document.querySelector('#slide-out-summary')
    slideOutSummary.innerHTML = currentlySelectedStock.name

    let slideOutAmountOwned = document.querySelector('#slide-out-amount-owned')
    slideOutAmountOwned.innerHTML = currentlySelectedStock.volume

    document.querySelector('#stock-chart').style.display = 'flex'
    getTimeSeries(currentlySelectedStock.symbol)

    let slideOutCurrencyList = document.querySelectorAll('.slide-out-currency')
    slideOutCurrencyList.forEach(slideOutCurrency => {
        slideOutCurrency.innerHTML = currentlySelectedStock.currency
    })

    let slideOutBuyPrice = document.querySelector('#slide-out-buy-price')
    slideOutBuyPrice.innerHTML = formatCurrencyText(currentlySelectedStock.price)

    let slideOutSellPrice = document.querySelector('#slide-out-sell-price')
    slideOutSellPrice.innerHTML = formatCurrencyText(currentlySelectedStock.price)

    getNews(currentlySelectedStock.name)
}


const renderNewsForSymbol = (results) =>
{
    let newsPlace = document.querySelector('#slide-out-inner')
    if (results.articles.length > 1)
    {
        document.querySelector('#stock-new-title').classList.remove('hidden')
        document.querySelector('#slide-out-inner').classList.remove('hidden')
        newsPlace.innerHTML = `<div class='stock-news-title'>${results.articles[0].source.name}</div> <div class='stock-news-link'><a href='${results.articles[0].url}'> ${results.articles[0].title} </a></div>`
        newsPlace.innerHTML += `<div class='stock-news-title'>${results.articles[1].source.name}</div> <div class='stock-news-link'><a href='${results.articles[1].url}'> ${results.articles[1].title} </a></div>`
    } else if (results.articles.length > 0)
    {
        document.querySelector('#stock-new-title').classList.remove('hidden')
        document.querySelector('#slide-out-inner').classList.remove('hidden')
        newsPlace.innerHTML = `<div class='stock-news-title'>${results.articles[0].source.name}</div> <div class='stock-news-link'><a href='${results.articles[0].url}'> ${results.articles[0].title} </a></div>`
    }
}

//////////////////////////////////////////////////////////////////////////

// Event handler functions

const closeSlideOutClick = () =>
{
    document.querySelector('#slide-out-parent').classList.add('hidden')
    document.querySelector('#main-results').classList.remove('hidden')
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
            easyPnotify('You successfully sold some your stock for this symbol')
        } else
        {
            document.querySelector("#slide-out-amount-owned").innerHTML = 0
            easyPnotify('You successfully sold all your stock for this symbol')
        }
    } else
    {
        console.log("Do not have enough to sell")
        easyPnotify('Not enough stock to sell')
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
            easyPnotify('Congratz on buying some stock!')
        } else
        {
            console.log('Was not able to purchase stock due to portfolio max stock limit of ' + maxStocks)
            easyPnotify('Was not able to purchase stock due to portfolio max stock limit of ' + maxStocks)
        }
    } else
    {
        console.log('Was not able to afford stock')
        easyPnotify('Not enough funds to purchase stock')
    }
}

const portfolioStockClick = (event) =>
{
    document.querySelector('#slide-out-parent').classList.remove('hidden')
    document.querySelector('#main-results').classList.add('hidden')
    let index = event.currentTarget.dataset.index
    renderPortfolioStock(portfolio.currentlyOwnedStocks[index])
}

const searchResultClick = (event) =>
{
    // https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=MSFT&apikey=SI7NQQ7U40XVI2K7
    document.querySelector('#slide-out-parent').classList.remove('hidden')
    document.querySelector('#main-results').classList.add('hidden')
    let symbol = event.currentTarget.dataset.symbol
    //let queryString = `${baseURL}${quoteFunction}${quoteSymbol}${symbol}${apiKey}`
    let queryString = buildQuoteQueryString(symbol)
    collectResults(queryString, renderQuoteResults)
}

const searchButtonClick = symbolSearchText =>
{
    // https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=Micro&apikey=SI7NQQ7U40XVI2K7
    let queryString = `${baseURL}${searchFunction}${searchKeyword}${symbolSearchText}${apiKey}`
    collectResults(queryString, renderSearchResults, 60000)
}

// const portfolioClick = () =>
// {
//     renderPortfolio(portfolio)
//     document.querySelector('#main-results').classList.remove('hidden')
//     document.querySelector('#slide-out-parent').classList.remove('hidden')
//     document.querySelector('#dialog-parent').classList.remove('hidden')
// }

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
        if (cache !== null && expiryMS < 0)
        {
            data = JSON.parse(cache)
            console.log("Cached API Request. Cache expires in " + (-expiryMS / 1000) + " seconds")
        } else
        {
            let results = await axios.get(queryString)
            if (results.data != null)
            {
                sessionStorage.setItem(queryString, JSON.stringify(results.data))
                if (cacheTime != 0)
                {
                    let expire = now + cacheTime * 1000
                    sessionStorage.setItem(queryString + "-expire", expire)
                }
                data = results.data
                console.log("Live API Request")
            }
        }
        if (data != null)
        {
            renderFunction(data)
        } else
        {
            easyPnotify("Error: API did not return expected data, you may be over your limit. Try again in a minute")
        }

    } catch (error)
    {
        console.log(error)
        easyPnotify("Ruh Roh. Could not get the data dawg.")
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

    // // Total Value refresh button event listener
    // let totalValueRefresh = document.querySelector('#total-value-refresh')
    // totalValueRefresh.addEventListener('click', (e) => {
    //     e.preventDefault()
    //     portfolioFn.refreshTotalValue()
    // })

    // // Portfolio Button
    // let portfolioButton = document.querySelector('#portfolio')
    // portfolioButton.addEventListener('click', (e) => {
    //     e.preventDefault()
    //     portfolioClick()
    // })

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

    let logo = document.querySelector('#logo-text')
    logo.addEventListener('click', returnToPortfolio)

    window.addEventListener('resize', resizeWindow);
}

let PNstackMobile = {
    dir1: 'up', // With a dir1 of 'up', the stacks will start appearing at the bottom.
    // Without a `dir2`, this stack will be horizontally centered, since the `dir1` axis is vertical.
    firstpos1: 106, // The notices will appear 25 pixels from the bottom of the context.
    spacing1: 5,
    // Without a `spacing1`, this stack's notices will be placed 25 pixels apart.
    push: 'top', // Each new notice will appear at the bottom of the screen, which is where the 'top' of the stack is. Other notices will be pushed up.
    // modal: true, // When a notice appears in this stack, a modal overlay will be created.
    overlayClose: true, // When the user clicks on the overlay, all notices in this stack will be closed.
    context: document.getElementById('main')
}

let PNstackTablet = {
    dir1: 'down', // With a dir1 of 'up', the stacks will start appearing at the bottom.
    // Without a `dir2`, this stack will be horizontally centered, since the `dir1` axis is vertical.
    firstpos1: 105, // The notices will appear 25 pixels from the bottom of the context.
    spacing1: 5,
    // Without a `spacing1`, this stack's notices will be placed 25 pixels apart.
    push: 'top', // Each new notice will appear at the bottom of the screen, which is where the 'top' of the stack is. Other notices will be pushed up.
    // modal: true, // When a notice appears in this stack, a modal overlay will be created.
    overlayClose: true, // When the user clicks on the overlay, all notices in this stack will be closed.
    context: document.getElementById('main')
}

let PNstackLaptop = {
    dir1: 'down', // With a dir1 of 'up', the stacks will start appearing at the bottom.
    // Without a `dir2`, this stack will be horizontally centered, since the `dir1` axis is vertical.
    firstpos1: 105, // The notices will appear 25 pixels from the bottom of the context.
    spacing1: 5,
    // Without a `spacing1`, this stack's notices will be placed 25 pixels apart.
    push: 'top', // Each new notice will appear at the bottom of the screen, which is where the 'top' of the stack is. Other notices will be pushed up.
    // modal: true, // When a notice appears in this stack, a modal overlay will be created.
    overlayClose: true, // When the user clicks on the overlay, all notices in this stack will be closed.
    context: document.getElementById('main')
}

let notifyModel = 0

const resizeWindow = () =>
{
    PNotify.defaults.width = window.innerWidth - 30 + 'px'
    notifyModel = 0
    let chartX = window.innerWidth / 5 * 4
    let chartY = 240
    if (window.innerWidth > 800 && window.innerWidth < 1099)
    {
        notifyModel = 1
        chartX = window.innerWidth / 5 * 4
    } else if (window.innerWidth > 1100)
    {
        notifyModel = 2
        chartX = window.innerWidth / 4
    }
    resizeChart(chartX, chartY)

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


const easyPnotify = (messageText) =>
{
    let message = {}
    message.text = messageText
    if (notifyModel == 0)
    {
        message.stack = PNstackMobile
    } else if (notifyModel == 1)
    {
        message.stack = PNstackTablet
    } else if (notifyModel == 2)
    {
        message.stack = PNstackLaptop
    }
    PNotify.alert(message)
}


// Game Flow Functions

const beginGame = () =>
{
    gameInProgress = true
    document.querySelector('#onboarding').style.display = 'none'
    document.querySelector('#dialog-box-parent').style.display = 'none'
    renderPortfolio(portfolio)
    portfolioFn.calcPortfolioTotalValue()
    easyPnotify('Welcome')
    setTimeout(() => {
        easyPnotify('Search for stock using the search bar')
    }, 2000)
}

setEventListeners()
initAppSetup()
resizeWindow()
loadLocalPortfolio()