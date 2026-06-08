
require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
  options: {
    trustServerCertificate: true,
    encrypt: false
  }
};

async function connectDB() {
  try {
    await sql.connect(dbConfig);
    console.log('Connected to SQL Server successfully!');
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
}

connectDB();

app.get('/api/sales-by-year', async (req, res) => {
  try {
    const result = await sql.query`
      SELECT 
        YEAR(OrderDate) as Year,
        COUNT(*) as TotalOrders,
        SUM(OrderQuantity * p.ProductPrice) as TotalRevenue
      FROM [dbo].[AllSalesData] s
      LEFT JOIN [dbo].[AdventureWorks Product Lookup] p 
        ON s.ProductKey = p.ProductKey
      GROUP BY YEAR(OrderDate)
      ORDER BY Year
    `;
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/top-products', async (req, res) => {
  try {
    const result = await sql.query`
      SELECT TOP 10
        p.ProductName,
        COUNT(*) as TotalOrders,
        SUM(s.OrderQuantity) as TotalUnits
      FROM [dbo].[AllSalesData] s
      LEFT JOIN [dbo].[AdventureWorks Product Lookup] p 
        ON s.ProductKey = p.ProductKey
      GROUP BY p.ProductName
      ORDER BY TotalOrders DESC
    `;
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sales-by-country', async (req, res) => {
  try {
    const result = await sql.query`
      SELECT 
        t.Country,
        t.Continent,
        COUNT(*) as TotalOrders
      FROM [dbo].[AllSalesData] s
      LEFT JOIN [dbo].[AdventureWorks Territory Lookup] t 
        ON s.TerritoryKey = t.SalesTerritoryKey
      GROUP BY t.Country, t.Continent
      ORDER BY TotalOrders DESC
    `;
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/customer-demographics', async (req, res) => {
  try {
    const result = await sql.query`
      SELECT 
        c.Gender,
        c.Occupation,
        c.EducationLevel,
        COUNT(*) as TotalOrders
      FROM [dbo].[AllSalesData] s
      LEFT JOIN [dbo].[AdventureWorks Customer Lookup] c 
        ON s.CustomerKey = c.CustomerKey
      GROUP BY c.Gender, c.Occupation, c.EducationLevel
      ORDER BY TotalOrders DESC
    `;
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/margins-by-category', async (req, res) => {
  try {
    const result = await sql.query`
      SELECT 
        pc.CategoryName,
        AVG(p.ProductCost) as AvgCost,
        AVG(p.ProductPrice) as AvgPrice,
        AVG((p.ProductPrice - p.ProductCost) / p.ProductPrice * 100) as AvgMarginPct
      FROM [dbo].[AllSalesData] s
      LEFT JOIN [dbo].[AdventureWorks Product Lookup] p 
        ON s.ProductKey = p.ProductKey
      LEFT JOIN [dbo].[AdventureWorks Product Subcategories Lookup] ps 
        ON p.ProductSubcategoryKey = ps.ProductSubcategoryKey
      LEFT JOIN [dbo].[AdventureWorks Product Categories Lookup] pc 
        ON ps.ProductCategoryKey = pc.ProductCategoryKey
      GROUP BY pc.CategoryName
      ORDER BY AvgMarginPct DESC
    `;
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});