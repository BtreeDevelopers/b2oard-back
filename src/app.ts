import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import mongoose from "mongoose";
import Controller from "./utils/interfaces/controllerInterface";

class App {
  public express: Application;
  public port: Number;
  public controllers: Controller[];

  constructor(controllers: Controller[], port: Number) {
    this.express = express();
    this.port = port;
    this.controllers = controllers;
  }

  public start(): void {
    this.initialiseDatabaseConnection();
    this.initialiseMiddleware();
    this.initialiseControllers(this.controllers);
  }

  public listen(): void {
    this.express.listen(this.port, () => {
      console.log(`Listening on port ${this.port}`);
    });
  }

  private initialiseMiddleware(): void {
    this.express.get("/", (r, res) => {
      res.send("board foi");
    });
    this.express.use(helmet());
    this.express.use(cors());
    this.express.use(morgan("dev"));
    this.express.use(express.json());
    this.express.use(express.urlencoded({ extended: false }));
  }

  private initialiseDatabaseConnection(): void {
    const { MONGO_USER, MONGO_PASSWORD, MONGO_PATH } = process.env;
    mongoose.connect(`mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_PATH}`);
  }

  private initialiseControllers(controllers: Controller[]): void {
    controllers.forEach((controller: Controller) => {
      this.express.use("/bjrd", controller.router);
    });
  }
}

export default App;
