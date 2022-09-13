function fakeAPIRequest() { return true; }
function generateSymbol() { return true; }
function generateFullSymbol() { return true; }

function subscribeOnStream() { return true; }
function unsubscribeFromStream() { return true; }

const lastBarsCache = new Map();

const configurationData = {
    supported_resolution: ['1D', '2D', '3D', 'W'],
    exchanges: [{
            value: 'bitbtf',
            name: 'BitBTF',
            desc: 'BitBtf'
        },
        {
            value: 'bitbtf1',
            name: 'BitBTF1',
            desc: 'BitBtf1'
        },
        {
            value: 'bitbtf2',
            name: 'BitBTF2',
            desc: 'BitBtf2'
        }
    ],
    symbol_types: [{
        name: 'crypto', value: 'crypto'
    }],
    supports_group_request: false,
    supports_marks: true,
    suports_search: false, // true
    supports_timescale_marks: true
}

export default {
    onReady: (callback) => {
        console.log("[onReady]: Method Call");
        setTimeout(() => callback(configurationData));
    },
    searchSymbols: async(
        userInput,
        exchange,
        symbolType,
        onResultReadyCallback
    ) => {
        console.log("[searchSymbol]: Method call");

    },
    resolveSymbol: async(
        symbolName,
        onSymbolResolvedCallback,
        onResolveErrorCallback
    ) => {
        console.log("[resolveSymbol]: Method call")
    },
    getBars: async(
        symbolInfo,
        resolution,
        periodParams,
        onHistoryCallback,
        onResolveErrorCallback
    ) => {
        const { from, to, firstDataRequest } = periodParams;
        console.log("[getBars]: Method call");
        const parsedSymbol = parseFullSymbol(symbolInfo.full_name);
        const urlParameters = {
            e: parsedSymbol.exchange,
            fsym: parsedSymbol.fromSymbol,
            tsym: parsedSymbol.toSymbol,
            toTs: to,
            limit: 2000,
        };
        try {
            // getData from socket
            if (firstDataRequest) {
                lastBarsCache.set(symbolInfo.full_name, {...bars[bars.length-1]})
            }
        } catch (error) {
            console.log("Error: from: getBars", error.message)
        }
    },
    subscribeBars: (
        systemInfo,
        resolution,
        onRealtimeCallback,
        subscribeUID,
        onResetCacheNeededCallback
    ) => {
        console.log("[subscribeBars]: Method call");
        subscribeOnStream(
            systemInfo,
            resolution,
            onRealtimeCallback,
            subscribeUID,
            onResetCacheNeededCallback,
            lastBarsCache.get(symbolInfo.full_name)
        )
    },
    unsubscribeBars: (subsriberUID) => {
        console.log("[unsubscribeBars]: Method call");
        unsubscribeFromStream(subsriberUID)
    }
}