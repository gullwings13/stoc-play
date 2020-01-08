# stock-trader
Trade virtual stock to gain confidence in stock trading

# Project Overview


## Project Schedule

|  Day | Deliverable | Status
|---|---| ---|
|Jan 2rd| Project Prompt, Wireframes / Priority Matrix / Functional Components | Complete
|Jan 3rd| Pseudocode / Actual code | Complete
|Jan 5th| Core Application Structure (HTML, CSS, etc.) | Complete
|Jan 6th| Initial Clickable Model / MVP | Complete
|Jan 7th| Polish / Post-MVP  | Complete
|Jan 8th| Polish / Post-MVP | Complete
|Jan 9th| Present | Incomplete


## Project Description

Web application that allows a user to make virtual stock market trades. It would allow a user to search for stock symbols, look up buy/sell prices and, purchase/sell stocks based on real stock market values. The user would be able to track portfolio progress over time.

## Wireframes

https://wireframe.cc/3Wgu2c

## Priority Matrix

![alt text](https://res.cloudinary.com/ddkoc1hdy/image/upload/v1578000250/Screen_Shot_2020-01-02_at_4.23.18_PM_bsawwo.png "Priority Matrix") 


## API Data Sample

![alt text](https://res.cloudinary.com/ddkoc1hdy/image/upload/v1577996852/Screen_Shot_2020-01-02_at_3.26.37_PM_ymq6om.png "API snippet")

### MVP/PostMVP

#### MVP 

- Collect stock price data from https://www.alphavantage.co/ API
- Display stock price data on page
- Allow user to search for specific stock
- Allow user to buy stock (virtually at current price) (putting into their portfolio)
- Allow user to sell stock (virtually at current price) (removing from their portfolio)
- Store portfolio and current cash balance in local storage
- Allow user to see current value of portfolio

#### PostMVP 

- Allow user to see individual and whole portfolio performance over time
- See historical stock prices
- Graph stock prices (individual, portfolio)
- Add Rick and Morty game mode (a more gameified version of the app set in Rick and Morty Universe)
- Game mode would include following potential features:
- Interface with Rick and Morty API
- Travel to rick and morty locations
- Sell rick and morty objects (mapped to select few stocks at random points in time (historical stock price))
- Aim of game is buy low / sell high


| Component | Priority | Estimated Time | Time Invested | Actual Time |
| --- | :---: |  :---: | :---: | :---: |
| Whiteboard Basic Plan | H | 1hrs| 1.5hrs | 2hrs |
| Basic HTML Page | H | 1hrs| 1.5hrs | 1hrs |
| Basic JS API Data Pull | H | 2hrs| 3hrs | 1hrs |
| Stock Search Function | H | 1hrs| 2hrs | 1hrs |
| Stock Buy Function | H | 2hrs| 3hrs | 2hrs |
| Stock Sell Function | H | 1hrs| 1hrs | 2hrs |
| Local Storage | M | 1hrs| 1hrs | 2hrs |
| Display current portfolio | H | 2hrs| 3hrs | 2hrs |
| Basic CSS | H | 3hrs| 4hrs | 1hrs |
| Display graph of portfolio performance  | M | 5hrs| 6hrs | n/a |
| Display graph of Individual stock performance  | M | 2hrs| 3hrs | 3hrs |
| Polished CSS | H | 4hrs| 5hrs | 7hrs |
| Game Mode - Interface/CSS | L | 2hrs| 2hrs | n/a |
| Game Mode - Travel to RM Locations | L | 2hrs| 2hrs | n/a |
| Game Mode - Select stocks to be mapped to RM Objects | L | 2hrs| 2hrs | n/a |
| Game Mode - Select stock periods to be mapped to RM locations | L | 2hrs| 2hrs | n/a |
| Game Mode - Game loop, game win, game lose | L | 2hrs| 2hrs | n/a |
| Game Mode - Game balance / Play testing | L | 2hrs| 2hrs | n/a |
| Total |  | 37hrs| 46hrs | 24hrs |


## Code Snippet

```
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
    }
}
```

## Change Log
2020.1.2 - Created this document
2020.1.8 - Updated document  
