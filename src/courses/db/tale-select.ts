import type { StoryPage } from "../types";

// Topic 2.1 told as a story: one morning at the shop's support desk, one real request per page,
// each answered with a query read line by line.

export const SELECT_CAST = "**Nisha** runs customer support at the shop. **Dev** is the developer at the next desk. The data is the same shop data you can run every query on.";

export const TALE_SELECT: StoryPage[] = [
  {
    when: "Monday, 9:05 · the support desk",
    title: "'Can you pull me a list?'",
    text: "Nisha runs customer support at the shop. A delivery partner has just told her that parcels to the UK will be three days late this week, and she wants to warn those customers before they start writing in.\n\nShe leans over to Dev. 'Can you pull me a list? Everyone in the UK, with their email.'\n\nDev does not open a spreadsheet. The customers live in the shop's database, and a database answers questions written in SQL. The question Nisha just asked, in SQL, is three short lines.",
    jargon: [
      ["SQL", "Structured Query Language: the sentence-like language every relational database understands. You describe the rows you want; the database finds them."],
      ["database", "the program that stores the shop's tables (customers, orders, products) and answers questions about them"],
    ],
    queries: [
      {
        title: "Everyone in the UK, with their email",
        sql: `SELECT name, email, city\nFROM customers\nWHERE country = 'UK';`,
        lines: [
          { sql: "SELECT name, email, city", say: "Show me these three columns and nothing else. Nisha wants names and emails; the city helps the courier note." },
          { sql: "FROM customers", say: "Look in the customers table. Every row in it is one customer." },
          { sql: "WHERE country = 'UK';", say: "Keep only the rows whose country is exactly the text UK. Text goes in single quotes. The semicolon ends the sentence." },
        ],
        expect: "two rows: Liam Walker in London and Emma Clarke in Manchester. Thirteen customers went in, two came out.",
      },
    ],
  },
  {
    when: "9:08 · a whiteboard",
    title: "What the database does with the sentence",
    text: "Nisha looks at the three lines and asks the question everyone asks the first time: 'Why is SELECT first, if it picks the columns last?'\n\nDev draws it. The database reads the sentence in a different order from how you write it. First FROM: it opens the customers table, all thirteen rows. Then WHERE: it walks through them and drops every row whose country is not UK. Only then SELECT: from the two rows left, it keeps the columns you named.\n\nSELECT is written first because that is how English works ('show me the names'), but it runs last. Keep this order in your head: FROM, then WHERE, then SELECT. Everything in this topic, and in the next three, slots into that order.",
    jargon: [["clause", "each keyword and what follows it (SELECT …, FROM …, WHERE …) is a clause; a query is a few clauses in a fixed order"]],
    diagram: "queryOrder",
    queries: [
      {
        title: "The same list, A to Z",
        sql: `SELECT name, email, city\nFROM customers\nWHERE country = 'UK'\nORDER BY name;`,
        lines: [
          { sql: "SELECT name, email, city", say: "The columns to show." },
          { sql: "FROM customers", say: "The table to look in." },
          { sql: "WHERE country = 'UK'", say: "Keep only UK rows." },
          { sql: "ORDER BY name;", say: "After the rows are chosen, sort them by name, A to Z. Sorting happens after filtering, so it only sorts the rows that survived." },
        ],
        expect: "the same two people, Emma now before Liam.",
      },
    ],
  },
  {
    when: "9:20",
    title: "'Only the ones who joined recently'",
    text: "Nisha comes back. 'The delay matters most for new customers; they are still forming an opinion of us. Give me everyone who joined since June 2024, anywhere in the world.'\n\n'Since June' is a comparison on a date. The signed_up column holds dates written as text like 2024-06-18, and text in that form sorts the same way dates do, so `>=` works on it. Dev writes the condition the way the calendar thinks: from the first of June onwards.\n\nThen she narrows it: 'and not India, the India warehouse is not affected.' Two conditions joined with AND means both must be true for a row to survive.",
    jargon: [["comparison", "=, <>, <, <=, >, >=: a test between two values that is true or false for each row"]],
    queries: [
      {
        title: "Joined since June 2024",
        sql: `SELECT name, country, signed_up\nFROM customers\nWHERE signed_up >= '2024-06-01'\nORDER BY signed_up;`,
        lines: [
          { sql: "SELECT name, country, signed_up", say: "Name, country and the date they joined, so Nisha can see why each row is here." },
          { sql: "FROM customers", say: "The customers table." },
          { sql: "WHERE signed_up >= '2024-06-01'", say: "Keep rows whose join date is on or after 1 June 2024. 'On or after' is >=." },
          { sql: "ORDER BY signed_up;", say: "Oldest of them first." },
        ],
        expect: "four people: Hana Sato, Zara Khan, Ethan Miller, Ishaan Roy.",
      },
      {
        title: "…and not in India",
        sql: `SELECT name, country, signed_up\nFROM customers\nWHERE signed_up >= '2024-06-01' AND country <> 'India'\nORDER BY signed_up;`,
        lines: [
          { sql: "WHERE signed_up >= '2024-06-01' AND country <> 'India'", say: "Two tests joined by AND: joined since June, and country is not India. <> means 'is not'. A row must pass both." },
          { sql: "ORDER BY signed_up;", say: "Oldest first again." },
        ],
        expect: "Hana Sato and Ethan Miller. Zara and Ishaan dropped out because they are in India.",
      },
    ],
  },
  {
    when: "9:30",
    title: "'India or the UK, but skip Mumbai': the brackets that save you",
    text: "The next request is messier. 'India or the UK, but skip Mumbai, the Mumbai depot is fine.'\n\nDev writes OR for 'India or the UK' and AND for 'but not Mumbai', then stops, because this is the moment people get it wrong. AND binds tighter than OR, the way multiplication binds tighter than addition. Without brackets, the condition means India, or (UK and not Mumbai), which quietly keeps Aarav in Mumbai on the list.\n\nBrackets say what you mean. And for 'is one of these values' there is a shorter spelling than a chain of ORs: IN with a list.",
    jargon: [["binds tighter", "is applied first. AND before OR, like × before + in arithmetic; brackets override the order"]],
    queries: [
      {
        title: "The trap, no brackets: Mumbai is still there",
        sql: `SELECT name, country, city\nFROM customers\nWHERE country = 'India' OR country = 'UK' AND city <> 'Mumbai'\nORDER BY country, city;`,
        lines: [
          { sql: "WHERE country = 'India' OR country = 'UK' AND city <> 'Mumbai'", say: "Read by the database as: country is India, OR (country is UK AND city is not Mumbai). The Mumbai test only applies to the UK half, so it does nothing." },
          { sql: "ORDER BY country, city;", say: "Sort by country first; inside each country, by city." },
        ],
        expect: "Aarav Mehta, Mumbai, is still in the list. The brackets you did not write were put in for you, in the wrong place.",
      },
      {
        title: "Fixed: brackets by way of IN",
        sql: `SELECT name, country, city\nFROM customers\nWHERE country IN ('India', 'UK') AND city <> 'Mumbai'\nORDER BY country, city;`,
        lines: [
          { sql: "WHERE country IN ('India', 'UK') AND city <> 'Mumbai'", say: "IN ('India', 'UK') is 'country is one of these', already grouped as one test. AND city is not Mumbai now applies to both countries." },
        ],
        expect: "Mumbai is gone: Priya, Rahul, Zara and Ishaan from India, Liam and Emma from the UK.",
      },
    ],
  },
  {
    when: "9:40 · the support tool's search box",
    title: "The search box",
    text: "A customer calls. 'It's Garcia, I ordered a chair.' Nisha types 'garcia' into the support tool, and Dev watches what the tool sends to the database.\n\nFor 'contains this text' SQL has LIKE with a pattern. The percent sign means 'anything here, including nothing'. So '%garcia%' means: any characters, then garcia, then any characters. And 'M%' means 'starts with M'.\n\nOne thing to know before it bites you: this browser database, SQLite, ignores upper and lower case in LIKE, so 'garcia' finds 'Garcia'. Postgres does not; there you write ILIKE, or compare LOWER(name). Dev adds LOWER anyway so the query behaves the same everywhere.",
    jargon: [
      ["pattern", "the text you give LIKE, with wildcards: % matches any run of characters, _ matches exactly one"],
      ["SQLite", "the small database engine running inside this page; Postgres and MySQL are the big server ones, and they differ in small ways like this"],
    ],
    queries: [
      {
        title: "Contains 'garcia'",
        sql: `SELECT name, email\nFROM customers\nWHERE LOWER(name) LIKE '%garcia%';`,
        lines: [
          { sql: "WHERE LOWER(name) LIKE '%garcia%';", say: "Lower-case the name, then test it against the pattern: anything, garcia, anything. 'Mateo Garcia' becomes 'mateo garcia' and matches." },
        ],
        expect: "Mateo Garcia.",
      },
      {
        title: "Starts with M",
        sql: `SELECT name, city\nFROM customers\nWHERE city LIKE 'M%'\nORDER BY city;`,
        lines: [
          { sql: "WHERE city LIKE 'M%'", say: "Cities that start with M, then anything. No % at the front, so the M must be the first letter." },
        ],
        expect: "Madrid, Manchester, Milan, Mumbai.",
      },
    ],
  },
  {
    when: "9:55 · the marketing channel",
    title: "'What can we put on sale under 50?': columns you compute",
    text: "Marketing wants a flash sale: 'everything under 50 that we have plenty of, and show me the sale price at 10% off'. This time the question is about products, and it needs a number the table does not store.\n\nSELECT can compute. `price * 0.9` is a new column made from an existing one, and AS gives it a name so the result reads well. Nisha asks for the cheapest first, so ORDER BY uses the new name.\n\nThen Dev tries to filter on the new name, `WHERE sale_price < 40`. Postgres and MySQL refuse: no such column. Remember the running order: WHERE runs before SELECT, so the name does not exist yet while rows are being filtered. ORDER BY runs after SELECT, so it can use the name. (SQLite quietly allows the alias in WHERE as a convenience, which is exactly how a query works in development and breaks in production.) The portable fix is to repeat the arithmetic in WHERE.",
    jargon: [["ROUND", "ROUND(x, 2) keeps two decimal places, so 28.8 instead of 28.800000000000001"]],
    queries: [
      {
        title: "Under 50, plenty in stock, cheapest first",
        sql: `SELECT name, price, ROUND(price * 0.9, 2) AS sale_price, stock\nFROM products\nWHERE price < 50 AND stock >= 60\nORDER BY sale_price;`,
        lines: [
          { sql: "SELECT name, price, ROUND(price * 0.9, 2) AS sale_price, stock", say: "Name and price as stored, then a computed column: price times 0.9, rounded, named sale_price. Then stock." },
          { sql: "FROM products", say: "The products table this time." },
          { sql: "WHERE price < 50 AND stock >= 60", say: "Under 50, and at least 60 in stock. Both must hold." },
          { sql: "ORDER BY sale_price;", say: "Sort by the computed column. This works because ORDER BY runs after SELECT made the name." },
        ],
        expect: "six products from the Water Bottle (15 → 13.5) up to the data-intensive book (48 → 43.2). The Gift Card is exactly 50, so 'under 50' leaves it out.",
      },
      {
        title: "Filtering on the computed value, the portable way",
        sql: `SELECT name, ROUND(price * 0.9, 2) AS sale_price\nFROM products\nWHERE price * 0.9 < 40\nORDER BY sale_price;`,
        lines: [
          { sql: "WHERE price * 0.9 < 40", say: "Repeat the arithmetic instead of using the alias. Every database accepts this." },
        ],
        expect: "the products whose sale price lands under 40.",
      },
    ],
  },
  {
    when: "10:05",
    title: "'Top three for the homepage banner'",
    text: "Marketing again: 'the three most expensive things, for the banner'. Two clauses do it: sort by price, largest first, then cut the list.\n\nORDER BY price DESC puts the dearest at the top. DESC is descending; ASC, the default, is ascending. LIMIT 3 keeps the first three rows of the sorted list and throws the rest away.\n\nOne rule to carry for life: LIMIT without ORDER BY is a lottery. The database hands back whichever three rows it reached first, and that can change after a reindex or a restart. If the order matters, say it. And if two rows could tie, add a second sort key so the answer never shuffles.",
    queries: [
      {
        title: "The three most expensive",
        sql: `SELECT name, category, price\nFROM products\nORDER BY price DESC, name\nLIMIT 3;`,
        lines: [
          { sql: "ORDER BY price DESC, name", say: "Dearest first. If two prices were equal, name decides, so the result is always the same." },
          { sql: "LIMIT 3;", say: "Keep the first three rows of the sorted list." },
        ],
        expect: "Standing Desk 449, Ergonomic Chair 329, Noise-Cancelling Headphones 199.",
      },
    ],
  },
  {
    when: "10:15 · the orders screen",
    title: "Page 2 of the orders screen",
    text: "The orders screen shows ten orders at a time, newest first, and Nisha has just clicked 'page 2'. The tool asks the database for rows 11 to 20.\n\nOFFSET skips rows; LIMIT takes rows. Page 2 is skip 10, take 10. The sort must be stable, meaning no two rows can tie, otherwise page 1 and page 2 can overlap or miss a row. Two orders placed at the same second are rare, but rare is not never, so Dev adds id as a second sort key.\n\nThis is what most apps do, and it is fine for the first pages. Keep one thing in mind for later: for page 500 the database still reads and discards 4,990 rows before handing over ten. There is a faster way for deep pages, keyset pagination, in the performance chapter.",
    jargon: [
      ["pagination", "showing a long list a page at a time"],
      ["keyset pagination", "the faster version that continues from the last row you saw instead of counting rows to skip; taught in the performance chapter"],
    ],
    queries: [
      {
        title: "Page 2: skip ten, take ten",
        sql: `SELECT id, ordered_at, status\nFROM orders\nORDER BY ordered_at DESC, id DESC\nLIMIT 10 OFFSET 10;`,
        lines: [
          { sql: "ORDER BY ordered_at DESC, id DESC", say: "Newest first; id breaks any tie so the order is stable." },
          { sql: "LIMIT 10 OFFSET 10;", say: "Skip the ten rows page 1 showed, then take the next ten." },
        ],
        expect: "orders 14 down to 5: the second ten in date order.",
      },
    ],
  },
  {
    when: "10:25",
    title: "The row that was on no list: NULL",
    text: "Nisha notices something odd in a staff report. 'Everyone has a manager except the CEO. When I ask for people with no manager, I get nobody.' Her query said `WHERE manager_id = NULL`.\n\nNULL is how a database says 'no value here'. It is not zero and it is not an empty string; it is the absence of an answer. And the rule that trips everyone: comparing anything with NULL, even NULL itself, is not true. It is unknown, and WHERE keeps only rows that are definitely true.\n\nSo `= NULL` never matches anything. The question 'is this missing?' has its own spelling: IS NULL, and the opposite, IS NOT NULL.",
    queries: [
      {
        title: "The query that finds nobody",
        sql: `SELECT name, manager_id\nFROM employees\nWHERE manager_id = NULL;`,
        lines: [{ sql: "WHERE manager_id = NULL;", say: "For every row this test is unknown, never true, so every row is dropped. Even the CEO's." }],
        expect: "zero rows, although the CEO really has no manager.",
      },
      {
        title: "Asked the right way",
        sql: `SELECT name, dept, manager_id\nFROM employees\nWHERE manager_id IS NULL;`,
        lines: [{ sql: "WHERE manager_id IS NULL;", say: "IS NULL is the test for 'missing'. Now the CEO's row is true and comes back." }],
        expect: "one row: the CEO, Meera Iyer, with manager_id empty.",
      },
    ],
  },
  {
    when: "10:35",
    title: "'Which countries do we even ship to?': DISTINCT",
    text: "'Give me the list of countries we have customers in. Just the countries, each once.'\n\nWithout help the database returns one country per customer: thirteen rows, with India five times. DISTINCT collapses identical rows into one.\n\nNisha's next sentence is 'and how many in each', and that is a different kind of question. Counting per group needs GROUP BY, which is the whole of the next topic. For now, notice that DISTINCT answers 'which values exist' and says nothing about how many.",
    queries: [
      {
        title: "Each country once",
        sql: `SELECT DISTINCT country\nFROM customers\nORDER BY country;`,
        lines: [
          { sql: "SELECT DISTINCT country", say: "Take the country column and keep each different value once." },
          { sql: "ORDER BY country;", say: "Alphabetical, so the list is easy to scan." },
        ],
        expect: "seven countries, India only once.",
      },
    ],
  },
  {
    when: "10:40 · a bug report",
    title: "The search that found everyone",
    text: "A new ticket: 'I searched for one customer and the tool showed me all of them.' Dev opens the search code. It builds the query by gluing the typed text into the SQL string. A customer had typed a name with an apostrophe, O'Brien, and the apostrophe ended the quoted text early; a tester then typed `' OR 1=1 --` on purpose and got every row.\n\nOnce data and code are in the same string, the database cannot tell them apart. The fix is not to glue at all: send the SQL with a placeholder in it, and the value separately. Every driver and every ORM does this; it is one line of code and it closes the hole for good. The security chapter goes deep on it.\n\nThe SQL box on this page cannot bind values for you, so the next query shows the shape: the typed text is treated as a value, joined inside the database with ||, never as part of the command.",
    jargon: [["driver", "the library your code uses to talk to the database (node-postgres, mysql2, better-sqlite3)"]],
    queries: [
      {
        title: "The typed text is a value, not code",
        sql: `SELECT name, email\nFROM customers\nWHERE name LIKE '%' || 'O''Brien' || '%';`,
        lines: [
          { sql: "WHERE name LIKE '%' || 'O''Brien' || '%';", say: "Build the pattern from the value: % then the text then %. Inside a quoted string an apostrophe is written twice, which is what a driver does for you. The result: a harmless pattern." },
        ],
        note: "In application code: query(\"… WHERE name LIKE $1\", ['%' + text + '%']). The value never touches the SQL text.",
        expect: "zero rows (there is no O'Brien) and no damage. The apostrophe was just a character.",
      },
    ],
  },
  {
    title: "Connect it back: Nisha's morning in one query",
    text: "By eleven o'clock Nisha has asked seven questions, and every answer had the same skeleton. FROM names the table. WHERE keeps the rows that match. SELECT picks the columns, and can compute new ones. ORDER BY sorts what is left. LIMIT and OFFSET cut a slice. The database runs them in that order, which is why a computed name works in ORDER BY but not in WHERE, why LIMIT without ORDER BY is a lottery, and why `= NULL` finds nothing.\n\nHer last request of the morning is the whole topic in one sentence: 'the five most recent customers outside India who joined since March 2024, name and email, newest first.'",
    queries: [
      {
        title: "The whole morning in one query",
        sql: `SELECT name, email, signed_up\nFROM customers\nWHERE signed_up >= '2024-03-01' AND country <> 'India'\nORDER BY signed_up DESC\nLIMIT 5;`,
        lines: [
          { sql: "SELECT name, email, signed_up", say: "The columns Nisha asked for, plus the date so she can check 'most recent'." },
          { sql: "FROM customers", say: "The table." },
          { sql: "WHERE signed_up >= '2024-03-01' AND country <> 'India'", say: "Joined on or after 1 March 2024, and not in India. Both must hold." },
          { sql: "ORDER BY signed_up DESC", say: "Newest first." },
          { sql: "LIMIT 5;", say: "Only the top five of that sorted list." },
        ],
        expect: "Ethan Miller, Hana Sato, Mateo Garcia, Olivia Brown, Emma Clarke.",
      },
    ],
    ask: "Nisha now asks: 'how many customers per country?' Which word in that sentence tells you this is a new kind of question, and what will the next topic add?",
  },
];
