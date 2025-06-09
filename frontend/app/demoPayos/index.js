const express = require("express");
const PayOS = require("@payos/node");
const path = require('path');

// Initialize PayOS SDK with your credentials
const payos = new PayOS({
    "clientId": "9ec171d-ba4b-4d61-a1a4-e669ac93edad",
    "apiKey": "74e13b6f-4654-49ac-a79e-6faee0df6203",
    "checksumKey": "a2829f982cf99f50fb690dacb783936b604df3abfc087ad66c31687795ea7"
});

const app = express();

// Middleware
app.use(express.static("public"));
app.use(express.json());

const YOUR_DOMAIN = "http://localhost:3000";

// Handle payment creation
app.post("/create-payment-link", async (req, res) => {
    const order = {
        amount: 10000,
        description: "Thanh toan mi tom",
        orderCode: 10,
        returnUrl: `${YOUR_DOMAIN}/success.html`,
        cancelUrl: `${YOUR_DOMAIN}/cancel.html`
    };

    try {
        // Create payment with PayOS
        const paymentLinkRes = await payos.createPaymentLink(order);

        // Redirect to the payment link
        res.redirect(paymentLinkRes.checkoutUrl);
    } catch (error) {
        console.error("Error creating payment:", error);
        res.status(500).send("Payment creation failed");
    }
});

// Serve static HTML files
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get("/success.html", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

app.get("/cancel.html", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cancel.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 