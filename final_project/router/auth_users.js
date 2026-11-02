const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
    // a username is valid (available) if it is not empty and not taken yet
    return typeof username === 'string' && username.trim().length > 0 &&
        !users.some((user) => user.username === username);
}

const authenticatedUser = (username,password)=>{ //returns boolean
    // check if username and password match the ones we have in records
    return users.some((user) => user.username === username && user.password === password);
}

//only registered users can login
regd_users.post("/login", (req,res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(404).json({message: "Error logging in"});
    }

    if (authenticatedUser(username, password)) {
        const accessToken = jwt.sign({ data: password }, 'access', { expiresIn: 60 * 60 });
        req.session.authorization = { accessToken, username };
        return res.status(200).send("User successfully logged in");
    }
    return res.status(208).json({message: "Invalid Login. Check username and password"});
});

// Add or modify a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const review = req.query.review;
    const username = req.session.authorization.username;

    if (!books[isbn]) {
        return res.status(404).json({message: "Book with ISBN " + isbn + " not found"});
    }
    if (!review) {
        return res.status(400).json({message: "Review text is required (?review=...)"});
    }

    // one review per user per book: a second review from the same user modifies the first
    books[isbn].reviews[username] = review;
    return res.status(200).json({
        message: "The review for the book with ISBN " + isbn + " has been added/updated",
        reviews: books[isbn].reviews
    });
});

// Delete a book review (only the logged-in user's own review)
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const username = req.session.authorization.username;

    if (!books[isbn]) {
        return res.status(404).json({message: "Book with ISBN " + isbn + " not found"});
    }
    if (!books[isbn].reviews[username]) {
        return res.status(404).json({message: "No review by " + username + " found for ISBN " + isbn});
    }

    delete books[isbn].reviews[username];
    return res.status(200).json({
        message: "Review for the ISBN " + isbn + " posted by the user " + username + " deleted.",
        reviews: books[isbn].reviews
    });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
