

let baseURL = 'https://www.alphavantage.co/query?'

// Time Series
let timeFunction = 'function=TIME_SERIES_INTRADAY'
let timeSymbol = '&symbol=' // plus symbol
let timeInterval = '&interval=5min'

// Symbol Search
let searchFunction = 'function=SYMBOL_SEARCH'
let searchKeyword = '&keywords=' // plus search keywords

// Global Quote
let quoteFunction = 'function=GLOBAL_QUOTE'
let quoteSymbol = '&symbol=' // plus symbol

// API Key
let apiKey = '&apikey=SI7NQQ7U40XVI2K7'


// Global Variables
let currentSelectedStock
let currentSearchedStocks
let currentSearchSymbolLookup

let portfolio = {}
let portfolioFn = {
    updateCashBalance: (adjustByAmount) =>
    {
        console.log("Adjust cash balance by:"+adjustByAmount)
        portfolio.cashBalance += adjustByAmount
    },
    getCashBalance: () =>
    {
        console.log("Get Cash Balance:"+portfolio.cashBalance)
        return portfolio.cashBalance
    },
    getTotalValue: () =>
    {
        console.log("Get Total Value:"+portfolio.totalValue)
        return portfolio.totalValue
    },
    setTotalValue: (newTotalValue) =>
    {
        console.log("Set Total Value:"+portfolio.totalValue)
        portfolio.totalValue = newTotalValue
    },
    updateStockVolume: (symbol, amount) => 
    {
        
    },
    refreshTotalValue: () =>
    {
        console.log("refreshing value")
    }
}
let refreshRate = 300 // refresh rate in seconds to update portfolio value


//////////////////////////////////////////////////////////////////////////
// Portfolio Load/Save/Build Functions

const loadLocalPortfolio = () => {
    let portfolioString = localStorage.getItem("main-portfolio")
    if(portfolioString !== null)
    {
        portfolio = JSON.parse(portfolioString)
    }
    else
    {
        buildNewPortfolio()
    }
}

const saveLocalPortfolio = () => {
    let portfolioString = JSON.stringify(portfolio)
    localStorage.setItem("main-portfolio", portfolioString)
}

const buildNewPortfolio = () => {
    portfolio = {
        cashBalance: 7000,
        currentlyOwnedStocks: [],
        transactionHistory: [],
        totalValue: 0,
        totalValueTime: Date.now(),
        totalValueHistory: [],
        
    }
    portfolioFn.setTotalValue = portfolioFn.getCashBalance()
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

const buildTableRowElement = (tableElementObject) =>
{
    let rowElement  = document.createElement('div')
    rowElement.classList.add('Rtable-cell')

    Object.keys(tableElementObject).forEach(keyName =>{

        let keyValue = tableElementObject[keyName]

        if(keyName == "clickEvent")
        {
            rowElement.addEventListener('click',keyValue)
        }
        else if(keyName.includes('domDataSet'))
        {
            rowElement.setAttribute("data-"+keyValue[0], keyValue[1]);
        }
        else
        {
            let rowSubElement = document.createElement('div')
            rowSubElement.classList.add(keyName)
            rowSubElement.innerHTML = keyValue
            if(keyValue != "")
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
    let stockIndex = findStockIndexInPortfolio(stockToAdd.stock.symbol)
    if(stockIndex >= 0)
    {
        portfolio.currentlyOwnedStocks[stockIndex].volume += stockToAdd.volume
    }
    else
    {
        portfolio.currentlyOwnedStocks.push(stockToAdd)
    }
}

const removeStock = (stockToRemove) => {

    // console.log('removeStock')
    // console.log(stockToRemove)
    // console.log(portfolio.currentlyOwnedStocks)
    let stockIndex = findStockIndexInPortfolio(stockToRemove.stock.symbol)
    if(stockIndex >= 0)
    {
        // console.log('removing stock')
        portfolio.currentlyOwnedStocks[stockIndex].volume -= stockToRemove.volume
    }
    else
    {
        console.log("Stock not owned")
    }
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
    let stockSearchHeader = buildTableRowElement({searchHeader:"Search results"})
    main.append(stockSearchHeader)

    results.bestMatches.forEach(match => {
        let rowElementObject = {
            clickEvent: searchResultClick,
            domDataSet1: ['symbol',match["1. symbol"]],
            domDataSet2: ['name',match["2. name"]],
            searchSymbol: match["1. symbol"],
            searchName: match["2. name"]
        }

        let stockSearchMatch = buildTableRowElement(rowElementObject)
        currentSearchSymbolLookup[match["1. symbol"]] = index
        main.append(stockSearchMatch)
        index++
    })
}

const renderQuoteResults = results =>
{
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

    let slideOutCurrencyList = document.querySelectorAll('.slide-out-currency')
    let symbolCurrency = currentSearchedStocks[symbolNameIndex]['8. currency']
    currentSelectedStock.currency = symbolCurrency
    slideOutCurrencyList.forEach(slideOutCurrency => {
        slideOutCurrency.innerHTML = currentSelectedStock.currency
    })

    // Stock Buy Price
    let slideOutBuyPrice = document.querySelector('#slide-out-buy-price')
    currentSelectedStock.price = results['Global Quote']['05. price']
    slideOutBuyPrice.innerHTML = currentSelectedStock.price

    // Stock Sell Price
    let slideOutSellPrice = document.querySelector('#slide-out-sell-price')
    slideOutSellPrice.innerHTML = currentSelectedStock.price

}

// let portfolio = {
//     cash: 7000,
//     currentlyOwnedStocks: [],
//     transactionHistory: [],
//     totalValue: this.cash,
//     totalValueTime: Date.now(),
//     totalValueHistory: []
// }

// let newStock = {
//     symbol: newSymbol,
//     name: newName
// }
//
// let newPortfolioStock = {
//     stock: newStock,
//     volume: newVolume,
//     singleValue: newSingleValue,
//     totalValue: 0,
//     valueTime: "",
//     currency: ""
// }

const renderPortfolio = portfolio =>
{
    let cashDiv = document.querySelector("#cash")
    let totalValueDiv = document.querySelector("#total-value")
    cashDiv.innerHTML = portfolioFn.getCashBalance()
    totalValueDiv.innerHTML = portfolioFn.getTotalValue()

    let main = document.querySelector('#main-results')
    main.innerHTML = ""

    let portfolioHeader = buildTableRowElement({portfolioHeader:"Your Stocks"})
    main.append(portfolioHeader)
    if(portfolio.currentlyOwnedStocks.length > 0)
    {
        let index = 0
        portfolio.currentlyOwnedStocks.forEach(ownedStock => {
            let rowElementObject = {
                clickEvent: portfolioStockClick,
                domDataSet1: ['symbol', ownedStock.stock.symbol],
                domDataSet2: ['name',ownedStock.stock.name],
                domDataSet3: ['index',index],
                portfolioSymbol: ownedStock.stock.symbol,
                portfolioName: ownedStock.stock.name,
                portfolioValue: ownedStock.totalValue,
                portfolioVolume: ownedStock.volume
            }
            index++
            let stockSearchMatch = buildTableRowElement(rowElementObject)
            main.append(stockSearchMatch)
        })
    }
    else
    {
        let noStock1 = buildTableRowElement({portfolio:"You do not have any stocks in your portfolio at present =(."})
        main.append(noStock1)
        let noStock2 = buildTableRowElement({portfolio:"Use the search function to find stocks to buy and sell"})
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

    let slideOutCurrencyList = document.querySelectorAll('.slide-out-currency')
    currentSelectedStock.currency = selectedStock.currency
    slideOutCurrencyList.forEach(slideOutCurrency => {
        slideOutCurrency.innerHTML = currentSelectedStock.currency
    })

    // Stock Buy Price
    let slideOutBuyPrice = document.querySelector('#slide-out-buy-price')
    currentSelectedStock.price = selectedStock.singleValue
    slideOutBuyPrice.innerHTML = currentSelectedStock.price

    // Stock Sell Price
    let slideOutSellPrice = document.querySelector('#slide-out-sell-price')
    slideOutSellPrice.innerHTML = currentSelectedStock.price
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

    portfolioFn.updateCashBalance(soldStock.totalValue)
    removeStock(soldStock)
    saveLocalPortfolio()
    renderPortfolio(portfolio)
}

const slideOutBuyClick = (stock, amount) =>
{
    let purchasedStock = buildPortfolioStock(
        stock.symbol,
        stock.name,
        parseInt(amount),
        stock.price,
        stock.currency)
    portfolioFn.updateCashBalance(-purchasedStock.totalValue)
    addStock(purchasedStock)
    saveLocalPortfolio()
    renderPortfolio(portfolio)
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
    let queryString = `${baseURL}${quoteFunction}${quoteSymbol}${symbol}${apiKey}`
    collectResults(queryString, renderQuoteResults)
}

const searchButtonClick = symbolSearchText =>
{
    // https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=Micro&apikey=SI7NQQ7U40XVI2K7
    let queryString = `${baseURL}${searchFunction}${searchKeyword}${symbolSearchText}${apiKey}`
    collectResults(queryString, renderSearchResults)
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


const collectResults = async (queryString,renderFunction,cacheTime = 3000) =>
{
    try
    {
        let data // final data from cache or live API call
        let cache = sessionStorage.getItem(queryString)
        let expire = sessionStorage.getItem(queryString+"-expire")
        let now = Date.now()
        let expiryMS = now - expire
        // console.log("expire check:"+expire)
        // console.log("now check:"+Date.now())
        // console.log("now < expire check:"+ (Date.now() < expire))
        // console.log("now - expire check:"+ (Date.now() - expire))
        // console.log(expiryMS)
        if (cache !== null && expiryMS < 0) {
            data = JSON.parse(cache)
            console.log("Cached API Request. Cache expires in " + (-expiryMS/1000) + " seconds")
        }
        else
        {
            let results = await axios.get(queryString)
            sessionStorage.setItem(queryString, JSON.stringify(results.data))
            if(cacheTime != 0)
            {
                let expire = now + cacheTime*1000
                // console.log("Now:"+Date.now())
                // console.log("Expire:"+expire)
                sessionStorage.setItem(queryString+"-expire",expire)
            }
            data = results.data
            console.log("Live API Request")
        }

        renderFunction(data)

    } catch (error)
    {
        console.log(`Oops! There was an error: ${error}`)
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
    searchButton.addEventListener('click',(e) =>{
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
    slideOutBuy.addEventListener('click', (e) =>{
        e.preventDefault()
        slideOutBuyClick(currentSelectedStock, slideOutBuyAmount.value)
        slideOutBuyAmount.value = ""
    })

    // Slide out buy button event listener
    let slideOutSell = document.querySelector('#slide-out-sell')
    let slideOutSellAmount = document.querySelector("#slide-out-sell-amount")
    slideOutSell.addEventListener('click', (e) =>{
        e.preventDefault()
        slideOutSellClick(currentSelectedStock, slideOutSellAmount.value)
        slideOutSellAmount.value = ""
    })
}

setEventListeners()

loadLocalPortfolio()
renderPortfolio(portfolio)