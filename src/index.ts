import express, { Request, Response } from 'express';

const app = express();
const PORT = 3000;

// Middleware to parse the body of POST requests
app.use(express.json());

// Handle GET request
app.get('/', (req: Request, res: Response) => {
    res.send('Hello, world!');
});

// Handle POST request
app.post('/data', (req: Request, res: Response) => {
    console.log(req.body);
    res.send({ message: 'Data received!', data: req.body });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
