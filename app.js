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
let currentSelectedStock;

const closeSlideOut = () =>
{
    document.querySelector('#slide-out-parent').classList.add('hidden')
}

const searchResultClick = (event) =>
{
    globalQuote(event.currentTarget.dataset.symbol)

    document.querySelector('#slide-out-parent').classList.remove('hidden')
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
        else if(keyName == 'domDataSet')
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

// const timeSeries = symbol =>
// {
//     // get example time series request
//     let queryString = `${baseURL}${timeFunction}${timeSymbol}${symbol}${timeInterval}${apiKey}`
//     collectResults(symbolSearchText, renderSearchResults)
// }

const globalQuote = symbol =>
{
    // https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=MSFT&apikey=SI7NQQ7U40XVI2K7
    let queryString = `${baseURL}${quoteFunction}${quoteSymbol}${symbol}${apiKey}`
    collectResults(queryString, renderQuoteResults)
}

const renderSearchResults = results =>
{
    let main = document.querySelector('#main-results')
    main.innerHTML = ""
    results.bestMatches.forEach(match => {
        let stockSearchMatch = buildTableRowElement({clickEvent: searchResultClick, domDataSet: ['symbol',match["1. symbol"]],searchSymbol:match["1. symbol"], searchName:match["2. name"],unit:""})
        // let rowElementObject = {searchSymbol:match["1. symbol"], searchName:match["2. name"]}
        // let stockSearchMatch = buildTableRowElement(rowElementObject)
        main.append(stockSearchMatch)
    })
}



const renderQuoteResults = results =>
{
    //let slideOutInner = document.querySelector('#slide-out-inner')
    // slideOutInner.innerHTML = results
    // slideOutInner.classList.remove('hidden')
    console.log(results)
    let slideOutTitle = document.querySelector('#slide-out-title')
    slideOutTitle.innerHTML = results['Global Quote']['01. symbol']

    let slideOutSummary = document.querySelector('#slide-out-summary')
    slideOutTitle.innerHTML = results['Global Quote']['01. symbol']

    let slideOutBuyPrice = document.querySelector('#slide-out-buy-price')
    slideOutBuyPrice.innerHTML = results['Global Quote']['05. price']

    let slideOutSellPrice = document.querySelector('#slide-out-sell-price')
    slideOutSellPrice.innerHTML = results['Global Quote']['05. price']

}
const collectResults = async (queryString,renderFunction) =>
{
    try
    {
        let results = await axios.get(queryString)
        //let results = symbolSearch
        renderFunction(results.data)
    } catch (error)
    {
        console.log(`Oops! There was an error: ${error}`)
    }
}

const searchButtonClick = symbolSearchText =>
{
    // https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=Micro&apikey=SI7NQQ7U40XVI2K7
    let queryString = `${baseURL}${searchFunction}${searchKeyword}${symbolSearchText}${apiKey}`
    collectResults(queryString, renderSearchResults)
}

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