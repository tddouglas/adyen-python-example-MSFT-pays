const clientKey = JSON.parse(document.getElementById('client-key').innerHTML);
const type = JSON.parse(document.getElementById('integration-type').innerHTML);

async function initCheckout() {
    try {
        const paymentMethodsResponse = await callServer("/api/getPaymentMethods", {});
        const configuration = {
            paymentMethodsResponse: filterUnimplemented(paymentMethodsResponse),
            clientKey,
            locale: "en_US",
            environment: "test",
            showPayButton: true,
            paymentMethodsConfiguration: {
                ideal: {
                    showImage: true
                },
                ach: {
                    enableStoreDetails: true,
                    showStoredPaymentMethods: true,
                },
                applepay: {
                    totalPriceStatus: "final",
                    totalPriceLabel: "totalPrice",
                    configuration: {
                        merchantName: "Tyler Douglas",
                        merchantId: "tylerDouglas"
                    },
                },
                googlepay: {
                    amount: {
                        value: 1000,
                        currency: "EUR"
                    },
                    countryCode: "NL",
                    //Set this to PRODUCTION when you're ready to accept live payments
                    environment: "TEST",
                    configuration: {
                        merchantName: "Tyler Douglas",
                        gatewayMerchantId: "TylerDouglas"
                    }
                },
                card: {
                    // hasHolderName: true,
                    // holderNameRequired: true,
                    // billingAddressRequired: true,
                    // billingAddressAllowedCountries: ['US'],
                    showStoredPaymentMethods: true,
                    enableStoreDetails: true,
                    name: "Credit or debit card",
                    onConfigSuccess: (component) => {
                        console.log("Card component configured successfully");
                    },
                    amount: {
                        value: 1000,
                        currency: "EUR"
                    }
                },
                paypal: {
                    amount: {
                        currency: "USD",
                        value: 1000
                    },
                    environment: "test", // Change this to "live" when you're ready to accept live PayPal payments
                    countryCode: "US", // Only needed for test. This will be automatically retrieved when you are in production.
                    intent: "authorize" // Change this to "authorize" if the payments should not be captured immediately. Contact Support to enable this flow.
                }
            },
            onSubmit: (state, component) => {
                console.log("on submit triggered", state);
                if (state.isValid) {
                    handleSubmission(state, component, "/api/initiatePayment");
                }
            },
            onAdditionalDetails: (state, component) => {
                console.log("OnAdditionalDetails triggered", state);
                handleSubmission(state, component, "/api/submitAdditionalDetails");
            },
            // Only needed for securefields flow
            // onChange: (state, component) => {
            //     console.log("On change triggered", component);
            //     if (state.isValid) {
            //         handleSubmission(state, component, "/api/initiatePayment");
            //     }
            // }
        };

        const checkout = await AdyenCheckout(configuration);
        checkout.create(type, {
            // Optional configuration
            // type: 'card',
            // brands: ['mc', 'visa', 'amex', 'bcmc', 'maestro'],
            // styles: {
            //     error: {
            //         color: 'red'
            //     },
            //     validated: {
            //         color: 'green'
            //     },
            //     placeholder: {
            //         color: '#d8d8d8',
            //         fontWeight: "500"
            //     }
            // },
            onSelect: comp => {
                console.log("onSelect Triggered", state);
            },
            onBinLookup: (state) => {
                console.log("onBinLookup Triggered", state);
            },
            onBinValue: (state) => {
                console.log("onBinValue Triggered", state);
            },
            onFieldValid: (state) => {
                console.log("onFieldValid Triggered", state);
            },
            onBrand: (state) => {
                console.log("onBrand Triggered", state);
            }
        }).mount("#component");
    } catch (error) {
        console.error(error);
        alert("Error occurred. Look at console for details");
    }
}

function filterUnimplemented(pm) {
    pm.paymentMethods = pm.paymentMethods.filter((it) =>
        [
            "scheme",
            "ideal",
            "dotpay",
            "giropay",
            "sepadirectdebit",
            "directEbanking",
            "ach",
            "alipay",
            "klarna_paynow",
            "klarna",
            "klarna_account",
            "paypal",
            "boletobancario_santander",
            "twint",
            "applepay",
            "googlepay",
            "bcmc",
            "bcmc_mobile",
            'kcp_naverpay',
            "directdebit_GB",
            "afterpaytouch",
            "securedfields",
            "afterpaytouch",
        ].includes(it.type)
    );
    return pm;
}

// Event handlers called when the shopper selects the pay button,
// or when additional information is required to complete the payment
async function handleSubmission(state, component, url) {
    try {
        const res = await callServer(url, state.data);
        handleServerResponse(res, component);
    } catch (error) {
        console.error(error);
        alert("Error occurred. Look at console for details");
    }
}

// Calls your server endpoints
async function callServer(url, data) {
    const res = await fetch(url, {
        method: "POST",
        body: data ? JSON.stringify(data) : "",
        headers: {
            "Content-Type": "application/json"
        }
    });

    return await res.json();
}

// Handles responses sent from your server to the client
function handleServerResponse(res, component) {
    if (res.action) {
        component.handleAction(res.action);
    } else {
        switch (res.resultCode) {
            case "Authorised":
                window.location.href = "/result/success";
                break;
            case "Pending":
            case "Received":
                window.location.href = "/result/pending";
                break;
            case "Refused":
                window.location.href = "/result/failed";
                break;
            default:
                window.location.href = "/result/error";
                break;
        }
    }
}

initCheckout();
