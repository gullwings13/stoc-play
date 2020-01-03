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

function makeTableRow(label, data, unit)
{
    let rowElement  = document.createElement('div')
    let labelElement = document.createElement('div')
    let dataElement = document.createElement('div')
    let unitElement = document.createElement('div')

    rowElement.classList.add('Rtable-cell')
    labelElement.classList.add('label')
    dataElement.classList.add('data')
    unitElement.classList.add('unit')

    labelElement.innerHTML = label
    dataElement.innerHTML = data
    unitElement.innerHTML = unit


    if(labelElement.innerHTML != "")
    {
        rowElement.append(labelElement)
    }
    rowElement.append(dataElement)
    if(unitElement.innerHTML != "")
    {
        rowElement.append(unitElement)
    }

    return rowElement
}


const searchButtonClick = symbolSearchText =>
{
    console.log('Search:'+symbolSearchText)
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

const globalQuote = symbol =>
{
    // https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=MSFT&apikey=SI7NQQ7U40XVI2K7
    let queryString = `${baseURL}${quoteFunction}${quoteSymbol}${symbol}${apiKey}`
    collectResults(queryString, renderQuoteResults)
}

const setEventListeners = () =>
{
    let searchText = document.querySelector('#search-text')
    let searchButton = document.querySelector('#search-button')
    searchButton.addEventListener('click',()=>{
        searchButtonClick(searchText.value)
        searchText.value = ""
    })
}

const renderSearchResults = results =>
{
    let main = document.querySelector('#main')
    main.innerHTML = ""
    results.bestMatches.forEach(match => {
        main.innerHTML += match["1. symbol"]+"\r"
    })
}

const renderQuoteResults = results =>
{
    let main = document.querySelector('#main')
}

// const renderResults = results =>
// {
//     console.log(results)
// }
//

const collectResults = async (queryString,renderFunction) =>
{
    try
    {
        //let results = await axios.get()
        let results = symbolSearch
        renderFunction(results)
    } catch (error)
    {
        console.log(`Oops! There was an error: ${error}`)
    }
}

// const collectResults = async () =>
// {
//     try
//     {
//         let results = await axios.get(`${baseURL}${timeFunction}${stockSymbol}${timeInterval}${apiKey}`)
//         renderResults(results)
//     } catch (error)
//     {
//         console.log(`Oops! There was an error: ${error}`)
//     }
// }

//collectResults()
setEventListeners()