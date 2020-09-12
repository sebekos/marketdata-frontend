import React, { useState, useLayoutEffect } from "react";
import PropTypes from "prop-types";
import "./App.css";

// ----------------------------------------------- Constants

// API call timeout
const FREQ = 1000;

// ----------------------------------------------- Utilities

// Background color
const color_util = (change) => {
    if (isNaN(change)) {
        return "";
    } else if (change >= 75) {
        return "green";
    } else if (change >= 50) {
        return "lightgreen";
    } else if (change >= -49) {
        return "";
    } else if (change >= -74) {
        return "lightred";
    } else {
        return "red";
    }
};

// Market data fetch request
const fetchMarketData = async () => {
    const response = await fetch("/marketData");
    if (response.status === 200) {
        const json = await response.json();
        return json;
    }
    throw new Error(response.status);
};

// ----------------------------------------------- Static elements

// No data
const NoData = () => <div className="no-data">No Market Data Found</div>;

// API error
const ConnectionError = () => <div className="connection-error">API Connection Error</div>;

// Loading
const Loading = () => <div className="loading">Loading...</div>;

// Market data item
const MarketDataItem = ({ data_id, current, high, low, open, peRatio, change }) => (
    <div className={`market-data-item ${color_util(change)}`}>
        <div>{data_id}</div>
        <div>{current}</div>
        <div>{high}</div>
        <div>{low}</div>
        <div>{open}</div>
        <div>{peRatio}</div>
    </div>
);

MarketDataItem.propTypes = {
    data_id: PropTypes.number,
    current: PropTypes.number,
    high: PropTypes.number,
    low: PropTypes.number,
    open: PropTypes.number,
    peRatio: PropTypes.number,
    change: PropTypes.number
};

// ----------------------------------------------- Components

// Market data container
const MarketDataContainer = ({ marketData }) => {
    if (!marketData || marketData.length === 0) return null;

    return (
        <div className="market-data-container">
            <div className="market-data-items">
                {marketData.map((item) => {
                    const { id, current, high, low, open, peRatio, change } = item;
                    return (
                        <MarketDataItem
                            key={id}
                            data_id={id}
                            current={current}
                            high={high}
                            low={low}
                            open={open}
                            peRatio={peRatio}
                            change={change}
                        />
                    );
                })}
            </div>
        </div>
    );
};

MarketDataContainer.propTypes = {
    marketData: PropTypes.array
};

// Main app
const App = () => {
    // Setup component state
    const [state, setState] = useState({ marketData: [], error: false, loading: false });

    // Run market data call before first render
    useLayoutEffect(() => {
        // Market data recursive
        const marketDataCall = async () => {
            setState((prevState) => ({ marketData: prevState.marketData, error: prevState.error, loading: true }));
            try {
                const data = await fetchMarketData();
                setState((prevState) => ({
                    marketData: data.map((item) => {
                        const { current, id } = item;
                        const change =
                            prevState.marketData && prevState.marketData[id]
                                ? ((current - prevState.marketData[id].current) / prevState.marketData[id].current) * 100
                                : 0;
                        return {
                            ...item,
                            change
                        };
                    }),
                    error: false,
                    loading: false
                }));
            } catch (err) {
                setState((prevState) => ({ marketData: prevState.marketData, error: true, loading: false }));
            }
            // Recursive call to prevent queue buildup on slow connections
            const marketTimeout = setTimeout(marketDataCall, FREQ);
            return () => clearTimeout(marketTimeout);
        };
        // Call to backend API
        marketDataCall();
    }, []);

    return (
        <div className="App">
            <div className="title">Market Data</div>
            <MarketDataContainer marketData={state.marketData} />
            {state.error && <ConnectionError />}
            {!state.error && state.loading && state.marketData.length === 0 && <Loading />}
            {!state.error && !state.loading && state.marketData.length === 0 && <NoData />}
        </div>
    );
};

export default App;
