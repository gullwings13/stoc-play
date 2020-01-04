let quote = {
    "Global Quote": {
        "01. symbol": "MSFT",
        "02. open": "158.7800",
        "03. high": "160.7300",
        "04. low": "158.3300",
        "05. price": "160.6200",
        "06. volume": "22103680",
        "07. latest trading day": "2020-01-02",
        "08. previous close": "157.7000",
        "09. change": "2.9200",
        "10. change percent": "1.8516%"
    }
}

let symbolSearch = {
    "bestMatches": [
        {
            "1. symbol": "AMD",
            "2. name": "Advanced Micro Devices Inc.",
            "3. type": "Equity",
            "4. region": "United States",
            "5. marketOpen": "09:30",
            "6. marketClose": "16:00",
            "7. timezone": "UTC-05",
            "8. currency": "USD",
            "9. matchScore": "0.5000"
        },
        {
            "1. symbol": "MSFT",
            "2. name": "Microsoft Corporation",
            "3. type": "Equity",
            "4. region": "United States",
            "5. marketOpen": "09:30",
            "6. marketClose": "16:00",
            "7. timezone": "UTC-05",
            "8. currency": "USD",
            "9. matchScore": "0.4545"
        },
        {
            "1. symbol": "MU",
            "2. name": "Micron Technology Inc.",
            "3. type": "Equity",
            "4. region": "United States",
            "5. marketOpen": "09:30",
            "6. marketClose": "16:00",
            "7. timezone": "UTC-05",
            "8. currency": "USD",
            "9. matchScore": "0.4444"
        },
        {
            "1. symbol": "MBOT",
            "2. name": "Microbot Medical Inc.",
            "3. type": "Equity",
            "4. region": "United States",
            "5. marketOpen": "09:30",
            "6. marketClose": "16:00",
            "7. timezone": "UTC-05",
            "8. currency": "USD",
            "9. matchScore": "0.4444"
        },
        {
            "1. symbol": "MVIS",
            "2. name": "MicroVision Inc.",
            "3. type": "Equity",
            "4. region": "United States",
            "5. marketOpen": "09:30",
            "6. marketClose": "16:00",
            "7. timezone": "UTC-05",
            "8. currency": "USD",
            "9. matchScore": "0.4444"
        },
        {
            "1. symbol": "MFGP",
            "2. name": "Micro Focus International plc",
            "3. type": "Equity",
            "4. region": "United States",
            "5. marketOpen": "09:30",
            "6. marketClose": "16:00",
            "7. timezone": "UTC-05",
            "8. currency": "USD",
            "9. matchScore": "0.4444"
        },
        {
            "1. symbol": "MCHP",
            "2. name": "Microchip Technology Incorporated",
            "3. type": "Equity",
            "4. region": "United States",
            "5. marketOpen": "09:30",
            "6. marketClose": "16:00",
            "7. timezone": "UTC-05",
            "8. currency": "USD",
            "9. matchScore": "0.3846"
        },
        {
            "1. symbol": "SMSI",
            "2. name": "Smith Micro Software Inc.",
            "3. type": "Equity",
            "4. region": "United States",
            "5. marketOpen": "09:30",
            "6. marketClose": "16:00",
            "7. timezone": "UTC-05",
            "8. currency": "USD",
            "9. matchScore": "0.3571"
        },
        {
            "1. symbol": "SMCI",
            "2. name": "Super Micro Computer Inc.",
            "3. type": "Equity",
            "4. region": "United States",
            "5. marketOpen": "09:30",
            "6. marketClose": "16:00",
            "7. timezone": "UTC-05",
            "8. currency": "USD",
            "9. matchScore": "0.3030"
        },
        {
            "1. symbol": "UMC",
            "2. name": "United Microelectronics Corporation",
            "3. type": "Equity",
            "4. region": "United States",
            "5. marketOpen": "09:30",
            "6. marketClose": "16:00",
            "7. timezone": "UTC-05",
            "8. currency": "USD",
            "9. matchScore": "0.2941"
        }
    ]
}

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
let symbolLookup

const closeSlideOut = () =>
{
    document.querySelector('#slide-out-parent').classList.add('hidden')
}

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







//////////////////////////////////////////////////////////////////////////
// Render Functions

const renderSearchResults = results =>
{
    let main = document.querySelector('#main-results')
    main.innerHTML = ""
    currentSearchedStocks = results.bestMatches;
    let index = 0
    symbolLookup = {}
    results.bestMatches.forEach(match => {
        let rowElementObject = {
            clickEvent: searchResultClick,
            domDataSet1: ['symbol',match["1. symbol"]],
            domDataSet2: ['name',match["2. name"]],
            searchSymbol: match["1. symbol"],
            searchName: match["2. name"]
        }
        let stockSearchMatch = buildTableRowElement(rowElementObject)
        symbolLookup[match["1. symbol"]] = index
        main.append(stockSearchMatch)
        index++
    })
}

const renderQuoteResults = results =>
{
    let slideOutTitle = document.querySelector('#slide-out-title')
    slideOutTitle.innerHTML = results['Global Quote']['01. symbol']

    let slideOutSummary = document.querySelector('#slide-out-summary')
    console.log(symbolLookup)
    console.log(results['Global Quote']['01. symbol'])
    let symbolNameIndex = symbolLookup[results['Global Quote']['01. symbol']]
    console.log(symbolNameIndex)
    let symbolName = currentSearchedStocks[symbolNameIndex]["2. name"]
    console.log(symbolName)
    slideOutSummary.innerHTML = symbolName

    let slideOutBuyPrice = document.querySelector('#slide-out-buy-price')
    slideOutBuyPrice.innerHTML = results['Global Quote']['05. price']

    let slideOutSellPrice = document.querySelector('#slide-out-sell-price')
    slideOutSellPrice.innerHTML = results['Global Quote']['05. price']

}


//////////////////////////////////////////////////////////////////////////
// Event handler functions

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

const collectResults = async (queryString,renderFunction) =>
{
    try
    {
        // let cached = sessionStorage.getItem(cacheKey)
        // if (cached !== null) {
        //     renderFunction(cached)
        // }


        let results = await axios.get(queryString)
        //let results = symbolSearch
        renderFunction(results.data)
    } catch (error)
    {
        console.log(`Oops! There was an error: ${error}`)
        console.log(error)
    }
}

// From: https://www.sitepoint.com/cache-fetched-ajax-requests/
// const cachedFetch = (url, options) => {
//     // Use the URL as the cache key to sessionStorage
//     let cacheKey = url
//
//     // START new cache HIT code
//     let cached = sessionStorage.getItem(cacheKey)
//     if (cached !== null) {
//         // it was in sessionStorage! Yay!
//         let response = new Response(new Blob([cached]))
//         return Promise.resolve(response)
//     }
//     // END new cache HIT code
//
//     return fetch(url, options).then(response => {
//         // let's only store in cache if the content-type is
//         // JSON or something non-binary
//         if (response.status === 200) {
//             let ct = response.headers.get('Content-Type')
//             if (ct && (ct.match(/application\/json/i) || ct.match(/text\//i))) {
//                 // There is a .json() instead of .text() but
//                 // we're going to store it in sessionStorage as
//                 // string anyway.
//                 // If we don't clone the response, it will be
//                 // consumed by the time it's returned. This
//                 // way we're being un-intrusive.
//                 response.clone().text().then(content => {
//                     sessionStorage.setItem(cacheKey, content)
//                 })
//             }
//         }
//         return response
//     })
// }



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

    // Slide out button event listener
    let slideOutClose = document.querySelector('#slide-out-close')
    slideOutClose.addEventListener('click', closeSlideOut)
}

setEventListeners()

searchButtonClick("mc")