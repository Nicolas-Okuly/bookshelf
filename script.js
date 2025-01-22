'use-strict'
/**
 * Handle all the cookie actions and replace values. Set unused values to null.
 * @param {String} cookie Cookie to take action on
 * @param {String} action Action to take on the cookie
 * @param {String} value Value to set the cookie to if editing/creating it
 * @returns {String} Value of the cookie or Null if deleting a cookie
 */
function handleCookies(cookie, action, value) {    
    // If the action is not valid, throw an error.
    if(!(['edit', 'delete', 'create', 'getall'].includes(action)))
        throw new Error(`Unexpected input: ${action}`);

    // Create/edit a cookie
    if (['edit', 'create'].includes(action))
        document.cookie = `${cookie}=${value}; expires=Thu, 01 Jan 2035 00:00:00 UTC; path=/;`;

    // Delete a cookie
    if (['delete'].includes(action)) {
        document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        return null;
    }

    // Get a list of all cookies
    if (['getall'].includes(action)) {
        let cookies = document.cookie;
        cookies = cookies.split(';');
        let cookieObj = new Array();

        for (let cookie of cookies) {
            let spl = cookie.split('=');
            cookieObj.push({ name: spl[0], value: spl[1] });
        }
        return cookieObj;
    }

    // Kickback value if nothing else gets kicked back
    return value;
}

/**
 * Add the current text value of the input
 * form to the front of the list.
 */
async function add() {
    const bookInput = document.getElementById("bookInput");
    const value = bookInput.value;

    const bookData = await getBookData(value);

    const cookieName = `Book-${bookData.volumeInfo.title}`;
    handleCookies(cookieName, 'create', value)
    updateDisplay();
    bookInput.value = "";
}

/**
 * Remove a book by the name
 * @param {String} bookname Name of the book to remove
  */
function remove(bookname) {
    const bookInput = document.getElementById("bookInput");
    const value = bookInput.value;

    handleCookies(`Book-${bookname}`, 'delete', null);
    updateDisplay();
}

/**
 * 
 * @param {String} bookname The name of the book to search for.
 */
async function getBookData(bookname) {
    const urlEncoded = encodeURIComponent(bookname);
    const url = `https://www.googleapis.com/books/v1/volumes?q=${urlEncoded}`;

    const response = await fetch(url);
    return (await response.json()).items[0];
}

/**
 * Update the list of books.
 */
async function updateDisplay() {
    const cookies = handleCookies(null, 'getall', null);
    document.getElementById('bookList').innerHTML = "";

    for (let cookie of cookies) {
        if (!cookie.value) return;

        const bookData = await getBookData(cookie.value);
        let author, amount, buylink;

        try { author = bookData.volumeInfo.authors[0]; } 
        catch (e) { author = "No Author"; }

        try { amount = `$${bookData.saleInfo.listPrice.amount}`; }
        catch (e) { amount = "Not for sale"}

        if (bookData.saleInfo.buyLink) {
            buylink = `<button><a target="_blank" href="${bookData.saleInfo.buyLink}">Purchase Book</a></button>`;
        } else {
            buylink = "";
        }

        document.getElementById('bookList').innerHTML += 
        `<div class="bookItem">
            <img width="128px" alt="Book cover" src="${bookData.volumeInfo.imageLinks.thumbnail}">
            <div>
                <p><b>Title:</b> ${bookData.volumeInfo.title}</p>
                <p><b>Author:</b> ${author}</p>
                <p><b>Cost:</b> ${amount}</p>
                ${buylink}
                <button class="remove-btn" onclick="remove(\`${bookData.volumeInfo.title}\`)">Remove Book</button>
            </div>
        </div>`
    }
}

document.getElementById("bookInput").addEventListener("keypress", (key) => {
    if (key.key == "Enter") add();
});