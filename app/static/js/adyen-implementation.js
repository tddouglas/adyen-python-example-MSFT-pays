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
            onSubmit: (state, component) => {
                console.log(state);

                if (state.isValid) {
                    handleSubmission(state, component, "/api/initiatePayment");
                }
            },
            onAdditionalDetails: (state, component) => {
                handleSubmission(state, component, "/api/submitAdditionalDetails");
            },
            onChange: (state, component) => {
                console.log("On change", state);
            }
        };

        const checkout = await AdyenCheckout(configuration);
        checkout.create(type, {
            // Optional configuration
            type: 'card',
            // brands: ['mc', 'visa', 'amex', 'bcmc', 'maestro'],
            styles: {
                error: {
                    color: 'red'
                },
                validated: {
                    color: 'green'
                },
                placeholder: {
                    color: '#d8d8d8',
                    fontWeight: "500"
                }
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
            "afterpaytouch",
            "securedfields"
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
