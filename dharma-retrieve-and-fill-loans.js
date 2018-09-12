// External libraries
const fetch = require("node-fetch");
const Web3 = require("web3");
const { Dharma } = require("@dharmaprotocol/dharma.js");
const { LoanRequest, Token } = Dharma.Types;

// Constants
const CREDITOR_ADDRESS = "0x3FA17C1F1a0Ae2DB269F0B572ca44B15Bc83929a";
const RELAYER_API_URL = "http://localhost:8000";
const ENDPOINT = "/v0/debt_orders";

// Instantiate Dharma.js
const provider = new Web3.providers.HttpProvider("http://localhost:8545");
const dharma = new Dharma(provider);

// Helper function to get the first LoanRequest from a Standard Relayer API
async function getFirstLoanRequest(relayerApiHost, path) {
    try {
        const response = await fetch(`${relayerApiHost}${path}`);

        const responseJson = await response.json();

        // Get the first Debt Order
        const debtOrders = responseJson.debtOrders;

        const debtOrder = debtOrders[0].debtOrder;

        // Instantiate a Loan Request object using the Debt Order, so it is easier to interact with
        const loanRequest = await LoanRequest.load(dharma, debtOrder);

        return loanRequest;
    } catch (error) {
        console.error(error);
    }
}

// Function to fill the first LoanRequest from a Standard Relayer API
async function fillFirstLoanRequest(relayerApiHost, path) {
    const loanRequest = await getFirstLoanRequest(relayerApiHost, path);

    // Set the creditor allowance so she may fill the Loan Request
    const loanTerms = loanRequest.getTerms();
    const principalTokenSymbol = loanTerms.principalTokenSymbol;

    const allowanceTransactionHash = await Token.makeAllowanceUnlimitedIfNecessary(
        dharma,
        principalTokenSymbol,
        CREDITOR_ADDRESS,
    );

    // Wait for the transaction to be mined
    if (allowanceTransactionHash) {
        await dharma.blockchain.awaitTransactionMinedAsync(allowanceTransactionHash);
    }

    // Fill the Loan Request
    const fillTransactionHash = await loanRequest.fillAsCreditor(CREDITOR_ADDRESS);

    // Wait for the transaction to be mined
    await dharma.blockchain.awaitTransactionMinedAsync(fillTransactionHash);

    process.exit();
}

fillFirstLoanRequest(RELAYER_API_URL, ENDPOINT);
