function createAddToCartURL(productDetails) {
    const baseUrl = "https://secure.sportdogfood.com/cart?";
    const params = new URLSearchParams();

    params.set('name', productDetails.name);
    params.set('price', productDetails.price);
    params.set('quantity', productDetails.quantity);
    // Add any other attributes you may want to pass, such as custom fields
    if (productDetails.color) {
        params.set('color', productDetails.color);
    }

    return baseUrl + params.toString();
}

// Example usage
const productDetails = {
    name: "Dog Food Premium",
    price: "29.99",
    quantity: "2",
    color: "Blue"
};

const addToCartURL = createAddToCartURL(productDetails);
console.log(addToCartURL);
