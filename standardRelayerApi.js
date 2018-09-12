const url = require("url");

const addStandardRelayerApi = (server, router) => {
    // Standard Relayer API
    server.get("/v0/debt_order/:id", (req, res) => {
        const id = req.params.id;

        const redirectUrl = url.format({
            pathname: `/loanRequests/${id}`,
            query: {
                standardize: true,
            },
        });

        res.redirect(redirectUrl);
    });

    server.get("/v0/debt_orders", (req, res) => {
        const originalQuery = req.query;

        const redirectUrl = url.format({
            pathname: "/loanRequests",
            query: {
                ...originalQuery,
                standardize: true,
            },
        });

        res.redirect(redirectUrl);
    });

    router.render = (req, res) => {
        const parsedUrl = url.parse(req.url, true);
        const query = parsedUrl.query;

        if (req.method === "GET" && req.path === "/loanRequests" && query.standardize) {
            const debtOrders = res.locals.data.map((loanRequest) => {
                return {
                    debtOrder: loanRequest,
                    metaData: { id: loanRequest.id },
                };
            });

            res.jsonp({
                total: debtOrders.length,
                page: 1,
                perPage: debtOrders.length,
                debtOrders,
            });
        } else if (
            req.method === "GET" &&
            req.path.match(/loanRequests\/(\d+)/) &&
            query.standardize
        ) {
            const loanRequest = res.locals.data;

            res.jsonp({
                debtOrder: loanRequest,
                metaData: { id: loanRequest.id },
            });
        } else {
            res.jsonp(res.locals.data);
        }
    };
};

module.exports = { addStandardRelayerApi };
