const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = process.env.BOOKSHOP_URL || "http://localhost:5000";


public_users.post("/register", (req,res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(404).json({message: "Unable to register user. Username and password are required."});
    }
    if (!isValid(username)) {
        return res.status(404).json({message: "User already exists!"});
    }

    users.push({"username": username, "password": password});
    return res.status(200).json({message: "User successfully registered. Now you can login"});
});

// Get the book list available in the shop
public_users.get('/',function (req, res) {
    return res.status(200).send(JSON.stringify(books, null, 4));
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn',function (req, res) {
    const isbn = req.params.isbn;
    if (books[isbn]) {
        return res.status(200).send(JSON.stringify(books[isbn], null, 4));
    }
    return res.status(404).json({message: "Book with ISBN " + isbn + " not found"});
 });

// Get book details based on author
public_users.get('/author/:author',function (req, res) {
    const author = req.params.author.toLowerCase();
    const result = Object.keys(books)
        .filter((isbn) => books[isbn].author.toLowerCase() === author)
        .map((isbn) => ({isbn, ...books[isbn]}));
    if (result.length > 0) {
        return res.status(200).send(JSON.stringify({booksbyauthor: result}, null, 4));
    }
    return res.status(404).json({message: "No books found for author " + req.params.author});
});

// Get all books based on title
public_users.get('/title/:title',function (req, res) {
    const title = req.params.title.toLowerCase();
    const result = Object.keys(books)
        .filter((isbn) => books[isbn].title.toLowerCase() === title)
        .map((isbn) => ({isbn, ...books[isbn]}));
    if (result.length > 0) {
        return res.status(200).send(JSON.stringify({booksbytitle: result}, null, 4));
    }
    return res.status(404).json({message: "No books found with title " + req.params.title});
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
    const isbn = req.params.isbn;
    if (books[isbn]) {
        return res.status(200).send(JSON.stringify(books[isbn].reviews, null, 4));
    }
    return res.status(404).json({message: "Book with ISBN " + isbn + " not found"});
});


// ---------------------------------------------------------------------------
// Axios clients: the same lookups done over HTTP, with promise callbacks
// and async/await (these call the routes above).
// ---------------------------------------------------------------------------

// Promise callbacks (.then/.catch): get all books
const getAllBooksPromise = () => {
    return axios.get(BASE_URL + "/")
        .then((response) => response.data)
        .catch((error) => { throw new Error("Could not retrieve books: " + error.message); });
};

// async/await: get a book by ISBN
const getBookByISBN = async (isbn) => {
    try {
        const response = await axios.get(BASE_URL + "/isbn/" + encodeURIComponent(isbn));
        return response.data;
    } catch (error) {
        throw new Error("Could not retrieve book by ISBN: " + error.message);
    }
};

// async/await: get books by author
const getBooksByAuthor = async (author) => {
    try {
        const response = await axios.get(BASE_URL + "/author/" + encodeURIComponent(author));
        return response.data;
    } catch (error) {
        throw new Error("Could not retrieve books by author: " + error.message);
    }
};

// Promise callbacks: get books by title
const getBooksByTitle = (title) => {
    return axios.get(BASE_URL + "/title/" + encodeURIComponent(title))
        .then((response) => response.data)
        .catch((error) => { throw new Error("Could not retrieve books by title: " + error.message); });
};

// Routes that expose the Axios-based functions
public_users.get('/async/books', (req, res) => {
    getAllBooksPromise()
        .then((data) => res.status(200).send(JSON.stringify(data, null, 4)))
        .catch((err) => res.status(500).json({message: err.message}));
});

public_users.get('/async/isbn/:isbn', async (req, res) => {
    try {
        const data = await getBookByISBN(req.params.isbn);
        return res.status(200).send(JSON.stringify(data, null, 4));
    } catch (err) {
        return res.status(500).json({message: err.message});
    }
});

public_users.get('/async/author/:author', async (req, res) => {
    try {
        const data = await getBooksByAuthor(req.params.author);
        return res.status(200).send(JSON.stringify(data, null, 4));
    } catch (err) {
        return res.status(500).json({message: err.message});
    }
});

public_users.get('/async/title/:title', (req, res) => {
    getBooksByTitle(req.params.title)
        .then((data) => res.status(200).send(JSON.stringify(data, null, 4)))
        .catch((err) => res.status(500).json({message: err.message}));
});

module.exports.general = public_users;
module.exports.getAllBooksPromise = getAllBooksPromise;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;
