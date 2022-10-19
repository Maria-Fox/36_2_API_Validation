process.env.NODE_ENV = "test";

const app = require("../app");
const db = require("../db");

const request = require("supertest");
const { response } = require("../app");


//the response information is contained in the body. Refer to responseVariable.body. any additional property to test.

let testIsbn;

beforeEach(async function(){
    const newBook = await db.query(`
    INSERT INTO books 
    (isbn, amazon_url, author, language, pages, publisher, title, year)
    VALUES ('999999999', 'https://amazon.com/reset', 'KM Rylan', 'English', '546', 'lulu publishing', 'Reset', 2015)
    RETURNING isbn
    `)
    testIsbn = newBook.rows[0].isbn;
})

afterEach(async function(){
    await db.query("DELETE FROM books");
});

afterAll(async function(){
    await db.end();
});

describe("Test book routes", function(){
    
    test("Get / all books", async function(){
        const res = await request(app).get("/books");
        expect(res.statusCode).toBe(200);
        expect(res.body.books).toHaveLength(1);
        expect(res.body.books[0]).toHaveProperty("publisher");
    })


    test("Get book by ISBN /:isbn", async function(){
        const res = await request(app).get(`/books/${testIsbn}`)
        expect(res.statusCode).toBe(200);
        expect(res.body.book).toHaveProperty("isbn");
        expect(res.body.book.author).toBe("KM Rylan");
    });

    test("Get book by ISBN /:isbn that doesnt exist should fail", async function(){
        const res = await request(app).get(`/books/000000`)
        expect(res.statusCode).toBe(404);
    });

    test("Add book POST /", async function(){
        const res =  await request(app).post(`/books`).send({
            isbn: '123456789',
            amazon_url: "https://amazon.com/hyah",
            author: "Link",
            language: "Hylian",
            pages: 40,
            publisher: "Malo Mart",
            title: "Hyah",
            year: 1986
        })
        expect(res.statusCode).toBe(201);
        expect(res.body.book.author).toBe("Link");
        expect(res.body.book.publisher).toBe("Malo Mart");
    });

    test("Adding invalid book should fail POST /", async function(){
        const res =  await request(app).post(`/books`).send({
            isbn: '',
            amazon_url: "https://amazon.com/hyah",
            author: "Link",
            language: "Hylian",
            pages: 40,
            publisher: "Malo Mart",
            title: "Hyah",
            year: "NOT A REAL YEAR"
        })
        expect(res.statusCode).toBe(400);
    });

    test("Updating books PUT /:isbn", async function(){
        const res =  await request(app).put(`/books/${testIsbn}`).send({
            author: "Adrien Aragon",
            language: "English",
            pages: 586,
            publisher: "lulu publishing",
            title: "Reset",
            year: 1994
        })
        expect(res.statusCode).toBe(200);
        expect(res.body.book.author).toBe("Adrien Aragon");
        expect(res.body.book.year).toBe(1994);
    });

    test("Updating books with invalid info PUT /:isbn should fail", async function(){
        const res =  await request(app).put(`/books/${testIsbn}`).send({
            author: 9000,
            language: "English",
            pages: 586,
            publisher: "lulu publishing",
            title: "Reset",
            year: "HELLO"
        })
        expect(res.statusCode).toBe(400);
    });

    test("Delete a book /:id", async function(){
        const res = await request(app).delete(`/books/${testIsbn}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({message: "Book deleted"})
    })

});
