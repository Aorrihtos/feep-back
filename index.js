const express = require("express");
const {connection} = require("./database/connector");

// Connect to DB
connection().then(r => console.log("Connected to Database!"));
